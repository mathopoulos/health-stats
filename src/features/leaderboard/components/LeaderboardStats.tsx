import React from 'react';
import type { LeaderboardEntry, LeaderboardMetric } from '../types';
import { METRIC_CONFIGS, formatMetricValue } from '../utils';

interface LeaderboardStatsProps {
  entries: LeaderboardEntry[];
  metric: LeaderboardMetric;
  loading?: boolean;
}

/**
 * Statistics component showing leaderboard insights
 */
export function LeaderboardStats({ entries, metric, loading }: LeaderboardStatsProps) {
  if (loading || !entries || entries.length === 0) {
    return null;
  }

  const metricConfig = METRIC_CONFIGS[metric];
  
  // Calculate statistics
  const values = entries.map(entry => entry.value);
  const average = values.reduce((sum, val) => sum + val, 0) / values.length;
  const highest = Math.max(...values);
  const lowest = Math.min(...values);
  const totalDataPoints = entries.reduce((sum, entry) => sum + entry.dataPoints, 0);
  
  const stats = [
    {
      label: 'Participants',
      value: entries.length.toString(),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      label: `Highest ${metricConfig.label}`,
      value: formatMetricValue(highest, metric),
      unit: metricConfig.unit,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      label: `Average ${metricConfig.label}`,
      value: formatMetricValue(average, metric),
      unit: metricConfig.unit,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      label: 'Total Readings',
      value: totalDataPoints.toLocaleString(),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-lg">{metricConfig.icon}</span>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {metricConfig.label} Leaderboard Stats
        </h3>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div 
            key={index}
            className="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <div className="flex items-center justify-center mb-2 text-indigo-600 dark:text-indigo-400">
              {stat.icon}
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stat.value}
              {stat.unit && (
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 ml-1">
                  {stat.unit}
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
