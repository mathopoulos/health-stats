'use client';

import React from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import type { ReactCalendarHeatmapValue } from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

// Import refactored components and utilities
import { useWorkoutHeatmapData } from '../hooks/useWorkoutHeatmapData';
import { WorkoutTooltip } from './WorkoutTooltip';
import { HeatmapLegend } from './HeatmapLegend';
import { WorkoutHeatMapStyles } from '../styles/WorkoutHeatMapStyles';
import { getDurationColorClass, createWorkoutSummary } from '../utils/workoutFormatting';
import { WORKOUT_HEATMAP_CONFIG } from '../constants/heatmapConfig';

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

interface HeatmapValue extends ReactCalendarHeatmapValue<string> {
  totalMinutes: number;
  details: {
    workouts: Array<{
      type: string;
      duration: string;
      calories?: string;
    }>;
  };
}

/**
 * Workout Heat Map Component
 * 
 * Displays a year-long calendar heatmap showing workout activity intensity.
 * Features:
 * - Color-coded squares based on workout duration
 * - Detailed tooltips showing workout information
 * - Responsive design with mobile support
 * - Weekly workout count tracking
 */
export default function WorkoutHeatMap({ workouts }: WorkoutHeatMapProps) {
  // Use custom hook to process all data
  const { values, dateRange } = useWorkoutHeatmapData({ workouts });

  const { startDate, endDate } = dateRange;
  const { TOOLTIP, UI } = WORKOUT_HEATMAP_CONFIG;

  // Create a Map for O(1) lookup performance instead of O(n) find operations
  const valuesByDate = React.useMemo(() => {
    const map = new Map<string, HeatmapValue>();
    values.forEach(value => {
      map.set(value.date, value);
    });
    return map;
  }, [values]);

  // Memoized tooltip content renderer for better performance
  const renderTooltipContent = React.useCallback(({ content }: { content?: string }) => {
    if (!content) return <WorkoutTooltip value={null} />;
    const currentValue = valuesByDate.get(content) || null;
    return <WorkoutTooltip value={currentValue} />;
  }, [valuesByDate]);

  // Get CSS class for heatmap square based on workout minutes
  const getSquareClass = (value: ReactCalendarHeatmapValue<string> | undefined): string => {
    if (!value || !('totalMinutes' in value)) {
      return WORKOUT_HEATMAP_CONFIG.COLOR_CLASSES.EMPTY;
    }
    return getDurationColorClass((value as HeatmapValue).totalMinutes);
  };

  // Get title text for accessibility
  const getSquareTitle = (value: ReactCalendarHeatmapValue<string> | undefined): string => {
    if (!value || !('totalMinutes' in value)) {
      return 'No workouts';
    }
    const val = value as HeatmapValue;
    return createWorkoutSummary(val.totalMinutes);
  };

  return (
    <div className="w-full">
      {/* Global styles for the heatmap */}
      <WorkoutHeatMapStyles />
      
      <div className="flex flex-col gap-4">
        {/* Heatmap container with horizontal scroll */}
        <div className="overflow-x-auto pb-4 -mx-4 sm:mx-0">
          <div 
            className="min-w-[800px] sm:min-w-0 px-4 sm:px-0"
            style={{ minWidth: `${UI.MIN_WIDTH_MOBILE}px` }}
          >
            <CalendarHeatmap<string>
              startDate={startDate}
              endDate={endDate}
              values={values}
              classForValue={getSquareClass}
              titleForValue={getSquareTitle}
              tooltipDataAttrs={(value) => ({
                'data-tooltip-id': TOOLTIP.ID,
                'data-tooltip-content': value && 'date' in value ? value.date : ''
              } as any)}
              showWeekdayLabels={true}
              weekdayLabels={UI.WEEKDAY_LABELS}
              monthLabels={UI.MONTH_LABELS}
              gutterSize={UI.GUTTER_SIZE}
            />
          </div>
        </div>

        {/* Legend */}
        <HeatmapLegend />
      </div>
      
      {/* Tooltip */}
      <Tooltip
        id={TOOLTIP.ID}
        render={renderTooltipContent}
        className="!bg-white dark:!bg-gray-800 !text-gray-900 dark:!text-white !shadow-xl !rounded-lg !border !border-gray-200 dark:!border-gray-700 !p-3"
        place={TOOLTIP.PLACE}
        offset={TOOLTIP.OFFSET}
        delayShow={TOOLTIP.DELAY_SHOW}
        delayHide={TOOLTIP.DELAY_HIDE}
        float
      />
    </div>
  );
}
