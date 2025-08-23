import React, { useEffect } from 'react';
import { WeeklyWorkoutProvider, useWeeklyWorkout } from '@providers/WeeklyWorkoutProvider';
import WorkoutHeatMap from './WorkoutHeatMap';
import type { ActivityFeedItem } from '@/types/dashboard';

// Helper component to show workout count using the actual hook
function WeeklyWorkoutCount() {
  const { workoutCount } = useWeeklyWorkout();
  return (
    <>
      {/* Show shorter text on small screens */}
      <span className="sm:hidden">{workoutCount} this week</span>
      {/* Show full text on larger screens */}
      <span className="hidden sm:inline">{workoutCount} workouts this week</span>
    </>
  );
}

// Internal component that calculates and sets the workout count
function WorkoutHeatMapContent({ activityFeed }: { activityFeed: ActivityFeedItem[] }) {
  const { setWorkoutCount } = useWeeklyWorkout();

  // Transform activity feed workouts to the format expected by WorkoutHeatMap
  const transformedWorkouts = activityFeed
    .filter(item => item.type === 'workout')
    .map(item => ({
      data: {
        startDate: item.startTime,
        activityType: item.activityType || 'other',
        metrics: {
          duration: parseInt(item.metrics.Duration?.replace(/[^0-9]/g, '') || '0') * 60,
          energyBurned: parseInt(item.metrics['Calories']?.replace(/[^0-9]/g, '') || '0')
        }
      }
    }));

  // Calculate workouts in the current week
  useEffect(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of current week (Saturday)
    endOfWeek.setHours(23, 59, 59, 999);

    const weeklyWorkouts = activityFeed.filter(item => {
      if (item.type !== 'workout') return false;
      const workoutDate = new Date(item.startTime);
      return workoutDate >= startOfWeek && workoutDate <= endOfWeek;
    });

    setWorkoutCount(weeklyWorkouts.length);
  }, [activityFeed, setWorkoutCount]);

  return (
    <>
      {/* Header: Title and Workout Count Pill - always in a row */}
      <div className="flex flex-row items-center justify-between mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white whitespace-nowrap">
          Workout Activity
        </h2>
        <div className="flex-shrink-0">
          <div className="flex items-center px-3 py-1.5 bg-emerald-50/50 dark:bg-emerald-900/30 rounded-full">
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              <WeeklyWorkoutCount />
            </span>
          </div>
        </div>
      </div>
      
      {/* Heat map container */}
      <div className="-mx-4 sm:-mx-6">
        <div className="px-4 sm:px-6">
          <WorkoutHeatMap workouts={transformedWorkouts} />
        </div>
      </div>
    </>
  );
}

interface WorkoutHeatMapSectionProps {
  activityFeed: ActivityFeedItem[]; // Activity feed data that includes workouts
}

export function WorkoutHeatMapSection({ activityFeed }: WorkoutHeatMapSectionProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 sm:px-6 py-6 sm:py-8 shadow-sm mb-8">
      <WeeklyWorkoutProvider>
        <WorkoutHeatMapContent activityFeed={activityFeed} />
      </WeeklyWorkoutProvider>
    </div>
  );
}
