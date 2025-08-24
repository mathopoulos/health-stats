import { useMemo, useEffect } from 'react';
import { useWeeklyWorkout } from '@providers/WeeklyWorkoutProvider';
import { 
  createHeatmapDateRange, 
  generateDateRange, 
  countWorkoutDaysThisWeek 
} from '../utils/dateRangeUtils';
import { 
  extractDateFromDateTime,
  formatWorkoutDuration,
  formatActivityType,
  calculateWorkoutMinutes 
} from '../utils/workoutFormatting';

interface WorkoutData {
  data: {
    startDate: string;
    activityType: string;
    metrics: {
      duration: number;
      energyBurned?: number;
    };
  };
}

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

interface UseWorkoutHeatmapDataProps {
  workouts: WorkoutData[];
}

interface UseWorkoutHeatmapDataReturn {
  values: HeatmapValue[];
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

/**
 * Custom hook to process workout data for the heatmap visualization
 * Handles data transformation, date range creation, and weekly count updates
 */
export function useWorkoutHeatmapData({ workouts }: UseWorkoutHeatmapDataProps): UseWorkoutHeatmapDataReturn {
  const { setWorkoutCount } = useWeeklyWorkout();
  
  // Get current date string for memoization (only changes when date changes, not time)
  const currentDateString = new Date().toDateString();
  
  // Memoize today to only change when the date actually changes (not on every render)
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, [currentDateString]);
  
  // Create date range for the heatmap
  const dateRange = useMemo(() => createHeatmapDateRange(today), [today]);

  // Process workout data and create heatmap values
  const { values, workoutsByDate } = useMemo(() => {
    // Group workouts by date
    const workoutsByDate = workouts.reduce<Record<string, HeatmapValue>>((acc, workout) => {
      const date = extractDateFromDateTime(workout.data.startDate);
      
      if (!acc[date]) {
        acc[date] = {
          date,
          totalMinutes: 0,
          details: {
            workouts: []
          }
        };
      }

      // Calculate and add workout details
      const durationInMinutes = calculateWorkoutMinutes(workout.data.metrics.duration);
      const formattedDuration = formatWorkoutDuration(workout.data.metrics.duration);
      const formattedType = formatActivityType(workout.data.activityType);

      acc[date].totalMinutes += durationInMinutes;
      acc[date].details.workouts.push({
        type: formattedType,
        duration: formattedDuration,
        calories: workout.data.metrics.energyBurned 
          ? `${Math.round(workout.data.metrics.energyBurned)} cal`
          : undefined
      });

      return acc;
    }, {});

    // Create entries for all days in the date range (including empty days)
    const allDateStrings = generateDateRange(dateRange.startDate, dateRange.endDate);
    const values: HeatmapValue[] = allDateStrings.map(dateString => {
      return workoutsByDate[dateString] || {
        date: dateString,
        totalMinutes: 0,
        details: {
          workouts: []
        }
      };
    });

    return { values, workoutsByDate };
  }, [workouts, dateRange]);

  // Update weekly workout count
  useEffect(() => {
    const workoutDaysThisWeek = countWorkoutDaysThisWeek(workoutsByDate, today);
    setWorkoutCount(workoutDaysThisWeek);
  }, [workoutsByDate, setWorkoutCount, today]);

  return {
    values,
    dateRange
  };
}
