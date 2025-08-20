import React from 'react';
import { UploadProgress, UploadFile } from '../types';

interface UploadProgressIndicatorProps {
  progress: UploadProgress;
  file?: UploadFile;
  showPercentage?: boolean;
  showFileName?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function UploadProgressIndicator({
  progress,
  file,
  showPercentage = true,
  showFileName = true,
  size = 'md',
  className = ''
}: UploadProgressIndicatorProps) {
  const { loaded, total, percentage } = progress;

  // Size configurations
  const sizeConfig = {
    sm: {
      barHeight: 'h-2',
      textSize: 'text-sm',
      spacing: 'space-y-1'
    },
    md: {
      barHeight: 'h-3',
      textSize: 'text-base',
      spacing: 'space-y-2'
    },
    lg: {
      barHeight: 'h-4',
      textSize: 'text-lg',
      spacing: 'space-y-3'
    }
  };

  const config = sizeConfig[size];

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Get status color
  const getStatusColor = () => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage > 50) return 'bg-blue-500';
    if (percentage > 25) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  return (
    <div className={`${config.spacing} ${className}`}>
      {/* File info */}
      {showFileName && file && (
        <div className="flex justify-between items-center">
          <span className={`font-medium text-gray-900 dark:text-white truncate ${config.textSize}`}>
            {file.name}
          </span>
          <span className={`text-gray-500 dark:text-gray-400 ${config.textSize}`}>
            {formatFileSize(loaded)} / {formatFileSize(total)}
          </span>
        </div>
      )}

      {/* Progress bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`${config.barHeight} ${getStatusColor()} transition-all duration-300 ease-out rounded-full`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {/* Percentage and status */}
      <div className="flex justify-between items-center">
        {showPercentage && (
          <span className={`text-gray-600 dark:text-gray-400 ${config.textSize}`}>
            {percentage}%
          </span>
        )}

        {/* Status indicator */}
        <div className="flex items-center space-x-1">
          {percentage === 100 ? (
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : percentage > 0 ? (
            <svg className="w-4 h-4 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 5a1 1 0 112 0v4a1 1 0 01-1 1H9a1 1 0 110-2h1V5z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
