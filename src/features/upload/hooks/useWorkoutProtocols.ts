'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import type { WorkoutProtocol } from '../services';

export interface UseWorkoutProtocolsReturn {
  // Workout protocols state
  workoutProtocols: WorkoutProtocol[];
  setWorkoutProtocols: (protocols: WorkoutProtocol[]) => void;
  isSavingWorkoutProtocol: boolean;
  setIsSavingWorkoutProtocol: (saving: boolean) => void;
  
  // Handlers
  addWorkoutProtocol: (type: string) => void;
  removeWorkoutProtocol: (type: string) => Promise<void>;
  updateWorkoutProtocolFrequency: (type: string, newFrequency: number) => Promise<void>;
  handleSaveWorkoutProtocols: (newProtocols: WorkoutProtocol[]) => Promise<void>;
}

export function useWorkoutProtocols(initialProtocols: WorkoutProtocol[] = []): UseWorkoutProtocolsReturn {
  const { data: session, status: sessionStatus } = useSession();
  const [workoutProtocols, setWorkoutProtocols] = useState<WorkoutProtocol[]>(initialProtocols);
  const [isSavingWorkoutProtocol, setIsSavingWorkoutProtocol] = useState(false);

  // Update workout protocols when initial values change (for async data loading)
  useEffect(() => {
    if (initialProtocols.length > 0) {
      setWorkoutProtocols(initialProtocols);
    }
  }, [initialProtocols]);

  // Fetch current workout protocols if no initial data provided
  useEffect(() => {
    const fetchWorkoutProtocols = async () => {
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

    // Only fetch if no initial protocols provided and we have a session
    if (initialProtocols.length === 0 && sessionStatus === 'authenticated' && session?.user?.id) {
      fetchWorkoutProtocols();
    }
  }, [initialProtocols.length, session?.user?.id, sessionStatus]);

  const addWorkoutProtocol = (type: string) => {
    if (workoutProtocols.some(p => p.type === type)) {
      toast.error('This workout type is already added');
      return;
    }

    const newProtocol: WorkoutProtocol = {
      type,
      frequency: 1,
    };

    setWorkoutProtocols(prev => [...prev, newProtocol]);
  };

  const removeWorkoutProtocol = async (type: string) => {
    setIsSavingWorkoutProtocol(true);

    try {
      const updatedProtocols = workoutProtocols.filter(p => p.type !== type);
      
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
        throw new Error('Failed to remove workout protocol');
      }

      setWorkoutProtocols(updatedProtocols);
      toast.success('Workout protocol removed');
    } catch (error) {
      console.error('Error removing workout protocol:', error);
      toast.error('Failed to remove workout protocol');
    } finally {
      setIsSavingWorkoutProtocol(false);
    }
  };

  const updateWorkoutProtocolFrequency = async (type: string, newFrequency: number) => {
    setIsSavingWorkoutProtocol(true);

    try {
      const updatedProtocols = workoutProtocols.map(p =>
        p.type === type ? { ...p, frequency: newFrequency } : p
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
        throw new Error('Failed to update workout protocol frequency');
      }

      setWorkoutProtocols(updatedProtocols);
    } catch (error) {
      console.error('Error updating workout protocol frequency:', error);
      toast.error('Failed to update frequency');
    } finally {
      setIsSavingWorkoutProtocol(false);
    }
  };

  const handleSaveWorkoutProtocols = async (newProtocols: WorkoutProtocol[]) => {
    setIsSavingWorkoutProtocol(true);

    try {
      const response = await fetch('/api/health-protocols', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          protocolType: 'exercise',
          protocol: JSON.stringify({ workouts: newProtocols }),
          startDate: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save workout protocols');
      }

      setWorkoutProtocols(newProtocols);
      toast.success('Workout protocols saved successfully');
    } catch (error) {
      console.error('Error saving workout protocols:', error);
      toast.error('Failed to save workout protocols');
    } finally {
      setIsSavingWorkoutProtocol(false);
    }
  };

  return {
    workoutProtocols,
    setWorkoutProtocols,
    isSavingWorkoutProtocol,
    setIsSavingWorkoutProtocol,
    addWorkoutProtocol,
    removeWorkoutProtocol,
    updateWorkoutProtocolFrequency,
    handleSaveWorkoutProtocols,
  };
}
