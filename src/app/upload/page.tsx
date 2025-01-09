'use client';

import { useState, useRef } from 'react';
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

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Upload Health Data</h1>
            <button 
              className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 rounded-lg text-sm font-medium transition-colors"
              onClick={() => setIsAddResultsModalOpen(true)}
            >
              Add Blood Test Results
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <input
                name="file"
                ref={inputFileRef}
                type="file"
                disabled={uploading}
                accept=".xml,application/xml"
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-medium
                  file:bg-indigo-500/10 file:text-indigo-600
                  hover:file:bg-indigo-500/20
                  disabled:opacity-50"
              />
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