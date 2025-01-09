'use client';

import { useState, useRef, DragEvent } from 'react';
import AddResultsModal from '../components/AddResultsModal';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

interface ProcessingResult {
  success: boolean;
  message: string;
  error?: string;
  results: Array<{
    message: string;
  }>;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function triggerProcessing(): Promise<ProcessingResult> {
  try {
    const response = await fetch('/api/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to process data');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error triggering processing:', error);
    throw error;
  }
}

export default function UploadPage() {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [isAddResultsModalOpen, setIsAddResultsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleProcess = async () => {
    setIsProcessing(true);
    setProcessingStatus('Starting processing...');
    try {
      const result = await triggerProcessing();
      if (result.success) {
        setProcessingStatus(
          `Processing complete: ${result.message}. ${result.results.map(r => r.message).join(', ')}`
        );
      } else {
        setProcessingStatus(`Error: ${result.error}`);
      }
    } catch (error) {
      setProcessingStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    const files = inputFileRef.current?.files;
    if (!files || files.length === 0) {
      setError('Please select a file to upload');
      return;
    }

    const file = files[0];
    if (!file || !(file instanceof File)) {
      setError('Invalid file selected');
      return;
    }

    console.log('Starting upload for file:', file.name, 'size:', file.size, 'type:', file.type);

    try {
      setUploading(true);
      setProgress(0);
      setError(null);
      setStatus('Preparing upload...');

      // Get the presigned URL
      console.log('Getting presigned URL...');
      const response = await fetch('/api/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || 'application/xml',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to get upload URL: ${errorData.error || response.statusText}`);
      }

      const { url, key } = await response.json();
      console.log('Got presigned URL:', url);

      // Upload to S3
      setStatus('Uploading to S3...');
      console.log('Uploading to S3...');

      // Use XMLHttpRequest for upload progress
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            setProgress(percentComplete);
            setStatus(`Uploading: ${Math.round(percentComplete)}%`);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(null);
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        };

        xhr.onerror = () => reject(new Error('Upload failed due to network error'));
        xhr.onabort = () => reject(new Error('Upload aborted'));

        xhr.open('PUT', url);
        xhr.setRequestHeader('Content-Type', file.type || 'application/xml');
        xhr.send(file);
      });

      setStatus('Upload complete! You can now process the data.');
      console.log('Upload complete');
      
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload file');
      setUploading(false);
      setProgress(0);
      setStatus('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      if (inputFileRef.current) {
        // Create a new DataTransfer object
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(files[0]);
        
        // Set the file input's files
        inputFileRef.current.files = dataTransfer.files;
      }
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Add Health Data</h1>
            <button 
              className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 rounded-lg text-sm font-medium transition-colors"
              onClick={() => setIsAddResultsModalOpen(true)}
            >
              Add Blood Test Results
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">Apple Health Fitness Data</h2>
            <div className="flex items-center text-xs text-gray-500">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              XML files exported from Apple Health
            </div>
          </div>
          <form onSubmit={handleSubmit}>
            <div 
              className={`mb-4 relative ${
                isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-dashed border-gray-300 bg-gray-50'
              } border-2 rounded-xl p-8 transition-all duration-200 ease-in-out`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                name="file"
                ref={inputFileRef}
                type="file"
                disabled={uploading}
                accept=".xml,application/xml"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={() => setError(null)}
              />
              <div className="flex flex-col items-center justify-center gap-3">
                <div className={`p-3 rounded-full ${
                  isDragging ? 'bg-indigo-100' : 'bg-gray-100'
                } transition-colors duration-200`}>
                  <svg 
                    className={`w-6 h-6 ${
                      isDragging ? 'text-indigo-500' : 'text-gray-500'
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">
                    {isDragging ? 'Drop your file here' : 'Drag and drop your file here, or click to browse'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Only XML files are supported
                  </p>
                  {inputFileRef.current?.files?.[0] && (
                    <p className="text-sm font-medium text-indigo-600 mt-2">
                      Selected: {inputFileRef.current.files[0].name}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={uploading}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium transition-colors"
              >
                Upload
              </button>
              <button
                type="button"
                onClick={handleProcess}
                disabled={isProcessing || uploading}
                className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors ${
                  isProcessing || uploading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isProcessing ? 'Processing...' : 'Process Data'}
              </button>
            </div>
          </form>

          {uploading && (
            <div className="mt-4">
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {status || `Uploading... ${Math.round(progress)}%`}
              </p>
            </div>
          )}

          {processingStatus && (
            <div className="mt-4 text-sm text-gray-600">
              {processingStatus}
            </div>
          )}

          {error && (
            <div className="mt-4 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Add Results Modal */}
      <AddResultsModal
        isOpen={isAddResultsModalOpen}
        onClose={() => setIsAddResultsModalOpen(false)}
        onSuccess={() => {
          setStatus('Blood test results added successfully');
          setTimeout(() => setStatus(''), 3000);
        }}
      />
    </main>
  );
} 