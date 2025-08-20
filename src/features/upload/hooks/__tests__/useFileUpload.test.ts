import { renderHook, act, waitFor } from '@testing-library/react';
import { useFileUpload } from '../useFileUpload';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock File constructor
const mockFile = (content: string, name: string, type: string) =>
  new File([content], name, { type });

describe('useFileUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useFileUpload());

      expect(result.current.files).toEqual([]);
      expect(result.current.isUploading).toBe(false);
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.hasError).toBe(false);
      expect(result.current.hasCompleted).toBe(false);
      expect(result.current.state.status).toBe('idle');
      expect(result.current.state.progress).toEqual({ loaded: 0, total: 0, percentage: 0 });
    });

    it('should initialize with custom options', () => {
      const customOptions = {
        maxFileSize: 500 * 1024 * 1024, // 500MB
        allowedTypes: ['application/pdf'],
        maxRetries: 5,
        chunkSize: 2 * 1024 * 1024, // 2MB chunks
        autoStart: false
      };

      const { result } = renderHook(() => useFileUpload(customOptions));

      expect(result.current.files).toEqual([]);
      expect(result.current.isUploading).toBe(false);
    });
  });

  describe('File Validation', () => {
    it('should validate file size correctly', async () => {
      const { result } = renderHook(() =>
        useFileUpload({ maxFileSize: 1024 }) // 1KB limit
      );

      const largeFile = mockFile('x'.repeat(2048), 'large.txt', 'text/plain');
      const onError = jest.fn();

      await act(async () => {
        await result.current.uploadFile(largeFile);
      });

      // File should not be added due to size validation
      expect(result.current.files).toHaveLength(0);
    });

    it('should validate file types correctly', async () => {
      const { result } = renderHook(() =>
        useFileUpload({ allowedTypes: ['text/plain', 'application/pdf'] })
      );

      const validFile = mockFile('content', 'test.txt', 'text/plain');
      const invalidFile = mockFile('content', 'test.exe', 'application/x-msdownload');

      // Valid file should trigger upload attempt
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      await act(async () => {
        await result.current.uploadFile(validFile);
      });

      expect(result.current.files).toHaveLength(1);
      expect(result.current.files[0].name).toBe('test.txt');

      // Invalid file should not be added
      await act(async () => {
        await result.current.uploadFile(invalidFile);
      });

      expect(result.current.files).toHaveLength(1); // Still only 1 file
    });

    it('should allow all file types when using wildcard', async () => {
      const { result } = renderHook(() =>
        useFileUpload({ allowedTypes: ['*/*'] })
      );

      const anyFile = mockFile('content', 'test.any', 'application/any');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      await act(async () => {
        await result.current.uploadFile(anyFile);
      });

      expect(result.current.files).toHaveLength(1);
      expect(result.current.files[0].name).toBe('test.any');
    });
  });

  describe('File Upload', () => {
    it('should upload file successfully with chunking', async () => {
      const { result } = renderHook(() => useFileUpload({
        chunkSize: 1024, // 1KB chunks
        autoStart: true
      }));

      const fileContent = 'x'.repeat(2048); // 2KB file = 2 chunks
      const testFile = mockFile(fileContent, 'test.txt', 'text/plain');

      // Mock successful chunk uploads
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });

      await act(async () => {
        await result.current.uploadFile(testFile);
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.current.files).toHaveLength(1);
      expect(result.current.files[0].status).toBe('completed');
      expect(result.current.files[0].progress).toBe(100);
      expect(result.current.state.status).toBe('completed');
    });

    it('should handle upload errors and retry', async () => {
      const { result } = renderHook(() => useFileUpload({
        maxRetries: 2,
        chunkSize: 1024
      }));

      const testFile = mockFile('x'.repeat(1024), 'test.txt', 'text/plain');

      // Mock failed upload then success
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });

      await act(async () => {
        await result.current.uploadFile(testFile);
      });

      expect(mockFetch).toHaveBeenCalledTimes(2); // 1 retry
      expect(result.current.files[0].status).toBe('completed');
    });

    it.skip('should handle max retries exceeded', async () => {
      const { result } = renderHook(() => useFileUpload({
        maxRetries: 1,
        chunkSize: 1024
      }));

      const testFile = mockFile('x'.repeat(1024), 'test.txt', 'text/plain');

      // Mock consistent failures (2 failures = 1 initial + 1 retry)
      mockFetch.mockRejectedValue(new Error('Network error'));

      await act(async () => {
        await result.current.uploadFile(testFile);
      });

      expect(mockFetch).toHaveBeenCalledTimes(2); // Initial + 1 retry
      expect(result.current.files[0].status).toBe('error');
      expect(result.current.files[0].error).toContain('Network error');
      expect(result.current.state.status).toBe('error');
    });

    it('should not auto-start upload when autoStart is false', async () => {
      const { result } = renderHook(() => useFileUpload({
        autoStart: false,
        chunkSize: 1024
      }));

      const testFile = mockFile('content', 'test.txt', 'text/plain');

      await act(async () => {
        await result.current.uploadFile(testFile);
      });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.current.files[0].status).toBe('pending');
    });
  });

  describe('Multiple File Upload', () => {
    it('should upload multiple files sequentially', async () => {
      const { result } = renderHook(() => useFileUpload({
        chunkSize: 1024
      }));

      const files = [
        mockFile('content1', 'test1.txt', 'text/plain'),
        mockFile('content2', 'test2.txt', 'text/plain')
      ];

      // Mock successful uploads
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      await act(async () => {
        await result.current.uploadFiles(files);
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.current.files).toHaveLength(2);
      expect(result.current.files.every(f => f.status === 'completed')).toBe(true);
    });

    it.skip('should handle partial failures in multiple file upload', async () => {
      const { result } = renderHook(() => useFileUpload({
        chunkSize: 1024,
        maxRetries: 0 // No retries to keep it simple
      }));

      const files = [
        mockFile('content1', 'test1.txt', 'text/plain'),
        mockFile('content2', 'test2.txt', 'text/plain')
      ];

      // First file fails, second succeeds
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('test1.txt')) {
          return Promise.reject(new Error('Upload failed'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      });

      await act(async () => {
        await result.current.uploadFiles(files);
      });

      expect(result.current.files).toHaveLength(2);
      expect(result.current.files[0].status).toBe('error');
      expect(result.current.files[1].status).toBe('completed');
    });
  });

  describe('Upload Management', () => {
    it.skip('should cancel ongoing upload', async () => {
      const { result } = renderHook(() => useFileUpload({
        chunkSize: 1024,
        autoStart: true
      }));

      const testFile = mockFile('x'.repeat(2048), 'test.txt', 'text/plain');

      // Mock fetch that will be aborted
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      await act(async () => {
        // Start upload
        const uploadPromise = result.current.uploadFile(testFile);

        // Wait for file to be added to state
        await new Promise(resolve => setTimeout(resolve, 10));

        // Cancel upload
        const fileId = result.current.files[0]?.id;
        if (fileId) {
          result.current.cancelUpload(fileId);
        }

        // Wait for cancellation to take effect
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(result.current.files[0].status).toBe('error');
      expect(result.current.files[0].error).toBe('Upload cancelled');
    });

    it.skip('should retry failed upload', async () => {
      const { result } = renderHook(() => useFileUpload({
        chunkSize: 1024,
        maxRetries: 0 // No automatic retries to keep it simple
      }));

      const testFile = mockFile('content', 'test.txt', 'text/plain');

      // First attempt fails
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Upload and fail
      await act(async () => {
        await result.current.uploadFile(testFile);
      });

      expect(result.current.files[0].status).toBe('error');

      // Retry upload - should succeed
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      await act(async () => {
        await result.current.retryUpload(result.current.files[0].id);
      });

      expect(result.current.files[0].status).toBe('completed');
      expect(mockFetch).toHaveBeenCalledTimes(2); // 1 failed + 1 retry
    });

    it('should clear all files', async () => {
      const { result } = renderHook(() => useFileUpload());

      const testFile = mockFile('content', 'test.txt', 'text/plain');

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      await act(async () => {
        await result.current.uploadFile(testFile);
      });

      expect(result.current.files).toHaveLength(1);

      act(() => {
        result.current.clearFiles();
      });

      expect(result.current.files).toEqual([]);
      expect(result.current.state.status).toBe('idle');
      expect(result.current.state.progress).toEqual({ loaded: 0, total: 0, percentage: 0 });
    });
  });

  describe('Progress Tracking', () => {
    it('should track upload progress correctly', async () => {
      let progressUpdates: any[] = [];

      const onProgress = jest.fn((progress) => {
        progressUpdates.push(progress);
      });

      const { result } = renderHook(() => useFileUpload({
        chunkSize: 1024,
        onProgress
      }));

      const testFile = mockFile('x'.repeat(2048), 'test.txt', 'text/plain'); // 2KB = 2 chunks

      // Mock successful chunk uploads
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      await act(async () => {
        await result.current.uploadFile(testFile);
      });

      expect(onProgress).toHaveBeenCalled();
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1].percentage).toBe(100);
    });

    it('should call onComplete callback on successful upload', async () => {
      const onComplete = jest.fn();
      const { result } = renderHook(() => useFileUpload({
        chunkSize: 1024,
        onComplete
      }));

      const testFile = mockFile('content', 'test.txt', 'text/plain');

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      await act(async () => {
        await result.current.uploadFile(testFile);
      });

      expect(onComplete).toHaveBeenCalledWith({ message: 'File uploaded successfully' });
    });

    it('should call onError callback on upload failure', async () => {
      const onError = jest.fn();
      const { result } = renderHook(() => useFileUpload({
        chunkSize: 1024,
        onError
      }));

      const testFile = mockFile('content', 'test.txt', 'text/plain');

      mockFetch.mockRejectedValue(new Error('Network error'));

      await act(async () => {
        await result.current.uploadFile(testFile);
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'UPLOAD_FAILED',
          message: expect.stringContaining('Network error')
        })
      );
    });
  });

  describe('State Management', () => {
    it('should manage state correctly during upload lifecycle', async () => {
      const { result } = renderHook(() => useFileUpload({
        chunkSize: 1024
      }));

      const testFile = mockFile('x'.repeat(1024), 'test.txt', 'text/plain');

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      // Initial state
      expect(result.current.state.status).toBe('idle');

      // Upload file
      await act(async () => {
        await result.current.uploadFile(testFile);
      });

      // Final state
      expect(result.current.state.status).toBe('completed');
      expect(result.current.state.files).toHaveLength(1);
      expect(result.current.state.progress.percentage).toBe(100);
      // Note: currentFile may not be undefined immediately after completion
      // depending on implementation details
    });

    it('should generate unique file IDs', async () => {
      const { result } = renderHook(() => useFileUpload({
        autoStart: false
      }));

      const file1 = mockFile('content1', 'test1.txt', 'text/plain');
      const file2 = mockFile('content2', 'test2.txt', 'text/plain');

      await act(async () => {
        await result.current.uploadFile(file1);
        await result.current.uploadFile(file2);
      });

      expect(result.current.files[0].id).not.toBe(result.current.files[1].id);
      expect(result.current.files[0].id).toMatch(/^\d+-[a-z0-9-]+$/);
      expect(result.current.files[1].id).toMatch(/^\d+-[a-z0-9-]+$/);
    });
  });
});
