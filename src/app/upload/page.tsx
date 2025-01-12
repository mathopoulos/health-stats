'use client';

import { useState, useRef, DragEvent, useEffect } from 'react';
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
    
    // Poll for status every 2 seconds
    let attempts = 0;
    const maxAttempts = 30; // 1 minute total polling time
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 3;
    
    while (attempts < maxAttempts) {
      await sleep(2000); // Wait 2 seconds between checks
      
      try {
        const statusResponse = await fetch(`/api/process/status?id=${processingId}`);
        
        // Handle non-200 responses
        if (!statusResponse.ok) {
          consecutiveErrors++;
          console.warn(`Status check failed (attempt ${consecutiveErrors}/${maxConsecutiveErrors}):`, statusResponse.status);
          
          if (consecutiveErrors >= maxConsecutiveErrors) {
            // After 3 consecutive errors, return a more optimistic message
            return {
              success: true,
              message: 'Processing has been started. Please check your dashboard in a few minutes to see your processed data.',
              results: []
            };
          }
          
          // Continue polling if we haven't hit max consecutive errors
          attempts++;
          continue;
        }
        
        // Reset consecutive errors on successful response
        consecutiveErrors = 0;
        
        const status = await statusResponse.json();
        
        if (status.completed) {
          return {
            success: true,
            message: status.message || 'Processing completed successfully',
            results: status.results || []
          };
        } else if (status.error) {
          // If we get an explicit error from the status endpoint
          console.error('Processing status error:', status.error);
          return {
            success: false,
            message: 'Processing encountered an error but may continue in the background',
            error: status.error,
            results: []
          };
        }
        
        // If still processing, continue polling
        attempts++;
      } catch (error) {
        consecutiveErrors++;
        console.warn(`Status check error (attempt ${consecutiveErrors}/${maxConsecutiveErrors}):`, error);
        
        if (consecutiveErrors >= maxConsecutiveErrors) {
          // After 3 consecutive errors, return a more optimistic message
          return {
            success: true,
            message: 'Processing has been started. Please check your dashboard in a few minutes to see your processed data.',
            results: []
          };
        }
        
        attempts++;
      }
    }
    
    // If we reach here, processing is taking too long but might still be running
    return {
      success: true,
      message: 'Processing started successfully. Please check your dashboard in a few minutes to see your processed data.',
      results: []
    };
    
  } catch (error) {
    console.error('Processing error:', error);
    // Return a more user-friendly error response
    return {
      success: false,
      message: 'Processing has been initiated but we encountered some issues. Please check your dashboard in a few minutes.',
      error: error instanceof Error ? error.message : 'Unknown error',
      results: []
    };
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
  const profileImageRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (sessionStatus === 'loading') {
        console.log('Session is loading...');
        return;
      }

      if (!session?.user?.id) {
        console.log('No user session, skipping fetch');
        return;
      }
      
      console.log('Fetching user data for:', session.user.id);
      try {
        const response = await fetch(`/api/users/${session.user.id}`);
        console.log('User data response:', {
          status: response.status,
          ok: response.ok
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('User data received:', {
            success: data.success,
            hasUser: !!data.user,
            hasName: !!data.user?.name,
            hasProfileImage: !!data.user?.profileImage
          });
          
          if (data.success && data.user) {
            setName(data.user.name || '');
            setProfileImage(data.user.profileImage || null);
          }
        } else {
          const errorData = await response.json();
          console.error('Error response:', errorData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [session?.user?.id, sessionStatus]);

  useEffect(() => {
    // Refresh user data (including presigned URL) every 45 minutes
    const interval = setInterval(() => {
      if (session?.user?.id) {
        fetch(`/api/users/${session.user.id}`)
          .then(response => response.json())
          .then(data => {
            if (data.success && data.user) {
              setProfileImage(data.user.profileImage || null);
            }
          })
          .catch(console.error);
      }
    }, 45 * 60 * 1000); // 45 minutes

    return () => clearInterval(interval);
  }, [session?.user?.id]);

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
      setProcessingStatus(
        result.message + (result.results.length > 0 ? ` ${result.results.map(r => r.message).join(', ')}` : '')
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setProcessingStatus('Processing started but we encountered some issues. Please check your dashboard in a few minutes.');
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
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Add Health Data</h1>
              {session?.user?.email ? (
                <span className="text-sm text-gray-500">
                  ({session.user.email})
                </span>
              ) : (
                <span className="text-sm text-gray-500">
                  (Not signed in)
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
          <div className="flex gap-8">
            {/* Profile Image Section */}
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 mb-2">
                  {profileImage ? (
                    <div className="w-full h-full">
                      <div onError={(e) => {
                        console.error('Image loading error:', e);
                        setProfileImage(null);
                        setImageError('Failed to load profile image');
                      }}>
                        <Image
                          src={profileImage}
                          alt="Profile"
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Next/Image error:', {
                              src: profileImage,
                              error: e
                            });
                            setProfileImage(null);
                            setImageError('Failed to load profile image');
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
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
                <button
                  onClick={() => profileImageRef.current?.click()}
                  disabled={isUploadingImage}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                >
                  {isUploadingImage ? (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              <button
                onClick={() => profileImageRef.current?.click()}
                disabled={isUploadingImage}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                Change Photo
              </button>
              {imageError && (
                <p className="mt-1 text-sm text-red-500">{imageError}</p>
              )}
            </div>

            {/* Name Input Section */}
            <div className="flex-1">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-2 bg-white text-gray-900 placeholder:text-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
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
                disabled={isProcessing || uploading}
                className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2
                  ${isProcessing || uploading ? 'bg-gray-400' : 
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