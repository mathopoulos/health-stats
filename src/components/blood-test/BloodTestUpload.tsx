'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';

interface BloodMarker {
  name: string;
  value: number;
  unit: string;
  flag: 'High' | 'Low' | null;
  category: string;
}

interface DateGroup {
  testDate: string;
  markers: BloodMarker[];
}

export function BloodTestUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<{
    markers: BloodMarker[];
    testDate: string | null;
    dateGroups?: DateGroup[];
    hasMultipleDates?: boolean;
  } | null>(null);

  // Initialize PDF.js worker
  useEffect(() => {
    if (typeof window !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    }
  }, []);

  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map(item => ('str' in item ? item.str : ''))
          .join(' ');
        fullText += pageText + '\n';
      }
      
      return fullText;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    setIsUploading(true);
    try {
      const extractedText = await extractTextFromPdf(file);
      
      console.log('📤 Sending PDF text to API for processing...');
      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: extractedText }),
      });

      if (!response.ok) {
        throw new Error('Failed to process PDF');
      }

      const data = await response.json();
      if (data.success) {
        console.log('📥 Received data from API:', data);
        console.log('📥 Raw test date from API:', data.testDate);
        console.log('📥 Multiple dates detected:', data.hasMultipleDates);
        
        if (data.dateGroups && data.dateGroups.length > 0) {
          console.log('📥 Date groups:', data.dateGroups.length);
          console.log('📥 First date group sample:', data.dateGroups[0]);
        }
        
        // Check if we have any markers
        if (data.markers && data.markers.length === 0 && 
           (!data.dateGroups || data.dateGroups.length === 0)) {
          toast.error('No blood markers could be extracted from this PDF. Please try another file or format.');
          return;
        }
        
        // Ensure the date is properly formatted
        let finalDate = data.testDate;
        if (finalDate && typeof finalDate === 'string') {
          console.log('📥 Validating date format:', finalDate);
          // Validate ISO format
          if (!/^\d{4}-\d{2}-\d{2}$/.test(finalDate)) {
            console.log('📥 Date is not in ISO format, attempting to fix');
            try {
              // Try to fix the format
              const fixedDate = new Date(finalDate).toISOString().split('T')[0];
              console.log('📥 Reformatted date to ISO:', fixedDate);
              finalDate = fixedDate;
            } catch (e) {
              console.error('📥 Failed to format date:', e);
            }
          } else {
            console.log('📥 Date is already in proper ISO format');
          }
        } else if (finalDate === null) {
          console.log('📥 No test date was found in the PDF (null)');
        } else if (finalDate === undefined) {
          console.log('📥 Test date is undefined');
        }
        
        console.log('📥 Final date to be set in state:', finalDate);
        setExtractedData({
          markers: data.markers,
          testDate: finalDate,
          dateGroups: data.dateGroups || [],
          hasMultipleDates: data.hasMultipleDates || false
        });
        
        // Provide feedback about the extraction
        if (data.hasMultipleDates) {
          toast.success(`Found ${data.dateGroups.length} test dates with blood markers`);
        } else if (data.testDate) {
          toast.success('Blood markers and test date extracted successfully');
        } else {
          toast.success('Blood markers extracted successfully, but no test date found');
          console.warn('No test date was found in the PDF');
        }
      } else {
        toast.error(data.error || 'Failed to extract blood markers');
      }
    } catch (error) {
      console.error('Error processing PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process PDF file';
      toast.error(`${errorMessage}. Please try uploading a different file or contact support if the issue persists.`);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
  });
  
  // Create a preview message based on extraction results
  const getPreviewMessage = () => {
    if (!extractedData) return '';
    
    if (extractedData.hasMultipleDates && extractedData.dateGroups?.length) {
      return `Found ${extractedData.dateGroups.length} test dates with a total of ${
        extractedData.dateGroups.reduce((sum, group) => sum + group.markers.length, 0)
      } blood markers`;
    }
    
    return `Found ${extractedData.markers.length} blood markers${
      extractedData.testDate ? ` from ${new Date(extractedData.testDate).toLocaleDateString()}` : ''
    }`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!extractedData ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
              : 'border-gray-300 dark:border-gray-700'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            {isUploading ? (
              // Loading state
              <div className="flex flex-col items-center space-y-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800">
                  <svg className="animate-spin h-6 w-6 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Processing PDF...
                </p>
              </div>
            ) : (
              // Default upload state
              <>
                <div className="flex justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <button
                    type="button"
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-medium"
                  >
                    Upload a file
                  </button>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    or drag and drop your blood test PDF here
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Extracted Blood Markers
            </h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {getPreviewMessage()}
            </p>
            
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => {
                  // Display the BloodMarkerPreview component from the app directory
                  // This is handled by your existing code elsewhere
                }}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Review & Save Markers
              </button>
              
              <button
                onClick={() => setExtractedData(null)}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Upload Another PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 