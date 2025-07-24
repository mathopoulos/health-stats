'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BiomarkerDataPoint {
  date: string;
  value: number;
  unit: string;
}

interface BiomarkerTrend {
  marker: string;
  data: BiomarkerDataPoint[];
  baseline: number;
  target?: number;
  improvement?: 'increase' | 'decrease'; // What direction is considered improvement
}

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
  progress?: number; // calculated field
  biomarkerTrends?: BiomarkerTrend[];
  createdAt: string;
  updatedAt: string;
}

// Helper function to calculate progress percentage
function calculateProgress(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  
  if (now >= end) return 100;
  if (now <= start) return 0;
  
  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  
  return Math.round((elapsed / total) * 100);
}

interface ActiveExperimentsProps {
  userId?: string;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'active':
      return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    case 'paused':
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
    case 'completed':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  }
}

function getProgressColor(progress: number) {
  if (progress >= 75) return 'bg-green-500';
  if (progress >= 50) return 'bg-blue-500';
  if (progress >= 25) return 'bg-yellow-500';
  return 'bg-orange-500';
}

export default function ActiveExperiments({ userId }: ActiveExperimentsProps) {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);

  // Filter experiments by status
  const activeExperiments = experiments.filter(exp => exp.status === 'active');
  const pastExperiments = experiments.filter(exp => exp.status === 'completed');

  // Fetch experiments from API
  useEffect(() => {
    const fetchExperiments = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch('/api/experiments', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch experiments');
        }

        const data = await response.json();
        if (data.success && data.data) {
          // Process experiments and calculate progress
          const experimentsWithProgress = data.data.map((exp: any) => ({
            ...exp,
            progress: calculateProgress(exp.startDate, exp.endDate)
          }));
          setExperiments(experimentsWithProgress);
        }
      } catch (err) {
        console.error('Error fetching experiments:', err);
        setError(err instanceof Error ? err.message : 'Failed to load experiments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExperiments();
  }, [userId]);

  const ExperimentDetailsModal = ({ experiment }: { experiment: Experiment }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              {experiment.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {experiment.description}
            </p>
          </div>
          <button
            onClick={() => setSelectedExperiment(null)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress and Overview */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Progress</span>
              <div className="mt-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {experiment.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-purple-500"
                    style={{ width: `${experiment.progress}%` }}
                  />
                </div>
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Frequency</span>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                {experiment.frequency}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration</span>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                {experiment.duration}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Timeline</span>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                {new Date(experiment.startDate).toLocaleDateString()} - {new Date(experiment.endDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Biomarker Trends - Coming Soon */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Biomarker Tracking Coming Soon
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Detailed biomarker progress charts and analysis will be available in future updates.
            </p>
          </div>
        </div>


      </div>
    </div>
  );

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
      <div className="bg-white dark:bg-gray-800 rounded-2xl px-6 py-8 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Active Experiments
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {activeExperiments.length} active
          </span>
        </div>

        {/* Experiments List or Empty State */}
        {activeExperiments.length > 0 ? (
          <div className="space-y-3">
        {activeExperiments.map((experiment) => (
          <div
            key={experiment.id}
            className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600"
            onClick={() => setSelectedExperiment(experiment)}
          >
            {/* Single Row Layout */}
            <div className="flex items-center justify-between">
              {/* Left: Title & Timeline */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {experiment.name}
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {experiment.frequency} • {experiment.duration}
                  </span>
                </div>
                
                {/* Key Markers */}
                <div className="flex flex-wrap gap-1">
                  {[...experiment.fitnessMarkers.slice(0, 2), ...experiment.bloodMarkers.slice(0, 2)].map((marker) => (
                    <span
                      key={marker}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      {marker}
                    </span>
                  ))}
                  {(experiment.fitnessMarkers.length + experiment.bloodMarkers.length) > 4 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                      +{(experiment.fitnessMarkers.length + experiment.bloodMarkers.length) - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Progress */}
              <div className="flex items-center gap-3 ml-4">
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {experiment.progress}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Progress
                  </div>
                </div>
                <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300 bg-purple-500"
                    style={{ width: `${experiment.progress}%` }}
                  />
                </div>
                
                {/* Click indicator */}
                <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400 mb-2">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              No active experiments
            </p>
          </div>
        )}
      </div>

      {/* Past Experiments Section */}
      {pastExperiments.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl px-6 py-8 shadow-sm">
          {/* Past Experiments Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Past Experiments
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {pastExperiments.length} completed
            </span>
          </div>

          {/* Past Experiments List */}
          <div className="space-y-3">
            {pastExperiments.map((experiment) => (
              <div
                key={experiment.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
              >
                {/* Single Row Layout */}
                <div className="flex items-center justify-between">
                  {/* Left: Title & Timeline */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {experiment.name}
                      </h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {experiment.frequency} • {experiment.duration}
                      </span>
                    </div>
                    
                    {/* Key Markers */}
                    <div className="flex flex-wrap gap-1">
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

                  {/* Right: Completed Badge */}
                  <div className="flex items-center gap-3 ml-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium">
                      ✓ Completed
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Render modal when experiment is selected */}
      {selectedExperiment && (
        <ExperimentDetailsModal experiment={selectedExperiment} />
      )}
    </div>
  );
} 