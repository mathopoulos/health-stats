import { renderHook, act } from '@testing-library/react';
import { useFileProcessing } from '../useFileProcessing';

// Mock console.error to avoid noise in tests
const mockConsoleError = jest.fn();
global.console.error = mockConsoleError;

// Mock fetch
global.fetch = jest.fn();

// Mock setInterval and clearInterval
const mockSetInterval = jest.fn();
const mockClearInterval = jest.fn();
global.setInterval = mockSetInterval;
global.clearInterval = mockClearInterval;

describe('useFileProcessing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleError.mockClear();
    (global.fetch as jest.Mock).mockClear();
    mockSetInterval.mockClear();
    mockClearInterval.mockClear();
    
    // Reset setInterval to return a mock interval ID
    mockSetInterval.mockReturnValue(123);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('initialization', () => {
    it('initializes with default values', () => {
      const { result } = renderHook(() => useFileProcessing());

      expect(result.current.isProcessing).toBe(false);
      expect(result.current.processingStatus).toBe('');
      expect(result.current.hasExistingUploads).toBe(false);
    });

    it('provides all expected functions', () => {
      const { result } = renderHook(() => useFileProcessing());

      expect(typeof result.current.setHasExistingUploads).toBe('function');
      expect(typeof result.current.handleProcess).toBe('function');
    });

    it('provides all expected state properties', () => {
      const { result } = renderHook(() => useFileProcessing());

      expect('isProcessing' in result.current).toBe(true);
      expect('processingStatus' in result.current).toBe(true);
      expect('hasExistingUploads' in result.current).toBe(true);
      expect('setHasExistingUploads' in result.current).toBe(true);
      expect('handleProcess' in result.current).toBe(true);
    });
  });

  describe('state setters', () => {
    it('setHasExistingUploads updates hasExistingUploads state', () => {
      const { result } = renderHook(() => useFileProcessing());

      act(() => {
        result.current.setHasExistingUploads(true);
      });

      expect(result.current.hasExistingUploads).toBe(true);

      act(() => {
        result.current.setHasExistingUploads(false);
      });

      expect(result.current.hasExistingUploads).toBe(false);
    });

    it('setHasExistingUploads can be called multiple times', () => {
      const { result } = renderHook(() => useFileProcessing());

      act(() => {
        result.current.setHasExistingUploads(true);
        result.current.setHasExistingUploads(false);
        result.current.setHasExistingUploads(true);
      });

      expect(result.current.hasExistingUploads).toBe(true);
    });
  });

  describe('handleProcess', () => {
    it('sets initial processing state', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jobId: 'job-123' })
      });

      const { result } = renderHook(() => useFileProcessing());

      act(() => {
        result.current.handleProcess();
      });

      expect(result.current.isProcessing).toBe(true);
      expect(result.current.processingStatus).toBe('Starting processing...');
    });

    it('successfully starts processing with job ID', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jobId: 'job-123' })
      });

      const { result } = renderHook(() => useFileProcessing());

      await act(async () => {
        await result.current.handleProcess();
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/process-health-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(result.current.processingStatus).toBe('Processing your data...');
      expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 2000);
    });

    it('handles successful processing completion', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ jobId: 'job-123' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'completed' })
        });

      const { result } = renderHook(() => useFileProcessing());

      await act(async () => {
        await result.current.handleProcess();
      });

      expect(mockSetInterval).toHaveBeenCalled();
      const pollCallback = mockSetInterval.mock.calls[0][0];

      // Simulate the polling callback
      await act(async () => {
        await pollCallback();
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/processing-job/job-123');
      expect(result.current.processingStatus).toBe('Processing completed successfully!');
      expect(result.current.isProcessing).toBe(false);
      expect(mockClearInterval).toHaveBeenCalledWith(123);
    });

    it('handles processing failure', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ jobId: 'job-123' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'failed' })
        });

      const { result } = renderHook(() => useFileProcessing());

      await act(async () => {
        await result.current.handleProcess();
      });

      const pollCallback = mockSetInterval.mock.calls[0][0];

      // Simulate the polling callback
      await act(async () => {
        await pollCallback();
      });

      expect(result.current.processingStatus).toBe('Processing failed. Please try again.');
      expect(result.current.isProcessing).toBe(false);
      expect(mockClearInterval).toHaveBeenCalledWith(123);
    });

    it('handles in-progress status with custom message', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ jobId: 'job-123' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'processing', message: 'Analyzing data...' })
        });

      const { result } = renderHook(() => useFileProcessing());

      await act(async () => {
        await result.current.handleProcess();
      });

      const pollCallback = mockSetInterval.mock.calls[0][0];

      // Simulate the polling callback
      await act(async () => {
        await pollCallback();
      });

      expect(result.current.processingStatus).toBe('Analyzing data...');
      expect(result.current.isProcessing).toBe(true);
      expect(mockClearInterval).not.toHaveBeenCalled();
    });

    it('handles in-progress status without custom message', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ jobId: 'job-123' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'processing' })
        });

      const { result } = renderHook(() => useFileProcessing());

      await act(async () => {
        await result.current.handleProcess();
      });

      const pollCallback = mockSetInterval.mock.calls[0][0];

      // Simulate the polling callback
      await act(async () => {
        await pollCallback();
      });

      expect(result.current.processingStatus).toBe('Processing...');
      expect(result.current.isProcessing).toBe(true);
      expect(mockClearInterval).not.toHaveBeenCalled();
    });

    it('handles API error during initial processing request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const { result } = renderHook(() => useFileProcessing());

      await act(async () => {
        await result.current.handleProcess();
      });

      expect(result.current.processingStatus).toBe('Processing failed. Please try again.');
      expect(result.current.isProcessing).toBe(false);
      expect(mockConsoleError).toHaveBeenCalledWith('Processing error:', expect.any(Error));
      expect(mockSetInterval).not.toHaveBeenCalled();
    });

    it('handles network error during initial processing request', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useFileProcessing());

      await act(async () => {
        await result.current.handleProcess();
      });

      expect(result.current.processingStatus).toBe('Processing failed. Please try again.');
      expect(result.current.isProcessing).toBe(false);
      expect(mockConsoleError).toHaveBeenCalledWith('Processing error:', expect.any(Error));
      expect(mockSetInterval).not.toHaveBeenCalled();
    });

    it('handles successful processing without job ID', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const { result } = renderHook(() => useFileProcessing());

      await act(async () => {
        await result.current.handleProcess();
      });

      expect(result.current.processingStatus).toBe('Starting processing...');
      expect(result.current.isProcessing).toBe(true);
      expect(mockSetInterval).not.toHaveBeenCalled();
    });

    it('handles error during job status polling', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ jobId: 'job-123' })
        })
        .mockRejectedValueOnce(new Error('Polling error'));

      const { result } = renderHook(() => useFileProcessing());

      await act(async () => {
        await result.current.handleProcess();
      });

      const pollCallback = mockSetInterval.mock.calls[0][0];

      // Simulate the polling callback with error
      await act(async () => {
        await pollCallback();
      });

      expect(result.current.processingStatus).toBe('Error checking processing status');
      expect(result.current.isProcessing).toBe(false);
      expect(mockClearInterval).toHaveBeenCalledWith(123);
      expect(mockConsoleError).toHaveBeenCalledWith('Error checking job status:', expect.any(Error));
    });

    it('handles multiple polling cycles before completion', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ jobId: 'job-123' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'processing', message: 'Step 1...' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'processing', message: 'Step 2...' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'completed' })
        });

      const { result } = renderHook(() => useFileProcessing());

      await act(async () => {
        await result.current.handleProcess();
      });

      const pollCallback = mockSetInterval.mock.calls[0][0];

      // First poll
      await act(async () => {
        await pollCallback();
      });
      expect(result.current.processingStatus).toBe('Step 1...');
      expect(result.current.isProcessing).toBe(true);

      // Second poll
      await act(async () => {
        await pollCallback();
      });
      expect(result.current.processingStatus).toBe('Step 2...');
      expect(result.current.isProcessing).toBe(true);

      // Final poll
      await act(async () => {
        await pollCallback();
      });
      expect(result.current.processingStatus).toBe('Processing completed successfully!');
      expect(result.current.isProcessing).toBe(false);
      expect(mockClearInterval).toHaveBeenCalledWith(123);
    });
  });

  describe('edge cases and integration scenarios', () => {
    it('handles rapid state changes', () => {
      const { result } = renderHook(() => useFileProcessing());

      act(() => {
        result.current.setHasExistingUploads(true);
        result.current.setHasExistingUploads(false);
        result.current.setHasExistingUploads(true);
      });

      expect(result.current.hasExistingUploads).toBe(true);
    });

    it('handles component unmount during processing', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jobId: 'job-123' })
      });

      const { result, unmount } = renderHook(() => useFileProcessing());

      await act(async () => {
        await result.current.handleProcess();
      });

      expect(result.current.isProcessing).toBe(true);
      expect(mockSetInterval).toHaveBeenCalled();

      // Unmount component (should not cause errors)
      unmount();

      // Should not throw any errors
    });

    it('handles multiple concurrent processing attempts', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ jobId: 'job-123' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ jobId: 'job-456' })
        });

      const { result } = renderHook(() => useFileProcessing());

      // Start first processing
      await act(async () => {
        await result.current.handleProcess();
      });

      expect(result.current.isProcessing).toBe(true);
      expect(mockSetInterval).toHaveBeenCalledTimes(1);

      // Start second processing while first is running
      await act(async () => {
        await result.current.handleProcess();
      });

      expect(result.current.isProcessing).toBe(true);
      expect(mockSetInterval).toHaveBeenCalledTimes(2);
    });

    it('maintains state consistency during processing flow', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ jobId: 'job-123' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'completed' })
        });

      const { result } = renderHook(() => useFileProcessing());

      // Set initial state
      act(() => {
        result.current.setHasExistingUploads(true);
      });

      expect(result.current.hasExistingUploads).toBe(true);
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.processingStatus).toBe('');

      // Start processing
      await act(async () => {
        await result.current.handleProcess();
      });

      expect(result.current.hasExistingUploads).toBe(true); // Should remain unchanged
      expect(result.current.isProcessing).toBe(true);
      expect(result.current.processingStatus).toBe('Processing your data...');

      // Complete processing
      const pollCallback = mockSetInterval.mock.calls[0][0];
      await act(async () => {
        await pollCallback();
      });

      expect(result.current.hasExistingUploads).toBe(true); // Should remain unchanged
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.processingStatus).toBe('Processing completed successfully!');
    });

    it('handles malformed job status response', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ jobId: 'job-123' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ malformed: 'response' })
        });

      const { result } = renderHook(() => useFileProcessing());

      await act(async () => {
        await result.current.handleProcess();
      });

      const pollCallback = mockSetInterval.mock.calls[0][0];

      // Simulate the polling callback with malformed response
      await act(async () => {
        await pollCallback();
      });

      expect(result.current.processingStatus).toBe('Processing...');
      expect(result.current.isProcessing).toBe(true);
      expect(mockClearInterval).not.toHaveBeenCalled();
    });

    it('handles JSON parsing error in job status response', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ jobId: 'job-123' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => { throw new Error('Invalid JSON'); }
        });

      const { result } = renderHook(() => useFileProcessing());

      await act(async () => {
        await result.current.handleProcess();
      });

      const pollCallback = mockSetInterval.mock.calls[0][0];

      // Simulate the polling callback with JSON error
      await act(async () => {
        await pollCallback();
      });

      expect(result.current.processingStatus).toBe('Error checking processing status');
      expect(result.current.isProcessing).toBe(false);
      expect(mockClearInterval).toHaveBeenCalledWith(123);
      expect(mockConsoleError).toHaveBeenCalledWith('Error checking job status:', expect.any(Error));
    });

    it('handles failed job status API request', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ jobId: 'job-123' })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404
        });

      const { result } = renderHook(() => useFileProcessing());

      await act(async () => {
        await result.current.handleProcess();
      });

      const pollCallback = mockSetInterval.mock.calls[0][0];

      // Simulate the polling callback with failed request
      await act(async () => {
        await pollCallback();
      });

      expect(result.current.processingStatus).toBe('Error checking processing status');
      expect(result.current.isProcessing).toBe(false);
      expect(mockClearInterval).toHaveBeenCalledWith(123);
      expect(mockConsoleError).toHaveBeenCalledWith('Error checking job status:', expect.any(Error));
    });

    it('handles unknown job status', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ jobId: 'job-123' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'unknown', message: 'Unknown status' })
        });

      const { result } = renderHook(() => useFileProcessing());

      await act(async () => {
        await result.current.handleProcess();
      });

      const pollCallback = mockSetInterval.mock.calls[0][0];

      // Simulate the polling callback with unknown status
      await act(async () => {
        await pollCallback();
      });

      expect(result.current.processingStatus).toBe('Unknown status');
      expect(result.current.isProcessing).toBe(true);
      expect(mockClearInterval).not.toHaveBeenCalled();
    });
  });
});
