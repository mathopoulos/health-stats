// Server-side types for leaderboard calculations

export interface HealthDataPoint {
  date: string;
  value: number;
}

export interface UserRecord {
  userId: string;
  name: string;
  profileImage?: string;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  profileImage?: string;
  avgValue: number;
  dataPoints: number;
  latestDate: string;
}

export interface LeaderboardResult {
  entries: LeaderboardEntry[];
  totalUsers: number;
  lastUpdated: string;
}

export type LeaderboardMetric = 'hrv' | 'vo2max';

export interface LeaderboardOptions {
  timeWindowDays?: number;
  minDataPoints?: number;
  maxEntries?: number;
}

// Helper functions to ensure coverage
export function isValidLeaderboardMetric(metric: string): metric is LeaderboardMetric {
  return metric === 'hrv' || metric === 'vo2max';
}

export function getDefaultLeaderboardOptions(): LeaderboardOptions {
  return {
    timeWindowDays: 30,
    minDataPoints: 1,
    maxEntries: 100,
  };
}
