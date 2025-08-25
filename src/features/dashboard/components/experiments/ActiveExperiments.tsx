'use client';

import React, { useState, useEffect } from 'react';
import { useExperiments, useExperimentFitnessData, useExperimentBloodMarkerData } from '../../hooks/useExperimentData';
import ExperimentDetailsModal from './ExperimentDetailsModal';
import { ExperimentList } from './ExperimentCard';

interface Experiment {
  id: string;
  name: string;
  description: string;
  frequency: string;
  duration: string;
  fitnessMarkers: string[];
  bloodMarkers: string[];
  startDate: string;
  endDate: string;
  status: 'active' | 'paused' | 'completed';
  progress?: number;
  createdAt: string;
  updatedAt: string;
}

interface ActiveExperimentsProps {
  userId?: string;
}

export default function ActiveExperiments({ userId }: ActiveExperimentsProps) {
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  
  // Use custom hooks for data fetching
  const { activeExperiments, pastExperiments, isLoading, error } = useExperiments(userId);
  const { experimentFitnessData, isLoadingFitnessData, fetchExperimentFitnessData } = useExperimentFitnessData(userId);
  const { experimentBloodMarkerData, isLoadingBloodMarkerData, fetchExperimentBloodMarkerData } = useExperimentBloodMarkerData(userId);

  // Handle experiment selection and data fetching
  const handleExperimentClick = (experiment: Experiment) => {
    setSelectedExperiment(experiment);
    if (experiment.fitnessMarkers?.length > 0) {
      fetchExperimentFitnessData(experiment);
    }
    if (experiment.bloodMarkers?.length > 0) {
      fetchExperimentBloodMarkerData(experiment);
    }
  };

  const handleModalClose = () => {
    setSelectedExperiment(null);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl px-6 py-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Active Experiments
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Currently running health and fitness experiments
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading experiments...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl px-6 py-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Active Experiments
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Currently running health and fitness experiments
              </p>
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Active Experiments Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl px-3 sm:px-6 py-6 sm:py-8 shadow-sm">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Active Experiments
          </h2>
          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {activeExperiments.length} active
          </span>
        </div>

        <ExperimentList
          experiments={activeExperiments}
          onExperimentClick={handleExperimentClick}
          title="Active Experiments"
          emptyMessage="No active experiments"
        />
      </div>

      {/* Past Experiments Section */}
      {pastExperiments.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl px-3 sm:px-6 py-6 sm:py-8 shadow-sm">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              Past Experiments
            </h2>
            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {pastExperiments.length} completed
            </span>
          </div>

          <ExperimentList
            experiments={pastExperiments}
            onExperimentClick={handleExperimentClick}
            title="Past Experiments"
            emptyMessage="No completed experiments"
          />
        </div>
      )}

      {/* Render modal when experiment is selected */}
      <ExperimentDetailsModal
        experiment={selectedExperiment}
        experimentFitnessData={experimentFitnessData}
        experimentBloodMarkerData={experimentBloodMarkerData}
        isLoadingFitnessData={isLoadingFitnessData}
        isLoadingBloodMarkerData={isLoadingBloodMarkerData}
        onClose={handleModalClose}
      />
    </div>
  );
} 