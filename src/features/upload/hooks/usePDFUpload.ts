import { useState, useCallback } from 'react';
import { useFileUpload } from './useFileUpload';
import {
  PDFProcessingResult,
  BloodMarker,
  DateGroup,
  UploadError,
  APIResponse
} from '../types';

interface UsePDFUploadOptions {
  onMarkersExtracted?: (markers: BloodMarker[], dateGroups: DateGroup[]) => void;
  onTextExtracted?: (text: string) => void;
  maxRetries?: number;
  extractText?: boolean;
  extractImages?: boolean;
  maxPages?: number;
}

interface UsePDFUploadReturn {
  // File upload functionality
  uploadFile: (file: File) => Promise<void>;
  uploadFiles: (files: File[]) => Promise<void>;
  cancelUpload: (fileId: string) => void;
  retryUpload: (fileId: string) => Promise<void>;
  clearFiles: () => void;

  // PDF-specific functionality
  processPDF: (file: File) => Promise<PDFProcessingResult>;
  extractBloodMarkers: (text: string) => Promise<{
    markers: BloodMarker[];
    dateGroups: DateGroup[];
    hasMultipleDates: boolean;
  }>;

  // State
  isProcessing: boolean;
  processingProgress: string;
  extractedMarkers: BloodMarker[];
  dateGroups: DateGroup[];
  extractedText: string | null;
  hasMultipleDates: boolean;

  // Inherited from useFileUpload
  files: any[];
  isUploading: boolean;
  hasError: boolean;
  hasCompleted: boolean;
}

export function usePDFUpload(options: UsePDFUploadOptions = {}): UsePDFUploadReturn {
  const {
    onMarkersExtracted,
    onTextExtracted,
    maxRetries = 3,
    extractText = true,
    extractImages = false,
    maxPages = 50
  } = options;

  // Local state for PDF processing
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState('');
  const [extractedMarkers, setExtractedMarkers] = useState<BloodMarker[]>([]);
  const [dateGroups, setDateGroups] = useState<DateGroup[]>([]);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [hasMultipleDates, setHasMultipleDates] = useState(false);

  // Use the base file upload hook
  const fileUpload = useFileUpload({
    allowedTypes: ['application/pdf'],
    maxFileSize: 10 * 1024 * 1024, // 10MB for PDFs
    autoStart: false, // We'll handle the upload manually
    maxRetries
  });

  // PDF.js text extraction
  const extractTextFromPDF = useCallback(async (file: File): Promise<string> => {
    const PDF_JS = await import('pdfjs-dist/build/pdf.mjs');

    // Initialize PDF.js worker
    if (typeof window !== 'undefined') {
      PDF_JS.GlobalWorkerOptions.workerSrc = '/vendor/pdfjs/pdf.worker.min.js';
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const pdf = await PDF_JS.getDocument({ data: arrayBuffer }).promise;

          let fullText = '';

          // Limit pages to avoid excessive processing
          const pagesToProcess = Math.min(pdf.numPages, maxPages);

          for (let i = 1; i <= pagesToProcess; i++) {
            setProcessingProgress(`Extracting text from page ${i} of ${pagesToProcess}`);
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            const pageText = textContent.items
              .map(item => ('str' in item ? item.str : ''))
              .join(' ');

            fullText += pageText + '\n';
          }

          resolve(fullText);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read PDF file'));
      reader.readAsArrayBuffer(file);
    });
  }, [maxPages]);

  // Extract blood markers from text using AI
  const extractBloodMarkers = useCallback(async (text: string) => {
    setProcessingProgress('Analyzing PDF content...');

    try {
      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (response.status === 401) {
        throw new Error('Session expired. Please sign in again.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Upload failed with status ${response.status}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to process blood test');
      }

      const result = {
        markers: data.markers || [],
        dateGroups: data.dateGroups || [],
        hasMultipleDates: data.hasMultipleDates || false
      };

      // Update local state
      setExtractedMarkers(result.markers);
      setDateGroups(result.dateGroups);
      setHasMultipleDates(result.hasMultipleDates);

      // Call callbacks
      onMarkersExtracted?.(result.markers, result.dateGroups);

      return result;
    } catch (error) {
      const uploadError: UploadError = {
        code: 'MARKER_EXTRACTION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to extract blood markers',
        details: error
      };

      throw uploadError;
    }
  }, [onMarkersExtracted]);

  // Process PDF file
  const processPDF = useCallback(async (file: File): Promise<PDFProcessingResult> => {
    setIsProcessing(true);
    setProcessingProgress('Preparing PDF file...');

    try {
      let text = '';

      if (extractText) {
        text = await extractTextFromPDF(file);
        setExtractedText(text);
        onTextExtracted?.(text);
      }

      const result: PDFProcessingResult = {
        text: extractText ? text : undefined,
        metadata: {
          pages: 0, // We don't have this info without loading the PDF again
          fileSize: file.size,
          extractedAt: new Date().toISOString()
        }
      };

      return result;
    } finally {
      setIsProcessing(false);
      setProcessingProgress('');
    }
  }, [extractText, extractTextFromPDF, onTextExtracted]);

  // Enhanced upload function that includes PDF processing
  const uploadPDF = useCallback(async (file: File) => {
    // First upload the file
    await fileUpload.uploadFile(file);

    // Then process it
    try {
      await processPDF(file);
      const text = await extractTextFromPDF(file);
      await extractBloodMarkers(text);
    } catch (error) {
      console.error('PDF processing failed:', error);
      // File upload succeeded but processing failed
      // This is handled by the error state in the hooks
    }
  }, [fileUpload, processPDF, extractTextFromPDF, extractBloodMarkers]);

  // Upload multiple PDFs
  const uploadPDFs = useCallback(async (files: File[]) => {
    for (const file of files) {
      if (file.type === 'application/pdf') {
        await uploadPDF(file);
      }
    }
  }, [uploadPDF]);

  // Reset function to clear all state
  const resetPDFState = useCallback(() => {
    setIsProcessing(false);
    setProcessingProgress('');
    setExtractedMarkers([]);
    setDateGroups([]);
    setExtractedText(null);
    setHasMultipleDates(false);
  }, []);

  // Enhanced clear files that also resets PDF state
  const clearFiles = useCallback(() => {
    fileUpload.clearFiles();
    resetPDFState();
  }, [fileUpload, resetPDFState]);

  return {
    // File upload functionality
    uploadFile: uploadPDF,
    uploadFiles: uploadPDFs,
    cancelUpload: fileUpload.cancelUpload,
    retryUpload: fileUpload.retryUpload,
    clearFiles,

    // PDF-specific functionality
    processPDF,
    extractBloodMarkers,

    // State
    isProcessing,
    processingProgress,
    extractedMarkers,
    dateGroups,
    extractedText,
    hasMultipleDates,

    // Inherited from useFileUpload
    files: fileUpload.files,
    isUploading: fileUpload.isUploading,
    hasError: fileUpload.hasError,
    hasCompleted: fileUpload.hasCompleted
  };
}
