'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

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

export interface UseExperimentsReturn {
  // Experiments state
  experiments: Experiment[];
  setExperiments: (experiments: Experiment[]) => void;
  isLoadingExperiments: boolean;
  setIsLoadingExperiments: (loading: boolean) => void;
  editingExperiment: Experiment | null;
  setEditingExperiment: (experiment: Experiment | null) => void;
  
  // Handlers
  fetchExperiments: () => Promise<void>;
  handleSaveExperiment: (experiment: Partial<Experiment>) => Promise<void>;
  removeExperiment: (id: string) => Promise<void>;
  handleEditExperiment: (experiment: Experiment) => void;
  handleUpdateExperiment: (updatedExperiment: Partial<Experiment>) => Promise<void>;
}

export function useExperiments(): UseExperimentsReturn {
  const { data: session } = useSession();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [isLoadingExperiments, setIsLoadingExperiments] = useState(false);
  const [editingExperiment, setEditingExperiment] = useState<Experiment | null>(null);

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
      toast.error('Failed to load experiments');
    } finally {
      setIsLoadingExperiments(false);
    }
  };

  const handleSaveExperiment = async (experiment: Partial<Experiment>) => {
    try {
      const response = await fetch('/api/experiments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...experiment,
          status: 'active'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save experiment');
      }

      const result = await response.json();
      if (result.success && result.data) {
        // Refresh experiments list to get the latest data
        await fetchExperiments();
        toast.success('Experiment created successfully');
      }
    } catch (error) {
      console.error('Error saving experiment:', error);
      toast.error('Failed to create experiment');
    }
  };

  const removeExperiment = async (id: string) => {
    try {
      const response = await fetch(`/api/experiments?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete experiment');
      }

      setExperiments(prev => prev.filter(exp => exp.id !== id));
      toast.success('Experiment deleted successfully');
    } catch (error) {
      console.error('Error deleting experiment:', error);
      toast.error('Failed to delete experiment');
    }
  };

  const handleEditExperiment = (experiment: Experiment) => {
    setEditingExperiment(experiment);
  };

  const handleUpdateExperiment = async (updatedExperiment: Partial<Experiment>) => {
    if (!editingExperiment?.id) return;

    try {
      const response = await fetch(`/api/experiments?id=${editingExperiment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedExperiment),
      });

      if (!response.ok) {
        throw new Error('Failed to update experiment');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setExperiments(prev => 
          prev.map(exp => exp.id === editingExperiment.id ? result.data : exp)
        );
        setEditingExperiment(null);
        toast.success('Experiment updated successfully');
      }
    } catch (error) {
      console.error('Error updating experiment:', error);
      toast.error('Failed to update experiment');
    }
  };

  // Load experiments on mount and when session changes
  useEffect(() => {
    if (session?.user?.id) {
      fetchExperiments();
    }
  }, [session?.user?.id]);

  return {
    experiments,
    setExperiments,
    isLoadingExperiments,
    setIsLoadingExperiments,
    editingExperiment,
    setEditingExperiment,
    fetchExperiments,
    handleSaveExperiment,
    removeExperiment,
    handleEditExperiment,
    handleUpdateExperiment,
  };
}
