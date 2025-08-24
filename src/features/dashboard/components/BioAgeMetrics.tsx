import React from 'react';
import type { ChartData, HealthData } from '@/types/dashboard';
import { getTimeRangeData } from '@/lib/metric-calculations';

interface BioAgeMetricsProps {
  data: ChartData;
  loading: boolean;
}

function MetricCard({ 
  title, 
  value, 
  colorClass,
  loading 
}: { 
  title: string; 
  value: string; 
  colorClass: string;
  loading: boolean;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 sm:px-6 py-4 sm:py-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
        <h3 className="text-sm sm:text-lg font-medium text-gray-900 dark:text-white">
          {title}
        </h3>
        <span className={`text-xl sm:text-2xl font-bold ${colorClass}`}>
          {loading ? "..." : value}
        </span>
      </div>
    </div>
  );
}

function calculateAverage(data: HealthData[]): string {
  if (data.length === 0) return "—";
  
  const average = data.reduce((sum, item) => sum + item.value, 0) / data.length;
  return Math.round(average).toString();
}

export function BioAgeMetrics({ data, loading }: BioAgeMetricsProps) {
  // Calculate metrics
  const biologicalAge = data.bloodMarkers.biologicalAge?.length > 0 
    ? data.bloodMarkers.biologicalAge[0].value.toString()
    : "—";

  const vo2maxLast30Days = getTimeRangeData(data.vo2max, 'last30days');
  const vo2maxAverage = calculateAverage(vo2maxLast30Days);

  const hrvLast30Days = getTimeRangeData(data.hrv, 'last30days');
  const hrvAverage = hrvLast30Days.length > 0 
    ? `${calculateAverage(hrvLast30Days)} ms`
    : "—";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
      <MetricCard
        title="Biological Age"
        value={biologicalAge}
        colorClass="text-indigo-600 dark:text-indigo-400"
        loading={loading}
      />
      
      <MetricCard
        title="Age Speed"
        value="—" // This seems to be a placeholder in the original
        colorClass="text-green-600 dark:text-green-400"
        loading={loading}
      />
      
      <MetricCard
        title="VO2 Max"
        value={vo2maxAverage}
        colorClass="text-blue-600 dark:text-blue-400"
        loading={loading}
      />
      
      <MetricCard
        title="HRV"
        value={hrvAverage}
        colorClass="text-purple-600 dark:text-purple-400"
        loading={loading}
      />
    </div>
  );
}
