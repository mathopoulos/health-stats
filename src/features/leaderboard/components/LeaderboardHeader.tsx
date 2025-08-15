import React from 'react';

/**
 * Leaderboard page header with title and decorative elements
 */
export function LeaderboardHeader() {

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
      
      {/* Subtitle */}
      <p className="text-lg text-gray-300 max-w-2xl mx-auto">
        Compete with the{' '}
        <span className="text-purple-400 font-semibold">
          Revly community
        </span>{' '}
        and track your fitness progress
      </p>
    </div>
  );
}
