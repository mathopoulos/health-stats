import React from 'react';
import { UploadError } from '../types';

interface UploadErrorDisplayProps {
  error: UploadError | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  canRetry?: boolean;
  isRetrying?: boolean;
  className?: string;
}

export default function UploadErrorDisplay({
  error,
  onRetry,
  onDismiss,
  canRetry = false,
  isRetrying = false,
  className = ''
}: UploadErrorDisplayProps) {
  if (!error) return null;

  // Error type icons
  const getErrorIcon = (code: string) => {
    switch (code) {
      case 'VALIDATION_FAILED':
        return '⚠️';
      case 'UPLOAD_FAILED':
        return '📤';
      case 'NETWORK_ERROR':
        return '🌐';
      case 'PROCESSING_FAILED':
        return '⚙️';
      case 'FILE_TOO_LARGE':
        return '📦';
      case 'INVALID_FILE_TYPE':
        return '📄';
      default:
        return '❌';
    }
  };

  // Error severity colors
  const getErrorSeverity = (code: string) => {
    switch (code) {
      case 'VALIDATION_FAILED':
        return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'UPLOAD_FAILED':
      case 'NETWORK_ERROR':
        return 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800';
      default:
        return 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800';
    }
  };

  const getErrorTitle = (code: string): string => {
    switch (code) {
      case 'VALIDATION_FAILED':
        return 'Invalid File';
      case 'UPLOAD_FAILED':
        return 'Upload Failed';
      case 'NETWORK_ERROR':
        return 'Network Error';
      case 'PROCESSING_FAILED':
        return 'Processing Failed';
      case 'FILE_TOO_LARGE':
        return 'File Too Large';
      case 'INVALID_FILE_TYPE':
        return 'Invalid File Type';
      default:
        return 'Upload Error';
    }
  };

  return (
    <div className={`rounded-lg border p-4 ${getErrorSeverity(error.code)} ${className}`}>
      <div className="flex items-start space-x-3">
        {/* Error icon */}
        <div className="flex-shrink-0 text-2xl">
          {getErrorIcon(error.code)}
        </div>

        {/* Error content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {getErrorTitle(error.code)}
            </h3>

            {/* Dismiss button */}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="ml-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Dismiss error"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>

          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            {error.message}
          </p>

          {/* Error details (for debugging) */}
          {error.details && (
            <details className="mt-2">
              <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                Technical Details
              </summary>
              <pre className="mt-1 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-2 rounded border overflow-auto">
                {JSON.stringify(error.details, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex space-x-3">
        {canRetry && onRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            {isRetrying ? (
              <>
                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Retrying...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a1 1 0 011 1v4.101a4.979 4.979 0 013.732-2.018 1 1 0 110 2 2.978 2.978 0 00-1.732.732V11a1 1 0 11-2 0V5a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Try Again
              </>
            )}
          </button>
        )}

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
