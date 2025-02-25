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

export default function BloodTestUpload() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [fileKey, setFileKey] = useState(0);
  const [extractedMarkers, setExtractedMarkers] = useState<BloodMarker[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [extractedDate, setExtractedDate] = useState<string | null>(null);

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
  }, []);

  const handleSaveMarkers = async (markers: BloodMarker[], testDate: Date) => {
    try {
      // Filter out markers with null or undefined values
      const validMarkers = markers.filter(marker => marker.value !== null && marker.value !== undefined);
      
      const response = await fetch('/api/blood-markers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: testDate,
          markers: validMarkers.map(marker => ({
            name: marker.name,
            value: marker.value,
            unit: marker.unit,
            category: marker.category
          }))
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save blood markers');
      }

      toast.success('Blood markers saved successfully');
      router.refresh(); // Refresh the page data
    } catch (error) {
      console.error('Error saving blood markers:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save blood markers');
      throw error;
    }
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
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
    const file = acceptedFiles[0];
    if (!file) return;

    // Check if user is authenticated
    if (!session) {
      toast.error('Please sign in to upload files');
      signIn();
      return;
    }

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      resetUpload();
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      toast.error('File size must be less than 10MB');
      resetUpload();
      return;
    }

    setIsUploading(true);
    setUploadProgress('Processing blood test...');

    try {
      // Extract text from PDF on the client side
      const extractedText = await extractTextFromPdf(file);
      
      // Send only the extracted text to the API
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
      
      // Check if we have extracted markers
      if (data.markers && data.markers.length > 0) {
        setExtractedMarkers(data.markers);
        setExtractedDate(data.testDate);
        setShowPreview(true);
        toast.success('Blood markers extracted successfully');
      } else {
        toast('No blood markers were found in the PDF', {
          icon: '⚠️'
        });
      }
    } catch (error) {
      console.error('Error processing blood test:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process blood test');
      resetUpload();
    } finally {
      setIsUploading(false);
    }
  }, [resetUpload, session, router]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    disabled: isUploading,
    noClick: isUploading,
    noDrag: isUploading,
  });

  return (
    <>
      <div className="space-y-8">
        {/* Upload section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Upload Blood Test PDF
          </h2>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              isDragActive
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-gray-300 dark:border-gray-700'
            } ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <input {...getInputProps()} key={fileKey} />
            <div className="space-y-4">
              {isUploading ? (
                <>
                  <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                    <div className="h-full bg-indigo-500 animate-progress"></div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {uploadProgress}
                  </p>
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
      />
    </>
  );
} 