'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';

import { signIn, useSession } from 'next-auth/react';
import { usePDFUpload } from '../../upload/hooks';
import BloodMarkerPreview from './BloodMarkerPreview';

export default function BloodTestUpload() {
  const { data: session } = useSession();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fileKey, setFileKey] = useState(0);

  // Use the new PDF upload hook
  const pdfUpload = usePDFUpload({
    onMarkersExtracted: (markers, dateGroups) => {
      setShowPreview(true);
    },
    onTextExtracted: (text) => {
      console.log('PDF text extracted:', text.length, 'characters');
    }
  });

  const resetUpload = useCallback(() => {
    pdfUpload.clearFiles();
    setFileKey(prev => prev + 1);
    // Revoke existing object URL to avoid memory leak
    setPdfUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [pdfUpload]);

  const handleSaveMarkers = async (markers: BloodMarker[], date: Date) => {
    if (!session?.user?.id) {
      toast.error('You must be logged in to save blood markers');
      signIn();
      return false;
    }

    try {
      const dateISOString = date.toISOString().split('T')[0];

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

      // Show success message
      toast.success(`${markers.length} blood markers saved successfully`);

      // Reset and notify
      resetUpload();

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('bloodMarkerAdded'));
      }

      return true;
    } catch (error) {
      console.error(`Error saving blood markers for date ${date.toISOString().split('T')[0]}:`, error);
      toast.error(`Failed to save markers for ${date.toLocaleDateString()}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  // This function is now handled by the usePDFUpload hook

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    // Generate a blob URL to preview the PDF
    setPdfUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });

    // Use the PDF upload hook to handle the file
    await pdfUpload.uploadFile(file);
  }, [pdfUpload]);

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
            pdfUpload.isUploading || pdfUpload.isProcessing
              ? 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700 cursor-not-allowed'
              : isDragActive
              ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 cursor-pointer'
              : 'border-gray-300 dark:border-gray-700 cursor-pointer'
          }`}
        >
          <input {...getInputProps()} disabled={pdfUpload.isUploading || pdfUpload.isProcessing} key={fileKey} />
          <div className="space-y-4">
            {pdfUpload.isUploading || pdfUpload.isProcessing ? (
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
                  {pdfUpload.processingProgress && (
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      {pdfUpload.processingProgress}
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
        isOpen={pdfUpload.extractedMarkers.length > 0}
        onClose={() => {
          resetUpload();
        }}
        markers={pdfUpload.extractedMarkers}
        onSave={handleSaveMarkers}
        initialDate={pdfUpload.extractedText ? new Date().toISOString().split('T')[0] : undefined}
        dateGroups={pdfUpload.dateGroups}
        pdfUrl={pdfUrl}
        isProcessing={pdfUpload.isProcessing}
        processingProgress={pdfUpload.processingProgress}
      />
    </>
  );
} 