import React from 'react';
import { Experiment } from '../../types/experiment';

interface ModalHeaderProps {
  experiment: Experiment;
  onClose: () => void;
}

export default function ModalHeader({ experiment, onClose }: ModalHeaderProps) {
  return (
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
        onClick={onClose}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        data-testid="close-modal-button"
      >
        <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
