import { renderHook, act } from '@testing-library/react';
import { useFileUpload } from '../useFileUpload';

// Mock console.error to avoid noise in tests
const mockConsoleError = jest.fn();
global.console.error = mockConsoleError;

// Mock fetch
global.fetch = jest.fn();

// Mock DataTransfer and related APIs
class MockDataTransfer {
  items: DataTransferItemList;
  files: FileList;
  
  constructor() {
    const items: DataTransferItem[] = [];
    const files: File[] = [];
    
    this.items = {
      add: jest.fn((file: File) => {
        files.push(file);
        return null as any;
      }),
      clear: jest.fn(),
      remove: jest.fn(),
      length: 0,
      [Symbol.iterator]: function* () {
        yield* items;
      }
    } as any;
    
    this.files = files as any;
  }
}

global.DataTransfer = MockDataTransfer as any;

// Mock Event constructor
const mockDispatchEvent = jest.fn();
const mockInputElement = {
  files: null as FileList | null,
  value: '',
  dispatchEvent: mockDispatchEvent
};

// Mock useRef to return our mock input element
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useRef: () => ({ current: mockInputElement })
}));

const mockFile = new File(['file content'], 'test.xml', { type: 'text/xml' });
const mockFitFile = new File(['fit content'], 'test.fit', { type: 'application/octet-stream' });
const mockInvalidFile = new File(['invalid content'], 'test.txt', { type: 'text/plain' });

// Helper functions
const createMockFormEvent = () => ({
  preventDefault: jest.fn()
} as any);

const createMockDragEvent = (type: string, relatedTarget?: Element | null, currentTarget?: Element | null) => ({
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
  type,
  relatedTarget,
  currentTarget: currentTarget || {
    contains: jest.fn((target: Node) => target === relatedTarget)
  },
  dataTransfer: {
    files: type === 'drop' ? [mockFile] : []
  }
} as any);

describe('useFileUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleError.mockClear();
    (global.fetch as jest.Mock).mockClear();
    mockDispatchEvent.mockClear();
    mockInputElement.files = null;
    mockInputElement.value = '';
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('initialization', () => {
    it('initializes with default values', () => {
      const { result } = renderHook(() => useFileUpload());

      expect(result.current.isDragging).toBe(false);
      expect(result.current.isFileLoading).toBe(false);
      expect(result.current.fileKey).toBe(0);
      expect(result.current.error).toBeNull();
      expect(result.current.uploading).toBe(false);
      expect(result.current.progress).toBe(0);
      expect(result.current.uploadSuccess).toBe(false);
      expect(result.current.inputFileRef).toBeDefined();
      expect(result.current.inputFileRef.current).toBe(mockInputElement);
    });

    it('provides all expected functions', () => {
      const { result } = renderHook(() => useFileUpload());

      expect(typeof result.current.setIsFileLoading).toBe('function');
      expect(typeof result.current.setFileKey).toBe('function');
      expect(typeof result.current.setError).toBe('function');
      expect(typeof result.current.setUploadSuccess).toBe('function');
      expect(typeof result.current.handleDragEnter).toBe('function');
      expect(typeof result.current.handleDragLeave).toBe('function');
      expect(typeof result.current.handleDragOver).toBe('function');
      expect(typeof result.current.handleDrop).toBe('function');
      expect(typeof result.current.handleSubmit).toBe('function');
    });
  });

  describe('state setters', () => {
    it('setIsFileLoading updates loading state', () => {
      const { result } = renderHook(() => useFileUpload());

      act(() => {
        result.current.setIsFileLoading(true);
      });

      expect(result.current.isFileLoading).toBe(true);

      act(() => {
        result.current.setIsFileLoading(false);
      });

      expect(result.current.isFileLoading).toBe(false);
    });

    it('setFileKey updates file key', () => {
      const { result } = renderHook(() => useFileUpload());

      act(() => {
        result.current.setFileKey(5);
      });

      expect(result.current.fileKey).toBe(5);
    });

    it('setFileKey works with function updater', () => {
      const { result } = renderHook(() => useFileUpload());

      act(() => {
        result.current.setFileKey(prev => prev + 1);
      });

      expect(result.current.fileKey).toBe(1);

      act(() => {
        result.current.setFileKey(prev => prev + 2);
      });

      expect(result.current.fileKey).toBe(3);
    });

    it('setError updates error state', () => {
      const { result } = renderHook(() => useFileUpload());

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.error).toBeNull();
    });

    it('setUploadSuccess updates upload success state', () => {
      const { result } = renderHook(() => useFileUpload());

      act(() => {
        result.current.setUploadSuccess(true);
      });

      expect(result.current.uploadSuccess).toBe(true);

      act(() => {
        result.current.setUploadSuccess(false);
      });

      expect(result.current.uploadSuccess).toBe(false);
    });
  });

  describe('drag and drop handlers', () => {

    describe('handleDragEnter', () => {
      it('prevents default and sets dragging to true', () => {
        const { result } = renderHook(() => useFileUpload());
        const mockEvent = createMockDragEvent('dragenter');

        act(() => {
          result.current.handleDragEnter(mockEvent);
        });

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(mockEvent.stopPropagation).toHaveBeenCalled();
        expect(result.current.isDragging).toBe(true);
      });
    });

    describe('handleDragLeave', () => {
      it('prevents default and sets dragging to false when leaving container', () => {
        const { result } = renderHook(() => useFileUpload());
        
        // First set dragging to true
        act(() => {
          result.current.handleDragEnter(createMockDragEvent('dragenter'));
        });
        expect(result.current.isDragging).toBe(true);

        const mockCurrentTarget = {
          contains: jest.fn().mockReturnValue(false)
        };
        const mockEvent = createMockDragEvent('dragleave', document.body, mockCurrentTarget);

        act(() => {
          result.current.handleDragLeave(mockEvent);
        });

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(mockEvent.stopPropagation).toHaveBeenCalled();
        expect(result.current.isDragging).toBe(false);
      });

      it('does not set dragging to false when moving within container', () => {
        const { result } = renderHook(() => useFileUpload());
        
        // First set dragging to true
        act(() => {
          result.current.handleDragEnter(createMockDragEvent('dragenter'));
        });
        expect(result.current.isDragging).toBe(true);

        const childElement = document.createElement('div');
        const mockCurrentTarget = {
          contains: jest.fn().mockReturnValue(true)
        };
        const mockEvent = createMockDragEvent('dragleave', childElement, mockCurrentTarget);

        act(() => {
          result.current.handleDragLeave(mockEvent);
        });

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(mockEvent.stopPropagation).toHaveBeenCalled();
        expect(result.current.isDragging).toBe(true);
      });

      it('handles case when currentTarget is null', () => {
        const { result } = renderHook(() => useFileUpload());
        
        act(() => {
          result.current.handleDragEnter(createMockDragEvent('dragenter'));
        });
        expect(result.current.isDragging).toBe(true);

        const mockEvent = createMockDragEvent('dragleave', null, null);

        act(() => {
          result.current.handleDragLeave(mockEvent);
        });

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(mockEvent.stopPropagation).toHaveBeenCalled();
        // Should remain true since currentTarget is null
        expect(result.current.isDragging).toBe(true);
      });
    });

    describe('handleDragOver', () => {
      it('prevents default behavior', () => {
        const { result } = renderHook(() => useFileUpload());
        const mockEvent = createMockDragEvent('dragover');

        act(() => {
          result.current.handleDragOver(mockEvent);
        });

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(mockEvent.stopPropagation).toHaveBeenCalled();
      });
    });

    describe('handleDrop', () => {
      it('handles file drop successfully', () => {
        const { result } = renderHook(() => useFileUpload());
        
        // Set dragging to true first
        act(() => {
          result.current.handleDragEnter(createMockDragEvent('dragenter'));
        });
        expect(result.current.isDragging).toBe(true);

        const mockEvent = {
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
          dataTransfer: {
            files: [mockFile]
          }
        } as any;

        act(() => {
          result.current.handleDrop(mockEvent);
        });

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(mockEvent.stopPropagation).toHaveBeenCalled();
        expect(result.current.isDragging).toBe(false);
        expect(mockInputElement.files).toEqual([mockFile]);
        expect(mockDispatchEvent).toHaveBeenCalledWith(expect.any(Event));
      });

      it('handles drop with no files', () => {
        const { result } = renderHook(() => useFileUpload());
        
        const mockEvent = {
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
          dataTransfer: {
            files: []
          }
        } as any;

        act(() => {
          result.current.handleDrop(mockEvent);
        });

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(mockEvent.stopPropagation).toHaveBeenCalled();
        expect(result.current.isDragging).toBe(false);
        expect(mockInputElement.files).toBeNull();
        expect(mockDispatchEvent).not.toHaveBeenCalled();
      });

      it('handles drop when inputFileRef.current is null', () => {
        const { result } = renderHook(() => useFileUpload());
        
        // Temporarily set current to null
        result.current.inputFileRef.current = null;

        const mockEvent = {
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
          dataTransfer: {
            files: [mockFile]
          }
        } as any;

        act(() => {
          result.current.handleDrop(mockEvent);
        });

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(mockEvent.stopPropagation).toHaveBeenCalled();
        expect(result.current.isDragging).toBe(false);
        expect(mockDispatchEvent).not.toHaveBeenCalled();
      });
    });
  });

  describe('handleSubmit', () => {

    it('prevents default form submission', async () => {
      const { result } = renderHook(() => useFileUpload());
      const mockEvent = createMockFormEvent();

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('sets error when no file is selected', async () => {
      const { result } = renderHook(() => useFileUpload());
      const mockEvent = createMockFormEvent();
      
      mockInputElement.files = null;

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.error).toBe('Please select a file to upload');
      expect(result.current.uploading).toBe(false);
    });

    it('sets error for invalid file type (non-XML/FIT)', async () => {
      const { result } = renderHook(() => useFileUpload());
      const mockEvent = createMockFormEvent();
      
      mockInputElement.files = [mockInvalidFile] as any;

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.error).toBe('Please upload an XML or FIT file');
      expect(result.current.uploading).toBe(false);
    });

    it('successfully uploads XML file', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const { result } = renderHook(() => useFileUpload());
      const mockEvent = createMockFormEvent();
      
      mockInputElement.files = [mockFile] as any;

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/upload', {
        method: 'POST',
        body: expect.any(FormData)
      });

      expect(result.current.uploading).toBe(false);
      expect(result.current.uploadSuccess).toBe(true);
      expect(result.current.progress).toBe(100);
      expect(result.current.error).toBeNull();
      expect(mockInputElement.value).toBe('');
      expect(result.current.fileKey).toBe(1);
    });

    it('successfully uploads FIT file', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const { result } = renderHook(() => useFileUpload());
      const mockEvent = createMockFormEvent();
      
      mockInputElement.files = [mockFitFile] as any;

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/upload', {
        method: 'POST',
        body: expect.any(FormData)
      });

      expect(result.current.uploading).toBe(false);
      expect(result.current.uploadSuccess).toBe(true);
      expect(result.current.progress).toBe(100);
      expect(result.current.error).toBeNull();
    });

    it('handles upload failure (response not ok)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const { result } = renderHook(() => useFileUpload());
      const mockEvent = createMockFormEvent();
      
      mockInputElement.files = [mockFile] as any;

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.uploading).toBe(false);
      expect(result.current.uploadSuccess).toBe(false);
      expect(result.current.error).toBe('Upload failed');
    });

    it('handles network error during upload', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useFileUpload());
      const mockEvent = createMockFormEvent();
      
      mockInputElement.files = [mockFile] as any;

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.uploading).toBe(false);
      expect(result.current.uploadSuccess).toBe(false);
      expect(result.current.error).toBe('Network error');
      expect(mockConsoleError).toHaveBeenCalledWith('Upload error:', expect.any(Error));
    });

    it('handles non-Error exception during upload', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce('String error');

      const { result } = renderHook(() => useFileUpload());
      const mockEvent = createMockFormEvent();
      
      mockInputElement.files = [mockFile] as any;

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.uploading).toBe(false);
      expect(result.current.uploadSuccess).toBe(false);
      expect(result.current.error).toBe('Upload failed');
      expect(mockConsoleError).toHaveBeenCalledWith('Upload error:', 'String error');
    });

    it('sets uploading state during upload process', async () => {
      let resolvePromise: (value: any) => void;
      const uploadPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValueOnce(uploadPromise);

      const { result } = renderHook(() => useFileUpload());
      const mockEvent = createMockFormEvent();
      
      mockInputElement.files = [mockFile] as any;

      // Start upload (don't await yet)
      act(() => {
        result.current.handleSubmit(mockEvent);
      });

      // Check that uploading is true during the process
      expect(result.current.uploading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.progress).toBe(0);

      // Complete the upload
      await act(async () => {
        resolvePromise!({
          ok: true,
          json: async () => ({ success: true })
        });
        await uploadPromise;
      });

      expect(result.current.uploading).toBe(false);
    });

    it.skip('handles case when inputFileRef.current is null during reset', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const { result } = renderHook(() => useFileUpload());
      const mockEvent = createMockFormEvent();
      
      mockInputElement.files = [mockFile] as any;

      await act(async () => {
        // Set inputFileRef.current to null just before the reset logic runs
        result.current.inputFileRef.current = null;
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.uploading).toBe(false);
      expect(result.current.uploadSuccess).toBe(true);
      expect(result.current.progress).toBe(100);
      expect(result.current.error).toBeNull();
      // FileKey should not increment when inputFileRef.current is null
      expect(result.current.fileKey).toBe(0);
    });
  });

  describe('FormData validation', () => {
    it('creates FormData with correct fields', async () => {
      const mockFormData = {
        append: jest.fn()
      };
      global.FormData = jest.fn(() => mockFormData) as any;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const { result } = renderHook(() => useFileUpload());
      const mockEvent = createMockFormEvent();
      
      mockInputElement.files = [mockFile] as any;

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(mockFormData.append).toHaveBeenCalledWith('file', mockFile);
      expect(mockFormData.append).toHaveBeenCalledWith('type', 'health-data');
    });
  });

  describe('edge cases and integration scenarios', () => {
    it('handles rapid state changes', () => {
      const { result } = renderHook(() => useFileUpload());

      act(() => {
        result.current.setIsFileLoading(true);
        result.current.setError('Test error');
        result.current.setUploadSuccess(true);
        result.current.setFileKey(5);
        result.current.setIsFileLoading(false);
        result.current.setError(null);
        result.current.setUploadSuccess(false);
      });

      expect(result.current.isFileLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.uploadSuccess).toBe(false);
      expect(result.current.fileKey).toBe(5);
    });

    it('handles multiple drag events in sequence', () => {
      const { result } = renderHook(() => useFileUpload());

      const mockEvent1 = createMockDragEvent('dragenter');
      const mockEvent2 = createMockDragEvent('dragover');
      const mockEvent3 = createMockDragEvent('dragleave', null, { contains: () => false });

      act(() => {
        result.current.handleDragEnter(mockEvent1);
      });
      expect(result.current.isDragging).toBe(true);

      act(() => {
        result.current.handleDragOver(mockEvent2);
      });
      expect(result.current.isDragging).toBe(true);

      act(() => {
        result.current.handleDragLeave(mockEvent3);
      });
      expect(result.current.isDragging).toBe(false);
    });

    it.skip('maintains state consistency during upload failure and recovery', async () => {
      // First upload fails
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const { result } = renderHook(() => useFileUpload());
      const mockEvent = createMockFormEvent();
      
      mockInputElement.files = [mockFile] as any;

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.error).toBe('Upload failed');
      expect(result.current.uploadSuccess).toBe(false);
      expect(result.current.uploading).toBe(false);

      // Clear error and try again successfully
      act(() => {
        result.current.setError(null);
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.error).toBeNull();
      expect(result.current.uploadSuccess).toBe(true);
      expect(result.current.uploading).toBe(false);
    });

    it.skip('handles component unmount during upload', async () => {
      let resolvePromise: (value: any) => void;
      const uploadPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValueOnce(uploadPromise);

      const { result, unmount } = renderHook(() => useFileUpload());
      const mockEvent = createMockFormEvent();
      
      mockInputElement.files = [mockFile] as any;

      // Start upload
      act(() => {
        result.current.handleSubmit(mockEvent);
      });

      expect(result.current.uploading).toBe(true);

      // Unmount component
      unmount();

      // Complete the upload (should not cause errors)
      await act(async () => {
        resolvePromise!({
          ok: true,
          json: async () => ({ success: true })
        });
        await uploadPromise;
      });

      // Should not throw any errors
    });

    it.skip('validates file extensions case insensitively', async () => {
      const xmlUpperCase = new File(['content'], 'test.XML', { type: 'text/xml' });
      const fitUpperCase = new File(['content'], 'test.FIT', { type: 'application/octet-stream' });
      
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        });

      const { result } = renderHook(() => useFileUpload());
      const mockEvent = createMockFormEvent();

      // Test uppercase XML
      mockInputElement.files = [xmlUpperCase] as any;
      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });
      expect(result.current.error).toBeNull();
      expect(result.current.uploadSuccess).toBe(true);

      // Reset state
      act(() => {
        result.current.setUploadSuccess(false);
      });

      // Test uppercase FIT
      mockInputElement.files = [fitUpperCase] as any;
      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });
      expect(result.current.error).toBeNull();
      expect(result.current.uploadSuccess).toBe(true);
    });
  });
});
