'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import BloodMarkerPreview from './BloodMarkerPreview';
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

export default function BloodTestUpload() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [fileKey, setFileKey] = useState(0);
  const [extractedMarkers, setExtractedMarkers] = useState<BloodMarker[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [extractedDate, setExtractedDate] = useState<string | null>(null);
  const [dateGroups, setDateGroups] = useState<DateGroup[]>([]);
  const [hasMultipleDates, setHasMultipleDates] = useState(false);

  // Initialize PDF.js
  useEffect(() => {
    if (typeof window !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    }
  }, []);

  const resetUpload = useCallback(() => {
    setIsUploading(false);
    setUploadProgress('');
    setFileKey(prev => prev + 1);
    setExtractedMarkers([]);
    setShowPreview(false);
    setExtractedDate(null);
    setDateGroups([]);
    setHasMultipleDates(false);
  }, []);

  const handleSaveMarkers = async (markers: BloodMarker[], date: Date) => {
    if (!session?.user?.id) {
      toast.error('You must be logged in to save blood markers');
      signIn();
      return;
    }

    try {
      const dateISOString = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      
      console.log('Saving blood markers for date:', dateISOString);
      console.log('Number of markers:', markers.length);
      console.log('Marker names:', markers.map(m => m.name).join(', '));
      
      const response = await fetch('/api/blood-markers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markers,
          date: dateISOString,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to save with status ${response.status}`);
      }

      // Individual group success (be quieter if there are multiple calls)
      if (dateGroups.length > 1) {
        console.log(`Saved ${markers.length} markers for date ${dateISOString}`);
      } else {
        // Show toast only for single date group
        toast.success(`${markers.length} blood markers saved successfully`);
        
        // For single group, we can reset and dispatch here
        resetUpload();
        
        // Notify other components about the change
        if (typeof window !== 'undefined') {
          console.log('Dispatching bloodMarkerAdded event after saving markers');
          window.dispatchEvent(new Event('bloodMarkerAdded'));
        }
      }
      
      return true; // Indicate success for the caller
    } catch (error) {
      console.error(`Error saving blood markers for date ${date.toISOString().split('T')[0]}:`, error);
      toast.error(`Failed to save markers for ${date.toLocaleDateString()}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false; // Indicate failure
    }
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        setUploadProgress(`Extracting text from page ${i} of ${pdf.numPages}`);
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
    setUploadProgress('Preparing PDF file...');

    try {
      const extractedText = await extractTextFromPdf(file);
      
      setUploadProgress('Processing blood test results...');
      
      console.log('📤 Sending PDF text to API for processing...');
      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: extractedText }),
      });

      if (response.status === 401) {
        toast.error('Session expired. Please sign in again.');
        signIn();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Upload failed with status ${response.status}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to process blood test');
      }
      
      console.log('API response data:', data);
      
      // Check if we have extracted markers
      if (data.markers && data.markers.length > 0) {
        // Log and validate the date before setting state
        console.log('📥 Raw testDate from API:', data.testDate);
        console.log('📥 testDate type:', typeof data.testDate);
        console.log('📥 Multiple dates detected:', data.hasMultipleDates);
        console.log('📥 Date groups count:', data.dateGroups?.length || 0);
        
        // Ensure the date is a properly formatted ISO string if present
        if (data.testDate && typeof data.testDate === 'string') {
          console.log('📥 Validating date format:', data.testDate);
          if (!/^\d{4}-\d{2}-\d{2}$/.test(data.testDate)) {
            console.warn('📥 testDate is not in proper ISO format, attempting to fix:', data.testDate);
            // Try to fix it if possible
            try {
              const fixedDate = new Date(data.testDate).toISOString().split('T')[0];
              if (/^\d{4}-\d{2}-\d{2}$/.test(fixedDate)) {
                console.log('📥 Fixed date format to:', fixedDate);
                data.testDate = fixedDate;
              } else {
                console.warn('📥 Could not fix date to proper format:', fixedDate);
              }
            } catch (e) {
              console.error(' Failed to fix date format:', e);
            }
          } else {
            console.log('📥 testDate is in proper ISO format');
          }
        } else if (data.testDate === null) {
          console.log('📥 No test date was found in the PDF (null)');
        } else if (data.testDate === undefined) {
          console.log('📥 Test date is undefined');
        }
        
        setExtractedMarkers(data.markers);
        console.log('📥 Setting extractedDate to:', data.testDate);
        setExtractedDate(data.testDate);
        
        // Handle multiple date groups if present
        if (data.dateGroups && Array.isArray(data.dateGroups) && data.dateGroups.length > 0) {
          console.log('📥 Setting date groups:', data.dateGroups.length);
          console.log('📥 Date groups data:', JSON.stringify(data.dateGroups));
          setDateGroups(data.dateGroups);
          setHasMultipleDates(data.hasMultipleDates || data.dateGroups.length > 1);
        }
        
        console.log('📥 State after setting extractedDate, value is:', data.testDate);
        setShowPreview(true);
        
        // Provide feedback about the extraction
        if (data.hasMultipleDates) {
          toast.success(`Found ${data.dateGroups.length} test dates with blood markers`);
        } else if (data.testDate) {
          toast.success('Blood markers and test date extracted successfully');
        } else {
          toast.success('Blood markers extracted successfully');
        }
      } else {
        toast.error('No blood markers found in the PDF');
      }
    } catch (error) {
      console.error('Error processing PDF:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process PDF');
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  }, [signIn]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <>
      <div className="w-full mx-auto">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition ${
            isUploading
              ? 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700 cursor-not-allowed'
              : isDragActive
              ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700'
              : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }`}
        >
          <input {...getInputProps()} disabled={isUploading} key={fileKey} />
          <div className="space-y-4">
            {isUploading ? (
              <>
                <div className="flex justify-center">
                  <svg
                    className="animate-spin h-10 w-10 text-indigo-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
                <div>
                  <p className="text-base text-gray-600 dark:text-gray-400">
                    Processing PDF...
                  </p>
                  {uploadProgress && (
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      {uploadProgress}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-center">
                  <svg
                    className="w-12 h-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-base text-gray-600 dark:text-gray-400">
                    Drop your blood test PDF here, or click to select
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    PDF file up to 10MB
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <BloodMarkerPreview
        isOpen={showPreview}
        onClose={() => {
          setShowPreview(false);
          resetUpload();
        }}
        markers={extractedMarkers}
        onSave={handleSaveMarkers}
        initialDate={extractedDate}
        dateGroups={dateGroups}
      />
    </>
  );
} 