import React from 'react';
import { formatTooltipDate, formatDuration } from '../utils/workoutFormatting';
import { WORKOUT_HEATMAP_CONFIG } from '../constants/heatmapConfig';

interface WorkoutDetails {
  type: string;
  duration: string;
  calories?: string;
}

interface HeatmapValue {
  date: string;
  totalMinutes: number;
  details: {
    workouts: WorkoutDetails[];
  };
}

interface WorkoutTooltipProps {
  value: HeatmapValue | null;
}

/**
 * Tooltip content component for workout heatmap
 * Shows date and workout details for each day
 * Memoized to prevent unnecessary re-renders
 */
export const WorkoutTooltip = React.memo(function WorkoutTooltip({ value }: WorkoutTooltipProps) {
  if (!value) {
    return <span>No workouts</span>;
  }

  const date = formatTooltipDate(value.date);

  // For days with no workouts, show just the date
  if (value.details.workouts.length === 0) {
    return (
      <div 
        className="min-w-[200px] max-w-[300px]"
        style={{ 
          minWidth: `${WORKOUT_HEATMAP_CONFIG.TOOLTIP.MIN_WIDTH}px`, 
          maxWidth: `${WORKOUT_HEATMAP_CONFIG.TOOLTIP.MAX_WIDTH}px` 
        }}
      >
        <div className="font-medium text-base">{date}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          No workouts
        </div>
      </div>
    );
  }

  // For days with workouts, show full details
  const workouts = value.details.workouts;
  const totalDuration = formatDuration(value.totalMinutes);

  return (
    <div 
      className="min-w-[200px] max-w-[300px]"
      style={{ 
        minWidth: `${WORKOUT_HEATMAP_CONFIG.TOOLTIP.MIN_WIDTH}px`, 
        maxWidth: `${WORKOUT_HEATMAP_CONFIG.TOOLTIP.MAX_WIDTH}px` 
      }}
    >
      {/* Header with date and total duration */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-2">
        <div className="font-medium text-base">{date}</div>
        <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
          {totalDuration} total
        </div>
      </div>
      
      {/* Individual workout details */}
      <div className="space-y-2">
        {workouts.map((workout, idx) => (
          <WorkoutItem key={idx} workout={workout} />
        ))}
      </div>
    </div>
  );
});

/**
 * Individual workout item within the tooltip
 */
interface WorkoutItemProps {
  workout: WorkoutDetails;
}

const WorkoutItem = React.memo(function WorkoutItem({ workout }: WorkoutItemProps) {
  return (
    <div className="flex flex-col">
      <div className="text-sm font-medium capitalize">{workout.type}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {workout.duration}
      </div>
    </div>
  );
});

export default WorkoutTooltip;
