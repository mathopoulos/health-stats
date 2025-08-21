'use client';

import { useState, useEffect } from 'react';
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
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [isLoadingExperiments, setIsLoadingExperiments] = useState(false);
  const [editingExperiment, setEditingExperiment] = useState<Experiment | null>(null);

  const fetchExperiments = async () => {
    setIsLoadingExperiments(true);
    try {
      const response = await fetch('/api/experiments');
      if (response.ok) {
        const data = await response.json();
        setExperiments(data);
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
        body: JSON.stringify(experiment),
      });

      if (!response.ok) {
        throw new Error('Failed to save experiment');
      }

      const savedExperiment = await response.json();
      setExperiments(prev => [...prev, savedExperiment]);
      toast.success('Experiment created successfully');
    } catch (error) {
      console.error('Error saving experiment:', error);
      toast.error('Failed to create experiment');
    }
  };

  const removeExperiment = async (id: string) => {
    try {
      const response = await fetch(`/api/experiments/${id}`, {
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
      const response = await fetch(`/api/experiments/${editingExperiment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedExperiment),
      });

      if (!response.ok) {
        throw new Error('Failed to update experiment');
      }

      const updated = await response.json();
      setExperiments(prev => 
        prev.map(exp => exp.id === editingExperiment.id ? updated : exp)
      );
      setEditingExperiment(null);
      toast.success('Experiment updated successfully');
    } catch (error) {
      console.error('Error updating experiment:', error);
      toast.error('Failed to update experiment');
    }
  };

  // Load experiments on mount
  useEffect(() => {
    fetchExperiments();
  }, []);

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
