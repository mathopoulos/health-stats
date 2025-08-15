import React from 'react';
import { Skeleton } from '@components/ui/skeleton';
import { LOADING_SKELETON_ROWS } from '../utils';

/**
 * Loading state component for leaderboard with skeleton placeholders
 */
export function LoadingState() {
  return (
    <div data-testid="loading-state" className="divide-y divide-slate-700/50">
      {Array.from({ length: LOADING_SKELETON_ROWS }, (_, index) => (
        <div key={index} className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-5">
              {/* Rank skeleton */}
              <div className="flex-shrink-0">
                <Skeleton className="w-16 h-12 rounded-lg" />
              </div>

              {/* Profile image skeleton */}
              <Skeleton className="w-14 h-14 rounded-full" />

              {/* User info skeleton */}
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-6 w-32" />
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>

            {/* Score skeleton */}
            <div className="text-right space-y-1">
              <Skeleton className="h-8 w-16 ml-auto" />
              <Skeleton className="h-4 w-12 ml-auto" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
