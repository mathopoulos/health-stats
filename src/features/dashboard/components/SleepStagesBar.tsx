import React from 'react';
import { SLEEP_STAGE_TARGETS } from '@/constants/sleep';
import type { SleepStagesBarProps } from '@/types/dashboard';

export function SleepStagesBar({ stageDurations }: SleepStagesBarProps) {
  if (!stageDurations) {
    return <div className="text-sm text-gray-500">No sleep data available</div>;
  }

  const durationToMinutes = (duration: string): number => {
    const hours = duration.match(/(\d+)h/)?.[1] || '0';
    const minutes = duration.match(/(\d+)m/)?.[1] || '0';
    return parseInt(hours) * 60 + parseInt(minutes);
  };

  return (
    <div className="space-y-4">
      {Object.entries(SLEEP_STAGE_TARGETS).map(([stage, { target, color, label }]) => {
        const stageData = stageDurations[stage];
        const durationMinutes = stageData ? durationToMinutes(stageData.duration) : 0;
        const percentageOfTarget = Math.min(100, (durationMinutes / target) * 100);
        const isOverTarget = durationMinutes >= target;
        
        return (
          <div key={stage} className="relative">
            {/* Stage Label and Duration */}
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="text-base font-medium text-gray-900 dark:text-white">
                {label}
              </span>
              <div className="text-sm">
                <span className={`font-semibold ${isOverTarget ? 'text-green-500' : 'text-gray-600 dark:text-gray-300'}`}>
                  {stageData?.duration || '0min'}
                </span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="relative h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div 
                className={`absolute left-0 top-0 h-full ${color} transition-all duration-500 ease-out`}
                style={{ width: `${percentageOfTarget}%` }}
              />
            </div>
            
            {/* Target Info */}
            <div className="flex justify-end mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Target: {target}min
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
