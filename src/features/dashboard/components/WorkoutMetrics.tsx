import React from 'react';
import { ACTIVITY_ICONS } from '@/components/workout-icons';
import type { WorkoutMetricsProps } from '@/types/dashboard';

export function WorkoutMetrics({ metrics, activityType }: WorkoutMetricsProps) {
  // Get the appropriate icon or default
  const icon = ACTIVITY_ICONS[activityType] || ACTIVITY_ICONS.default;
  
  // Order metrics in a specific way
  const orderedMetricKeys = ['Duration', 'Distance', 'Pace', 'Avg Heart Rate'];
  const orderedMetrics = orderedMetricKeys
    .filter(key => metrics[key])
    .map(key => ({ key, value: metrics[key] }));
  
  // Add any remaining metrics that aren't in our predefined order
  Object.entries(metrics)
    .filter(([key]) => !orderedMetricKeys.includes(key))
    .forEach(([key, value]) => orderedMetrics.push({ key, value }));

  return (
    <div className="space-y-5">
      <div className="flex items-center space-x-2 mb-2">
        {icon}
        <span className="text-gray-700 dark:text-gray-300 font-medium capitalize">
          {activityType.replace(/_/g, ' ')}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        {orderedMetrics.map(({ key, value }) => (
          <div key={key} className="flex flex-col">
            <div className="text-xs text-gray-500 dark:text-gray-400">{key}</div>
            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
