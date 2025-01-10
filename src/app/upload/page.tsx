'use client';

import { useState, useRef, DragEvent } from 'react';
import { useSession, signOut } from "next-auth/react";
import AddResultsModal from '../components/AddResultsModal';
import Image from 'next/image';

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
  const { data: session } = useSession();
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [isAddResultsModalOpen, setIsAddResultsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [name, setName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const handleUpdateName = async () => {
    if (!name.trim()) {
      setNameError('Name is required');
      return;
    }

    setIsSavingName(true);
    setNameError(null);

    try {
      const response = await fetch('/api/update-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update name');
      }

      setStatus('Name updated successfully');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setNameError(error instanceof Error ? error.message : 'Failed to update name');
    } finally {
      setIsSavingName(false);
    }
  };

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
    setUploadSuccess(false);
    
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
      setUploadSuccess(true);
      console.log('Upload complete');
      
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload file');
      setUploading(false);
      setProgress(0);
      setStatus('Upload failed');
      setUploadSuccess(false);
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
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Add Health Data</h1>
              {session?.user?.email && (
                <span className="text-sm text-gray-500">
                  ({session.user.email})
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button 
                className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 rounded-lg text-sm font-medium transition-colors"
                onClick={() => setIsAddResultsModalOpen(true)}
              >
                Add Blood Test Results
              </button>
              {session?.user?.id && (
                <a
                  href={`/?userId=${session.user.id}`}
                  className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-600 rounded-lg text-sm font-medium transition-colors"
                >
                  View Dashboard
                </a>
              )}
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Add Name Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Your Profile</h2>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
              />
              {nameError && (
                <p className="mt-1 text-sm text-red-500">{nameError}</p>
              )}
            </div>
            <button
              onClick={handleUpdateName}
              disabled={isSavingName}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium transition-colors flex items-center gap-2"
            >
              {isSavingName ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : 'Save Name'}
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
                isDragging ? 'border-indigo-500 bg-indigo-50 scale-[1.02]' : 
                uploadSuccess ? 'border-green-500 bg-green-50' :
                'border-dashed border-gray-300 bg-gray-50'
              } border-2 rounded-xl p-8 transition-all duration-200 ease-in-out hover:border-indigo-400 hover:bg-indigo-50/50`}
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
                onChange={() => {
                  setError(null);
                  setUploadSuccess(false);
                }}
              />
              <div className="flex flex-col items-center justify-center gap-3">
                <div className={`p-3 rounded-full ${
                  isDragging ? 'bg-indigo-100' : 
                  uploadSuccess ? 'bg-green-100' :
                  'bg-gray-100'
                } transition-colors duration-200`}>
                  {uploadSuccess ? (
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
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
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">
                    {isDragging ? 'Drop your file here' : 
                     uploadSuccess ? 'File uploaded successfully!' :
                     'Drag and drop your file here, or click to browse'}
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
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium transition-colors flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Uploading...
                  </>
                ) : 'Upload'}
              </button>
              <button
                type="button"
                onClick={handleProcess}
                disabled={isProcessing || uploading || !uploadSuccess}
                className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2
                  ${isProcessing || uploading ? 'bg-gray-400' : 
                    !uploadSuccess ? 'bg-gray-300 cursor-not-allowed' :
                    'bg-green-600 hover:bg-green-700'}`}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : 'Process Data'}
              </button>
            </div>
          </form>

          {/* Status Messages */}
          <div className="mt-6 space-y-4">
            {uploading && (
              <div className="bg-gray-50 rounded-lg p-4">
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
              <div className={`rounded-lg p-4 text-sm ${
                processingStatus.includes('Error') ? 'bg-red-50 text-red-600' : 
                processingStatus.includes('complete') ? 'bg-green-50 text-green-600' :
                'bg-blue-50 text-blue-600'
              }`}>
                {processingStatus}
                {processingStatus.includes('complete') && session?.user?.id && (
                  <div className="mt-2">
                    <a 
                      href={`/dashboard/${session.user.id}`}
                      className="text-green-700 hover:text-green-800 font-medium underline"
                    >
                      View your dashboard →
                    </a>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 rounded-lg p-4 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Help Section */}
          <div className="mt-8 border-t border-gray-100 pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">How to export your Apple Health data</h3>
            <ol className="space-y-3">
              <li className="flex gap-3 text-sm text-gray-600">
                <span className="flex-none w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-900">1</span>
                <span>Open the Health app on your iPhone</span>
              </li>
              <li className="flex gap-3 text-sm text-gray-600">
                <span className="flex-none w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-900">2</span>
                <span>Tap your profile picture in the top right</span>
              </li>
              <li className="flex gap-3 text-sm text-gray-600">
                <span className="flex-none w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-900">3</span>
                <span>Scroll down and tap "Export All Health Data"</span>
              </li>
              <li className="flex gap-3 text-sm text-gray-600">
                <span className="flex-none w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-900">4</span>
                <span>Upload the exported ZIP file here</span>
              </li>
            </ol>
          </div>
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