'use client';

import React from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import type { ReactCalendarHeatmapValue } from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import ReactTooltip from 'react-tooltip';
import { subYears, format, parseISO } from 'date-fns';

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
  count: number;
  details: {
    workouts: WorkoutDetails[];
  };
}

export default function WorkoutHeatMap({ workouts }: WorkoutHeatMapProps) {
  const today = new Date();
  const startDate = subYears(today, 1); // Show last 1 year of data

  // Process workout data for the heatmap
  const workoutsByDate = workouts.reduce<Record<string, HeatmapValue>>((acc, workout) => {
    const date = workout.data.startDate.split('T')[0];
    if (!acc[date]) {
      acc[date] = {
        date,
        count: 0,
        details: {
          workouts: []
        }
      };
    }

    // Format duration
    const durationInMinutes = Math.round(workout.data.metrics.duration / 60);
    const hours = Math.floor(durationInMinutes / 60);
    const minutes = durationInMinutes % 60;
    const formattedDuration = hours > 0 
      ? `${hours}h ${minutes}m`
      : `${minutes}m`;

    // Add workout details
    acc[date].count += 1;
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

  // Custom tooltip content
  const getTooltipContent = (value: HeatmapValue | null) => {
    if (!value || !value.details.workouts.length) {
      return 'No workouts';
    }

    const date = format(parseISO(value.date), 'MMM d, yyyy');
    const workouts = value.details.workouts;

    return (
      <div className="p-2 max-w-xs">
        <div className="font-semibold mb-1">{date}</div>
        <div className="text-sm">
          {workouts.map((workout, idx) => (
            <div key={idx} className="flex flex-col gap-1">
              <div className="capitalize">{workout.type}</div>
              <div className="text-gray-600 dark:text-gray-400 text-xs">
                Duration: {workout.duration}
                {workout.calories && ` • ${workout.calories}`}
              </div>
              {idx < workouts.length - 1 && <hr className="my-1 border-gray-200 dark:border-gray-700" />}
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
          classForValue={(value) => {
            if (!value || !value.count) return 'color-empty';
            if (value.count === 1) return 'color-scale-1';
            if (value.count === 2) return 'color-scale-2';
            if (value.count === 3) return 'color-scale-3';
            return 'color-scale-4';
          }}
          tooltipDataAttrs={(value) => {
            const dataAttrs: { [key: string]: string } = {
              'data-tip': value ? JSON.stringify(value) : '',
              'data-html': 'true',
              'data-place': 'top',
              'data-effect': 'solid',
              'data-class': 'workout-tooltip'
            };
            return dataAttrs;
          }}
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
              <div className="w-3 h-3 rounded bg-[#39D353]" />
              <div className="w-3 h-3 rounded bg-[#26A641]" />
              <div className="w-3 h-3 rounded bg-[#006D32]" />
              <div className="w-3 h-3 rounded bg-[#0E4429]" />
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
      <ReactTooltip
        id="workout-tooltip"
        getContent={(dataTip: string | null) => getTooltipContent(dataTip ? JSON.parse(dataTip) : null)}
        className="!bg-white dark:!bg-gray-800 !text-gray-900 dark:!text-white !shadow-lg !rounded-lg !border !border-gray-200 dark:!border-gray-700"
      />
    </div>
  );
} 