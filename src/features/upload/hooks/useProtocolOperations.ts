'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

// Type definitions
export interface WorkoutProtocol {
  type: string;
  frequency: number;
}

export interface SupplementProtocol {
  type: string;
  frequency: string;
  dosage: string;
  unit: string;
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  frequency: string;
  duration: string;
  fitnessMarkers: string[];
  bloodMarkers: string[];
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
}

export interface ExperimentData {
  name: string;
  description: string;
  frequency: string;
  duration: string;
  fitnessMarkers: string[];
  bloodMarkers: string[];
}

export interface UseProtocolOperationsReturn {
  // User data
  profileImage: string | null;
  name: string;
  
  // Diet data
  currentDiet: string;
  isSavingProtocol: boolean;
  
  // Workout data
  workoutProtocols: WorkoutProtocol[];
  isSavingWorkoutProtocol: boolean;
  
  // Supplement data
  supplementProtocols: SupplementProtocol[];
  isSavingSupplementProtocol: boolean;
  
  // Experiment data
  experiments: Experiment[];
  isSavingExperiment: boolean;
  isLoadingExperiments: boolean;
  
  // Status
  status: string;
  
  // Operations
  handleDietChange: (newDiet: string) => Promise<void>;
  addWorkoutProtocol: (type: string) => void;
  removeWorkoutProtocol: (type: string) => Promise<void>;
  updateWorkoutProtocolFrequency: (type: string, frequency: number) => Promise<void>;
  handleSaveWorkoutProtocols: (protocols: WorkoutProtocol[]) => Promise<void>;
  addSupplementProtocol: (type: string, frequency: string, dosage: string, unit: string) => void;
  updateSupplementProtocol: (type: string, field: string, newValue: string) => Promise<void>;
  handleSaveSupplementProtocols: (protocols: SupplementProtocol[]) => Promise<void>;
  handleSaveExperiment: (data: ExperimentData) => Promise<void>;
  removeExperiment: (id: string) => Promise<void>;
  handleUpdateExperiment: (experiment: Experiment) => Promise<void>;
  refreshExperiments: () => Promise<void>;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

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

/**
 * Custom hook to manage all protocol-related API operations and state
 * Centralizes data fetching and mutations for better testability and maintainability
 */
export function useProtocolOperations(): UseProtocolOperationsReturn {
  const { data: session, status: sessionStatus } = useSession();
  
  // User profile state
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [name, setName] = useState<string>('');
  
  // Diet protocol state
  const [currentDiet, setCurrentDiet] = useState<string>('');
  const [isSavingProtocol, setIsSavingProtocol] = useState(false);
  
  // Workout protocol state
  const [workoutProtocols, setWorkoutProtocols] = useState<WorkoutProtocol[]>([]);
  const [isSavingWorkoutProtocol, setIsSavingWorkoutProtocol] = useState(false);

  // Supplement protocol state
  const [supplementProtocols, setSupplementProtocols] = useState<SupplementProtocol[]>([]);
  const [isSavingSupplementProtocol, setIsSavingSupplementProtocol] = useState(false);

  // Experiment state
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [isSavingExperiment, setIsSavingExperiment] = useState(false);
  const [isLoadingExperiments, setIsLoadingExperiments] = useState(false);

  const [status, setStatus] = useState<string>('');

  // Helper function to set temporary status messages
  const setTemporaryStatus = useCallback((message: string, duration = 3000) => {
    setStatus(message);
    setTimeout(() => setStatus(''), duration);
  }, []);

  // Fetch functions
  const fetchUserData = useCallback(async () => {
    if (!session?.user?.id) return;
    
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
  }, [session?.user?.id]);

  const fetchCurrentDiet = useCallback(async () => {
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
  }, [session?.user?.id]);

  const fetchCurrentWorkoutProtocols = useCallback(async () => {
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
  }, [session?.user?.id]);

  const fetchCurrentSupplementProtocols = useCallback(async () => {
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
  }, [session?.user?.id]);

  const refreshExperiments = useCallback(async () => {
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
  }, [session?.user?.id]);

  // Initial data loading
  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (!session?.user?.id) return;

    // Use retry mechanism for session-dependent data fetching
    fetchWithRetry(fetchUserData);
    fetchWithRetry(fetchCurrentDiet);
    fetchWithRetry(fetchCurrentWorkoutProtocols);
    fetchWithRetry(fetchCurrentSupplementProtocols);
    fetchWithRetry(refreshExperiments);
  }, [session?.user?.id, sessionStatus, fetchUserData, fetchCurrentDiet, fetchCurrentWorkoutProtocols, fetchCurrentSupplementProtocols, refreshExperiments]);

  // Diet protocol operations
  const handleDietChange = useCallback(async (newDiet: string) => {
    if (newDiet === currentDiet) return;
    
    setIsSavingProtocol(true);
    const previousDiet = currentDiet;
    setCurrentDiet(newDiet);
    
    try {
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

      setTemporaryStatus('Diet protocol updated successfully');
    } catch (error) {
      console.error('Error updating diet protocol:', error);
      setCurrentDiet(previousDiet); // Revert on error
      setTemporaryStatus(error instanceof Error ? error.message : 'Failed to update diet protocol');
    } finally {
      setIsSavingProtocol(false);
    }
  }, [currentDiet, setTemporaryStatus]);

  // Workout protocol operations
  const addWorkoutProtocol = useCallback((type: string) => {
    setWorkoutProtocols(prev => {
      if (prev.find(w => w.type === type)) {
        return prev; // Don't add if already exists
      }
      return [...prev, { type, frequency: 2 }];
    });
  }, []);

  const removeWorkoutProtocol = useCallback(async (type: string) => {
    // Store the current state before making any changes
    let previousProtocols: WorkoutProtocol[] = workoutProtocols;
    
    // Update state to remove the protocol
    const updatedProtocols = workoutProtocols.filter(w => w.type !== type);
    setWorkoutProtocols(updatedProtocols);
    
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

      setTemporaryStatus('Workout protocol removed successfully');
    } catch (error) {
      console.error('Error removing workout protocol:', error);
      // Revert to previous state on error
      setWorkoutProtocols(previousProtocols);
      setTemporaryStatus(error instanceof Error ? error.message : 'Failed to remove workout protocol');
    }
  }, [setTemporaryStatus, workoutProtocols]);

  const updateWorkoutProtocolFrequency = useCallback(async (type: string, newFrequency: number) => {
    let originalFrequency = 2;
    
    setWorkoutProtocols(prev => {
      originalFrequency = prev.find(w => w.type === type)?.frequency || 2;
      return prev.map(w => 
        w.type === type 
          ? { ...w, frequency: newFrequency }
          : w
      );
    });

    try {
      let updatedProtocols: WorkoutProtocol[];
      setWorkoutProtocols(prev => {
        updatedProtocols = prev; // Get current state
        return prev;
      });

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

      setTemporaryStatus('Workout protocol updated successfully');
    } catch (error) {
      console.error('Error updating workout protocol:', error);
      setWorkoutProtocols(prev => 
        prev.map(w => 
          w.type === type 
            ? { ...w, frequency: originalFrequency }
            : w
        )
      );
      setTemporaryStatus(error instanceof Error ? error.message : 'Failed to update workout protocol');
    }
  }, [workoutProtocols, setTemporaryStatus]);

  const handleSaveWorkoutProtocols = useCallback(async (newProtocols: WorkoutProtocol[]) => {
    setIsSavingWorkoutProtocol(true);
    
    try {
      const updatedProtocols = [...workoutProtocols];
      
      newProtocols.forEach(newProtocol => {
        const existingIndex = updatedProtocols.findIndex(p => p.type === newProtocol.type);
        if (existingIndex >= 0) {
          updatedProtocols[existingIndex] = newProtocol;
        } else {
          updatedProtocols.push(newProtocol);
        }
      });

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

      setWorkoutProtocols(updatedProtocols);
      setTemporaryStatus('Workout protocols updated successfully');
    } catch (error) {
      console.error('Error updating workout protocols:', error);
      setTemporaryStatus(error instanceof Error ? error.message : 'Failed to update workout protocols');
    } finally {
      setIsSavingWorkoutProtocol(false);
    }
  }, [workoutProtocols, setTemporaryStatus]);

  // Supplement protocol operations
  const addSupplementProtocol = useCallback((type: string, frequency: string, dosage: string, unit: string) => {
    setSupplementProtocols(prev => {
      if (prev.find(s => s.type === type)) {
        return prev; // Don't add if already exists
      }
      return [...prev, { type, frequency, dosage, unit }];
    });
  }, []);

  const updateSupplementProtocol = useCallback(async (type: string, field: string, newValue: string) => {
    const originalProtocol = supplementProtocols.find(s => s.type === type);
    if (!originalProtocol) return;

    setSupplementProtocols(prev => 
      prev.map(s => 
        s.type === type 
          ? { ...s, [field]: newValue }
          : s
      )
    );

    try {
      const updatedProtocols = supplementProtocols.map(s => 
        s.type === type 
          ? { ...s, [field]: newValue }
          : s
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

      setTemporaryStatus('Supplement protocol updated successfully');
    } catch (error) {
      console.error('Error updating supplement protocol:', error);
      setSupplementProtocols(prev => 
        prev.map(s => 
          s.type === type 
            ? originalProtocol
            : s
        )
      );
      setTemporaryStatus(error instanceof Error ? error.message : 'Failed to update supplement protocol');
    }
  }, [supplementProtocols, setTemporaryStatus]);

  const handleSaveSupplementProtocols = useCallback(async (newProtocols: SupplementProtocol[]) => {
    setIsSavingSupplementProtocol(true);
    
    try {
      const updatedProtocols = [...supplementProtocols];
      
      newProtocols.forEach(newProtocol => {
        const existingIndex = updatedProtocols.findIndex(p => p.type === newProtocol.type);
        if (existingIndex >= 0) {
          updatedProtocols[existingIndex] = newProtocol;
        } else {
          updatedProtocols.push(newProtocol);
        }
      });

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

      setSupplementProtocols(updatedProtocols);
      setTemporaryStatus('Supplement protocols updated successfully');
    } catch (error) {
      console.error('Error updating supplement protocols:', error);
      setTemporaryStatus(error instanceof Error ? error.message : 'Failed to update supplement protocols');
    } finally {
      setIsSavingSupplementProtocol(false);
    }
  }, [supplementProtocols, setTemporaryStatus]);

  // Experiment operations
  const handleSaveExperiment = useCallback(async (experimentData: ExperimentData) => {
    setIsSavingExperiment(true);
    try {
      const response = await fetch('/api/experiments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...experimentData,
          status: 'active'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create experiment');
      }

      // Refresh experiments list
      await refreshExperiments();
      setTemporaryStatus('Experiment created successfully');
    } catch (error) {
      console.error('Error creating experiment:', error);
      setTemporaryStatus(error instanceof Error ? error.message : 'Failed to create experiment');
    } finally {
      setIsSavingExperiment(false);
    }
  }, [refreshExperiments, setTemporaryStatus]);

  const removeExperiment = useCallback(async (id: string) => {
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
      setTemporaryStatus('Experiment deleted successfully');
    } catch (error) {
      console.error('Error deleting experiment:', error);
      setTemporaryStatus(error instanceof Error ? error.message : 'Failed to delete experiment');
    }
  }, [setTemporaryStatus]);

  const handleUpdateExperiment = useCallback(async (updatedExperiment: Experiment) => {
    try {
      // Update local state
      setExperiments(prev => 
        prev.map(exp => 
          exp.id === updatedExperiment.id 
            ? { ...exp, ...updatedExperiment }
            : exp
        )
      );
      setTemporaryStatus('Experiment updated successfully');
    } catch (error) {
      console.error('Error updating experiment:', error);
      setTemporaryStatus(error instanceof Error ? error.message : 'Failed to update experiment');
    }
  }, [setTemporaryStatus]);

  return {
    // User data
    profileImage,
    name,
    
    // Diet data
    currentDiet,
    isSavingProtocol,
    
    // Workout data
    workoutProtocols,
    isSavingWorkoutProtocol,
    
    // Supplement data
    supplementProtocols,
    isSavingSupplementProtocol,
    
    // Experiment data
    experiments,
    isSavingExperiment,
    isLoadingExperiments,
    
    // Status
    status,
    
    // Operations
    handleDietChange,
    addWorkoutProtocol,
    removeWorkoutProtocol,
    updateWorkoutProtocolFrequency,
    handleSaveWorkoutProtocols,
    addSupplementProtocol,
    updateSupplementProtocol,
    handleSaveSupplementProtocols,
    handleSaveExperiment,
    removeExperiment,
    handleUpdateExperiment,
    refreshExperiments,
  };
}
