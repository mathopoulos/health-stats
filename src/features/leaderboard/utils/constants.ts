import type { MetricConfig, LeaderboardFilters, TimeRange } from '../types';

/**
 * Configuration for each leaderboard metric
 */
export const METRIC_CONFIGS: Record<string, MetricConfig> = {
  hrv: {
    label: 'HRV',
    unit: 'ms',
    icon: '❤️',
    description: 'Heart Rate Variability measures the variation in time between heartbeats',
  },
  vo2max: {
    label: 'VO2 Max',
    unit: 'ml/kg/min',
    icon: '⚡',
    description: 'VO2 Max measures the maximum rate of oxygen consumption during exercise',
  },
} as const;

/**
 * Default filter settings
 */
export const DEFAULT_FILTERS: LeaderboardFilters = {
  metric: 'hrv',
  timeRange: '30d',
  minDataPoints: 1,
} as const;

/**
 * Rank color mappings for different positions
 */
export const RANK_COLORS = {
  1: 'gold',
  2: 'silver', 
  3: 'bronze',
  default: 'indigo',
} as const;

/**
 * Available time range options
 */
export const TIME_RANGE_OPTIONS: Array<{ value: TimeRange; label: string }> = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
] as const;

/**
 * Minimum data points required for leaderboard inclusion
 */
export const MIN_DATA_POINTS = 1;

/**
 * Cache duration for leaderboard data (in milliseconds)
 */
export const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Maximum number of entries to display
 */
export const MAX_LEADERBOARD_ENTRIES = 100;

/**
 * Loading skeleton configuration
 */
export const LOADING_SKELETON_ROWS = 8;

/**
 * Error retry configuration
 */
export const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
} as const;
