import { renderHook, act, waitFor } from '@testing-library/react';
import { usePDFUpload } from '../usePDFUpload';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock PDF.js
jest.mock('pdfjs-dist/build/pdf.mjs', () => ({
  GlobalWorkerOptions: {
    set workerSrc(value: string) {}
  },
  getDocument: jest.fn(() => ({
    promise: Promise.resolve({
      numPages: 2,
      getPage: jest.fn((pageNum: number) => Promise.resolve({
        getTextContent: jest.fn(() => Promise.resolve({
          items: [
            { str: `Page ${pageNum} text content` },
            { str: `Line 2 of page ${pageNum}` }
          ]
        }))
      }))
    })
  }))
}));

// Mock File constructor
const mockPDFFile = (name: string = 'test.pdf', content: string = 'PDF content') =>
  new File([content], name, { type: 'application/pdf' });

describe('usePDFUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => usePDFUpload());

      expect(result.current.extractedMarkers).toEqual([]);
      expect(result.current.dateGroups).toEqual([]);
      expect(result.current.extractedText).toBeNull();
      expect(result.current.hasMultipleDates).toBe(false);
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.processingProgress).toBe('');
      expect(result.current.files).toEqual([]);
      expect(result.current.isUploading).toBe(false);
    });

    it('should initialize with custom options', () => {
      const customOptions = {
        extractText: false,
        extractImages: true,
        maxPages: 10,
        maxRetries: 5
      };

      const { result } = renderHook(() => usePDFUpload(customOptions));

      expect(result.current.extractedMarkers).toEqual([]);
      expect(result.current.isProcessing).toBe(false);
    });
  });

  describe('PDF Processing', () => {
    it('should process PDF successfully with text extraction', async () => {
      const onTextExtracted = jest.fn();
      const { result } = renderHook(() => usePDFUpload({
        onTextExtracted,
        extractText: true
      }));

      const testFile = mockPDFFile('test.pdf', 'PDF content');

      await act(async () => {
        const pdfResult = await result.current.processPDF(testFile);
        expect(pdfResult).toHaveProperty('text');
        expect(pdfResult.text).toContain('Page 1 text content');
        expect(pdfResult.text).toContain('Page 2 text content');
      });

      expect(result.current.extractedText).toContain('Page 1 text content');
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.processingProgress).toBe('');
      expect(onTextExtracted).toHaveBeenCalledWith(expect.stringContaining('Page 1 text content'));
    });

    it('should skip text extraction when extractText is false', async () => {
      const { result } = renderHook(() => usePDFUpload({
        extractText: false
      }));

      const testFile = mockPDFFile();

      await act(async () => {
        const pdfResult = await result.current.processPDF(testFile);
        expect(pdfResult.text).toBeUndefined();
      });

      expect(result.current.extractedText).toBeNull();
    });

    it('should handle PDF processing errors', async () => {
      const mockError = new Error('Failed to load PDF');
      const PDF_JS = require('pdfjs-dist/build/pdf.mjs');
      PDF_JS.getDocument.mockImplementationOnce(() => ({
        promise: Promise.reject(mockError)
      }));

      const { result } = renderHook(() => usePDFUpload());

      const testFile = mockPDFFile();

      await act(async () => {
        await expect(result.current.processPDF(testFile)).rejects.toThrow('Failed to load PDF');
      });

      expect(result.current.isProcessing).toBe(false);
    });

    it('should limit pages processed based on maxPages', async () => {
      const { result } = renderHook(() => usePDFUpload({
        maxPages: 1
      }));

      const testFile = mockPDFFile();

      await act(async () => {
        const pdfResult = await result.current.processPDF(testFile);
        expect(pdfResult.text).toContain('Page 1 text content');
        expect(pdfResult.text).not.toContain('Page 2 text content');
      });
    });
  });

  describe('Blood Marker Extraction', () => {
    it('should extract blood markers successfully', async () => {
      const mockMarkers = [
        { name: 'Glucose', value: 90, unit: 'mg/dL', flag: null, category: 'Metabolic' },
        { name: 'Cholesterol', value: 180, unit: 'mg/dL', flag: 'High', category: 'Lipid' }
      ];

      const mockDateGroups = [
        {
          testDate: '2024-01-15',
          markers: mockMarkers
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          markers: mockMarkers,
          dateGroups: mockDateGroups,
          hasMultipleDates: false
        })
      });

      const onMarkersExtracted = jest.fn();
      const { result } = renderHook(() => usePDFUpload({
        onMarkersExtracted
      }));

      await act(async () => {
        const extractionResult = await result.current.extractBloodMarkers('Sample PDF text content');
        expect(extractionResult.markers).toEqual(mockMarkers);
        expect(extractionResult.dateGroups).toEqual(mockDateGroups);
        expect(extractionResult.hasMultipleDates).toBe(false);
      });

      expect(result.current.extractedMarkers).toEqual(mockMarkers);
      expect(result.current.dateGroups).toEqual(mockDateGroups);
      expect(result.current.hasMultipleDates).toBe(false);
      expect(onMarkersExtracted).toHaveBeenCalledWith(mockMarkers, mockDateGroups);
    });

    it.skip('should handle API errors during marker extraction', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' })
      });

      const { result } = renderHook(() => usePDFUpload());

      await act(async () => {
        await expect(result.current.extractBloodMarkers('Sample text')).rejects.toThrow('Server error');
      });
    });

    it.skip('should handle network errors during marker extraction', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => usePDFUpload());

      await act(async () => {
        await expect(result.current.extractBloodMarkers('Sample text')).rejects.toThrow('Network error');
      });
    });

    it.skip('should handle session expired error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' })
      });

      const { result } = renderHook(() => usePDFUpload());

      await act(async () => {
        await expect(result.current.extractBloodMarkers('Sample text')).rejects.toThrow('Session expired. Please sign in again.');
      });
    });
  });

  describe('File Upload Integration', () => {
    it.skip('should upload and process PDF successfully', async () => {
      // Mock successful file upload
      const mockFetchUpload = jest.fn();
      global.fetch = mockFetchUpload;

      // Mock successful marker extraction
      mockFetchUpload.mockImplementation((url: string) => {
        if (url.includes('/api/pdf')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              markers: [{ name: 'Test Marker', value: 100, unit: 'unit', flag: null, category: 'Test' }],
              dateGroups: [{ testDate: '2024-01-01', markers: [] }],
              hasMultipleDates: false
            })
          });
        }
        // Mock successful chunk upload
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      });

      const onMarkersExtracted = jest.fn();
      const onTextExtracted = jest.fn();

      const { result } = renderHook(() => usePDFUpload({
        onMarkersExtracted,
        onTextExtracted
      }));

      const testFile = mockPDFFile();

      await act(async () => {
        await result.current.uploadFile(testFile);
      });

      expect(result.current.files).toHaveLength(1);
      expect(result.current.files[0].status).toBe('completed');
      expect(result.current.extractedMarkers).toHaveLength(1);
      expect(onMarkersExtracted).toHaveBeenCalled();
      expect(onTextExtracted).toHaveBeenCalled();
    });

    it.skip('should handle upload success but processing failure', async () => {
      // Mock successful file upload but failed processing
      const mockFetchUpload = jest.fn();
      global.fetch = mockFetchUpload;

      // Mock successful upload but failed marker extraction
      mockFetchUpload.mockImplementation((url: string) => {
        if (url.includes('/api/pdf')) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ error: 'Processing failed' })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      });

      const { result } = renderHook(() => usePDFUpload());

      const testFile = mockPDFFile();

      await act(async () => {
        await result.current.uploadFile(testFile);
      });

      // File should still be uploaded successfully
      expect(result.current.files[0].status).toBe('completed');
      // But processing should have failed
      expect(result.current.extractedMarkers).toHaveLength(0);
    });

    it('should only process PDF files in multiple file upload', async () => {
      const mockFetchUpload = jest.fn();
      global.fetch = mockFetchUpload;

      mockFetchUpload.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      const { result } = renderHook(() => usePDFUpload());

      const files = [
        mockPDFFile('test1.pdf'),
        new File(['text content'], 'test.txt', { type: 'text/plain' }),
        mockPDFFile('test2.pdf')
      ];

      await act(async () => {
        await result.current.uploadFiles(files);
      });

      // Should only process the PDF files
      expect(result.current.files).toHaveLength(2);
      expect(result.current.files.every(f => f.type === 'application/pdf')).toBe(true);
    });
  });

  describe('State Management', () => {
    it('should clear all state correctly', async () => {
      const { result } = renderHook(() => usePDFUpload());

      // Set some state
      act(() => {
        result.current.clearFiles();
      });

      expect(result.current.extractedMarkers).toEqual([]);
      expect(result.current.dateGroups).toEqual([]);
      expect(result.current.extractedText).toBeNull();
      expect(result.current.hasMultipleDates).toBe(false);
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.processingProgress).toBe('');
      expect(result.current.files).toEqual([]);
    });

    it.skip('should manage processing state during PDF processing', async () => {
      const { result } = renderHook(() => usePDFUpload());

      const testFile = mockPDFFile();

      // Start processing
      const processPromise = act(async () => {
        return result.current.processPDF(testFile);
      });

      // Should be processing
      expect(result.current.isProcessing).toBe(true);

      // Wait for completion
      await act(async () => {
        await processPromise;
      });

      // Should not be processing anymore
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.processingProgress).toBe('');
    });

    it.skip('should update processing progress', async () => {
      const { result } = renderHook(() => usePDFUpload());

      const testFile = mockPDFFile();

      await act(async () => {
        await result.current.processPDF(testFile);
      });

      // Progress should have been updated during processing
      expect(result.current.processingProgress).toBe('');
    });
  });

  describe('Callback Integration', () => {
    it.skip('should call onMarkersExtracted callback with correct data', async () => {
      const mockMarkers = [{ name: 'Test', value: 100, unit: 'unit', flag: null, category: 'Test' }];
      const mockDateGroups = [{ testDate: '2024-01-01', markers: mockMarkers }];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          markers: mockMarkers,
          dateGroups: mockDateGroups,
          hasMultipleDates: false
        })
      });

      const onMarkersExtracted = jest.fn();
      const { result } = renderHook(() => usePDFUpload({
        onMarkersExtracted
      }));

      await act(async () => {
        await result.current.extractBloodMarkers('Sample text');
      });

      expect(onMarkersExtracted).toHaveBeenCalledWith(mockMarkers, mockDateGroups);
    });

    it.skip('should call onTextExtracted callback with extracted text', async () => {
      const onTextExtracted = jest.fn();
      const { result } = renderHook(() => usePDFUpload({
        onTextExtracted
      }));

      const testFile = mockPDFFile();

      await act(async () => {
        await result.current.processPDF(testFile);
      });

      expect(onTextExtracted).toHaveBeenCalledWith(expect.stringContaining('Page 1 text content'));
    });

    it.skip('should handle missing callbacks gracefully', async () => {
      const { result } = renderHook(() => usePDFUpload());

      const testFile = mockPDFFile();

      await act(async () => {
        await result.current.processPDF(testFile);
      });

      // Should not throw even without callbacks
      expect(result.current.extractedText).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it.skip('should handle invalid file types', async () => {
      const { result } = renderHook(() => usePDFUpload());

      const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });

      // Should not process non-PDF files
      await act(async () => {
        await result.current.uploadFile(invalidFile);
      });

      expect(result.current.files).toHaveLength(0);
    });

    it.skip('should handle file read errors', async () => {
      const mockError = new Error('Failed to read file');

      // Mock FileReader to simulate error
      const originalFileReader = global.FileReader;
      global.FileReader = jest.fn(() => ({
        readAsArrayBuffer: jest.fn(),
        onload: jest.fn(),
        onerror: jest.fn(() => {
          const reader = global.FileReader as any;
          reader.onerror();
        })
      })) as any;

      const { result } = renderHook(() => usePDFUpload());

      const testFile = mockPDFFile();

      await act(async () => {
        await expect(result.current.processPDF(testFile)).rejects.toThrow('Failed to read PDF file');
      });

      global.FileReader = originalFileReader;
    });

    it.skip('should handle API response parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      const { result } = renderHook(() => usePDFUpload());

      await act(async () => {
        await expect(result.current.extractBloodMarkers('Sample text')).rejects.toThrow('Invalid JSON');
      });
    });
  });
});
