import { FileUploadService, UploadedFile, ProcessingJobStatus } from '../fileUploadService';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock console.error to avoid test output pollution
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

// Mock setTimeout/clearInterval for polling tests
jest.useFakeTimers();

describe('FileUploadService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
    jest.useRealTimers();
  });

  describe('API Methods', () => {
    describe('uploadFile', () => {
      it('uploads file successfully with default type', async () => {
        const mockFile = new File(['content'], 'test.xml', { type: 'application/xml' });
        const mockResponse = { fileId: '123', message: 'Upload successful' };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockResponse),
        });

        const result = await FileUploadService.uploadFile(mockFile);

        expect(mockFetch).toHaveBeenCalledWith('/api/upload', {
          method: 'POST',
          body: expect.any(FormData),
        });

        // Verify FormData contents
        const formData = mockFetch.mock.calls[0][1].body;
        expect(formData.get('file')).toBe(mockFile);
        expect(formData.get('type')).toBe('health-data');
        expect(result).toEqual(mockResponse);
      });

      it('uploads file successfully with custom type', async () => {
        const mockFile = new File(['content'], 'test.fit', { type: 'application/octet-stream' });
        const mockResponse = { fileId: '456' };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockResponse),
        });

        const result = await FileUploadService.uploadFile(mockFile, 'fitness-data');

        const formData = mockFetch.mock.calls[0][1].body;
        expect(formData.get('file')).toBe(mockFile);
        expect(formData.get('type')).toBe('fitness-data');
        expect(result).toEqual(mockResponse);
      });

      it('throws error when upload fails', async () => {
        const mockFile = new File(['content'], 'test.xml');

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
        });

        await expect(FileUploadService.uploadFile(mockFile)).rejects.toThrow('Upload failed');
      });

      it('throws error when network fails', async () => {
        const mockFile = new File(['content'], 'test.xml');

        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(FileUploadService.uploadFile(mockFile)).rejects.toThrow('Network error');
      });
    });

    describe('startProcessing', () => {
      it('starts processing successfully', async () => {
        const mockResponse = { jobId: 'job-123' };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockResponse),
        });

        const result = await FileUploadService.startProcessing();

        expect(mockFetch).toHaveBeenCalledWith('/api/process-health-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        expect(result).toEqual(mockResponse);
      });

      it('throws error when processing start fails', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
        });

        await expect(FileUploadService.startProcessing()).rejects.toThrow('Processing failed');
      });

      it('throws error when network fails', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(FileUploadService.startProcessing()).rejects.toThrow('Network error');
      });
    });

    describe('checkProcessingStatus', () => {
      it('checks processing status successfully', async () => {
        const mockStatus: ProcessingJobStatus = {
          status: 'processing',
          message: 'Processing in progress',
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockStatus),
        });

        const result = await FileUploadService.checkProcessingStatus('job-123');

        expect(mockFetch).toHaveBeenCalledWith('/api/processing-job/job-123');
        expect(result).toEqual(mockStatus);
      });

      it('throws error when status check fails', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

        await expect(FileUploadService.checkProcessingStatus('job-123')).rejects.toThrow('Failed to check processing status');
      });

      it('throws error when network fails', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(FileUploadService.checkProcessingStatus('job-123')).rejects.toThrow('Network error');
      });
    });

    describe('getUploadedFiles', () => {
      it('fetches uploaded files successfully', async () => {
        const mockFiles: UploadedFile[] = [
          {
            id: '1',
            filename: 'test1.xml',
            uploadDate: '2024-01-01',
          },
          {
            id: '2',
            filename: 'test2.fit',
            uploadDate: '2024-01-02',
          },
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockFiles),
        });

        const result = await FileUploadService.getUploadedFiles();

        expect(mockFetch).toHaveBeenCalledWith('/api/uploaded-files');
        expect(result).toEqual(mockFiles);
      });

      it('throws error when fetch fails', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
        });

        await expect(FileUploadService.getUploadedFiles()).rejects.toThrow('Failed to fetch uploaded files');
      });

      it('throws error when network fails', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(FileUploadService.getUploadedFiles()).rejects.toThrow('Network error');
      });
    });

    describe('deleteFiles', () => {
      it('deletes files successfully', async () => {
        const fileIds = ['1', '2', '3'];

        mockFetch.mockResolvedValueOnce({
          ok: true,
        });

        await expect(FileUploadService.deleteFiles(fileIds)).resolves.toBeUndefined();

        expect(mockFetch).toHaveBeenCalledWith('/api/uploaded-files', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fileIds }),
        });
      });

      it('deletes single file successfully', async () => {
        const fileIds = ['1'];

        mockFetch.mockResolvedValueOnce({
          ok: true,
        });

        await expect(FileUploadService.deleteFiles(fileIds)).resolves.toBeUndefined();

        expect(mockFetch).toHaveBeenCalledWith('/api/uploaded-files', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fileIds }),
        });
      });

      it('throws error when deletion fails', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

        await expect(FileUploadService.deleteFiles(['1'])).rejects.toThrow('Failed to delete files');
      });

      it('throws error when network fails', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(FileUploadService.deleteFiles(['1'])).rejects.toThrow('Network error');
      });
    });
  });

  describe('Validation Methods', () => {
    describe('validateFile', () => {
      it('returns null for valid XML file', () => {
        const xmlFile = new File(['content'], 'test.xml', { type: 'application/xml' });
        expect(FileUploadService.validateFile(xmlFile)).toBeNull();
      });

      it('returns null for valid FIT file', () => {
        const fitFile = new File(['content'], 'data.fit', { type: 'application/octet-stream' });
        expect(FileUploadService.validateFile(fitFile)).toBeNull();
      });

      it('returns error for files with uppercase extensions (case sensitive)', () => {
        const xmlFile = new File(['content'], 'test.XML');
        const fitFile = new File(['content'], 'data.FIT');
        expect(FileUploadService.validateFile(xmlFile)).toBe('Please upload an XML or FIT file');
        expect(FileUploadService.validateFile(fitFile)).toBe('Please upload an XML or FIT file');
      });

      it('returns error for invalid file types', () => {
        const csvFile = new File(['content'], 'test.csv', { type: 'text/csv' });
        const txtFile = new File(['content'], 'test.txt', { type: 'text/plain' });
        const pdfFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });

        expect(FileUploadService.validateFile(csvFile)).toBe('Please upload an XML or FIT file');
        expect(FileUploadService.validateFile(txtFile)).toBe('Please upload an XML or FIT file');
        expect(FileUploadService.validateFile(pdfFile)).toBe('Please upload an XML or FIT file');
      });

      it('returns error for files without extensions', () => {
        const noExtFile = new File(['content'], 'filename');
        expect(FileUploadService.validateFile(noExtFile)).toBe('Please upload an XML or FIT file');
      });

      it('returns error for files with partial matching extensions', () => {
        const partialFile = new File(['content'], 'test.xmlx');
        const anotherPartialFile = new File(['content'], 'test.fitting');
        expect(FileUploadService.validateFile(partialFile)).toBe('Please upload an XML or FIT file');
        expect(FileUploadService.validateFile(anotherPartialFile)).toBe('Please upload an XML or FIT file');
      });
    });
  });

  describe('Polling Utility', () => {
    describe('pollProcessingStatus', () => {
      it('polls and receives updates for processing status', async () => {
        const onUpdate = jest.fn();
        const jobId = 'job-123';

        // Mock the checkProcessingStatus method
        const mockCheckStatus = jest.spyOn(FileUploadService, 'checkProcessingStatus');
        mockCheckStatus.mockResolvedValueOnce({ status: 'processing' });
        mockCheckStatus.mockResolvedValueOnce({ status: 'completed', message: 'Done!' });

        const cleanup = FileUploadService.pollProcessingStatus(jobId, onUpdate, 1000);

        // Fast-forward through first interval
        jest.advanceTimersByTime(1000);
        await Promise.resolve(); // Allow async calls to complete

        expect(onUpdate).toHaveBeenCalledWith({ status: 'processing' });

        // Fast-forward through second interval
        jest.advanceTimersByTime(1000);
        await Promise.resolve();

        expect(onUpdate).toHaveBeenCalledWith({ status: 'completed', message: 'Done!' });
        expect(onUpdate).toHaveBeenCalledTimes(2);

        cleanup();
        mockCheckStatus.mockRestore();
      });

      it('stops polling when status is completed', async () => {
        const onUpdate = jest.fn();
        const jobId = 'job-123';

        const mockCheckStatus = jest.spyOn(FileUploadService, 'checkProcessingStatus');
        mockCheckStatus.mockResolvedValue({ status: 'completed' });

        const cleanup = FileUploadService.pollProcessingStatus(jobId, onUpdate, 1000);

        jest.advanceTimersByTime(1000);
        await Promise.resolve();

        expect(onUpdate).toHaveBeenCalledWith({ status: 'completed' });
        expect(onUpdate).toHaveBeenCalledTimes(1);

        // Should not poll again after completion
        jest.advanceTimersByTime(1000);
        await Promise.resolve();
        expect(onUpdate).toHaveBeenCalledTimes(1);

        cleanup();
        mockCheckStatus.mockRestore();
      });

      it('stops polling when status is failed', async () => {
        const onUpdate = jest.fn();
        const jobId = 'job-123';

        const mockCheckStatus = jest.spyOn(FileUploadService, 'checkProcessingStatus');
        mockCheckStatus.mockResolvedValue({ status: 'failed', message: 'Error occurred' });

        const cleanup = FileUploadService.pollProcessingStatus(jobId, onUpdate, 1000);

        jest.advanceTimersByTime(1000);
        await Promise.resolve();

        expect(onUpdate).toHaveBeenCalledWith({ status: 'failed', message: 'Error occurred' });
        expect(onUpdate).toHaveBeenCalledTimes(1);

        // Should not poll again after failure
        jest.advanceTimersByTime(1000);
        await Promise.resolve();
        expect(onUpdate).toHaveBeenCalledTimes(1);

        cleanup();
        mockCheckStatus.mockRestore();
      });

      it('handles errors during polling and stops', async () => {
        const onUpdate = jest.fn();
        const jobId = 'job-123';

        const mockCheckStatus = jest.spyOn(FileUploadService, 'checkProcessingStatus');
        mockCheckStatus.mockRejectedValue(new Error('Network error'));

        const cleanup = FileUploadService.pollProcessingStatus(jobId, onUpdate, 1000);

        jest.advanceTimersByTime(1000);
        await Promise.resolve();

        expect(mockConsoleError).toHaveBeenCalledWith('Error checking job status:', expect.any(Error));
        expect(onUpdate).toHaveBeenCalledWith({
          status: 'failed',
          message: 'Error checking processing status',
        });

        // Should not poll again after error
        jest.advanceTimersByTime(1000);
        await Promise.resolve();
        expect(onUpdate).toHaveBeenCalledTimes(1);

        cleanup();
        mockCheckStatus.mockRestore();
      });

      it('uses custom polling interval', async () => {
        const onUpdate = jest.fn();
        const jobId = 'job-123';
        const customInterval = 5000;

        const mockCheckStatus = jest.spyOn(FileUploadService, 'checkProcessingStatus');
        mockCheckStatus.mockResolvedValue({ status: 'processing' });

        const cleanup = FileUploadService.pollProcessingStatus(jobId, onUpdate, customInterval);

        // Should not have called yet
        expect(onUpdate).not.toHaveBeenCalled();

        // Fast-forward by custom interval
        jest.advanceTimersByTime(customInterval);
        await Promise.resolve();

        expect(onUpdate).toHaveBeenCalledWith({ status: 'processing' });

        cleanup();
        mockCheckStatus.mockRestore();
      });

      it('uses default interval when not specified', async () => {
        const onUpdate = jest.fn();
        const jobId = 'job-123';

        const mockCheckStatus = jest.spyOn(FileUploadService, 'checkProcessingStatus');
        mockCheckStatus.mockResolvedValue({ status: 'processing' });

        const cleanup = FileUploadService.pollProcessingStatus(jobId, onUpdate);

        // Default interval is 2000ms
        jest.advanceTimersByTime(2000);
        await Promise.resolve();

        expect(onUpdate).toHaveBeenCalledWith({ status: 'processing' });

        cleanup();
        mockCheckStatus.mockRestore();
      });

      it('cleanup function stops polling', async () => {
        const onUpdate = jest.fn();
        const jobId = 'job-123';

        const mockCheckStatus = jest.spyOn(FileUploadService, 'checkProcessingStatus');
        mockCheckStatus.mockResolvedValue({ status: 'processing' });

        const cleanup = FileUploadService.pollProcessingStatus(jobId, onUpdate, 1000);

        // First interval
        jest.advanceTimersByTime(1000);
        await Promise.resolve();
        expect(onUpdate).toHaveBeenCalledTimes(1);

        // Call cleanup
        cleanup();

        // Should not poll after cleanup
        jest.advanceTimersByTime(1000);
        await Promise.resolve();
        expect(onUpdate).toHaveBeenCalledTimes(1);

        mockCheckStatus.mockRestore();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles files with complex names', () => {
      const complexFile = new File(['content'], 'my-file.with.dots.and-dashes.xml');
      expect(FileUploadService.validateFile(complexFile)).toBeNull();
    });

    it('handles empty file names gracefully', () => {
      const emptyNameFile = new File(['content'], '');
      expect(FileUploadService.validateFile(emptyNameFile)).toBe('Please upload an XML or FIT file');
    });

    it('handles very long file names', () => {
      const longName = 'a'.repeat(200) + '.xml';
      const longNameFile = new File(['content'], longName);
      expect(FileUploadService.validateFile(longNameFile)).toBeNull();
    });

    it('rejects mixed case extensions (case sensitive validation)', () => {
      const mixedCaseXml = new File(['content'], 'test.Xml');
      const mixedCaseFit = new File(['content'], 'test.FiT');
      expect(FileUploadService.validateFile(mixedCaseXml)).toBe('Please upload an XML or FIT file');
      expect(FileUploadService.validateFile(mixedCaseFit)).toBe('Please upload an XML or FIT file');
    });
  });
});
