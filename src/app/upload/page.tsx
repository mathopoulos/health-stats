'use client';

import { useState, useRef, DragEvent, useEffect } from 'react';
import { useSession, signOut } from "next-auth/react";
import AddResultsModal from '../components/AddResultsModal';
import Image from 'next/image';
import Link from 'next/link';
import ThemeToggle from '../components/ThemeToggle';
import BloodTestUpload from '../components/BloodTestUpload';
import BloodMarkerHistory from '../components/BloodMarkerHistory';

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

async function triggerProcessing(updateStatus: (status: string) => void): Promise<ProcessingResult> {
  try {
    // Start the processing
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

    // Get the processing ID from the response
    const { processingId } = await startResponse.json();
    
    // Poll for status with exponential backoff
    let attempts = 0;
    const maxAttempts = 60; // 15 minutes total polling time with exponential backoff
    let backoffMs = 2000; // Start with 2 seconds
    const maxBackoffMs = 30000; // Max 30 seconds between polls
    
    while (attempts < maxAttempts) {
      await sleep(backoffMs); // Wait with exponential backoff
      
      try {
        const statusResponse = await fetch(`/api/process/status?id=${processingId}`);
        if (!statusResponse.ok) {
          throw new Error('Failed to check processing status');
        }
        
        const status = await statusResponse.json();
        
        if (status.completed) {
          return {
            success: true,
            message: status.message || 'Processing completed successfully',
            results: status.results || []
          };
        } else if (status.error) {
          throw new Error(status.error);
        }
        
        // If still processing, continue polling with exponential backoff
        attempts++;
        backoffMs = Math.min(backoffMs * 1.5, maxBackoffMs); // Increase backoff time, but cap at maxBackoffMs
        
        // Update processing status with progress if available
        if (status.progress) {
          updateStatus(`Processing... ${status.progress}`);
        }
      } catch (error) {
        console.error('Error checking status:', error);
        throw error;
      }
    }
    
    // If we reach here, processing is taking too long but might still be running
    return {
      success: true,
      message: 'Processing is taking longer than expected. Please check your dashboard in a few minutes to see your processed data.',
      results: []
    };
    
  } catch (error) {
    console.error('Processing error:', error);
    throw error;
  }
}

export default function UploadPage() {
  const { data: session, status: sessionStatus } = useSession();
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
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const profileImageRef = useRef<HTMLInputElement>(null);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [fileKey, setFileKey] = useState(0);
  const [hasExistingUploads, setHasExistingUploads] = useState(false);
  const [prefilledResults, setPrefilledResults] = useState<Array<{
    name: string;
    value: number;
    unit: string;
    category: string;
  }> | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (sessionStatus === 'loading' || !session?.user?.id) return;
      
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

    fetchUserData();
  }, [session?.user?.id, sessionStatus]);

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
      const result = await triggerProcessing(setProcessingStatus);
      if (result.success) {
        setProcessingStatus(
          result.message + (result.results.length > 0 ? ` ${result.results.map(r => r.message).join(', ')}` : '')
        );
      } else {
        setProcessingStatus(`Error: ${result.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setProcessingStatus(`Error: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const checkExistingUploads = async () => {
    try {
      const response = await fetch('/api/check-uploads');
      if (response.ok) {
        const { hasUploads } = await response.json();
        setHasExistingUploads(hasUploads);
      }
    } catch (error) {
      console.error('Error checking existing uploads:', error);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      checkExistingUploads();
    }
  }, [session?.user?.id]);

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
      await checkExistingUploads();
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

  const handleProfileImageUpload = async (file: File) => {
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setImageError('Please select an image file');
      return;
    }

    setIsUploadingImage(true);
    setImageError(null);

    try {
      // Get presigned URL
      const response = await fetch('/api/update-profile-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentType: file.type,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get upload URL');
      }

      const { url, imageUrl } = await response.json();

      // Upload to S3
      await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      setProfileImage(imageUrl);
      setStatus('Profile image updated successfully');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Add session debugging log
  useEffect(() => {
    console.log('Session state:', {
      status: sessionStatus,
      session: session,
      userEmail: session?.user?.email,
      userId: session?.user?.id,
      isAuthenticated: !!session,
      timestamp: new Date().toISOString(),
    });
  }, [session, sessionStatus]);

  const handleUploadComplete = () => {
    // Refresh the dashboard data
    window.location.href = '/dashboard';
  };

  if (sessionStatus === 'loading') {
    return (
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-2 text-gray-600">Loading session...</span>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Left Navigation */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="p-4">
          <Link href="/" className="flex items-center space-x-2 mb-8">
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400 text-transparent bg-clip-text">
              revly
            </span>
          </Link>
          
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center space-x-2 px-4 py-2 text-sm rounded-lg transition-colors ${
                activeTab === 'profile'
                  ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('fitness')}
              className={`w-full flex items-center space-x-2 px-4 py-2 text-sm rounded-lg transition-colors ${
                activeTab === 'fitness'
                  ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Fitness Metrics</span>
            </button>

            <button
              onClick={() => setActiveTab('blood')}
              className={`w-full flex items-center space-x-2 px-4 py-2 text-sm rounded-lg transition-colors ${
                activeTab === 'blood'
                  ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <span>Blood Markers</span>
            </button>
          </nav>
        </div>

        {/* User Profile Section with Dashboard Button above it */}
        <div className="absolute bottom-0 left-0 w-64">
          {/* Dashboard Button */}
          {session?.user?.id && (
            <div className="px-4 pb-3">
              <Link
                href={`/dashboard/userId=${session.user.id}`}
                className="group flex items-center justify-between w-full px-4 py-2 text-sm font-medium rounded-lg transition-all bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-800"
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>View Dashboard</span>
                </div>
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}

          {/* User Profile Section */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">
                    {name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {name || 'Anonymous User'}
                </p>
                <button
                  onClick={() => signOut()}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Sign out
                </button>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8">
          {/* Profile Tab Content */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm divide-y divide-gray-200 dark:divide-gray-700">
                {/* Profile Photo & Name Section */}
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Personal Information</h3>
                  <div className="flex flex-col md:flex-row md:items-start gap-8">
                    {/* Profile Image Upload */}
                    <div className="flex flex-col items-center">
                      <div className="relative group">
                        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 mb-3 ring-4 ring-white dark:ring-gray-800 shadow-lg">
                          {profileImage ? (
                            <div className="w-full h-full">
                              <Image
                                src={profileImage}
                                alt="Profile"
                                width={128}
                                height={128}
                                className="w-full h-full object-cover"
                                onError={() => {
                                  setProfileImage(null);
                                  setImageError('Failed to load profile image');
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          )}
                          <button
                            onClick={() => profileImageRef.current?.click()}
                            disabled={isUploadingImage}
                            className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                          >
                            {isUploadingImage ? (
                              <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : (
                              <div className="flex flex-col items-center">
                                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-sm">Change Photo</span>
                              </div>
                            )}
                          </button>
                        </div>
                        <input
                          type="file"
                          ref={profileImageRef}
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleProfileImageUpload(file);
                          }}
                        />
                      </div>
                      {imageError && (
                        <p className="mt-2 text-sm text-red-500 dark:text-red-400">{imageError}</p>
                      )}
                    </div>

                    {/* Name Input Section */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Display Name
                        </label>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <input
                              type="text"
                              name="name"
                              id="name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-[38px] px-3"
                              placeholder="Enter your name"
                            />
                            {nameError && (
                              <p className="mt-1 text-sm text-red-500 dark:text-red-400">{nameError}</p>
                            )}
                          </div>
                          <button
                            onClick={handleUpdateName}
                            disabled={isSavingName}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 min-w-[100px] justify-center h-[38px]"
                          >
                            {isSavingName ? (
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : 'Save Name'}
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        This is the name that will be displayed on your profile and dashboard.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fitness Metrics Tab Content */}
          {activeTab === 'fitness' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Fitness Metrics</h2>

              {/* iOS App Sync Section - Simplified */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Get automatic syncing with our iOS app —
                      <a
                        href="https://apps.apple.com/app/your-app-id"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-medium ml-1"
                      >
                        Download on the App Store
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              {/* Manual Upload Section */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Upload Apple Health Data</h3>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    XML files exported from Apple Health
                  </div>
                </div>

                {/* Existing file upload functionality */}
                <div
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-300 dark:border-gray-700'
                  }`}
                >
                  <input
                    key={fileKey}
                    type="file"
                    ref={inputFileRef}
                    onChange={(e) => {
                      setIsFileLoading(true);
                      if (e.target.files?.[0]) {
                        setError(null);
                        setUploadSuccess(false);
                      }
                      setTimeout(() => {
                        setIsFileLoading(false);
                      }, 500);
                    }}
                    className="hidden"
                    accept=".xml,.fit"
                  />
                  <div className="space-y-4">
                    {isFileLoading ? (
                      // Loading state
                      <div className="flex flex-col items-center space-y-3">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800">
                          <svg className="animate-spin h-6 w-6 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Adding file...
                        </p>
                      </div>
                    ) : inputFileRef.current?.files?.[0] ? (
                      // Show selected file info
                      <div className="flex flex-col items-center space-y-3">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/20">
                          <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {inputFileRef.current.files[0].name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Ready to upload
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            if (inputFileRef.current) {
                              inputFileRef.current.value = '';
                              setIsFileLoading(false);
                              setFileKey(prev => prev + 1);
                            }
                          }}
                          className="text-sm text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300"
                        >
                          Remove file
                        </button>
                      </div>
                    ) : (
                      // Default upload state
                      <>
                        <div className="flex justify-center">
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <div>
                          <button
                            onClick={() => inputFileRef.current?.click()}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-medium"
                          >
                            Upload a file
                          </button>
                          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            or drag and drop your fitness data files here
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
                {uploading && (
                  <div className="mt-4">
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                            Uploading
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold inline-block text-indigo-600">
                            {progress}%
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
                        <div
                          style={{ width: `${progress}%` }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
                {isProcessing && (
                  <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{processingStatus}</p>
                )}

                {/* Processing Buttons */}
                <div className="flex gap-4 mt-4">
                  <button
                    type="submit"
                    onClick={(e) => handleSubmit(e as any)}
                    disabled={uploading || !inputFileRef.current?.files?.[0]}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {uploading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Uploading...
                      </>
                    ) : 'Upload'}
                  </button>
                  {(uploadSuccess || hasExistingUploads) && (
                    <button
                      onClick={handleProcess}
                      disabled={isProcessing || uploading}
                      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white transition-colors ${
                        isProcessing || uploading
                          ? 'bg-gray-400 dark:bg-gray-600' 
                          : 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600'
                      } disabled:cursor-not-allowed`}
                    >
                      {isProcessing ? (
                        <>
                          <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Processing...
                        </>
                      ) : 'Process Latest Upload'}
                    </button>
                  )}
                </div>

                {/* Help Section */}
                <div className="mt-8 border-t border-gray-100 dark:border-gray-800 pt-6">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">How to export your Apple Health data</h3>
                  <ol className="space-y-3">
                    <li className="flex gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex-none w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-medium text-gray-900 dark:text-white">1</span>
                      <span>Open the Health app on your iPhone</span>
                    </li>
                    <li className="flex gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex-none w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-medium text-gray-900 dark:text-white">2</span>
                      <span>Tap your profile picture in the top right</span>
                    </li>
                    <li className="flex gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex-none w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-medium text-gray-900 dark:text-white">3</span>
                      <span>Scroll down and tap "Export All Health Data"</span>
                    </li>
                    <li className="flex gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex-none w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-medium text-gray-900 dark:text-white">4</span>
                      <span>Upload the exported ZIP file here</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* Blood Markers Tab Content */}
          {activeTab === 'blood' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Blood Markers</h2>
              
              {/* PDF Upload Section */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Upload Blood Test PDF</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Upload your blood test PDF and we'll automatically extract the results.
                </p>
                <BloodTestUpload />
              </div>

              {/* Manual Entry Section */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Manual Entry</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Manually add and track your blood test results here.
                </p>
                <Link href="/add-blood-test">
                  <button
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Add Blood Test Results
                  </button>
                </Link>
              </div>
              
              {/* Blood Marker History Section - Added as requested */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Blood Marker History</h3>
                <BloodMarkerHistory />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 