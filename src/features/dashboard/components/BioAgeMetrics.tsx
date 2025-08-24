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
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col space-y-1">
        <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {title}
        </h3>
        <span className={`text-2xl sm:text-3xl font-bold ${colorClass} leading-none`}>
          {loading ? (
            <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-16 rounded"></div>
          ) : (
            value
          )}
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      <MetricCard
        title="Biological Age"
        value={biologicalAge}
        colorClass="text-indigo-700 dark:text-indigo-300"
        loading={loading}
      />
      
      <MetricCard
        title="Age Speed"
        value="—" // This seems to be a placeholder in the original
        colorClass="text-emerald-700 dark:text-emerald-300"
        loading={loading}
      />
      
      <MetricCard
        title="VO2 Max"
        value={vo2maxAverage}
        colorClass="text-blue-700 dark:text-blue-300"
        loading={loading}
      />
      
      <MetricCard
        title="HRV"
        value={hrvAverage}
        colorClass="text-violet-700 dark:text-violet-300"
        loading={loading}
      />
    </div>
  );
}
