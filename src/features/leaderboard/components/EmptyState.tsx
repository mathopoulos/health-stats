import React from 'react';
import type { LeaderboardMetric } from '../types';
import { METRIC_CONFIGS } from '../utils';

interface EmptyStateProps {
  metric: LeaderboardMetric;
  onRefresh?: () => void;
}

/**
 * Empty state component when no leaderboard data is available
 */
export function EmptyState({ metric, onRefresh }: EmptyStateProps) {
  const metricConfig = METRIC_CONFIGS[metric];

  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6 opacity-50">
          📊
        </div>
        
        <h3 className="text-xl font-semibold text-white mb-2">
          No {metricConfig.label} Data Available
        </h3>
        
        <p className="text-gray-400 mb-6 leading-relaxed">
          There's no {metricConfig.label.toLowerCase()} data to display yet. 
          Users need to sync their health data to appear on the leaderboard.
        </p>

        <div className="space-y-3">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-700 rounded-lg text-sm text-gray-300">
            <span className="text-lg">{metricConfig.icon}</span>
            <span>{metricConfig.description}</span>
          </div>

          {onRefresh && (
            <div>
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Check for Updates</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
