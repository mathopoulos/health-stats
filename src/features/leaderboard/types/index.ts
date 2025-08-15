// Leaderboard feature types and interfaces

export type LeaderboardMetric = 'hrv' | 'vo2max';

export type TimeRange = '7d' | '30d' | '90d';

export interface LeaderboardEntry {
  userId: string;
  name: string;
  profileImage?: string;
  value: number;
  dataPoints: number;
  latestDate: string;
  rank: number;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  totalUsers: number;
  lastUpdated: string;
  metric: LeaderboardMetric;
}

export interface LeaderboardFilters {
  metric: LeaderboardMetric;
  timeRange: TimeRange;
  minDataPoints?: number;
}

export interface LeaderboardState {
  hrv: LeaderboardData | null;
  vo2max: LeaderboardData | null;
  loading: {
    hrv: boolean;
    vo2max: boolean;
  };
  error: {
    hrv: string | null;
    vo2max: string | null;
  };
}

// API Response types
export interface LeaderboardApiResponse {
  success: boolean;
  data: Array<{
    userId: string;
    name: string;
    profileImage?: string;
    avgHRV?: number;
    avgValue?: number;
    dataPoints: number;
    latestDate: string;
  }>;
  totalUsers: number;
  error?: string;
}

// Component prop types
export interface LeaderboardTabsProps {
  activeTab: LeaderboardMetric;
  onTabChange: (tab: LeaderboardMetric) => void;
  loading?: {
    hrv: boolean;
    vo2max: boolean;
  };
}

export interface LeaderboardTableProps {
  data: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  metric: LeaderboardMetric;
  onRetry?: () => void;
}

export interface LeaderboardEntryProps {
  entry: LeaderboardEntry;
  metric: LeaderboardMetric;
  isTopThree: boolean;
}

export interface LeaderboardHeaderProps {
  totalUsers: number;
  lastUpdated?: string;
  loading?: boolean;
}

// Utility types
export interface RankConfig {
  text: string;
  color: string;
  gradient: string;
  icon?: string;
}

export interface MetricConfig {
  label: string;
  unit: string;
  icon: string;
  description: string;
}

// Hook return types
export interface UseLeaderboardDataReturn {
  state: LeaderboardState;
  refreshData: (metric?: LeaderboardMetric) => Promise<void>;
  clearError: (metric: LeaderboardMetric) => void;
}

export interface UseLeaderboardFiltersReturn {
  filters: LeaderboardFilters;
  setMetric: (metric: LeaderboardMetric) => void;
  setTimeRange: (range: TimeRange) => void;
  setMinDataPoints: (min: number) => void;
  resetFilters: () => void;
}
