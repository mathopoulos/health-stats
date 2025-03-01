'use client';

import { useState, useRef, DragEvent, useEffect } from 'react';
import { useSession, signOut } from "next-auth/react";
import AddResultsModal from '../components/AddResultsModal';
import Image from 'next/image';
import Link from 'next/link';
import ThemeToggle from '../components/ThemeToggle';
import BloodTestUpload from '../components/BloodTestUpload';
import BloodMarkerHistory from '../components/BloodMarkerHistory';
import { toast } from 'react-hot-toast';
import { useSearchParams, useRouter } from 'next/navigation';

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
  console.log('Starting triggerProcessing function');
  try {
    // Start the processing
    console.log('Making POST request to /api/process');
    updateStatus('Initiating processing request...');
    
    const startResponse = await fetch('/api/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    console.log('Response status from /api/process:', startResponse.status);
    
    if (!startResponse.ok) {
      const errorText = await startResponse.text();
      console.error('Error response from /api/process:', errorText);
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { error: errorText || 'Failed to start processing' };
      }
      throw new Error(error.error || 'Failed to start processing');
    }

    // Get the processing ID from the response
    const responseData = await startResponse.json();
    console.log('Received processing ID:', responseData.processingId);
    const { processingId } = responseData;
    
    // Poll for status with exponential backoff
    let attempts = 0;
    const maxAttempts = 60; // 15 minutes total polling time with exponential backoff
    let backoffMs = 2000; // Start with 2 seconds
    const maxBackoffMs = 30000; // Max 30 seconds between polls
    
    updateStatus('Processing started. Waiting for status updates...');
    
    while (attempts < maxAttempts) {
      console.log(`Polling attempt ${attempts + 1}/${maxAttempts} - waiting ${backoffMs}ms`);
      await sleep(backoffMs); // Wait with exponential backoff
      
      try {
        console.log(`Checking status for processingId: ${processingId}`);
        const statusResponse = await fetch(`/api/process/status?id=${processingId}`);
        console.log('Status response:', statusResponse.status);
        
        if (!statusResponse.ok) {
          console.error('Error checking status:', statusResponse.status, statusResponse.statusText);
          throw new Error('Failed to check processing status');
        }
        
        const statusText = await statusResponse.text();
        console.log('Raw status response:', statusText);
        
        let status;
        try {
          status = JSON.parse(statusText);
          console.log('Parsed status response:', status);
        } catch (parseError) {
          console.error('Failed to parse status response as JSON:', parseError);
          throw new Error('Invalid status response format');
        }
        
        if (status.completed) {
          console.log('Processing completed successfully');
          return {
            success: true,
            message: status.message || 'Processing completed successfully',
            results: status.results || []
          };
        } else if (status.error) {
          console.error('Error in status response:', status.error);
          throw new Error(status.error);
        }
        
        // If still processing, continue polling with exponential backoff
        attempts++;
        backoffMs = Math.min(backoffMs * 1.5, maxBackoffMs); // Increase backoff time, but cap at maxBackoffMs
        
        // Update processing status with progress if available
        if (status.progress) {
          console.log('Current progress:', status.progress);
          updateStatus(`Processing... ${status.progress}`);
        } else {
          console.log('No progress information in status response');
          updateStatus(`Processing... (waiting for progress updates)`);
        }
      } catch (error) {
        console.error('Error checking status:', error);
        throw error;
      }
    }
    
    // If we reach here, processing is taking too long but might still be running
    console.warn('Processing is taking longer than expected, exceeded max polling attempts');
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
  const [age, setAge] = useState<number | ''>('');
  const [sex, setSex] = useState<'male' | 'female' | 'other' | ''>('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [ageError, setAgeError] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(() => {
    // Initialize from URL query param if available, otherwise default to 'profile'
    const tab = searchParams?.get('tab');
    return tab && ['profile', 'fitness', 'blood'].includes(tab) ? tab : 'profile';
  });
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
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    id: string;
    filename: string;
    uploadDate: string;
  }>>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isHelpExpanded, setIsHelpExpanded] = useState(false);

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
            setAge(data.user.age || '');
            setSex(data.user.sex || '');
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [session?.user?.id, sessionStatus]);

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      setNameError('Name is required');
      return;
    }

    // Validate age if provided
    if (age !== '' && (isNaN(Number(age)) || Number(age) < 0 || Number(age) > 120)) {
      setAgeError('Please enter a valid age between 0 and 120');
      return;
    }

    setIsSavingProfile(true);
    setNameError(null);
    setAgeError(null);

    try {
      const response = await fetch('/api/update-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: name.trim(),
          age: age === '' ? null : Number(age),
          sex: sex || null
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      setStatus('Profile updated successfully');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setNameError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleProcess = async () => {
    console.log('Process button clicked');
    setIsProcessing(true);
    setProcessingStatus('Starting processing...');
    
    try {
      console.log('Calling triggerProcessing function');
      const result = await triggerProcessing(setProcessingStatus);
      console.log('triggerProcessing result:', result);
      
      if (result.success) {
        const resultMessage = result.message + (result.results.length > 0 ? ` ${result.results.map(r => r.message).join(', ')}` : '');
        console.log('Processing successful, setting message:', resultMessage);
        setProcessingStatus(resultMessage);
      } else {
        console.error('Processing unsuccessful:', result.error);
        setProcessingStatus(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error in handleProcess:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setProcessingStatus(`Error: ${errorMessage}`);
    } finally {
      console.log('Processing completed or failed, setting isProcessing to false');
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

  const fetchUploadedFiles = async () => {
    if (!session?.user?.id) return;
    
    setIsLoadingFiles(true);
    try {
      const response = await fetch('/api/uploads');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUploadedFiles(data.files || []);
        } else {
          console.error('Failed to fetch uploaded files:', data.error);
        }
      } else {
        console.error('Failed to fetch uploaded files');
      }
    } catch (error) {
      console.error('Error fetching uploaded files:', error);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return;
    }
    
    try {
      console.log('Attempting to delete file with ID:', fileId);
      
      // Properly encode the file ID to handle special characters
      const encodedFileId = encodeURIComponent(fileId);
      console.log('Encoded file ID for API call:', encodedFileId);
      
      const response = await fetch(`/api/uploads/${encodedFileId}`, {
        method: 'DELETE',
      });
      
      const responseText = await response.text();
      console.log('Delete response status:', response.status, 'text:', responseText);
      
      let data;
      try {
        // Try to parse the response as JSON
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing response as JSON:', parseError);
        throw new Error('Invalid response format from server');
      }
      
      if (response.ok) {
        if (data.success) {
          toast.success('File deleted successfully');
          setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
          // Remove from selected files if it was selected
          setSelectedFiles(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(fileId)) {
              newSelection.delete(fileId);
            }
            return newSelection;
          });
        } else {
          throw new Error(data.error || data.details || 'Failed to delete file');
        }
      } else {
        throw new Error(data.error || data.details || `Failed to delete file (Status: ${response.status})`);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete file');
    }
  };

  // Function to toggle selection of a file
  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(fileId)) {
        newSelection.delete(fileId);
      } else {
        newSelection.add(fileId);
      }
      return newSelection;
    });
  };

  // Function to check if a file is selected
  const isFileSelected = (fileId: string) => {
    return selectedFiles.has(fileId);
  };

  // Function to select or deselect all files
  const toggleSelectAllFiles = () => {
    if (selectedFiles.size === uploadedFiles.length) {
      // If all are selected, deselect all
      setSelectedFiles(new Set());
    } else {
      // Select all files
      const allFileIds = uploadedFiles.map(file => file.id);
      setSelectedFiles(new Set(allFileIds));
    }
  };

  // Function to delete multiple files at once
  const deleteSelectedFiles = async () => {
    if (selectedFiles.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedFiles.size} selected file(s)? This action cannot be undone.`)) {
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    let errorMessages: string[] = [];
    
    // Create a copy of the selected files to iterate over
    const filesToDelete = Array.from(selectedFiles);
    
    for (const fileId of filesToDelete) {
      try {
        console.log('Bulk delete - attempting to delete file with ID:', fileId);
        
        // Properly encode the file ID to handle special characters
        const encodedFileId = encodeURIComponent(fileId);
        console.log('Bulk delete - encoded file ID for API call:', encodedFileId);
        
        const response = await fetch(`/api/uploads/${encodedFileId}`, {
          method: 'DELETE',
        });
        
        const responseText = await response.text();
        console.log('Bulk delete - response status:', response.status, 'text:', responseText);
        
        let data;
        try {
          // Try to parse the response as JSON
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Bulk delete - error parsing response as JSON:', parseError);
          errorCount++;
          errorMessages.push(`Failed to parse response for file: ${fileId}`);
          continue;
        }
        
        if (response.ok && data.success) {
          successCount++;
        } else {
          errorCount++;
          const errorMessage = data.error || data.details || `Unknown error (Status: ${response.status})`;
          errorMessages.push(errorMessage);
          console.error('Bulk delete - failed for file:', fileId, 'Error:', errorMessage);
        }
      } catch (error) {
        console.error('Bulk delete - error processing file:', fileId, 'Error:', error);
        errorCount++;
        errorMessages.push(error instanceof Error ? error.message : 'Unknown error');
      }
    }
    
    // Update the UI after all deletions
    if (successCount > 0) {
      toast.success(`${successCount} file(s) deleted successfully`);
      // Remove deleted files from the list
      setUploadedFiles(prev => prev.filter(file => !selectedFiles.has(file.id)));
      // Clear selection
      setSelectedFiles(new Set());
    }
    
    if (errorCount > 0) {
      toast.error(`Failed to delete ${errorCount} file(s)`);
      console.error('Bulk delete errors:', errorMessages);
    }
    
    // Refresh the list
    fetchUploadedFiles();
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchUploadedFiles();
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
            setProgress(Math.round(percentComplete));
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
      await fetchUploadedFiles();
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

  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    // Create a new URLSearchParams object from the current
    const params = new URLSearchParams(searchParams?.toString() || '');
    // Set the tab parameter
    params.set('tab', tab);
    // Update URL without refreshing the page
    router.push(`/upload?${params.toString()}`, { scroll: false });
    // Update the state
    setActiveTab(tab);
  };

  if (sessionStatus === 'loading') {
    return (
      <main className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm mb-6">
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading session...</span>
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
              onClick={() => handleTabChange('profile')}
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
              onClick={() => handleTabChange('fitness')}
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
              onClick={() => handleTabChange('blood')}
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm divide-y divide-gray-200 dark:divide-gray-700">
                {/* Profile Photo & Name Section */}
                <div className="pt-10 px-6 pb-6">
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
                            onClick={handleUpdateProfile}
                            disabled={isSavingProfile}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 h-[38px]"
                          >
                            {isSavingProfile ? (
                              <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : ''}
                            Update
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                        Your name and profile picture will be visible publicly on your dashboard and shared reports.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Health Goals Section - Now with Age and Sex */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mt-6">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Personal Information</h3>
                  
                  <div className="space-y-6">
                    {/* Age and Sex Inputs Side by Side with Update Button */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                      {/* Age Input */}
                      <div className="md:col-span-5">
                        <label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Age
                        </label>
                        <input
                          type="number"
                          name="age"
                          id="age"
                          value={age}
                          onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                          min="0"
                          max="120"
                          className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-[38px] px-3"
                          placeholder="Enter your age"
                        />
                        {ageError && (
                          <p className="mt-1 text-sm text-red-500 dark:text-red-400">{ageError}</p>
                        )}
                      </div>
                      
                      {/* Biological Sex Input */}
                      <div className="md:col-span-5">
                        <label htmlFor="sex" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Biological Sex
                        </label>
                        <select
                          name="sex"
                          id="sex"
                          value={sex}
                          onChange={(e) => setSex(e.target.value as 'male' | 'female' | '')}
                          className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-[38px] px-3 pr-10 appearance-none bg-no-repeat bg-[right_0.5rem_center]"
                          style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundSize: "1.5em 1.5em" }}
                        >
                          <option value="">Select your biological sex</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>

                      {/* Update Button */}
                      <div className="md:col-span-2 flex justify-center">
                        <button
                          onClick={handleUpdateProfile}
                          disabled={isSavingProfile}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 h-[38px]"
                        >
                          {isSavingProfile ? (
                            <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          ) : ''}
                          Update
                        </button>
                      </div>
                    </div>
                    
                    {/* Privacy Notice */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md mt-6">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            Your age and sex information is used only to provide more accurate health insights and will not be shared publicly.
                          </p>
                        </div>
                      </div>
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
                      Get automatic syncing with our iOS app 
                      <span className="inline-flex items-center ml-2 px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full shadow-sm">
                        Coming Soon
                      </span>
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
                  onClick={() => inputFileRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${
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
                          className="text-sm text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 cursor-pointer"
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
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-medium cursor-pointer"
                          >
                            Upload a file
                          </button>
                          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            or drag and drop your Apple Health XML file here
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
                            {Math.round(progress)}%
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
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
                          : 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 cursor-pointer'
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

                {/* Help Section - How to export Apple Health data - Now Expandable */}
                <div className="mt-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setIsHelpExpanded(!isHelpExpanded)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-indigo-500 dark:text-indigo-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium text-gray-900 dark:text-white text-sm">
                        How to export your Apple Health data
                      </span>
                    </div>
                    <svg 
                      className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isHelpExpanded ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isHelpExpanded ? 'max-h-96 py-4 px-6' : 'max-h-0'}`}>
                    <ol className="space-y-3">
                      <li className="flex gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex-none w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-900 dark:text-white">1</span>
                        <span>Open the Health app on your iPhone</span>
                      </li>
                      <li className="flex gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex-none w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-900 dark:text-white">2</span>
                        <span>Tap your profile picture in the top right</span>
                      </li>
                      <li className="flex gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex-none w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-900 dark:text-white">3</span>
                        <span>Scroll down and tap "Export All Health Data"</span>
                      </li>
                      <li className="flex gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex-none w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-900 dark:text-white">4</span>
                        <span>Upload the exported ZIP file here</span>
                      </li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Uploaded Files History Section - As a separate standalone section */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Uploaded Files History</h3>
                  <button
                    onClick={fetchUploadedFiles}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                </div>
                
                {/* Show delete selected button when files are selected */}
                {selectedFiles.size > 0 && (
                  <div className="flex items-center justify-between mb-4 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-md">
                    <span className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">
                      {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} selected
                    </span>
                    <button
                      onClick={deleteSelectedFiles}
                      className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                    >
                      Delete Selected
                    </button>
                  </div>
                )}
                
                {isLoadingFiles ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                    <span className="ml-2 text-gray-500 dark:text-gray-400">Loading uploaded files...</span>
                  </div>
                ) : uploadedFiles.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      No files uploaded yet. Upload your Apple Health data to get started.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          {/* Checkbox column for select all */}
                          <th scope="col" className="px-2 py-3">
                            <div className="flex items-center justify-center">
                              <input
                                type="checkbox"
                                className="h-3.5 w-3.5 text-indigo-500 focus:ring-indigo-400 focus:ring-opacity-50 focus:ring-offset-0 border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                                checked={uploadedFiles.length > 0 && selectedFiles.size === uploadedFiles.length}
                                onChange={toggleSelectAllFiles}
                              />
                            </div>
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Filename
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Upload Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {uploadedFiles.map((file, idx) => (
                          <tr 
                            key={file.id} 
                            className={`${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/30'} ${
                              isFileSelected(file.id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                            }`}
                          >
                            {/* Checkbox for row selection */}
                            <td className="px-2 py-4">
                              <div className="flex items-center justify-center">
                                <input
                                  type="checkbox"
                                  className="h-3.5 w-3.5 text-indigo-500 focus:ring-indigo-400 focus:ring-opacity-50 focus:ring-offset-0 border-gray-300 dark:border-gray-600 rounded cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
                                  checked={isFileSelected(file.id)}
                                  onChange={() => toggleFileSelection(file.id)}
                                />
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {file.filename}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {new Date(file.uploadDate).toLocaleDateString(undefined, { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <button 
                                onClick={() => handleDeleteFile(file.id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                aria-label={`Delete ${file.filename}`}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Manually Add</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Manually add and track your blood test results here.
                </p>
                <button
                  onClick={() => setIsAddResultsModalOpen(true)}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add Blood Test Results
                </button>
              </div>
              
              {/* Blood Marker History Section - Added as requested */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Blood Marker History</h3>
                <BloodMarkerHistory />
              </div>
            </div>
          )}
          
          {/* Add the modal inside the main component structure */}
          {isAddResultsModalOpen && (
            <AddResultsModal
              isOpen={isAddResultsModalOpen}
              onClose={() => setIsAddResultsModalOpen(false)}
              prefilledResults={null}
            />
          )}
        </div>
      </div>
    </div>
  );
} 