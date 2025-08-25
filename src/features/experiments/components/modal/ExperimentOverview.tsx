import React from 'react';
import { Experiment } from '../../types/experiment';

interface ExperimentOverviewProps {
  experiment: Experiment;
}

export default function ExperimentOverview({ experiment }: ExperimentOverviewProps) {
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'Active', color: 'bg-green-500', textColor: 'text-green-600' };
      case 'paused':
        return { label: 'Paused', color: 'bg-yellow-500', textColor: 'text-yellow-600' };
      case 'completed':
        return { label: 'Completed', color: 'bg-blue-500', textColor: 'text-blue-600' };
      default:
        return { label: 'Unknown', color: 'bg-gray-500', textColor: 'text-gray-600' };
    }
  };

  const statusDisplay = getStatusDisplay(experiment.status);

  return (
    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</span>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 ${statusDisplay.color} rounded-full`}></div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {statusDisplay.label}
            </span>
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
  );
}
