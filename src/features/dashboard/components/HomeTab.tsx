import React from 'react';
import { BioAgeMetrics } from './BioAgeMetrics';
import { ActivityFeed } from './ActivityFeed';
import { WorkoutHeatMapSection } from './WorkoutHeatMapSection';
import { Skeleton } from '@components/ui/skeleton';
import type { ChartData, ActivityFeedItem } from '@/types/dashboard';

interface HomeTabProps {
  data: ChartData;
  activityFeed: ActivityFeedItem[];
  loading: boolean;
  hasLoadedData: boolean;
  userId?: string;
}

function LoadingSkeleton() {
  return (
    <>
      {/* Metric cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 sm:h-28 w-full" />
        ))}
      </div>

      {/* Activity feed skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>

      {/* Recent activity skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </>
  );
}

export function HomeTab({ 
  data, 
  activityFeed, 
  loading, 
  hasLoadedData, 
  userId 
}: HomeTabProps) {
  return (
    <div className="space-y-6">
      {!hasLoadedData ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* Bio Age Metrics */}
          <BioAgeMetrics data={data} loading={loading} />

          {/* Workout Heat Map */}
          <WorkoutHeatMapSection activityFeed={activityFeed} />

          {/* Recent Activity */}
          <ActivityFeed activities={activityFeed} loading={loading} />
        </>
      )}
    </div>
  );
}
