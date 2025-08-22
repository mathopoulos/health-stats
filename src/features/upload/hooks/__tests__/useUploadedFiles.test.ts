import { renderHook, act } from '@testing-library/react';
import { toast } from 'react-hot-toast';
import { useUploadedFiles } from '../useUploadedFiles';

// Mock dependencies
jest.mock('react-hot-toast');

const mockToast = toast as jest.MockedFunction<typeof toast>;

// Mock fetch
global.fetch = jest.fn();

const mockFile = {
  id: 'file-123',
  name: 'test-document.pdf',
  size: 1024,
  uploadedAt: '2024-01-15T10:30:00Z',
  type: 'application/pdf'
};

const mockFiles = [
  mockFile,
  {
    id: 'file-456',
    name: 'health-report.jpg',
    size: 2048,
    uploadedAt: '2024-01-16T14:45:00Z',
    type: 'image/jpeg'
  }
];

describe('useUploadedFiles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToast.success = jest.fn();
    mockToast.error = jest.fn();
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('initialization', () => {
    it('initializes with default values', () => {
      const { result } = renderHook(() => useUploadedFiles());

      expect(result.current.uploadedFiles).toEqual([]);
      expect(result.current.selectedFiles).toEqual(new Set());
      expect(result.current.isLoadingFiles).toBe(true); // Should start loading
    });

    it.skip('initializes and fetches files on mount', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, files: mockFiles })
      });

      const { result } = renderHook(() => useUploadedFiles());

      expect(result.current.isLoadingFiles).toBe(true);

      // Wait for fetch to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/uploads', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      expect(result.current.uploadedFiles).toEqual(mockFiles);
      expect(result.current.isLoadingFiles).toBe(false);
    });

    it('handles fetch failure on mount', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useUploadedFiles());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.uploadedFiles).toEqual([]);
      expect(result.current.isLoadingFiles).toBe(false);
    });

    it('handles unsuccessful API response on mount', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const { result } = renderHook(() => useUploadedFiles());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.uploadedFiles).toEqual([]);
      expect(result.current.isLoadingFiles).toBe(false);
    });

    it('handles API response without success field', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ files: mockFiles }) // Missing success: true
      });

      const { result } = renderHook(() => useUploadedFiles());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.uploadedFiles).toEqual([]);
      expect(result.current.isLoadingFiles).toBe(false);
    });

    it('handles API response without files field', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }) // Missing files
      });

      const { result } = renderHook(() => useUploadedFiles());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.uploadedFiles).toEqual([]);
      expect(result.current.isLoadingFiles).toBe(false);
    });
  });

  describe('toggleFileSelection', () => {
    it('selects an unselected file', () => {
      const { result } = renderHook(() => useUploadedFiles());

      act(() => {
        result.current.toggleFileSelection('file-123');
      });

      expect(result.current.selectedFiles).toEqual(new Set(['file-123']));
    });

    it('deselects a selected file', () => {
      const { result } = renderHook(() => useUploadedFiles());

      // First select the file
      act(() => {
        result.current.toggleFileSelection('file-123');
      });

      expect(result.current.selectedFiles).toEqual(new Set(['file-123']));

      // Then deselect it
      act(() => {
        result.current.toggleFileSelection('file-123');
      });

      expect(result.current.selectedFiles).toEqual(new Set());
    });

    it('handles multiple file selections', () => {
      const { result } = renderHook(() => useUploadedFiles());

      act(() => {
        result.current.toggleFileSelection('file-123');
        result.current.toggleFileSelection('file-456');
      });

      expect(result.current.selectedFiles).toEqual(new Set(['file-123', 'file-456']));
    });

    it('handles partial deselection with multiple files', () => {
      const { result } = renderHook(() => useUploadedFiles());

      // Select multiple files
      act(() => {
        result.current.toggleFileSelection('file-123');
        result.current.toggleFileSelection('file-456');
        result.current.toggleFileSelection('file-789');
      });

      expect(result.current.selectedFiles).toEqual(new Set(['file-123', 'file-456', 'file-789']));

      // Deselect one file
      act(() => {
        result.current.toggleFileSelection('file-456');
      });

      expect(result.current.selectedFiles).toEqual(new Set(['file-123', 'file-789']));
    });
  });

  describe('selectAllFiles', () => {
    it.skip('selects all files when uploadedFiles is populated', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, files: mockFiles })
      });

      const { result } = renderHook(() => useUploadedFiles());

      // Wait for files to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.selectAllFiles();
      });

      expect(result.current.selectedFiles).toEqual(new Set(['file-123', 'file-456']));
    });

    it.skip('handles selectAllFiles when no files are loaded', () => {
      const { result } = renderHook(() => useUploadedFiles());

      act(() => {
        result.current.selectAllFiles();
      });

      expect(result.current.selectedFiles).toEqual(new Set());
    });

    it.skip('selects all files when some are already selected', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, files: mockFiles })
      });

      const { result } = renderHook(() => useUploadedFiles());

      // Wait for files to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Select one file first
      act(() => {
        result.current.toggleFileSelection('file-123');
      });

      expect(result.current.selectedFiles).toEqual(new Set(['file-123']));

      // Now select all
      act(() => {
        result.current.selectAllFiles();
      });

      expect(result.current.selectedFiles).toEqual(new Set(['file-123', 'file-456']));
    });
  });

  describe('clearSelection', () => {
    it.skip('clears all selected files', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, files: mockFiles })
      });

      const { result } = renderHook(() => useUploadedFiles());

      // Wait for files to load and select all
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      act(() => {
        result.current.selectAllFiles();
      });

      expect(result.current.selectedFiles).toEqual(new Set(['file-123', 'file-456']));

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedFiles).toEqual(new Set());
    });

    it.skip('handles clearSelection when no files are selected', () => {
      const { result } = renderHook(() => useUploadedFiles());

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedFiles).toEqual(new Set());
    });
  });

  describe('deleteSelectedFiles', () => {
    it('successfully deletes selected files', async () => {
      // Mock initial fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, files: mockFiles })
      });

      const { result } = renderHook(() => useUploadedFiles());

      // Wait for files to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Select files to delete
      act(() => {
        result.current.toggleFileSelection('file-123');
        result.current.toggleFileSelection('file-456');
      });

      // Mock delete requests for each file
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true }) // Delete file-123
        .mockResolvedValueOnce({ ok: true }); // Delete file-456

      await act(async () => {
        await result.current.deleteSelectedFiles();
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/uploads/file-123', {
        method: 'DELETE'
      });
      expect(global.fetch).toHaveBeenCalledWith('/api/uploads/file-456', {
        method: 'DELETE'
      });

      expect(result.current.uploadedFiles).toEqual([]);
      expect(result.current.selectedFiles).toEqual(new Set());
    });

    it('handles mixed success/failure in delete operations', async () => {
      // Mock initial fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, files: mockFiles })
      });

      const { result } = renderHook(() => useUploadedFiles());

      // Wait for files to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Select files to delete
      act(() => {
        result.current.toggleFileSelection('file-123');
        result.current.toggleFileSelection('file-456');
      });

      // Mock delete requests - one success, one failure
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true }) // Delete file-123 succeeds
        .mockResolvedValueOnce({ ok: false, status: 404 }); // Delete file-456 fails

      await act(async () => {
        await result.current.deleteSelectedFiles();
      });

      // Only file-123 should be removed from the list
      expect(result.current.uploadedFiles).toEqual([mockFiles[1]]); // Only file-456 remains
      expect(result.current.selectedFiles).toEqual(new Set());
    });

    it.skip('handles network errors during delete', async () => {
      // Mock initial fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, files: mockFiles })
      });

      const { result } = renderHook(() => useUploadedFiles());

      // Wait for files to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Select a file to delete
      act(() => {
        result.current.toggleFileSelection('file-123');
      });

      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await act(async () => {
        await result.current.deleteSelectedFiles();
      });

      // Files should remain unchanged due to error
      expect(result.current.uploadedFiles).toEqual(mockFiles);
      expect(result.current.selectedFiles).toEqual(new Set());
    });

    it('does nothing when no files are selected', async () => {
      const { result } = renderHook(() => useUploadedFiles());

      // Clear any previous fetch calls
      (global.fetch as jest.Mock).mockClear();

      await act(async () => {
        await result.current.deleteSelectedFiles();
      });

      // Should not make any API calls
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it.skip('handles files with special characters in IDs', async () => {
      const specialFiles = [
        { id: 'file@#$%^&*()', name: 'special.pdf', size: 1024, uploadedAt: '2024-01-01T00:00:00Z', type: 'application/pdf' }
      ];

      // Mock initial fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, files: specialFiles })
      });

      const { result } = renderHook(() => useUploadedFiles());

      // Wait for files to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Select the special file
      act(() => {
        result.current.toggleFileSelection('file@#$%^&*()');
      });

      // Mock delete request
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      await act(async () => {
        await result.current.deleteSelectedFiles();
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/uploads/file%40%23%24%25%5E%26*()%27', {
        method: 'DELETE'
      });
    });
  });

  describe('handleDeleteFile', () => {
    it('successfully deletes a single file', async () => {
      // Mock initial fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, files: mockFiles })
      });

      const { result } = renderHook(() => useUploadedFiles());

      // Wait for files to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Mock delete request
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      await act(async () => {
        await result.current.handleDeleteFile('file-123');
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/uploads/file-123', {
        method: 'DELETE'
      });

      expect(result.current.uploadedFiles).toEqual([mockFiles[1]]); // Only file-456 remains
    });

    it('handles delete failure for single file', async () => {
      // Mock initial fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, files: mockFiles })
      });

      const { result } = renderHook(() => useUploadedFiles());

      // Wait for files to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Mock delete failure
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404 });

      await act(async () => {
        await result.current.handleDeleteFile('file-123');
      });

      // Files should remain unchanged
      expect(result.current.uploadedFiles).toEqual(mockFiles);
    });

    it('removes file from selected files when deleted', async () => {
      // Mock initial fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, files: mockFiles })
      });

      const { result } = renderHook(() => useUploadedFiles());

      // Wait for files to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Select the file first
      act(() => {
        result.current.toggleFileSelection('file-123');
      });

      expect(result.current.selectedFiles).toEqual(new Set(['file-123']));

      // Mock delete request
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      await act(async () => {
        await result.current.handleDeleteFile('file-123');
      });

      expect(result.current.selectedFiles).toEqual(new Set());
    });

    it('handles network error during single file delete', async () => {
      // Mock initial fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, files: mockFiles })
      });

      const { result } = renderHook(() => useUploadedFiles());

      // Wait for files to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await act(async () => {
        await result.current.handleDeleteFile('file-123');
      });

      // Files should remain unchanged
      expect(result.current.uploadedFiles).toEqual(mockFiles);
    });

    it('handles deleting non-existent file', async () => {
      // Mock initial fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, files: mockFiles })
      });

      const { result } = renderHook(() => useUploadedFiles());

      // Wait for files to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Mock delete request for non-existent file
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      await act(async () => {
        await result.current.handleDeleteFile('non-existent-file');
      });

      // Files should remain unchanged since the file wasn't in the list
      expect(result.current.uploadedFiles).toEqual(mockFiles);
    });
  });

  describe('state setters', () => {
    it.skip('setUploadedFiles updates files state', () => {
      const { result } = renderHook(() => useUploadedFiles());

      act(() => {
        result.current.setUploadedFiles(mockFiles);
      });

      expect(result.current.uploadedFiles).toEqual(mockFiles);
    });

    it.skip('setSelectedFiles updates selection state', () => {
      const { result } = renderHook(() => useUploadedFiles());

      const newSelection = new Set(['file-123', 'file-456']);

      act(() => {
        result.current.setSelectedFiles(newSelection);
      });

      expect(result.current.selectedFiles).toEqual(newSelection);
    });

    it.skip('setIsLoadingFiles updates loading state', () => {
      const { result } = renderHook(() => useUploadedFiles());

      act(() => {
        result.current.setIsLoadingFiles(false);
      });

      expect(result.current.isLoadingFiles).toBe(false);
    });
  });

  describe('edge cases and integration scenarios', () => {
    it('handles rapid file selections and deselections', () => {
      const { result } = renderHook(() => useUploadedFiles());

      act(() => {
        result.current.toggleFileSelection('file-1');
        result.current.toggleFileSelection('file-2');
        result.current.toggleFileSelection('file-1'); // Deselect
        result.current.toggleFileSelection('file-3');
        result.current.toggleFileSelection('file-2'); // Deselect
      });

      expect(result.current.selectedFiles).toEqual(new Set(['file-3']));
    });

    it('handles component unmount during fetch operation', async () => {
      let resolvePromise: (value: any) => void;
      const fetchPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValueOnce(fetchPromise);

      const { unmount } = renderHook(() => useUploadedFiles());

      // Unmount component while fetch is in progress
      unmount();

      // Complete the promise (this should not cause errors)
      await act(async () => {
        resolvePromise!({
          ok: true,
          json: async () => ({ success: true, files: mockFiles })
        });
        await fetchPromise;
      });

      // Should not throw any errors
    });

    it.skip('handles concurrent delete operations', async () => {
      // Mock initial fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, files: mockFiles })
      });

      const { result } = renderHook(() => useUploadedFiles());

      // Wait for files to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Select both files
      act(() => {
        result.current.toggleFileSelection('file-123');
        result.current.toggleFileSelection('file-456');
      });

      // Start concurrent delete operations
      const deletePromise1 = result.current.handleDeleteFile('file-123');
      const deletePromise2 = result.current.deleteSelectedFiles();

      // Mock the delete calls
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true }) // handleDeleteFile
        .mockResolvedValueOnce({ ok: true }) // deleteSelectedFiles - file-123
        .mockResolvedValueOnce({ ok: true }); // deleteSelectedFiles - file-456

      await act(async () => {
        await Promise.all([deletePromise1, deletePromise2]);
      });

      expect(result.current.uploadedFiles).toEqual([]);
      expect(result.current.selectedFiles).toEqual(new Set());
    });

    it.skip('maintains state consistency during rapid operations', async () => {
      const { result } = renderHook(() => useUploadedFiles());

      act(() => {
        result.current.setUploadedFiles(mockFiles);
        result.current.selectAllFiles();
        result.current.clearSelection();
        result.current.toggleFileSelection('file-123');
        result.current.setIsLoadingFiles(false);
      });

      expect(result.current.uploadedFiles).toEqual(mockFiles);
      expect(result.current.selectedFiles).toEqual(new Set(['file-123']));
      expect(result.current.isLoadingFiles).toBe(false);
    });

    it.skip('handles large number of files efficiently', () => {
      const largeFileList = Array.from({ length: 1000 }, (_, i) => ({
        id: `file-${i}`,
        name: `document-${i}.pdf`,
        size: 1024 * i,
        uploadedAt: '2024-01-01T00:00:00Z',
        type: 'application/pdf'
      }));

      const { result } = renderHook(() => useUploadedFiles());

      act(() => {
        result.current.setUploadedFiles(largeFileList);
      });

      act(() => {
        result.current.selectAllFiles();
      });

      expect(result.current.selectedFiles.size).toBe(1000);
      expect(result.current.uploadedFiles).toEqual(largeFileList);
    });

    it('handles malformed file data gracefully', async () => {
      const malformedFiles = [
        { id: null, name: undefined, size: 'invalid', uploadedAt: null, type: '' },
        { id: 'valid-file', name: 'test.pdf', size: 1024, uploadedAt: '2024-01-01T00:00:00Z', type: 'application/pdf' }
      ];

      // Mock initial fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, files: malformedFiles })
      });

      const { result } = renderHook(() => useUploadedFiles());

      // Wait for files to load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.uploadedFiles).toEqual(malformedFiles);

      // Should handle selection of malformed file without errors
      act(() => {
        result.current.toggleFileSelection(null as any);
        result.current.toggleFileSelection('valid-file');
      });

      expect(result.current.selectedFiles).toEqual(new Set([null, 'valid-file']));
    });
  });

  describe('API error handling', () => {
    it('handles JSON parsing errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); }
      });

      const { result } = renderHook(() => useUploadedFiles());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.uploadedFiles).toEqual([]);
      expect(result.current.isLoadingFiles).toBe(false);
    });

    it('handles different HTTP status codes', async () => {
      const statusCodes = [400, 401, 403, 404, 500, 502, 503];

      for (const status of statusCodes) {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status
        });

        const { result } = renderHook(() => useUploadedFiles());

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.uploadedFiles).toEqual([]);
        expect(result.current.isLoadingFiles).toBe(false);

        jest.clearAllMocks();
      }
    });

    it('handles timeout errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new DOMException('The operation was aborted', 'AbortError'));

      const { result } = renderHook(() => useUploadedFiles());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.uploadedFiles).toEqual([]);
      expect(result.current.isLoadingFiles).toBe(false);
    });
  });
});
