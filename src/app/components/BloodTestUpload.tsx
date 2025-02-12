'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';

export default function BloodTestUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [fileKey, setFileKey] = useState(0);

  const resetUpload = useCallback(() => {
    setIsUploading(false);
    setUploadProgress('');
    setFileKey(prev => prev + 1);
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    console.log('=== Starting file upload process ===');
    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

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
      // TODO: Add API call here in next phase
      toast.success('File uploaded successfully. Processing will begin shortly.');
      resetUpload();
    } catch (error) {
      console.error('Error processing blood test:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process blood test');
      resetUpload();
    }
  }, [resetUpload]);

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
  );
} 