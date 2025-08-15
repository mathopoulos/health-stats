import React from 'react';
import type { LeaderboardHeaderProps } from '../types';

/**
 * Leaderboard page header with title, stats, and decorative elements
 */
export function LeaderboardHeader({ totalUsers, lastUpdated, loading }: LeaderboardHeaderProps) {
  const formatLastUpdated = (dateString?: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  return (
    <div className="text-center space-y-4">
      {/* Live rankings badge */}
      <div className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800/80 rounded-full border border-slate-700/50 backdrop-blur-sm">
        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
        <span className="text-sm font-medium text-purple-400">
          LIVE RANKINGS
        </span>
      </div>
      
      {/* Main title */}
      <h1 className="text-4xl md:text-5xl font-bold text-white">
        Leaderboards
      </h1>
      
      {/* Decorative line */}
      <div className="flex items-center justify-center">
        <div className="w-8 h-px bg-gradient-to-r from-purple-500 to-blue-500"></div>
      </div>
      
      {/* Subtitle with stats */}
      <div className="space-y-2">
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          Compete with the{' '}
          <span className="text-purple-400 font-semibold">
            Revly community
          </span>{' '}
          and track your fitness progress
        </p>
        
        {/* User count and last updated */}
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
          {loading ? (
            <span className="animate-pulse">Loading...</span>
          ) : (
            <>
              {totalUsers > 0 && (
                <span>{totalUsers.toLocaleString()} competitors</span>
              )}
              {lastUpdated && (
                <>
                  {totalUsers > 0 && <span>•</span>}
                  <span>Updated {formatLastUpdated(lastUpdated)}</span>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
