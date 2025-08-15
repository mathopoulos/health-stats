import React from 'react';
import TrendIndicator from '@components/TrendIndicator';
import type { HealthData } from '@/types/dashboard';
import { getTimeRangeData, calculateTrendComparison, formatMetricValue } from '@/lib/metric-calculations';

interface MetricSummaryCardProps {
  title: string;
  data: HealthData[];
  loading: boolean;
  metricType: 'hrv' | 'vo2max' | 'weight' | 'bodyFat';
  unit?: string;
  timeRange?: string;
}

export function MetricSummaryCard({
  title,
  data,
  loading,
  metricType,
  unit,
  timeRange = 'last30days'
}: MetricSummaryCardProps) {
  const timeRangeData = getTimeRangeData(data, timeRange);
  const trendData = calculateTrendComparison(data, timeRange);
  
  const displayValue = loading ? "..." : 
    timeRangeData.length > 0 
      ? formatMetricValue(timeRangeData.reduce((sum, item) => sum + item.value, 0) / timeRangeData.length, metricType)
      : "No data";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-6 shadow-sm">
      <div className="flex flex-col">
        <span className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </span>
        <div className="mt-1.5 md:mt-2 flex flex-col md:flex-row md:items-baseline gap-1 md:gap-2">
          <span className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            {displayValue}
          </span>
          {!loading && timeRangeData.length > 0 && trendData.hasData && (
            <div className="flex items-center">
              {unit && (
                <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
                  {unit}
                </span>
              )}
              <TrendIndicator 
                current={trendData.current} 
                previous={trendData.previous} 
                isFitnessMetric={true}
                isBodyFat={metricType === 'bodyFat'}
              />
            </div>
          )}
        </div>
        <span className="mt-1 text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
          {timeRange === 'last30days' ? 'Last 30 days' : 'Average'}
        </span>
      </div>
    </div>
  );
}
