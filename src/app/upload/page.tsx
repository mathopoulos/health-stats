'use client';

import { useState, useRef, DragEvent, useEffect } from 'react';
import { useSession, signOut } from "next-auth/react";
import AddResultsModal from '../components/AddResultsModal';
import AddWorkoutProtocolModal from '../components/AddWorkoutProtocolModal';
import AddSupplementProtocolModal from '../components/AddSupplementProtocolModal';
import AddExperimentModal from '../components/AddExperimentModal';
import Image from 'next/image';
import Link from 'next/link';
import ThemeToggle from '../components/ThemeToggle';
import BloodTestUpload from '../components/BloodTestUpload';
import BloodMarkerHistory from '../components/BloodMarkerHistory';
import FitnessMetricsHistory from '../components/FitnessMetricsHistory';
import { toast } from 'react-hot-toast';
import { useSearchParams, useRouter } from 'next/navigation';
import ConfirmDialog from '../components/ui/ConfirmDialog';

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
  const [editingSupplementType, setEditingSupplementType] = useState<string | null>(null);

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

  // Delete account state
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [confirmationPhrase, setConfirmationPhrase] = useState('');
  const requiredPhrase = 'DELETE MY ACCOUNT';

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

    const fetchCurrentDiet = async () => {
      if (sessionStatus === 'loading' || !session?.user?.id) return;
      
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
      if (sessionStatus === 'loading' || !session?.user?.id) return;
      
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
      if (sessionStatus === 'loading' || !session?.user?.id) return;
      
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

    fetchUserData();
    fetchCurrentDiet();
    fetchCurrentWorkoutProtocols();
    fetchCurrentSupplementProtocols();
    fetchExperiments();
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

  const removeWorkoutProtocol = (type: string) => {
    setWorkoutProtocols(prev => prev.filter(w => w.type !== type));
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
    
    // Exit edit mode
    setEditingSupplementType(null);
    
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
    if (sessionStatus === 'loading' || !session?.user?.id) return;
    
    setIsLoadingExperiments(true);
    try {
      const response = await fetch('/api/experiments');
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

  // Delete account handlers
  const handleDeleteAccountClick = () => {
    setShowDeleteAccountDialog(true);
    setConfirmationPhrase('');
  };

  const handleDeleteAccount = async () => {
    if (!session?.user?.id) {
      toast.error('You must be logged in to delete your account');
      return;
    }

    if (confirmationPhrase !== requiredPhrase) {
      toast.error('Please type the confirmation phrase exactly as shown');
      return;
    }

    setIsDeletingAccount(true);

    try {
      const response = await fetch('/api/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      if (data.success) {
        toast.success('Account deleted successfully. You will be signed out.');
        
        // Sign out the user and redirect to home page
        setTimeout(async () => {
          await signOut({ callbackUrl: '/' });
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete account');
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteAccountDialog(false);
      setConfirmationPhrase('');
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

  // Mobile Navigation Tabs Component
  const MobileNavigation = () => (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="flex justify-around items-center h-16">
        <button
          onClick={() => handleTabChange('profile')}
          className={`flex flex-1 flex-col items-center justify-center h-full ${
            activeTab === 'profile' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-xs mt-1">Profile</span>
        </button>

        <button
          onClick={() => handleTabChange('protocols')}
          className={`flex flex-1 flex-col items-center justify-center h-full ${
            activeTab === 'protocols' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-xs mt-1">Protocols</span>
        </button>

        <button
          onClick={() => handleTabChange('fitness')}
          className={`flex flex-1 flex-col items-center justify-center h-full ${
            activeTab === 'fitness' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-xs mt-1">Fitness</span>
        </button>

        <button
          onClick={() => handleTabChange('blood')}
          className={`flex flex-1 flex-col items-center justify-center h-full ${
            activeTab === 'blood' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          <span className="text-xs mt-1">Blood</span>
        </button>

        <button
          onClick={() => handleTabChange('more')}
          className={`flex flex-1 flex-col items-center justify-center h-full ${
            activeTab === 'more' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="text-xs mt-1">More</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Left Navigation - Hidden on mobile */}
      <div className="hidden md:block w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
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
              onClick={() => handleTabChange('protocols')}
              className={`w-full flex items-center space-x-2 px-4 py-2 text-sm rounded-lg transition-colors ${
                activeTab === 'protocols'
                  ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Protocols & Experiments</span>
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

        {/* User Profile Section with Sign out and Theme toggle */}
        <div className="absolute bottom-0 left-0 w-64">
          {/* Dashboard Button - Desktop Version */}
          {session?.user?.id && (
            <div className="px-4 pb-2">
              <Link
                href={`/dashboard/userId=${session.user.id}`}
                className="group flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-lg transition-all bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-800"
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

      {/* Mobile Header - Only visible on mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-gray-50 dark:bg-gray-900 border-b border-gray-200/50 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400 text-transparent bg-clip-text">
              revly
            </span>
          </Link>
          <div className="w-6"></div> {/* Empty div for flex spacing */}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8 md:p-8 pt-16 md:pt-8 pb-24 md:pb-8">
          
          {/* Profile Tab Content */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* View Dashboard Button - Moved to top for mobile */}
              {session?.user?.id && (
                <div className="block md:hidden">
                  <Link
                    href={`/dashboard/userId=${session.user.id}`}
                    className="group flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-lg transition-all bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-800"
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
              
              <h2 className="hidden md:block text-2xl font-bold text-gray-900 dark:text-white">Profile</h2>
              
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
                              className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-[38px] px-3 text-gray-900"
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
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
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
                          className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-12 px-4 text-gray-900"
                          placeholder="Enter your age"
                        />
                        {ageError && (
                          <p className="mt-2 text-sm text-red-500 dark:text-red-400">{ageError}</p>
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
                          onChange={(e) => setSex(e.target.value as 'male' | 'female' | 'other' | '')}
                          className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-12 px-4 text-gray-900 appearance-none bg-no-repeat"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                            backgroundPosition: `right 0.5rem center`,
                            backgroundSize: `1.5em 1.5em`
                          }}
                        >
                          <option value="">Select sex</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                        {sexError && (
                          <p className="mt-2 text-sm text-red-500 dark:text-red-400">{sexError}</p>
                        )}
                      </div>

                      {/* Update Button */}
                      <div className="md:col-span-2 flex items-end">
                        <button
                          onClick={handleUpdateProfile}
                          disabled={isSavingProfile}
                          className="w-full h-12 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                        >
                          {isSavingProfile ? (
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          ) : (
                            'Update'
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Information Notice */}
                    <div className="mt-6 flex items-start space-x-3 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>
                        Your age and sex information is used only to provide more accurate health insights and will not be shared publicly.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delete Account Section - Subtle */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mt-6">
                <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Account Management</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Manage your account settings and data
                      </p>
                    </div>
                    <button
                      onClick={handleDeleteAccountClick}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Protocols & Experiments Tab Content */}
          {activeTab === 'protocols' && (
            <div className="space-y-6">
              <h2 className="hidden md:block text-2xl font-bold text-gray-900 dark:text-white">Protocols & Experiments</h2>
              
              {/* Current Diet Protocol */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Current Diet Protocol</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Select your current dietary approach to track its impact on your health metrics.
                </p>
                
                <div className="max-w-md relative">
                  <select
                    name="currentDiet"
                    id="currentDiet"
                    value={currentDiet}
                    onChange={(e) => handleDietChange(e.target.value)}
                    disabled={isSavingProtocol}
                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-12 px-4 text-gray-900 appearance-none bg-no-repeat disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: `right 0.5rem center`,
                      backgroundSize: `1.5em 1.5em`
                    }}
                  >
                    <option value="">Select your current diet</option>
                    <option value="ketogenic">Ketogenic Diet</option>
                    <option value="carnivore">Carnivore Diet</option>
                    <option value="mediterranean">Mediterranean Diet</option>
                    <option value="paleo">Paleo Diet</option>
                    <option value="vegan">Vegan Diet</option>
                    <option value="vegetarian">Vegetarian Diet</option>
                    <option value="whole30">Whole30</option>
                    <option value="low-carb">Low Carb Diet</option>
                    <option value="variable-no-particular">Variable - No Particular Diet</option>
                    <option value="other">Other</option>
                  </select>
                  {isSavingProtocol && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <svg className="animate-spin h-4 w-4 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Current Workout Protocols */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Workout Protocols</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Track your workout routines and weekly frequency to optimize your fitness protocols.
                </p>
                
                {/* Add Workout Protocol Button */}
                <button
                  onClick={() => setIsAddWorkoutProtocolModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add Workout Protocols
                </button>

                {/* Current Workout Protocols List */}
                {workoutProtocols.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Your Current Protocols:</h4>
                    <div className="space-y-3">
                      {workoutProtocols.map((workout) => (
                        <div key={workout.type} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {workout.type.split('-').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                              ).join(' ')}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {editingWorkoutType === workout.type ? (
                              // Edit mode
                              <div className="flex items-center gap-2">
                                <select
                                  value={workout.frequency}
                                  onChange={(e) => updateWorkoutProtocolFrequency(workout.type, Number(e.target.value))}
                                  onBlur={() => setEditingWorkoutType(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                      setEditingWorkoutType(null);
                                    }
                                  }}
                                  className="h-8 rounded-md border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 text-sm px-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                                  autoFocus
                                >
                                  {Array.from({ length: 7 }, (_, i) => i + 1).map(num => (
                                    <option key={num} value={num}>{num}x/week</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => setEditingWorkoutType(null)}
                                  className="w-6 h-6 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                  title="Cancel edit"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              // View mode
                              <>
                                <button
                                  onClick={() => setEditingWorkoutType(workout.type)}
                                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  {workout.frequency}x/week
                                  {isSavingWorkoutProtocol && (
                                    <svg className="animate-spin h-3 w-3 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                  )}
                                </button>
                                
                                <button
                                  onClick={() => setEditingWorkoutType(workout.type)}
                                  className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                  title="Edit frequency"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                
                                <button
                                  onClick={() => removeWorkoutProtocol(workout.type)}
                                  className="w-8 h-8 flex items-center justify-center rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                  title="Remove protocol"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Total: {workoutProtocols.reduce((sum, w) => sum + w.frequency, 0)} sessions/week
                      </span>
                    </div>
                  </div>
                )}

              </div>

              {/* Current Supplement Protocols */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Supplement Protocols</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Track your supplement regimen including dosages, frequency, and timing to optimize your health protocols.
                </p>
                
                {/* Add Supplement Protocol Button */}
                <button
                  onClick={() => setIsAddSupplementProtocolModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add Supplement Protocols
                </button>

                {/* Current Supplement Protocols List */}
                {supplementProtocols.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Your Current Protocols:</h4>
                    <div className="space-y-3">
                      {supplementProtocols.map((supplement) => (
                        <div key={supplement.type} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {supplement.type.split('-').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                              ).join(' ')}
                            </span>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {supplement.dosage} {supplement.unit} • {supplement.frequency.replace('-', ' ')}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {editingSupplementType === supplement.type ? (
                              // Edit mode
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setEditingSupplementType(null)}
                                  className="w-6 h-6 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                  title="Cancel edit"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              // View mode
                              <>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {isSavingSupplementProtocol && (
                                    <svg className="animate-spin h-3 w-3 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                  )}
                                </span>
                                
                                <button
                                  onClick={() => setEditingSupplementType(supplement.type)}
                                  className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                  title="Edit supplement"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                
                                <button
                                  onClick={() => removeSupplementProtocol(supplement.type)}
                                  className="w-8 h-8 flex items-center justify-center rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                  title="Remove protocol"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Total: {supplementProtocols.length} supplement{supplementProtocols.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                )}

              </div>

              {/* Experiments Section */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Experiments & Trials</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Create and track health and fitness experiments to optimize your protocols and measure their impact.
                </p>
                
                {/* Add Experiment Button */}
                <button
                  onClick={() => setIsAddExperimentModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create New Experiment
                </button>

                {/* Loading State */}
                {isLoadingExperiments && (
                  <div className="mt-6 flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading experiments...</span>
                  </div>
                )}

                {/* Current Experiments List */}
                {!isLoadingExperiments && experiments.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Your Active Experiments:</h4>
                    <div className="space-y-3">
                      {experiments.filter(exp => exp.status === 'active').map((experiment) => (
                        <div key={experiment.id} className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {experiment.name}
                              </span>
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                Active
                              </span>
                            </div>
                            {experiment.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                {experiment.description}
                              </p>
                            )}
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {experiment.frequency} • {experiment.duration} • Created {new Date(experiment.createdAt).toLocaleDateString()}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {[...experiment.fitnessMarkers.slice(0, 3), ...experiment.bloodMarkers.slice(0, 3)].map((marker) => (
                                <span
                                  key={marker}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                                >
                                  {marker}
                                </span>
                              ))}
                              {(experiment.fitnessMarkers.length + experiment.bloodMarkers.length) > 6 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400">
                                  +{(experiment.fitnessMarkers.length + experiment.bloodMarkers.length) - 6} more
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => removeExperiment(experiment.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="Remove experiment"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Total: {experiments.filter(exp => exp.status === 'active').length} active experiment{experiments.filter(exp => exp.status === 'active').length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {!isLoadingExperiments && experiments.length === 0 && (
                  <div className="mt-6 text-center py-6 text-gray-500 dark:text-gray-400">
                    <p className="text-sm">No experiments created yet. Start your first health experiment!</p>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Fitness Tab Content */}
          {activeTab === 'fitness' && (
            <div className="space-y-6">
              <h2 className="hidden md:block text-2xl font-bold text-gray-900 dark:text-white">Fitness Metrics</h2>

              {/* iOS App Sync Section - Simplified */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Get automatic syncing with our iOS app 
                      <a 
                        href="https://testflight.apple.com/join/P3P1dtH6" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center ml-2 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-800/40 border border-indigo-200 dark:border-indigo-700 rounded-md transition-colors"
                      >
                        Download Beta
                        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                        </svg>
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

              {/* Uploaded Files History Section */}
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

              {/* Move FitnessMetricsHistory component here, below the Uploaded Files History section */}
              <FitnessMetricsHistory />
            </div>
          )}

          {/* Blood Tab Content */}
          {activeTab === 'blood' && (
            <div className="space-y-6">
              <h2 className="hidden md:block text-2xl font-bold text-gray-900 dark:text-white">Blood Markers</h2>
              
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
          
          {/* More Tab - Mobile Only */}
          {activeTab === 'more' && (
            <div className="space-y-6">
              <h2 className="hidden md:block text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="p-6 space-y-6">
                  {/* User Profile Section */}
                  <div className="flex items-center space-x-4">
                    {profileImage ? (
                      <Image
                        src={profileImage}
                        alt="Profile"
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-gray-500 dark:text-gray-400 text-base font-medium">
                          {name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-base font-medium text-gray-900 dark:text-white">
                        {name || 'Anonymous User'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{session?.user?.email}</p>
                    </div>
                  </div>
                  
                  {/* Theme Toggle */}
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                      <span className="text-base text-gray-800 dark:text-gray-200">Dark Mode</span>
                    </div>
                    <ThemeToggle />
                  </div>
                  
                  {/* Sign Out Button */}
                  <button
                    onClick={() => signOut()}
                    className="w-full flex items-center justify-between py-3 text-base text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Sign Out</span>
                    </div>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* About Section - Only visible on desktop */}
              <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">About</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Health Stats App v1.0.0<br />
                    Track and monitor your health metrics in one place.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNavigation />

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

      {/* Add Experiment Modal */}
      <AddExperimentModal
        isOpen={isAddExperimentModalOpen}
        onClose={() => setIsAddExperimentModalOpen(false)}
        onSave={handleSaveExperiment}
      />

      {/* Delete Account Confirmation Dialog */}
      {showDeleteAccountDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4 text-center">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" 
              onClick={() => {
                setShowDeleteAccountDialog(false);
                setConfirmationPhrase('');
              }}
              aria-hidden="true"
            />

            {/* Dialog */}
            <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:max-w-lg sm:w-full">
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                      Confirm Account Deletion
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        This action will permanently delete your account and all associated data. This cannot be undone.
                      </p>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          To confirm, type <span className="font-mono font-semibold text-red-600 dark:text-red-400">{requiredPhrase}</span> in the box below:
                        </label>
                        <input
                          type="text"
                          value={confirmationPhrase}
                          onChange={(e) => setConfirmationPhrase(e.target.value)}
                          className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm px-3 py-2"
                          placeholder={requiredPhrase}
                          disabled={isDeletingAccount}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  disabled={confirmationPhrase !== requiredPhrase || isDeletingAccount}
                  className="inline-flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDeleteAccount}
                >
                  {isDeletingAccount ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    'Delete My Account'
                  )}
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={() => {
                    setShowDeleteAccountDialog(false);
                    setConfirmationPhrase('');
                  }}
                  disabled={isDeletingAccount}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
} 