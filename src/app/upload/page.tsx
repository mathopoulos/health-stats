'use client';

import { useState } from 'react';
import { upload } from '@vercel/blob/client';

export default function UploadPage() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError(null);
    setStatus('Starting upload...');

    try {
      // Get the blob URL from our API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: JSON.stringify({
          filename: 'export.xml',
          contentType: 'application/xml',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { url, uploadUrl } = await response.json();

      // Upload the file to the URL
      const uploadResponse = await upload(uploadUrl, file, {
        contentType: 'application/xml',
        access: 'public',
        handleUploadUrl: url
      });

      if (!uploadResponse) {
        throw new Error('Upload failed');
      }

      // Process the health data after upload
      try {
        const processResponse = await fetch('/api/process-health-data', {
          method: 'POST'
        });

        if (!processResponse.ok) {
          throw new Error('Failed to process health data');
        }
      } catch (error) {
        console.error('Failed to process health data:', error);
        throw error;
      }

      setProgress(100);
      setStatus('Processing complete! Redirecting...');
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-2xl font-bold mb-8">Upload Health Data</h1>
        
        <div className="bg-white/5 p-8 rounded-lg shadow-lg">
          <div className="mb-4">
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
              accept=".xml"
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                disabled:opacity-50"
            />
          </div>

          {uploading && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {status || `Uploading... ${Math.round(progress)}%`}
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 text-red-500 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 