import { useState, useEffect, useCallback } from 'react';
import type { 
  LeaderboardState, 
  LeaderboardMetric, 
  LeaderboardApiResponse,
  UseLeaderboardDataReturn 
} from '../types';
import { processLeaderboardData } from '../utils';

const CACHE_KEY = 'leaderboard-cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: LeaderboardApiResponse;
  timestamp: number;
  metric: LeaderboardMetric;
}

/**
 * Custom hook for managing leaderboard data
 * Handles fetching, caching, loading states, and error handling for both HRV and VO2 Max leaderboards
 */
export function useLeaderboardData(): UseLeaderboardDataReturn {
  const [state, setState] = useState<LeaderboardState>({
    hrv: null,
    vo2max: null,
    loading: {
      hrv: true,
      vo2max: true,
    },
    error: {
      hrv: null,
      vo2max: null,
    },
  });

  /**
   * Get cached data if still valid
   */
  const getCachedData = useCallback((metric: LeaderboardMetric): LeaderboardApiResponse | null => {
    try {
      const cached = localStorage.getItem(`${CACHE_KEY}-${metric}`);
      if (!cached) return null;

      const cacheEntry: CacheEntry = JSON.parse(cached);
      const isExpired = Date.now() - cacheEntry.timestamp > CACHE_DURATION;
      
      if (isExpired) {
        localStorage.removeItem(`${CACHE_KEY}-${metric}`);
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      console.warn('Error reading from cache:', error);
      return null;
    }
  }, []);

  /**
   * Cache leaderboard data
   */
  const cacheData = useCallback((metric: LeaderboardMetric, data: LeaderboardApiResponse) => {
    try {
      const cacheEntry: CacheEntry = {
        data,
        timestamp: Date.now(),
        metric,
      };
      localStorage.setItem(`${CACHE_KEY}-${metric}`, JSON.stringify(cacheEntry));
    } catch (error) {
      console.warn('Error writing to cache:', error);
    }
  }, []);

  /**
   * Fetch leaderboard data for a specific metric
   */
  const fetchLeaderboardData = useCallback(async (metric: LeaderboardMetric): Promise<void> => {
    // Set loading state
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, [metric]: true },
      error: { ...prev.error, [metric]: null },
    }));

    try {
      // Check cache first
      const cachedData = getCachedData(metric);
      if (cachedData) {
        const processedData = processLeaderboardData(cachedData, metric);
        setState(prev => ({
          ...prev,
          [metric]: {
            entries: processedData,
            totalUsers: cachedData.totalUsers,
            lastUpdated: new Date().toISOString(),
            metric,
          },
          loading: { ...prev.loading, [metric]: false },
        }));
        return;
      }

      // Fetch fresh data
      const response = await fetch(`/api/leaderboard/${metric}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });

      const data: LeaderboardApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to fetch ${metric} leaderboard`);
      }

      if (!data.success) {
        throw new Error(data.error || `API returned error for ${metric} leaderboard`);
      }

      // Cache the successful response
      cacheData(metric, data);

      // Process and update state
      const processedData = processLeaderboardData(data, metric);
      setState(prev => ({
        ...prev,
        [metric]: {
          entries: processedData,
          totalUsers: data.totalUsers,
          lastUpdated: new Date().toISOString(),
          metric,
        },
        loading: { ...prev.loading, [metric]: false },
      }));

    } catch (error) {
      console.error(`Error fetching ${metric} leaderboard:`, error);
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, [metric]: false },
        error: { 
          ...prev.error, 
          [metric]: error instanceof Error ? error.message : `Failed to load ${metric} leaderboard`,
        },
      }));
    }
  }, [getCachedData, cacheData]);

  /**
   * Refresh data for one or both metrics
   */
  const refreshData = useCallback(async (metric?: LeaderboardMetric): Promise<void> => {
    if (metric) {
      await fetchLeaderboardData(metric);
    } else {
      // Refresh both metrics
      await Promise.all([
        fetchLeaderboardData('hrv'),
        fetchLeaderboardData('vo2max'),
      ]);
    }
  }, [fetchLeaderboardData]);

  /**
   * Clear error state for a specific metric
   */
  const clearError = useCallback((metric: LeaderboardMetric) => {
    setState(prev => ({
      ...prev,
      error: { ...prev.error, [metric]: null },
    }));
  }, []);

  // Initial data fetch on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      await Promise.all([
        fetchLeaderboardData('hrv'),
        fetchLeaderboardData('vo2max'),
      ]);
    };

    fetchInitialData();
  }, [fetchLeaderboardData]);

  return {
    state,
    refreshData,
    clearError,
  };
}
