import React from 'react';
import type { LeaderboardTabsProps, LeaderboardMetric } from '../types';
import { METRIC_CONFIGS } from '../utils';

/**
 * Tab navigation component for switching between leaderboard metrics
 */
export function LeaderboardTabs({ 
  activeTab, 
  onTabChange, 
  loading = { hrv: false, vo2max: false } 
}: LeaderboardTabsProps) {
  const tabs: Array<{ key: LeaderboardMetric; label: string; icon: JSX.Element }> = [
    {
      key: 'hrv',
      label: METRIC_CONFIGS.hrv.label,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
    {
      key: 'vo2max',
      label: METRIC_CONFIGS.vo2max.label,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700/50">
      <nav className="flex" aria-label="Leaderboard tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const isLoading = loading[tab.key];
          
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              disabled={isLoading}
              className={`
                flex-1 py-4 px-6 text-base font-medium transition-all duration-200 relative
                ${isActive
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                }
                ${isLoading ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
                ${tab.key === 'hrv' ? 'rounded-l-2xl' : 'rounded-r-2xl'}
              `}
            >
              <div className="flex items-center justify-center space-x-2">
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  tab.icon
                )}
                <span>{tab.label}</span>
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
