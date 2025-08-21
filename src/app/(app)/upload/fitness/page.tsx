'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { FitnessTab, DesktopNavigation, MobileNavigation, MobileHeader } from '@features/upload/components';

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

async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY
): Promise<T | void> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetchFn();
    } catch (error) {
      console.log(`Attempt ${i + 1} failed:`, error);
      if (i === retries - 1) {
        console.error('All retry attempts failed');
        return;
      }
      await sleep(delay * Math.pow(2, i)); // Exponential backoff
    }
  }
}

async function triggerProcessing(updateStatus: (status: string) => void): Promise<ProcessingResult> {
  console.log('Starting triggerProcessing function');
  try {
    updateStatus('Initiating processing request...');
    
    const startResponse = await fetch('/api/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!startResponse.ok) {
      const errorText = await startResponse.text();
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error: errorText || 'Failed to start processing' };
      }
      throw new Error(error.error || 'Failed to start processing');
    }

    const responseData = await startResponse.json();
    const { processingId } = responseData;
    
    // Poll for status with exponential backoff
    let attempts = 0;
    const maxAttempts = 60;
    let backoffMs = 2000;
    const maxBackoffMs = 30000;
    
    updateStatus('Processing started. Waiting for status updates...');
    
    while (attempts < maxAttempts) {
      await sleep(backoffMs);
      
      const statusResponse = await fetch(`/api/process/status?id=${processingId}`);
      
      if (!statusResponse.ok) {
        throw new Error('Failed to check processing status');
      }
      
      const statusText = await statusResponse.text();
      let status;
      try {
        status = JSON.parse(statusText);
      } catch (parseError) {
        throw new Error('Invalid status response format');
      }
      
      if (status.completed) {
        return {
          success: true,
          message: status.message || 'Processing completed successfully',
          results: status.results || []
        };
      } else if (status.error) {
        throw new Error(status.error);
      }
      
      attempts++;
      backoffMs = Math.min(backoffMs * 1.5, maxBackoffMs);
      
      if (status.progress) {
        updateStatus(`Processing... ${status.progress}`);
      } else {
        updateStatus(`Processing... (waiting for progress updates)`);
      }
    }
    
    return {
      success: true,
      message: 'Processing is taking longer than expected. Please check your dashboard in a few minutes to see your processed data.',
      results: []
    };
    
  } catch (error) {
    console.error('Processing error in triggerProcessing:', error);
    throw error;
  }
}

export default function FitnessPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const inputFileRef = useRef<HTMLInputElement>(null);
  
  // User profile state for navigation
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [name, setName] = useState<string>('');

  // Fitness-specific state
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [fileKey, setFileKey] = useState(0);
  const [hasExistingUploads, setHasExistingUploads] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    id: string;
    filename: string;
    uploadDate: string;
  }>>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isHelpExpanded, setIsHelpExpanded] = useState(false);

  // Fix session race condition
  useEffect(() => {
    if (sessionStatus === 'authenticated' && !session?.user?.id) {
      console.log('Session authenticated but missing user ID, forcing refresh...');
      window.location.reload();
      return;
    }
  }, [session, sessionStatus]);

  // Fetch user data and uploaded files
  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (!session?.user?.id) return;

    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/users/${session.user.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            setName(data.user.name || '');
            setProfileImage(data.user.profileImage || null);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    const fetchUploadedFiles = async () => {
      setIsLoadingFiles(true);
      try {
        const response = await fetch('/api/uploads');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.files) {
            setUploadedFiles(data.files);
            setHasExistingUploads(data.files.length > 0);
          }
        }
      } catch (error) {
        console.error('Error fetching uploaded files:', error);
      } finally {
        setIsLoadingFiles(false);
      }
    };

    fetchWithRetry(fetchUserData);
    fetchWithRetry(fetchUploadedFiles);
  }, [session?.user?.id, sessionStatus]);

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // File upload handler
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    setUploading(true);
    setProgress(0);
    setError(null);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      setUploadSuccess(true);
      setStatus('File uploaded successfully! You can now process it or upload additional files.');
      
      // Refresh the uploaded files list
      const fetchUploadedFiles = async () => {
        setIsLoadingFiles(true);
        try {
          const response = await fetch('/api/uploads');
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.files) {
              setUploadedFiles(data.files);
              setHasExistingUploads(data.files.length > 0);
            }
          }
        } catch (error) {
          console.error('Error fetching uploaded files:', error);
        } finally {
          setIsLoadingFiles(false);
        }
      };
      await fetchUploadedFiles();
      
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fileInput = inputFileRef.current;
    if (fileInput?.files && fileInput.files[0]) {
      await handleFileUpload(fileInput.files[0]);
    }
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    setProcessingStatus('');
    
    try {
      const result = await triggerProcessing(setProcessingStatus);
      if (result.success) {
        setStatus(result.message);
        setTimeout(() => setStatus(''), 5000);
      }
    } catch (error) {
      console.error('Processing error:', error);
      setProcessingStatus('');
      setError(error instanceof Error ? error.message : 'Processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // File management handlers
  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const toggleSelectAllFiles = () => {
    if (selectedFiles.size === uploadedFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(uploadedFiles.map(f => f.id)));
    }
  };

  const isFileSelected = (fileId: string) => {
    return selectedFiles.has(fileId);
  };

  const deleteSelectedFiles = async () => {
    if (selectedFiles.size === 0) return;
    
    try {
      for (const fileId of selectedFiles) {
        await fetch(`/api/uploads/${fileId}`, {
          method: 'DELETE',
        });
      }
      
      // Refresh the uploaded files list
      const response = await fetch('/api/uploads');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.files) {
          setUploadedFiles(data.files);
          setHasExistingUploads(data.files.length > 0);
        }
      }
      
      setSelectedFiles(new Set());
      setStatus('Selected files deleted successfully');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Error deleting files:', error);
      setError('Failed to delete selected files');
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/uploads/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      // Refresh the uploaded files list
      const fetchResponse = await fetch('/api/uploads');
      if (fetchResponse.ok) {
        const data = await fetchResponse.json();
        if (data.success && data.files) {
          setUploadedFiles(data.files);
          setHasExistingUploads(data.files.length > 0);
        }
      }

      setStatus('File deleted successfully');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Error deleting file:', error);
      setError('Failed to delete file');
    }
  };

  const handleTabChange = (tab: string) => {
    switch (tab) {
      case 'profile':
        router.push('/upload/profile');
        break;
      case 'protocols':
        router.push('/upload/protocols');
        break;
      case 'fitness':
        // Already on fitness page
        break;
      case 'blood':
        router.push('/upload/blood');
        break;
      case 'more':
        router.push('/upload/settings');
        break;
      default:
        router.push('/upload/profile');
    }
  };

  // Loading state
  if (sessionStatus === 'loading') {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  // Unauthenticated state
  if (sessionStatus === 'unauthenticated') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Authentication Required</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Please sign in to access the upload functionality.</p>
          <a
            href="/auth/signin"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Sign In
          </a>
        </div>
      </main>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Navigation */}
      <DesktopNavigation
        activeTab="fitness"
        onTabChange={handleTabChange}
        session={session}
        profileImage={profileImage}
        name={name}
      />

      {/* Mobile Header */}
      <MobileHeader />

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8 md:p-8 pt-16 md:pt-8 pb-24 md:pb-8">
          {status && (
            <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 text-sm">
              {status}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}
          
          <FitnessTab
            isDragging={isDragging}
            inputFileRef={inputFileRef}
            isFileLoading={isFileLoading}
            setIsFileLoading={setIsFileLoading}
            fileKey={fileKey}
            setFileKey={setFileKey}
            error={error}
            setError={setError}
            uploading={uploading}
            progress={progress}
            uploadSuccess={uploadSuccess}
            setUploadSuccess={setUploadSuccess}
            isProcessing={isProcessing}
            processingStatus={processingStatus}
            hasExistingUploads={hasExistingUploads}
            uploadedFiles={uploadedFiles}
            selectedFiles={selectedFiles}
            isLoadingFiles={isLoadingFiles}
            isHelpExpanded={isHelpExpanded}
            setIsHelpExpanded={setIsHelpExpanded}
            handleDragEnter={handleDragEnter}
            handleDragLeave={handleDragLeave}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
            handleSubmit={handleSubmit}
            handleProcess={handleProcess}
            fetchUploadedFiles={async () => {
              setIsLoadingFiles(true);
              try {
                const response = await fetch('/api/uploads');
                if (response.ok) {
                  const data = await response.json();
                  if (data.success && data.files) {
                    setUploadedFiles(data.files);
                    setHasExistingUploads(data.files.length > 0);
                  }
                }
              } catch (error) {
                console.error('Error fetching uploaded files:', error);
              } finally {
                setIsLoadingFiles(false);
              }
            }}
            deleteSelectedFiles={deleteSelectedFiles}
            toggleSelectAllFiles={toggleSelectAllFiles}
            toggleFileSelection={toggleFileSelection}
            isFileSelected={isFileSelected}
            handleDeleteFile={handleDeleteFile}
          />
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation
        activeTab="fitness"
        onTabChange={handleTabChange}
      />
    </div>
  );
}
