'use client';

import React, { useState, useRef, DragEvent, useEffect } from 'react';
import { useSession, signOut } from "next-auth/react";
import AddResultsModal from '@features/experiments/components/AddResultsModal';
import AddWorkoutProtocolModal from '@features/experiments/components/AddWorkoutProtocolModal';
import AddSupplementProtocolModal from '@features/experiments/components/AddSupplementProtocolModal';
import AddExperimentModal from '@features/experiments/components/AddExperimentModal';
import EditExperimentModal from '@features/experiments/components/EditExperimentModal';
import Image from 'next/image';
import Link from 'next/link';
import ThemeToggle from '@components/ThemeToggle';
import BloodTestUpload from '@features/blood-markers/components/BloodTestUpload';
import BloodMarkerHistory from '@features/blood-markers/components/BloodMarkerHistory';

import { toast } from 'react-hot-toast';
import { useSearchParams, useRouter } from 'next/navigation';
import ConfirmDialog from '@components/ui/ConfirmDialog';
import EditSupplementProtocolModal from '@features/experiments/components/EditSupplementProtocolPopover';
import { ProfileTab, BloodTab, MoreTab, FitnessTab, ProtocolsTab, MobileNavigation, DesktopNavigation, MobileHeader } from '@features/upload/components';

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
  const { data: session, status: sessionStatus, update: updateSession } = useSession();
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
  const [name, setName] = useState<string>('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [age, setAge] = useState<number | ''>('');
  const [ageError, setAgeError] = useState<string | null>(null);
  const [sex, setSex] = useState<'male' | 'female' | 'other' | ''>('');
  const [sexError, setSexError] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(() => {
    // Initialize from URL query param if available, otherwise default to 'profile'
    const tab = searchParams?.get('tab');
    return tab && ['profile', 'protocols', 'fitness', 'blood', 'more'].includes(tab) ? tab : 'profile';
  });

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
  const [currentDiet, setCurrentDiet] = useState<string>('');
  const [isSavingProtocol, setIsSavingProtocol] = useState(false);
  
  // Workout protocol state
  const [workoutProtocols, setWorkoutProtocols] = useState<Array<{
    type: string;
    frequency: number;
  }>>([]);
  const [isSavingWorkoutProtocol, setIsSavingWorkoutProtocol] = useState(false);
  
  // Available workout types
  const [isAddWorkoutProtocolModalOpen, setIsAddWorkoutProtocolModalOpen] = useState(false);
  const [editingWorkoutType, setEditingWorkoutType] = useState<string | null>(null);

  // Supplement protocol state
  const [supplementProtocols, setSupplementProtocols] = useState<Array<{
    type: string;
    frequency: string;
    dosage: string;
    unit: string;
  }>>([]);
  const [isSavingSupplementProtocol, setIsSavingSupplementProtocol] = useState(false);
  const [isAddSupplementProtocolModalOpen, setIsAddSupplementProtocolModalOpen] = useState(false);
  const [editingSupplementProtocol, setEditingSupplementProtocol] = useState<{
    type: string;
    frequency: string;
    dosage: string;
    unit: string;
  } | null>(null);
  const [isEditSupplementProtocolModalOpen, setIsEditSupplementProtocolModalOpen] = useState(false);


  // Experiment state
  const [experiments, setExperiments] = useState<Array<{
    id: string;
    name: string;
    description: string;
    frequency: string;
    duration: string;
    fitnessMarkers: string[];
    bloodMarkers: string[];
    status: 'active' | 'completed' | 'paused';
    createdAt: string;
  }>>([]);
  const [isSavingExperiment, setIsSavingExperiment] = useState(false);
  const [isAddExperimentModalOpen, setIsAddExperimentModalOpen] = useState(false);
  const [isLoadingExperiments, setIsLoadingExperiments] = useState(false);
  const [isEditExperimentModalOpen, setIsEditExperimentModalOpen] = useState(false);
  const [editingExperiment, setEditingExperiment] = useState<{
    id: string;
    name: string;
    description: string;
    frequency: string;
    duration: string;
    fitnessMarkers: string[];
    bloodMarkers: string[];
    status: 'active' | 'completed' | 'paused';
    createdAt: string;
  } | null>(null);

  // Delete account state
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [confirmationPhrase, setConfirmationPhrase] = useState('');
  const requiredPhrase = 'DELETE MY ACCOUNT';

  // Fix session race condition in preview deployments
  useEffect(() => {
    // If authenticated but missing user ID, force session refresh
    if (sessionStatus === 'authenticated' && session && !session.user?.id) {
      updateSession();
    }
    
    // Clean up OAuth proxy success parameter from URL
    const isFromOAuthProxy = searchParams?.get('oauth_success') === 'true';
    if (isFromOAuthProxy) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('oauth_success');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [sessionStatus, session, updateSession, searchParams]);

  useEffect(() => {
    // Retry mechanism for session-dependent data fetching
    // This helps with race conditions in preview deployments where session cookies
    // may take time to be properly established after OAuth proxy redirect
    const fetchWithRetry = async (fetchFn: () => Promise<void>, retryCount = 0): Promise<void> => {
      const maxRetries = 3;
      const retryDelay = 1000; // 1 second
      
      if (sessionStatus === 'loading') return;
      
      if (!session?.user?.id) {
        if (retryCount < maxRetries && sessionStatus === 'authenticated') {
          // Session status is authenticated but user ID not available yet
          // This can happen during OAuth proxy flow - retry after delay
          console.log(`Session user ID not available, retrying in ${retryDelay}ms (attempt ${retryCount + 1}/${maxRetries})`);
          setTimeout(() => fetchWithRetry(fetchFn, retryCount + 1), retryDelay);
        }
        return;
      }
      
      try {
        await fetchFn();
      } catch (error) {
        console.error('Error in fetchWithRetry:', error);
      }
    };

    const fetchUserData = async () => {
      if (!session?.user?.id) return;
      
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

    const fetchCurrentDiet = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch(`/api/health-protocols?protocolType=diet&activeOnly=true&userId=${session.user.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.length > 0) {
            setCurrentDiet(data.data[0].protocol || '');
          }
        }
      } catch (error) {
        console.error('Error fetching current diet:', error);
      }
    };

    const fetchCurrentWorkoutProtocols = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch(`/api/health-protocols?protocolType=exercise&activeOnly=true&userId=${session.user.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.length > 0) {
            const protocolData = JSON.parse(data.data[0].protocol);
            setWorkoutProtocols(protocolData.workouts || []);
          }
        }
      } catch (error) {
        console.error('Error fetching current workout protocols:', error);
      }
    };

    const fetchCurrentSupplementProtocols = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch(`/api/health-protocols?protocolType=supplement&activeOnly=true&userId=${session.user.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.length > 0) {
            const protocolData = JSON.parse(data.data[0].protocol);
            setSupplementProtocols(protocolData.supplements || []);
          }
        }
      } catch (error) {
        console.error('Error fetching current supplement protocols:', error);
      }
    };

    // Use retry mechanism for all session-dependent data fetching
    fetchWithRetry(fetchUserData);
    fetchWithRetry(fetchCurrentDiet);
    fetchWithRetry(fetchCurrentWorkoutProtocols);
    fetchWithRetry(fetchCurrentSupplementProtocols);
    fetchWithRetry(fetchExperiments);
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

  const handleDietChange = async (newDiet: string) => {
    if (newDiet === currentDiet) return;
    
    setIsSavingProtocol(true);
    
    try {
      if (newDiet) {
        const response = await fetch('/api/health-protocols', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            protocolType: 'diet',
            protocol: newDiet,
            startDate: new Date().toISOString()
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to save diet protocol');
        }

        setStatus('Diet protocol updated successfully');
        setTimeout(() => setStatus(''), 3000);
      }
      
      setCurrentDiet(newDiet);
    } catch (error) {
      console.error('Error updating diet protocol:', error);
      setStatus(error instanceof Error ? error.message : 'Failed to update diet protocol');
      setTimeout(() => setStatus(''), 3000);
    } finally {
      setIsSavingProtocol(false);
    }
  };

  // Workout protocol handlers
  const addWorkoutProtocol = (type: string) => {
    // Check if this workout type is already added
    if (!workoutProtocols.find(w => w.type === type)) {
      setWorkoutProtocols(prev => [...prev, { type, frequency: 2 }]);
    }
  };

  const removeWorkoutProtocol = async (type: string) => {
    // Update local state immediately for optimistic UI
    const updatedProtocols = workoutProtocols.filter(w => w.type !== type);
    setWorkoutProtocols(updatedProtocols);
    
    // Save to backend to persist the deletion
    setIsSavingWorkoutProtocol(true);
    try {
      const response = await fetch('/api/health-protocols', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          protocolType: 'exercise',
          protocol: JSON.stringify({ workouts: updatedProtocols }),
          startDate: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove workout protocol');
      }

      setStatus('Workout protocol removed successfully');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Error removing workout protocol:', error);
      
      // Revert local state on error
      setWorkoutProtocols(workoutProtocols);
      
      setStatus(error instanceof Error ? error.message : 'Failed to remove workout protocol');
      setTimeout(() => setStatus(''), 3000);
    } finally {
      setIsSavingWorkoutProtocol(false);
    }
  };

  const updateWorkoutProtocolFrequency = async (type: string, newFrequency: number) => {
    // Capture original frequency for potential revert
    const originalFrequency = workoutProtocols.find(w => w.type === type)?.frequency || 2;
    
    // Update local state immediately for optimistic UI
    setWorkoutProtocols(prev => 
      prev.map(w => w.type === type ? { ...w, frequency: newFrequency } : w)
    );
    
    // Exit edit mode
    setEditingWorkoutType(null);
    
    // Save to backend
    setIsSavingWorkoutProtocol(true);
    try {
      const updatedProtocols = workoutProtocols.map(w => 
        w.type === type ? { ...w, frequency: newFrequency } : w
      );
      
      const response = await fetch('/api/health-protocols', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          protocolType: 'exercise',
          protocol: JSON.stringify({ workouts: updatedProtocols }),
          startDate: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update workout protocol');
      }
      
      setStatus('Workout protocol updated successfully');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Error updating workout protocol:', error);
      setStatus(error instanceof Error ? error.message : 'Failed to update workout protocol');
      setTimeout(() => setStatus(''), 3000);
      
      // Revert local state on error
      setWorkoutProtocols(prev => 
        prev.map(w => w.type === type ? { ...w, frequency: originalFrequency } : w)
      );
    } finally {
      setIsSavingWorkoutProtocol(false);
    }
  };



  const handleSaveWorkoutProtocols = async (newProtocols: Array<{ type: string; frequency: number }>) => {
    setIsSavingWorkoutProtocol(true);
    
    try {
      // Combine new protocols with existing ones, avoiding duplicates
      const updatedProtocols = [...workoutProtocols];
      
      newProtocols.forEach(newProtocol => {
        const existingIndex = updatedProtocols.findIndex(p => p.type === newProtocol.type);
        if (existingIndex >= 0) {
          // Update existing protocol frequency
          updatedProtocols[existingIndex] = newProtocol;
        } else {
          // Add new protocol
          updatedProtocols.push(newProtocol);
        }
      });
      
      // Save to backend
      const response = await fetch('/api/health-protocols', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          protocolType: 'exercise',
          protocol: JSON.stringify({ workouts: updatedProtocols }),
          startDate: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save workout protocols');
      }

      // Update local state
      setWorkoutProtocols(updatedProtocols);
      
      setStatus('Workout protocols updated successfully');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Error updating workout protocols:', error);
      setStatus(error instanceof Error ? error.message : 'Failed to update workout protocols');
      setTimeout(() => setStatus(''), 3000);
    } finally {
      setIsSavingWorkoutProtocol(false);
    }
  };

  // Supplement protocol handlers
  const addSupplementProtocol = (type: string, frequency: string, dosage: string, unit: string) => {
    // Check if this supplement type is already added
    if (!supplementProtocols.find(s => s.type === type)) {
      setSupplementProtocols(prev => [...prev, { type, frequency, dosage, unit }]);
    }
  };

  const removeSupplementProtocol = (type: string) => {
    setSupplementProtocols(prev => prev.filter(s => s.type !== type));
  };

  const updateSupplementProtocol = async (type: string, field: string, newValue: string) => {
    // Capture original value for potential revert
    const originalProtocol = supplementProtocols.find(s => s.type === type);
    if (!originalProtocol) return;
    
    // Update local state immediately for optimistic UI
    setSupplementProtocols(prev => 
      prev.map(s => s.type === type ? { ...s, [field]: newValue } : s)
    );
    
    // Save to backend
    setIsSavingSupplementProtocol(true);
    try {
      const updatedProtocols = supplementProtocols.map(s => 
        s.type === type ? { ...s, [field]: newValue } : s
      );
      
      const response = await fetch('/api/health-protocols', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          protocolType: 'supplement',
          protocol: JSON.stringify({ supplements: updatedProtocols }),
          startDate: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update supplement protocol');
      }
      
      setStatus('Supplement protocol updated successfully');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Error updating supplement protocol:', error);
      setStatus(error instanceof Error ? error.message : 'Failed to update supplement protocol');
      setTimeout(() => setStatus(''), 3000);
      
      // Revert local state on error
      setSupplementProtocols(prev => 
        prev.map(s => s.type === type ? originalProtocol : s)
      );
    } finally {
      setIsSavingSupplementProtocol(false);
    }
  };

  const handleSaveSupplementProtocols = async (newProtocols: Array<{ type: string; frequency: string; dosage: string; unit: string }>) => {
    setIsSavingSupplementProtocol(true);
    
    try {
      // Combine new protocols with existing ones, avoiding duplicates
      const updatedProtocols = [...supplementProtocols];
      
      newProtocols.forEach(newProtocol => {
        const existingIndex = updatedProtocols.findIndex(p => p.type === newProtocol.type);
        if (existingIndex >= 0) {
          // Update existing protocol
          updatedProtocols[existingIndex] = newProtocol;
        } else {
          // Add new protocol
          updatedProtocols.push(newProtocol);
        }
      });
      
      // Save to backend
      const response = await fetch('/api/health-protocols', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          protocolType: 'supplement',
          protocol: JSON.stringify({ supplements: updatedProtocols }),
          startDate: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save supplement protocols');
      }

      // Update local state
      setSupplementProtocols(updatedProtocols);
      
      setStatus('Supplement protocols updated successfully');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Error updating supplement protocols:', error);
      setStatus(error instanceof Error ? error.message : 'Failed to update supplement protocols');
      setTimeout(() => setStatus(''), 3000);
    } finally {
      setIsSavingSupplementProtocol(false);
    }
  };

  // Experiment handlers
  const fetchExperiments = async () => {
    if (!session?.user?.id) return;
    
    setIsLoadingExperiments(true);
    try {
      const timestamp = Date.now();
      const response = await fetch(`/api/experiments?userId=${session.user.id}&t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setExperiments(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching experiments:', error);
    } finally {
      setIsLoadingExperiments(false);
    }
  };

  const handleSaveExperiment = async (experimentData: {
    name: string;
    description: string;
    frequency: string;
    duration: string;
    fitnessMarkers: string[];
    bloodMarkers: string[];
  }) => {
    setIsSavingExperiment(true);
    
    try {
      const response = await fetch('/api/experiments', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(experimentData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create experiment');
      }

      const result = await response.json();
      if (result.success) {
        // Refresh experiments list
        await fetchExperiments();
        setStatus('Experiment created successfully');
        setTimeout(() => setStatus(''), 3000);
      }
    } catch (error) {
      console.error('Error creating experiment:', error);
      setStatus(error instanceof Error ? error.message : 'Failed to create experiment');
      setTimeout(() => setStatus(''), 3000);
    } finally {
      setIsSavingExperiment(false);
    }
  };

  const removeExperiment = async (id: string) => {
    try {
      const response = await fetch(`/api/experiments?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete experiment');
      }

      // Remove from local state
      setExperiments(prev => prev.filter(exp => exp.id !== id));
      setStatus('Experiment deleted successfully');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Error deleting experiment:', error);
      setStatus(error instanceof Error ? error.message : 'Failed to delete experiment');
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const handleEditExperiment = (experiment: typeof experiments[0]) => {
    setEditingExperiment(experiment);
    setIsEditExperimentModalOpen(true);
  };

  const handleUpdateExperiment = async (updatedExperiment: typeof experiments[0]) => {
    try {
      // Update local state
      setExperiments(prev => 
        prev.map(exp => 
          exp.id === updatedExperiment.id 
            ? { ...exp, ...updatedExperiment }
            : exp
        )
      );
      setStatus('Experiment updated successfully');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Error updating experiment in state:', error);
      setStatus('Failed to update experiment');
      setTimeout(() => setStatus(''), 3000);
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
      {/* Desktop Navigation */}
      <DesktopNavigation
        activeTab={activeTab}
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
          
          {/* Profile Tab Content */}
          {activeTab === 'profile' && (
            <ProfileTab
              name={name}
              setName={setName}
              nameError={nameError}
              setNameError={setNameError}
              age={age}
              setAge={setAge}
              ageError={ageError}
              setAgeError={setAgeError}
              sex={sex}
              setSex={setSex}
              sexError={sexError}
              setSexError={setSexError}
              profileImage={profileImage}
              setProfileImage={setProfileImage}
              imageError={imageError}
              setImageError={setImageError}
              isUploadingImage={isUploadingImage}
              setIsUploadingImage={setIsUploadingImage}
              isSavingProfile={isSavingProfile}
              setIsSavingProfile={setIsSavingProfile}
              showDeleteAccountDialog={showDeleteAccountDialog}
              setShowDeleteAccountDialog={setShowDeleteAccountDialog}
              isDeletingAccount={isDeletingAccount}
              setIsDeletingAccount={setIsDeletingAccount}
              confirmationPhrase={confirmationPhrase}
              setConfirmationPhrase={setConfirmationPhrase}
              requiredPhrase={requiredPhrase}
            />
          )}

          {/* Protocols & Experiments Tab Content */}
          {activeTab === 'protocols' && (
            <ProtocolsTab
              currentDiet={currentDiet}
              setCurrentDiet={setCurrentDiet}
              isSavingProtocol={isSavingProtocol}
              setIsSavingProtocol={setIsSavingProtocol}
              workoutProtocols={workoutProtocols}
              setWorkoutProtocols={setWorkoutProtocols}
              isSavingWorkoutProtocol={isSavingWorkoutProtocol}
              setIsSavingWorkoutProtocol={setIsSavingWorkoutProtocol}
              supplementProtocols={supplementProtocols}
              setSupplementProtocols={setSupplementProtocols}
              isSavingSupplementProtocol={isSavingSupplementProtocol}
              setIsSavingSupplementProtocol={setIsSavingSupplementProtocol}
              experiments={experiments}
              setExperiments={setExperiments}
              isLoadingExperiments={isLoadingExperiments}
              setIsLoadingExperiments={setIsLoadingExperiments}
              editingExperiment={editingExperiment}
              setEditingExperiment={setEditingExperiment}
              isAddWorkoutProtocolModalOpen={isAddWorkoutProtocolModalOpen}
              setIsAddWorkoutProtocolModalOpen={setIsAddWorkoutProtocolModalOpen}
              isAddSupplementProtocolModalOpen={isAddSupplementProtocolModalOpen}
              setIsAddSupplementProtocolModalOpen={setIsAddSupplementProtocolModalOpen}
              isEditSupplementProtocolModalOpen={isEditSupplementProtocolModalOpen}
              setIsEditSupplementProtocolModalOpen={setIsEditSupplementProtocolModalOpen}
              isAddExperimentModalOpen={isAddExperimentModalOpen}
              setIsAddExperimentModalOpen={setIsAddExperimentModalOpen}
              isEditExperimentModalOpen={isEditExperimentModalOpen}
              setIsEditExperimentModalOpen={setIsEditExperimentModalOpen}
              handleDietChange={handleDietChange}
              addWorkoutProtocol={addWorkoutProtocol}
              removeWorkoutProtocol={removeWorkoutProtocol}
              updateWorkoutProtocolFrequency={updateWorkoutProtocolFrequency}
              handleSaveWorkoutProtocols={handleSaveWorkoutProtocols}
              addSupplementProtocol={addSupplementProtocol}
              updateSupplementProtocol={updateSupplementProtocol}
              handleSaveSupplementProtocols={handleSaveSupplementProtocols}
              fetchExperiments={fetchExperiments}
              handleSaveExperiment={handleSaveExperiment}
              removeExperiment={removeExperiment}
              handleEditExperiment={handleEditExperiment}
              handleUpdateExperiment={handleUpdateExperiment}
            />
          )}

          {/* Fitness Tab Content */}
          {activeTab === 'fitness' && (
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
              fetchUploadedFiles={fetchUploadedFiles}
              deleteSelectedFiles={deleteSelectedFiles}
              toggleSelectAllFiles={toggleSelectAllFiles}
              toggleFileSelection={toggleFileSelection}
              isFileSelected={isFileSelected}
              handleDeleteFile={handleDeleteFile}
            />
          )}

          {/* Blood Tab Content */}
          {activeTab === 'blood' && (
            <BloodTab
              isAddResultsModalOpen={isAddResultsModalOpen}
              setIsAddResultsModalOpen={setIsAddResultsModalOpen}
            />
          )}
          
          {/* More Tab - Mobile Only */}
          {activeTab === 'more' && (
            <MoreTab
              profileImage={profileImage}
              name={name}
            />
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Add the modal inside the main component structure */}
      {isAddResultsModalOpen && (
        <AddResultsModal
          isOpen={isAddResultsModalOpen}
          onClose={() => setIsAddResultsModalOpen(false)}
          prefilledResults={null}
        />
      )}

      {/* Add Workout Protocol Modal */}
      <AddWorkoutProtocolModal
        isOpen={isAddWorkoutProtocolModalOpen}
        onClose={() => setIsAddWorkoutProtocolModalOpen(false)}
        onSave={handleSaveWorkoutProtocols}
      />

      {/* Add Supplement Protocol Modal */}
      <AddSupplementProtocolModal
        isOpen={isAddSupplementProtocolModalOpen}
        onClose={() => setIsAddSupplementProtocolModalOpen(false)}
        onSave={handleSaveSupplementProtocols}
      />

      {/* Edit Supplement Protocol Modal */}
      <EditSupplementProtocolModal
        isOpen={isEditSupplementProtocolModalOpen}
        onClose={() => {
          setIsEditSupplementProtocolModalOpen(false);
          setEditingSupplementProtocol(null);
        }}
        supplement={editingSupplementProtocol}
        onUpdate={updateSupplementProtocol}
        isSaving={isSavingSupplementProtocol}
      />

      {/* Add Experiment Modal */}
      <AddExperimentModal
        isOpen={isAddExperimentModalOpen}
        onClose={() => setIsAddExperimentModalOpen(false)}
        onSave={handleSaveExperiment}
      />

      {/* Edit Experiment Modal */}
      <EditExperimentModal
        isOpen={isEditExperimentModalOpen}
        onClose={() => {
          setIsEditExperimentModalOpen(false);
          setEditingExperiment(null);
        }}
        onSave={handleUpdateExperiment}
        experiment={editingExperiment}
      />

      {/* Mobile Navigation */}
      <MobileNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

    </div>
  );
} 