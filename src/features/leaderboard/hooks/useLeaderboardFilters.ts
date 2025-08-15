import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { 
  LeaderboardFilters, 
  LeaderboardMetric, 
  TimeRange,
  UseLeaderboardFiltersReturn 
} from '../types';
import { DEFAULT_FILTERS } from '../utils';

/**
 * Custom hook for managing leaderboard filters and URL synchronization
 * Handles active metric tab, time range, and URL state persistence
 */
export function useLeaderboardFilters(): UseLeaderboardFiltersReturn {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize filters from URL params or defaults
  const initializeFilters = useCallback((): LeaderboardFilters => {
    const urlMetric = searchParams?.get('metric') as LeaderboardMetric;
    const urlTimeRange = searchParams?.get('timeRange') as TimeRange;
    const urlMinDataPoints = searchParams?.get('minDataPoints');

    const parsedMinDataPoints = urlMinDataPoints ? parseInt(urlMinDataPoints, 10) : NaN;
    
    return {
      metric: (urlMetric && ['hrv', 'vo2max'].includes(urlMetric)) ? urlMetric : DEFAULT_FILTERS.metric,
      timeRange: (urlTimeRange && ['7d', '30d', '90d'].includes(urlTimeRange)) ? urlTimeRange : DEFAULT_FILTERS.timeRange,
      minDataPoints: !isNaN(parsedMinDataPoints) ? parsedMinDataPoints : DEFAULT_FILTERS.minDataPoints,
    };
  }, [searchParams]);

  const [filters, setFilters] = useState<LeaderboardFilters>(initializeFilters);

  /**
   * Update URL params to match current filters
   */
  const updateUrlParams = useCallback((newFilters: LeaderboardFilters) => {
    const params = new URLSearchParams();
    
    // Only add non-default values to keep URL clean
    if (newFilters.metric !== DEFAULT_FILTERS.metric) {
      params.set('metric', newFilters.metric);
    }
    if (newFilters.timeRange !== DEFAULT_FILTERS.timeRange) {
      params.set('timeRange', newFilters.timeRange);
    }
    if (newFilters.minDataPoints !== DEFAULT_FILTERS.minDataPoints) {
      params.set('minDataPoints', newFilters.minDataPoints?.toString() || '');
    }

    const paramString = params.toString();
    const newUrl = paramString ? `?${paramString}` : window.location.pathname;
    
    // Use replace to avoid adding to browser history for filter changes
    router.replace(newUrl, { scroll: false });
  }, [router]);

  /**
   * Set active metric tab
   */
  const setMetric = useCallback((metric: LeaderboardMetric) => {
    const newFilters = { ...filters, metric };
    setFilters(newFilters);
    updateUrlParams(newFilters);
  }, [filters, updateUrlParams]);

  /**
   * Set time range filter
   */
  const setTimeRange = useCallback((timeRange: TimeRange) => {
    const newFilters = { ...filters, timeRange };
    setFilters(newFilters);
    updateUrlParams(newFilters);
  }, [filters, updateUrlParams]);

  /**
   * Set minimum data points filter
   */
  const setMinDataPoints = useCallback((minDataPoints: number) => {
    const newFilters = { ...filters, minDataPoints };
    setFilters(newFilters);
    updateUrlParams(newFilters);
  }, [filters, updateUrlParams]);

  /**
   * Reset all filters to defaults
   */
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    updateUrlParams(DEFAULT_FILTERS);
  }, [updateUrlParams]);

  // Listen for URL changes (e.g., back/forward navigation)
  useEffect(() => {
    const newFilters = initializeFilters();
    setFilters(newFilters);
  }, [initializeFilters]);

  // Persist filters to localStorage for session persistence
  useEffect(() => {
    try {
      localStorage.setItem('leaderboard-filters', JSON.stringify(filters));
    } catch (error) {
      console.warn('Failed to persist filters to localStorage:', error);
    }
  }, [filters]);

  return {
    filters,
    setMetric,
    setTimeRange,
    setMinDataPoints,
    resetFilters,
  };
}
