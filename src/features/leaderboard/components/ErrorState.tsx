import React from 'react';
import type { LeaderboardMetric } from '../types';
import { METRIC_CONFIGS } from '../utils';

interface ErrorStateProps {
  metric: LeaderboardMetric;
  error: string;
  onRetry?: () => void;
  onClearError?: () => void;
}

/**
 * Error state component for leaderboard loading failures
 */
export function ErrorState({ metric, error, onRetry, onClearError }: ErrorStateProps) {
  const metricConfig = METRIC_CONFIGS[metric];

  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6 text-red-400">
          ⚠️
        </div>
        
        <h3 className="text-xl font-semibold text-white mb-2">
          Failed to Load {metricConfig.label} Leaderboard
        </h3>
        
        <p className="text-gray-300 mb-2">
          {error}
        </p>

        <p className="text-sm text-gray-400 mb-6">
          Please try again or check your internet connection.
        </p>

        <div className="flex items-center justify-center space-x-3">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Try Again</span>
            </button>
          )}

          {onClearError && (
            <button
              type="button"
              onClick={onClearError}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Dismiss</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
