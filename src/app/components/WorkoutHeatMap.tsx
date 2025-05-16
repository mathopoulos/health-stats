'use client';

import React from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import type { ReactCalendarHeatmapValue } from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { subYears, format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { useWeeklyWorkout } from '../context/WeeklyWorkoutContext';

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

interface WorkoutHeatMapProps {
  workouts: WorkoutData[];
}

interface WorkoutDetails {
  type: string;
  duration: string;
  calories?: string;
}

interface HeatmapValue extends ReactCalendarHeatmapValue<string> {
  totalMinutes: number;
  details: {
    workouts: WorkoutDetails[];
  };
}

export default function WorkoutHeatMap({ workouts }: WorkoutHeatMapProps) {
  const { setWorkoutCount } = useWeeklyWorkout();
  const today = new Date();
  const startDate = subYears(today, 1); // Show last 1 year of data

  // Process workout data for the heatmap
  const workoutsByDate = workouts.reduce<Record<string, HeatmapValue>>((acc, workout) => {
    const date = workout.data.startDate.split('T')[0];
    if (!acc[date]) {
      acc[date] = {
        date,
        totalMinutes: 0,
        details: {
          workouts: []
        }
      };
    }

    // Calculate duration in minutes
    const durationInMinutes = Math.round(workout.data.metrics.duration / 60);
    const hours = Math.floor(durationInMinutes / 60);
    const minutes = durationInMinutes % 60;
    const formattedDuration = hours > 0 
      ? `${hours}h ${minutes}m`
      : `${minutes}m`;

    // Add workout details and accumulate total minutes
    acc[date].totalMinutes += durationInMinutes;
    acc[date].details.workouts.push({
      type: workout.data.activityType.replace(/_/g, ' '),
      duration: formattedDuration,
      calories: workout.data.metrics.energyBurned 
        ? `${Math.round(workout.data.metrics.energyBurned)} cal`
        : undefined
    });

    return acc;
  }, {});

  // Convert to array format required by react-calendar-heatmap
  const values = Object.values(workoutsByDate);

  // Calculate workout days for current week
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 }); // Week starts on Monday
  const currentWeekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const currentWeekDates = eachDayOfInterval({ start: currentWeekStart, end: currentWeekEnd });
  
  const workoutDaysThisWeek = currentWeekDates.filter(date => {
    const dateString = format(date, 'yyyy-MM-dd');
    return workoutsByDate[dateString] !== undefined;
  }).length;

  // Update context with weekly count
  React.useEffect(() => {
    setWorkoutCount(workoutDaysThisWeek);
  }, [workoutDaysThisWeek, setWorkoutCount]);

  // Calculate duration thresholds for color scale
  // Scale: 0-30min, 30-60min, 60-90min, 90+ min
  const getDurationColor = (minutes: number) => {
    if (!minutes) return 'color-empty';
    if (minutes <= 30) return 'color-scale-4'; // Darkest for least workout
    if (minutes <= 60) return 'color-scale-3';
    if (minutes <= 90) return 'color-scale-2';
    return 'color-scale-1'; // Lightest for most workout
  };

  // Format duration for tooltip
  const formatTotalDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Custom tooltip content
  const getTooltipContent = (value: HeatmapValue | null) => {
    if (!value || !value.details.workouts.length) {
      return 'No workouts';
    }

    const date = format(parseISO(value.date), 'MMM d, yyyy');
    const workouts = value.details.workouts;
    const totalDuration = formatTotalDuration(value.totalMinutes);

    return (
      <div className="min-w-[200px] max-w-[300px]">
        <div className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-2">
          <div className="font-medium text-base">{date}</div>
          <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
            {totalDuration} total
          </div>
        </div>
        <div className="space-y-2">
          {workouts.map((workout, idx) => (
            <div key={idx} className="flex flex-col">
              <div className="text-sm font-medium capitalize">{workout.type}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <span>{workout.duration}</span>
                {workout.calories && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <span>{workout.calories}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <style jsx global>{`
        .react-calendar-heatmap {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        }
        .react-calendar-heatmap text {
          font-size: 10px;
          fill: #7D8590;
        }
        .react-calendar-heatmap rect {
          rx: 2;
          width: 10px;
          height: 10px;
        }
        .react-calendar-heatmap .color-empty {
          fill: #ebedf0;
        }
        .react-calendar-heatmap-week {
          gap: 4px;
        }
        .dark .react-calendar-heatmap .color-empty {
          fill: #2D333B;
        }
        .dark .react-calendar-heatmap text {
          fill: #7D8590;
        }
        .react-calendar-heatmap .color-scale-1 { fill: #39D353; }
        .react-calendar-heatmap .color-scale-2 { fill: #26A641; }
        .react-calendar-heatmap .color-scale-3 { fill: #006D32; }
        .react-calendar-heatmap .color-scale-4 { fill: #0E4429; }
        .dark .react-calendar-heatmap .color-scale-1 { fill: #39D353; }
        .dark .react-calendar-heatmap .color-scale-2 { fill: #26A641; }
        .dark .react-calendar-heatmap .color-scale-3 { fill: #006D32; }
        .dark .react-calendar-heatmap .color-scale-4 { fill: #0E4429; }
      `}</style>
      <div className="flex flex-col gap-2">
        <CalendarHeatmap<string>
          startDate={startDate}
          endDate={today}
          values={values}
          classForValue={(value: ReactCalendarHeatmapValue<string> | undefined) => {
            if (!value || !('totalMinutes' in value)) return 'color-empty';
            return getDurationColor((value as HeatmapValue).totalMinutes);
          }}
          titleForValue={(value) => {
            if (!value || !('totalMinutes' in value)) return 'No workouts';
            const val = value as HeatmapValue;
            return `${val.totalMinutes} minutes of exercise`;
          }}
          tooltipDataAttrs={(value) => ({
            'data-tooltip-id': 'workout-tooltip',
            'data-tooltip-content': value && 'totalMinutes' in value ? value.date : ''
          } as any)}
          showWeekdayLabels={true}
          weekdayLabels={['', 'Mon', '', 'Wed', '', 'Fri', '']}
          monthLabels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
          gutterSize={4}
        />
        <div className="flex justify-end mt-1">
          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded bg-[#ebedf0] dark:bg-[#2D333B]" />
              <div className="w-3 h-3 rounded bg-[#0E4429]" title="0-30 min" />
              <div className="w-3 h-3 rounded bg-[#006D32]" title="30-60 min" />
              <div className="w-3 h-3 rounded bg-[#26A641]" title="60-90 min" />
              <div className="w-3 h-3 rounded bg-[#39D353]" title="90+ min" />
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
      <Tooltip
        id="workout-tooltip"
        render={({ content }) => {
          const currentValue = values.find(v => v.date === content);
          return getTooltipContent(currentValue || null);
        }}
        className="!bg-white dark:!bg-gray-800 !text-gray-900 dark:!text-white !shadow-xl !rounded-lg !border !border-gray-200 dark:!border-gray-700 !p-3"
        place="top"
        offset={8}
        delayHide={100}
        float
      />
    </div>
  );
} 