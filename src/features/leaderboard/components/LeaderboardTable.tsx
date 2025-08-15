import React from 'react';
import type { LeaderboardTableProps } from '../types';
import { LeaderboardEntry } from './LeaderboardEntry';
import { LoadingState } from './LoadingState';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';

/**
 * Main leaderboard table component that handles all states and renders entries
 */
export function LeaderboardTable({ 
  data, 
  loading, 
  error, 
  metric, 
  onRetry 
}: LeaderboardTableProps) {
  const renderContent = () => {
    // Loading state
    if (loading) {
      return <LoadingState />;
    }

    // Error state
    if (error) {
      return (
        <ErrorState 
          metric={metric}
          error={error}
          onRetry={onRetry}
        />
      );
    }

    // Empty state
    if (!data || data.length === 0) {
      return (
        <EmptyState 
          metric={metric}
          onRefresh={onRetry}
        />
      );
    }

    // Success state - render entries
    return (
      <div className="divide-y divide-slate-700/50">
        {data.map((entry) => {
          const isTopThree = entry.rank <= 3;
          
          return (
            <LeaderboardEntry
              key={entry.userId}
              entry={entry}
              metric={metric}
              isTopThree={isTopThree}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-slate-800 rounded-2xl shadow-sm overflow-hidden border border-slate-700/50">
      {renderContent()}
    </div>
  );
}
