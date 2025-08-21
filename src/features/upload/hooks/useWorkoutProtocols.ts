'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

export interface WorkoutProtocol {
  type: string;
  frequency: number;
}

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
  const [workoutProtocols, setWorkoutProtocols] = useState<WorkoutProtocol[]>(initialProtocols);
  const [isSavingWorkoutProtocol, setIsSavingWorkoutProtocol] = useState(false);

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
      const response = await fetch('/api/workout-protocols', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove workout protocol');
      }

      setWorkoutProtocols(prev => prev.filter(p => p.type !== type));
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
      const response = await fetch('/api/workout-protocols', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          frequency: newFrequency,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update workout protocol frequency');
      }

      setWorkoutProtocols(prev =>
        prev.map(p =>
          p.type === type ? { ...p, frequency: newFrequency } : p
        )
      );
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
      const response = await fetch('/api/workout-protocols', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ protocols: newProtocols }),
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
