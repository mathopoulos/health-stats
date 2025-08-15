'use client';

import React from 'react';

import { Toaster } from 'react-hot-toast';
import ThemeToggle from '@components/ThemeToggle';

// Import our feature components and hooks
import {
  LeaderboardHeader,
  LeaderboardTabs,
  LeaderboardTable,
} from './index';
import { useLeaderboardData, useLeaderboardFilters } from '../hooks';

/**
 * Main leaderboard page component using the new architecture
 * Much cleaner and more maintainable than the original 300-line monolithic component
 */
export function LeaderboardPage() {
  // Use our custom hooks for data management and filters
  const { state, refreshData, clearError } = useLeaderboardData();
  const { filters, setMetric } = useLeaderboardFilters();

  // Get current data based on active metric
  const currentData = state[filters.metric];
  const currentLoading = state.loading[filters.metric];
  const currentError = state.error[filters.metric];

  // Handlers
  const handleTabChange = (metric: typeof filters.metric) => {
    setMetric(metric);
  };

  const handleRetry = () => {
    if (currentError) {
      clearError(filters.metric);
    }
    refreshData(filters.metric);
  };



  return (
    <>
      <Toaster position="bottom-left" />
      
      <main className="min-h-screen px-4 sm:px-8 py-8 bg-slate-900">
        {/* Theme Toggle */}
        <div className="fixed bottom-4 right-4 z-[100]">
          <ThemeToggle />
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Page Header */}
          <LeaderboardHeader />

          {/* Tab Navigation */}
          <LeaderboardTabs
            activeTab={filters.metric}
            onTabChange={handleTabChange}
            loading={state.loading}
          />

          {/* Main Leaderboard Table */}
          <LeaderboardTable
            data={currentData?.entries || []}
            loading={currentLoading}
            error={currentError}
            metric={filters.metric}
            onRetry={handleRetry}
          />

        </div>
      </main>
    </>
  );
}
