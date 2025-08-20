import React, { useState, useEffect } from 'react';
import { ProcessingJob } from '../types';

interface ProcessingStatusProps {
  job?: ProcessingJob | null;
  isProcessing: boolean;
  processingProgress: string;
  onCancel?: () => void;
  onRetry?: () => void;
  showProgressBar?: boolean;
  className?: string;
}

export default function ProcessingStatus({
  job,
  isProcessing,
  processingProgress,
  onCancel,
  onRetry,
  showProgressBar = true,
  className = ''
}: ProcessingStatusProps) {
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Calculate elapsed time
  useEffect(() => {
    if (!isProcessing) {
      setElapsedTime(0);
      return;
    }

    const startTime = job?.startedAt ? new Date(job.startedAt).getTime() : Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [isProcessing, job?.startedAt]);

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status color and icon
  const getStatusConfig = () => {
    if (job?.status === 'completed') {
      return {
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/20',
        icon: '✅'
      };
    }

    if (job?.status === 'failed') {
      return {
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900/20',
        icon: '❌'
      };
    }

    if (isProcessing) {
      return {
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        icon: '⚙️'
      };
    }

    return {
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-900/20',
      icon: '⏸️'
    };
  };

  const statusConfig = getStatusConfig();

  if (!isProcessing && !job) {
    return null; // Nothing to show
  }

  return (
    <div className={`rounded-lg border p-4 ${statusConfig.bgColor} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{statusConfig.icon}</span>
          <div>
            <h3 className={`text-sm font-medium ${statusConfig.color}`}>
              {isProcessing ? 'Processing Data' : job?.status === 'completed' ? 'Processing Complete' : 'Processing Failed'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {processingProgress || getStatusText(job, isProcessing)}
            </p>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center space-x-2">
          {isProcessing && (
            <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}

          {job?.status === 'completed' && (
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}

          {job?.status === 'failed' && (
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {showProgressBar && isProcessing && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      )}

      {/* Time information */}
      <div className="mt-3 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
        <span>
          Elapsed: {formatTime(elapsedTime)}
        </span>

        {job?.startedAt && (
          <span>
            Started: {new Date(job.startedAt).toLocaleTimeString()}
          </span>
        )}

        {job?.completedAt && (
          <span>
            Completed: {new Date(job.completedAt).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex space-x-2">
        {isProcessing && onCancel && (
          <button
            onClick={onCancel}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Cancel
          </button>
        )}

        {job?.status === 'failed' && onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a1 1 0 011 1v4.101a4.979 4.979 0 013.732-2.018 1 1 0 110 2 2.978 2.978 0 00-1.732.732V11a1 1 0 11-2 0V5a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

// Helper function to get status text
function getStatusText(job: ProcessingJob | null | undefined, isProcessing: boolean): string {
  if (job?.status === 'completed') {
    return 'All data has been successfully processed and saved.';
  }

  if (job?.status === 'failed') {
    return job.error || 'Processing failed. Please try again.';
  }

  if (isProcessing) {
    return 'Your data is being processed. This may take a few minutes...';
  }

  return 'Ready to process data';
}
