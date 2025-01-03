'use client';

import { useState, useRef } from 'react';
import { upload } from '@vercel/blob/client';
import { type PutBlobResult } from '@vercel/blob';

const CHUNK_SIZE = 200 * 1024 * 1024; // Increased to 200MB chunks
const MAX_PARALLEL_UPLOADS = 3; // Number of parallel uploads

async function* createChunks(file: File, chunkSize: number) {
  let offset = 0;
  const chunks = [];
  
  while (offset < file.size) {
    const chunk = file.slice(offset, offset + chunkSize);
    chunks.push({
      chunk,
      offset,
      isLastChunk: offset + chunkSize >= file.size
    });
    offset += chunkSize;
  }
  
  // Return chunks in groups for parallel processing
  for (let i = 0; i < chunks.length; i += MAX_PARALLEL_UPLOADS) {
    yield chunks.slice(i, i + MAX_PARALLEL_UPLOADS);
  }
}

export default function UploadPage() {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [blob, setBlob] = useState<PutBlobResult | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!inputFileRef.current?.files) {
      console.log('No file selected');
      setError('No file selected');
      return;
    }

    const file = inputFileRef.current.files[0];
    console.log('Starting upload for file:', file.name, 'size:', file.size, 'type:', file.type);

    setUploading(true);
    setProgress(0);
    setError(null);
    setStatus('Cleaning up old data...');

    try {
      // Clean up old data first
      console.log('Cleaning up old data...');
      const cleanupResponse = await fetch('/api/cleanup-blobs', {
        method: 'POST'
      });

      if (!cleanupResponse.ok) {
        console.warn('Cleanup warning:', await cleanupResponse.text());
      }

      setStatus('Starting upload...');
      let chunkIndex = 0;
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      let finalBlob: PutBlobResult | null = null;
      let totalBytesUploaded = 0;

      for await (const chunkGroup of createChunks(file, CHUNK_SIZE)) {
        const uploadPromises = chunkGroup.map(async ({ chunk, offset, isLastChunk }) => {
          chunkIndex++;
          const chunkFile = new File([chunk], file.name, { type: file.type });
          console.log(`Uploading chunk ${chunkIndex}/${totalChunks}, size: ${chunk.size}`);

          const newBlob = await upload(file.name, chunkFile, {
            access: 'public',
            handleUploadUrl: '/api/upload',
            contentType: 'application/xml',
            clientPayload: JSON.stringify({
              filename: file.name,
              chunkIndex,
              totalChunks,
              offset,
              isLastChunk,
            }),
          });

          if (isLastChunk) {
            finalBlob = newBlob;
          }

          totalBytesUploaded += chunk.size;
          const uploadProgress = (totalBytesUploaded / file.size) * 100;
          setProgress(Math.min(50, uploadProgress));
          setStatus(`Uploading... ${Math.round(uploadProgress)}%`);

          return newBlob;
        });

        // Wait for all parallel uploads in this group to complete
        await Promise.all(uploadPromises);
      }

      if (!finalBlob) {
        throw new Error('Upload failed - no final blob');
      }

      console.log('Upload completed:', finalBlob);
      setBlob(finalBlob);
      setProgress(50);
      setStatus('Waiting for processing to complete...');

      // Wait for the server-side processing to complete by polling the status
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds timeout
      while (attempts < maxAttempts) {
        try {
          const statusResponse = await fetch('/api/health-data/status', {
            method: 'GET',
          });
          
          if (statusResponse.ok) {
            const status = await statusResponse.json();
            if (status.complete) {
              console.log('Processing complete');
              setProgress(100);
              setStatus('Processing complete! Redirecting...');
              setTimeout(() => {
                window.location.href = '/';
              }, 1000);
              break;
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before next attempt
          attempts++;
          setProgress(50 + (attempts / maxAttempts) * 50); // Progress from 50% to 100%
        } catch (error) {
          console.error('Error checking processing status:', error);
          // Continue polling even if there's an error
        }
      }

      if (attempts >= maxAttempts) {
        throw new Error('Processing timed out - please check the dashboard for status');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload file');
      setStatus('Upload failed');
    } finally {
      if (!error) {
        setUploading(false);
      }
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-2xl font-bold mb-8">Upload Health Data</h1>
        
        <div className="bg-white/5 p-8 rounded-lg shadow-lg">
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
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={uploading}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              Upload
            </button>
          </form>

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

          {blob && (
            <div className="mt-4 text-sm">
              Blob url: <a href={blob.url} className="text-blue-500 hover:underline">{blob.url}</a>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 