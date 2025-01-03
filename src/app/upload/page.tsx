'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    setIsSuccess(false);
    setIsProcessing(true);
    setProcessingStep('Preparing upload...');

    const items = Array.from(e.dataTransfer.items);
    const folder = items.find(item => item.kind === 'file' && item.webkitGetAsEntry()?.isDirectory);

    if (!folder) {
      setError('Please drop a folder containing your Apple Health export.');
      setIsProcessing(false);
      return;
    }

    try {
      const formData = new FormData();
      
      setProcessingStep('Reading folder contents...');
      const files = await getAllFiles(folder.webkitGetAsEntry() as FileSystemDirectoryEntry);
      
      const exportXml = files.find(file => file.name === 'export.xml');
      if (!exportXml) {
        throw new Error('No export.xml file found in the uploaded folder.');
      }

      setProcessingStep('Uploading export.xml...');
      formData.append('file', exportXml);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok || !uploadData.success) {
        throw new Error(uploadData.error || 'Failed to upload file');
      }

      setProcessingStep('Processing health data...');
      const processResponse = await fetch('/api/process-health-data', {
        method: 'POST'
      });

      const processData = await processResponse.json();

      if (!processResponse.ok || !processData.success) {
        throw new Error(processData.error || processData.details || 'Failed to process health data');
      }

      setIsSuccess(true);
      setProcessingStep('');
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while processing your data.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen dot-grid p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 font-mono text-gray-900">Upload Health Data</h1>
          <p className="text-gray-700">Drag and drop your Apple Health export folder here</p>
        </div>

        {isSuccess ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center space-y-4">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-green-800 font-mono">Data Processed Successfully!</h2>
            <p className="text-green-700">Your health data has been processed and is ready to view.</p>
            <div className="flex flex-col gap-3">
              <a 
                href="/?upload=success" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg font-mono hover:bg-green-700 transition-colors"
              >
                View Health Dashboard →
              </a>
              <button
                onClick={() => {
                  setIsSuccess(false);
                  setError(null);
                }}
                className="inline-block px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-mono hover:bg-gray-200 transition-colors"
              >
                Upload Another File
              </button>
            </div>
          </div>
        ) : (
          <div 
            className={`border-4 border-dashed rounded-xl p-12 text-center transition-colors ${
              isDragging 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isProcessing ? (
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-700 mx-auto"></div>
                <p className="text-gray-700 font-mono">{processingStep}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-6xl mb-4">📁</div>
                <p className="text-gray-700 font-mono">
                  Drop your Apple Health export folder here
                </p>
                <p className="text-gray-600 text-sm">
                  The folder should contain an export.xml file
                </p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 font-mono">{error}</p>
          </div>
        )}

        <div className="mt-8 space-y-4">
          <h2 className="font-medium text-gray-900">How to export your Apple Health data:</h2>
          <ol className="list-decimal pl-5 space-y-2 text-gray-700">
            <li>Open the Health app on your iPhone</li>
            <li>Tap your profile picture in the top right</li>
            <li>Scroll down and tap "Export All Health Data"</li>
            <li>Choose a location to save the export</li>
            <li>Upload the exported folder here</li>
          </ol>
        </div>
      </div>
    </main>
  );
}

// Helper function to recursively get all files from a directory
async function getAllFiles(entry: FileSystemEntry): Promise<File[]> {
  if (entry.isFile) {
    return new Promise((resolve, reject) => {
      (entry as FileSystemFileEntry).file(resolve, reject);
    }).then(file => [file as File]);
  }

  if (entry.isDirectory) {
    const dirReader = (entry as FileSystemDirectoryEntry).createReader();
    const entries = await new Promise<FileSystemEntry[]>((resolve, reject) => {
      const entries: FileSystemEntry[] = [];
      function readEntries() {
        dirReader.readEntries(async (results) => {
          if (!results.length) {
            resolve(entries);
          } else {
            entries.push(...results);
            readEntries();
          }
        }, reject);
      }
      readEntries();
    });

    const files = await Promise.all(entries.map(entry => getAllFiles(entry)));
    return files.flat();
  }

  return [];
} 