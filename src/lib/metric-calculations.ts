import type { HealthData } from '@/types/dashboard';

// Helper function to aggregate data by week or month
export function aggregateData(data: HealthData[], aggregationType: 'weekly' | 'monthly'): HealthData[] {
  const groupedData = new Map<string, { items: HealthData[], startDate: Date, endDate: Date }>();
  
  data.forEach(item => {
    const date = new Date(item.date);
    let key: string;
    let startDate: Date;
    let endDate: Date;
    
    if (aggregationType === 'weekly') {
      // Convert to UTC to avoid timezone issues
      const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
      // Get the Monday of this week (Monday = 1, Sunday = 0)
      const dayOfWeek = utcDate.getUTCDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Handle Sunday (0) as last day of week
      const weekStartMonday = new Date(utcDate);
      weekStartMonday.setUTCDate(utcDate.getUTCDate() + mondayOffset);
      
      // Calculate Sunday of the same week
      const weekEndSunday = new Date(weekStartMonday);
      weekEndSunday.setUTCDate(weekStartMonday.getUTCDate() + 6);
      
      startDate = weekStartMonday;
      endDate = weekEndSunday;
      key = weekStartMonday.toISOString().split('T')[0];
    } else {
      // Monthly aggregation - calculate first and last day of the month
      const year = date.getFullYear();
      const month = date.getMonth();
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month + 1, 0); // Last day of the month
      key = date.toISOString().slice(0, 7); // YYYY-MM format
    }
    
    if (!groupedData.has(key)) {
      groupedData.set(key, { items: [], startDate, endDate });
    }
    
    groupedData.get(key)?.items.push(item);
  });
  
  // Aggregate each group to a single data point (average value)
  const aggregatedData: HealthData[] = [];
  
  groupedData.forEach((group, key) => {
    const { items, startDate, endDate } = group;
    
    // Calculate average value for the group
    const sum = items.reduce((acc, curr) => acc + curr.value, 0);
    const avgValue = sum / items.length;
    
    // Use the middle item's date for a more representative point in time
    const middleIndex = Math.floor(items.length / 2);
    
    const aggregatedItem: HealthData = {
      date: items[middleIndex]?.date || items[0].date,
      value: Number(avgValue.toFixed(2)), // Round to 2 decimal places
      // Add metadata for tooltip with date ranges
      meta: {
        aggregationType: aggregationType,
        pointCount: items.length,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      }
    };
    
    aggregatedData.push(aggregatedItem);
  });
  
  // Sort aggregated data by date
  return aggregatedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// Time range utilities
export function getTimeRangeData(data: HealthData[], range: string): HealthData[] {
  if (range === 'all') return data;
  
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

// Calculate average for data array
export function calculateAverage(data: HealthData[]): number {
  if (data.length === 0) return 0;
  return data.reduce((sum, item) => sum + item.value, 0) / data.length;
}

// Calculate trend comparison between current and previous periods
export function calculateTrendComparison(data: HealthData[], timeRange: string) {
  const filteredData = getTimeRangeData(data, timeRange);
  
  if (filteredData.length === 0) {
    return { current: 0, previous: 0, hasData: false };
  }

  // For 30 days comparison, look at previous 30-60 days
  if (timeRange === 'last30days') {
    const currentPeriodData = filteredData;
    const previousPeriodStartDate = new Date();
    previousPeriodStartDate.setDate(previousPeriodStartDate.getDate() - 60);
    const previousPeriodEndDate = new Date();
    previousPeriodEndDate.setDate(previousPeriodEndDate.getDate() - 30);

    const previousPeriodData = data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= previousPeriodStartDate && itemDate < previousPeriodEndDate;
    });

    if (currentPeriodData.length > 0 && previousPeriodData.length > 0) {
      return {
        current: calculateAverage(currentPeriodData),
        previous: calculateAverage(previousPeriodData),
        hasData: true,
      };
    }
  }

  // For other time ranges, split the period in half
  const periodLength = Math.min(getTimeRangeInDays(timeRange), filteredData.length);
  const halfPeriod = Math.floor(periodLength / 2);
  
  const currentPeriodData = filteredData.slice(-halfPeriod);
  const previousPeriodData = filteredData.slice(-periodLength, -halfPeriod);
  
  if (currentPeriodData.length > 0 && previousPeriodData.length > 0) {
    return {
      current: calculateAverage(currentPeriodData),
      previous: calculateAverage(previousPeriodData),
      hasData: true,
    };
  }

  return { current: 0, previous: 0, hasData: false };
}

// Calculate trend comparison using pre-filtered/aggregated data (like original implementation)
export function calculateTrendFromAggregatedData(aggregatedData: HealthData[]) {
  if (aggregatedData.length === 0) {
    return { current: 0, previous: 0, hasData: false };
  }

  // Split the aggregated data in half (like the original implementation)
  const halfPeriod = Math.floor(aggregatedData.length / 2);
  
  // Current period (most recent half of the data)
  const currentPeriodData = aggregatedData.slice(-halfPeriod);
  const currentAvg = currentPeriodData.length > 0 
    ? currentPeriodData.reduce((sum, item) => sum + item.value, 0) / currentPeriodData.length 
    : 0;
  
  // Previous period (older half of the data)  
  const previousPeriodData = aggregatedData.slice(-aggregatedData.length, -halfPeriod);
  const previousAvg = previousPeriodData.length > 0 
    ? previousPeriodData.reduce((sum, item) => sum + item.value, 0) / previousPeriodData.length 
    : 0;
  
  // Only return data if we have enough for both periods
  if (currentPeriodData.length > 0 && previousPeriodData.length > 0) {
    return {
      current: currentAvg,
      previous: previousAvg,
      hasData: true,
    };
  }

  return { current: 0, previous: 0, hasData: false };
}

// Get time range in days
export function getTimeRangeInDays(timeRange: string): number {
  switch(timeRange) {
    case 'last30days': return 30;
    case 'last3months': return 90;
    case 'last6months': return 180;
    case 'last1year': return 365;
    case 'last3years': return 1095;
    default: return 30;
  }
}

// Get display label for time range
export function getTimeRangeLabel(timeRange: string): string {
  switch(timeRange) {
    case 'last30days': return 'Last 30 days';
    case 'last3months': return 'Last 3 months';
    case 'last6months': return 'Last 6 months';
    case 'last1year': return 'Last year';
    case 'last3years': return 'Last 3 years';
    default: return 'Last 30 days';
  }
}

// Format metric value with appropriate precision and unit
export function formatMetricValue(value: number, metricType: string): string {
  if (isNaN(value)) return "No data";
  
  switch (metricType) {
    case 'hrv':
      return `${Math.round(value)} ms`;
    case 'vo2max':
      return Math.round(value).toString();
    case 'weight':
      return `${value.toFixed(1)}`;
    case 'bodyFat':
      return `${value.toFixed(1)}`;
    default:
      return value.toString();
  }
}
