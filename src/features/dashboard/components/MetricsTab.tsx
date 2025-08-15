import React from 'react';
import { MetricSummaryCard } from './MetricSummaryCard';
import { HealthChart } from './HealthChart';
import type { ChartData } from '@/types/dashboard';
import type { TimeRange } from '../hooks/useTimeRangeFilters';

interface MetricsTabProps {
  data: ChartData;
  loading: boolean;
  isDarkMode: boolean;
  timeRanges: {
    weight: TimeRange;
    bodyFat: TimeRange;
    hrv: TimeRange;
    vo2max: TimeRange;
  };
  onTimeRangeChange: {
    setWeightTimeRange: (range: TimeRange) => void;
    setBodyFatTimeRange: (range: TimeRange) => void;
    setHrvTimeRange: (range: TimeRange) => void;
    setVo2maxTimeRange: (range: TimeRange) => void;
  };
}

export function MetricsTab({ 
  data, 
  loading, 
  isDarkMode,
  timeRanges,
  onTimeRangeChange 
}: MetricsTabProps) {
  return (
    <>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <MetricSummaryCard
          title="Heart Rate Variability"
          data={data.hrv}
          loading={loading}
          metricType="hrv"
          timeRange="last30days"
        />
        
        <MetricSummaryCard
          title="VO2 Max"
          data={data.vo2max}
          loading={loading}
          metricType="vo2max"
          unit="mL/kg·min"
          timeRange="last30days"
        />
        
        <MetricSummaryCard
          title="Weight"
          data={data.weight}
          loading={loading}
          metricType="weight"
          unit="lb"
          timeRange="last30days"
        />
        
        <MetricSummaryCard
          title="Body Fat"
          data={data.bodyFat}
          loading={loading}
          metricType="bodyFat"
          unit="%"
          timeRange="last30days"
        />
      </div>

      {/* Charts */}
      <div className="space-y-6">
        {/* HRV Chart */}
        <HealthChart
          title="Heart Rate Variability"
          data={data.hrv}
          loading={loading}
          timeRange={timeRanges.hrv}
          onTimeRangeChange={onTimeRangeChange.setHrvTimeRange}
          isDarkMode={isDarkMode}
          metricType="hrv"
          unit="ms"
          color={{
            stroke: "#4f46e5",
            strokeDark: "#818cf8",
            bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
            textColor: "text-indigo-600 dark:text-indigo-400",
            iconColor: "text-indigo-500"
          }}
        />

        {/* Weight Chart */}
        <HealthChart
          title="Weight"
          data={data.weight}
          loading={loading}
          timeRange={timeRanges.weight}
          onTimeRangeChange={onTimeRangeChange.setWeightTimeRange}
          isDarkMode={isDarkMode}
          metricType="weight"
          unit="lb"
          color={{
            stroke: "#10b981",
            strokeDark: "#34d399",
            bgColor: "bg-green-50 dark:bg-green-900/20",
            textColor: "text-green-600 dark:text-green-400",
            iconColor: "text-green-500"
          }}
        />

        {/* Body Fat Chart */}
        <HealthChart
          title="Body Fat"
          data={data.bodyFat}
          loading={loading}
          timeRange={timeRanges.bodyFat}
          onTimeRangeChange={onTimeRangeChange.setBodyFatTimeRange}
          isDarkMode={isDarkMode}
          metricType="bodyFat"
          unit="%"
          color={{
            stroke: "#f59e0b",
            strokeDark: "#fbbf24",
            bgColor: "bg-amber-50 dark:bg-amber-900/20",
            textColor: "text-amber-600 dark:text-amber-400",
            iconColor: "text-amber-500"
          }}
        />

        {/* VO2 Max Chart */}
        <HealthChart
          title="VO2 Max"
          data={data.vo2max}
          loading={loading}
          timeRange={timeRanges.vo2max}
          onTimeRangeChange={onTimeRangeChange.setVo2maxTimeRange}
          isDarkMode={isDarkMode}
          metricType="vo2max"
          unit="mL/kg·min"
          color={{
            stroke: "#3b82f6",
            strokeDark: "#60a5fa",
            bgColor: "bg-blue-50 dark:bg-blue-900/20",
            textColor: "text-blue-600 dark:text-blue-400",
            iconColor: "text-blue-500"
          }}
        />
      </div>
    </>
  );
}
