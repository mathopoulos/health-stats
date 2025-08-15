import React from 'react';
import Image from 'next/image';
import type { LeaderboardEntryProps } from '../types';
import { getRankConfig, formatMetricValue, METRIC_CONFIGS } from '../utils';

/**
 * Individual leaderboard entry component
 */
export function LeaderboardEntry({ entry, metric, isTopThree }: LeaderboardEntryProps) {
  const rankConfig = getRankConfig(entry.rank);
  const metricConfig = METRIC_CONFIGS[metric];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative transition-all duration-200 hover:bg-slate-700/30">
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Rank display */}
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-12 h-12">
                <span className={`text-xl font-bold ${rankConfig.color}`}>
                  {rankConfig.text}
                </span>
              </div>
            </div>

            {/* Profile image */}
            <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-700 flex-shrink-0 border-2 border-slate-600">
              {entry.profileImage ? (
                <Image
                  src={entry.profileImage}
                  alt={`${entry.name}'s profile`}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    if (target.parentElement) {
                      target.parentElement.classList.add('profile-image-error');
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>

            {/* User information */}
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-white truncate">
                {entry.name}
              </h3>
              <div className="flex items-center space-x-4 mt-1">
                {/* Data points */}
                <div className="flex items-center text-sm text-gray-400">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>{entry.dataPoints} readings</span>
                </div>
                
                {/* Last update */}
                <div className="flex items-center text-sm text-gray-400">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{formatDate(entry.latestDate)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Metric value */}
          <div className="text-right space-y-1">
            <div className="text-2xl font-bold text-white">
              {formatMetricValue(entry.value, metric)}
            </div>
            <div className="text-sm text-gray-400 font-medium">
              {metricConfig.unit}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
