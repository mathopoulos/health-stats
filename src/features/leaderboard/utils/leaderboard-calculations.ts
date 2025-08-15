import type { 
  LeaderboardEntry, 
  LeaderboardMetric, 
  LeaderboardApiResponse,
  TimeRange 
} from '../types';

interface HealthDataPoint {
  date: string;
  value: number;
}

/**
 * Calculate simple average of numeric values
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Filter health data by time range from the most recent date
 */
export function filterByTimeRange(
  data: HealthDataPoint[], 
  days: number
): HealthDataPoint[] {
  if (data.length === 0) return [];
  
  // Sort by date descending to get the most recent first
  const sortedData = [...data].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  const latestDate = new Date(sortedData[0].date);
  const cutoffDate = new Date(latestDate);
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return sortedData.filter(item => 
    new Date(item.date) >= cutoffDate
  );
}

/**
 * Sort leaderboard entries by metric value (descending)
 */
export function sortByMetric(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((a, b) => b.value - a.value);
}

/**
 * Convert API response to standardized leaderboard entries
 */
export function processLeaderboardData(
  apiResponse: LeaderboardApiResponse,
  metric: LeaderboardMetric
): LeaderboardEntry[] {
  if (!apiResponse.success || !apiResponse.data) {
    return [];
  }

  const entries: LeaderboardEntry[] = apiResponse.data.map((item, index) => ({
    userId: item.userId,
    name: item.name || 'Anonymous',
    profileImage: item.profileImage,
    value: metric === 'hrv' ? (item.avgHRV || 0) : (item.avgValue || 0),
    dataPoints: item.dataPoints,
    latestDate: item.latestDate,
    rank: index + 1,
  }));

  return sortByMetric(entries).map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}

/**
 * Format metric values for display
 */
export function formatMetricValue(value: number, metric: LeaderboardMetric): string {
  const roundedValue = Math.round(value * 100) / 100; // Round to 2 decimal places
  
  switch (metric) {
    case 'hrv':
      return roundedValue.toString();
    case 'vo2max':
      return roundedValue.toFixed(1);
    default:
      return roundedValue.toString();
  }
}

/**
 * Get time range in days from TimeRange string
 */
export function getTimeRangeDays(timeRange: TimeRange): number {
  switch (timeRange) {
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
    default: return 30;
  }
}

/**
 * Validate if leaderboard entry has sufficient data
 */
export function hasValidData(
  entry: Partial<LeaderboardEntry>,
  minDataPoints: number = 1
): boolean {
  return !!(
    entry.value && 
    entry.value > 0 && 
    entry.dataPoints && 
    entry.dataPoints >= minDataPoints
  );
}
