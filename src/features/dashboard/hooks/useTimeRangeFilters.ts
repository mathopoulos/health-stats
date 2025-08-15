import { useState } from 'react';
import type { HealthData } from '@/types/dashboard';

export type TimeRange = 'last30days' | 'last3months' | 'last6months' | 'last1year' | 'last3years';

interface TimeRangeFilters {
  weight: TimeRange;
  bodyFat: TimeRange;
  hrv: TimeRange;
  vo2max: TimeRange;
}

interface UseTimeRangeFiltersReturn {
  timeRanges: TimeRangeFilters;
  setWeightTimeRange: (range: TimeRange) => void;
  setBodyFatTimeRange: (range: TimeRange) => void;
  setHrvTimeRange: (range: TimeRange) => void;
  setVo2maxTimeRange: (range: TimeRange) => void;
  getTimeRangeData: (data: HealthData[], range: TimeRange) => HealthData[];
}

// Helper function to filter data by time range
function getTimeRangeData(data: HealthData[], range: TimeRange): HealthData[] {
  const now = new Date();
  let startDate: Date;
  
  switch (range) {
    case 'last30days':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'last3months':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'last6months':
      startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      break;
    case 'last1year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case 'last3years':
      startDate = new Date(now.getTime() - 3 * 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      return data;
  }
  
  return data.filter(item => new Date(item.date) >= startDate);
}

export function useTimeRangeFilters(): UseTimeRangeFiltersReturn {
  const [timeRanges, setTimeRanges] = useState<TimeRangeFilters>({
    weight: 'last1year',
    bodyFat: 'last1year',
    hrv: 'last1year',
    vo2max: 'last1year',
  });

  const setWeightTimeRange = (range: TimeRange) => {
    setTimeRanges(prev => ({ ...prev, weight: range }));
  };

  const setBodyFatTimeRange = (range: TimeRange) => {
    setTimeRanges(prev => ({ ...prev, bodyFat: range }));
  };

  const setHrvTimeRange = (range: TimeRange) => {
    setTimeRanges(prev => ({ ...prev, hrv: range }));
  };

  const setVo2maxTimeRange = (range: TimeRange) => {
    setTimeRanges(prev => ({ ...prev, vo2max: range }));
  };

  return {
    timeRanges,
    setWeightTimeRange,
    setBodyFatTimeRange,
    setHrvTimeRange,
    setVo2maxTimeRange,
    getTimeRangeData,
  };
}
