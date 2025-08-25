'use client';

import React from 'react';

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

interface ExperimentCardProps {
  experiment: Experiment;
  onClick: () => void;
  isActive?: boolean;
}

export function ExperimentCard({ experiment, onClick, isActive = true }: ExperimentCardProps) {
  return (
    <div
      key={experiment.id}
      className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600"
      onClick={onClick}
    >
      {/* Mobile-first responsive layout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        {/* Top/Left: Title & Details */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-2 sm:mb-1">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
              {experiment.name}
            </h3>
            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {experiment.frequency} • {experiment.duration}
            </span>
          </div>
          
          {/* Key Markers */}
          <div className="flex flex-wrap gap-1">
            {[...experiment.fitnessMarkers.slice(0, 2), ...experiment.bloodMarkers.slice(0, 2)].map((marker) => (
              <span
                key={marker}
                className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                {marker}
              </span>
            ))}
            {(experiment.fitnessMarkers.length + experiment.bloodMarkers.length) > 4 && (
              <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                +{(experiment.fitnessMarkers.length + experiment.bloodMarkers.length) - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Bottom/Right: Progress or Status */}
        {isActive && experiment.progress !== undefined ? (
          <div className="flex items-center gap-3 justify-between sm:justify-end sm:ml-4">
            <div className="flex items-center gap-3 flex-1 sm:flex-initial">
              <div className="text-left sm:text-right">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {experiment.progress}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Progress
                </div>
              </div>
              <div className="w-20 sm:w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300 bg-purple-500"
                  style={{ width: `${experiment.progress}%` }}
                />
              </div>
            </div>
            
            {/* Click indicator */}
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-indigo-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        ) : (
          <div className="flex items-center justify-start sm:justify-end sm:ml-4">
            <span className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs sm:text-sm font-medium">
              ✓ Completed
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

interface ExperimentListProps {
  experiments: Experiment[];
  onExperimentClick: (experiment: Experiment) => void;
  title: string;
  emptyMessage: string;
}

export function ExperimentList({ experiments, onExperimentClick, title, emptyMessage }: ExperimentListProps) {
  if (experiments.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="text-gray-500 dark:text-gray-400 mb-2">
          <svg className="w-6 h-6 sm:w-8 sm:h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {experiments.map((experiment) => (
        <ExperimentCard
          key={experiment.id}
          experiment={experiment}
          onClick={() => onExperimentClick(experiment)}
          isActive={experiment.status === 'active'}
        />
      ))}
    </div>
  );
}
