import { renderHook, act } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLeaderboardFilters } from '../useLeaderboardFilters';
import { DEFAULT_FILTERS } from '../../utils';

// Mock Next.js router and search params
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;

describe('useLeaderboardFilters', () => {
  const mockReplace = jest.fn();
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mocks
    mockUseRouter.mockReturnValue({
      replace: mockReplace,
    } as any);
    
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue(null),
    } as any);

    // Clear localStorage
    localStorage.clear();
  });

  describe('initialization', () => {
    it('initializes with default filters when no URL params exist', () => {
      const { result } = renderHook(() => useLeaderboardFilters());
      
      expect(result.current.filters).toEqual(DEFAULT_FILTERS);
    });

    it('initializes with URL params when they exist', () => {
      // Setup mocks before rendering
      const mockGet = jest.fn((key: string) => {
        switch (key) {
          case 'metric': return 'vo2max';
          case 'timeRange': return '7d';
          case 'minDataPoints': return '5';
          default: return null;
        }
      });

      mockUseSearchParams.mockReturnValue({
        get: mockGet,
      } as any);

      const { result } = renderHook(() => useLeaderboardFilters());
      
      expect(result.current.filters).toEqual({
        metric: 'vo2max',
        timeRange: '7d',
        minDataPoints: 5,
      });
    });

    it('falls back to defaults for invalid URL params', () => {
      const mockGet = jest.fn((key: string) => {
        switch (key) {
          case 'metric': return 'invalid-metric';
          case 'timeRange': return 'invalid-range';
          case 'minDataPoints': return 'invalid-number';
          default: return null;
        }
      });

      mockUseSearchParams.mockReturnValue({
        get: mockGet,
      } as any);

      const { result } = renderHook(() => useLeaderboardFilters());
      
      expect(result.current.filters).toEqual(DEFAULT_FILTERS);
    });
  });

  describe('setMetric', () => {
    it('updates metric and calls router.replace', () => {
      const { result } = renderHook(() => useLeaderboardFilters());
      
      act(() => {
        result.current.setMetric('vo2max');
      });

      expect(result.current.filters.metric).toBe('vo2max');
      expect(mockReplace).toHaveBeenCalledWith('?metric=vo2max', { scroll: false });
    });

    it('removes metric from URL when setting to default', () => {
      // Start with non-default metric
      const mockGet = jest.fn().mockReturnValueOnce('vo2max');
      mockUseSearchParams.mockReturnValue({ get: mockGet } as any);

      const { result } = renderHook(() => useLeaderboardFilters());
      
      act(() => {
        result.current.setMetric('hrv'); // Default metric
      });

      expect(result.current.filters.metric).toBe('hrv');
      expect(mockReplace).toHaveBeenCalledWith(expect.not.stringContaining('metric'), { scroll: false });
    });
  });

  describe('setTimeRange', () => {
    it('updates time range and URL', () => {
      const { result } = renderHook(() => useLeaderboardFilters());
      
      act(() => {
        result.current.setTimeRange('7d');
      });

      expect(result.current.filters.timeRange).toBe('7d');
      expect(mockReplace).toHaveBeenCalledWith('?timeRange=7d', { scroll: false });
    });

    it('removes timeRange from URL when setting to default', () => {
      const { result } = renderHook(() => useLeaderboardFilters());
      
      act(() => {
        result.current.setTimeRange('30d'); // Default time range
      });

      expect(result.current.filters.timeRange).toBe('30d');
      expect(mockReplace).toHaveBeenCalledWith(expect.not.stringContaining('timeRange'), { scroll: false });
    });
  });

  describe('setMinDataPoints', () => {
    it('updates minimum data points and URL', () => {
      const { result } = renderHook(() => useLeaderboardFilters());
      
      act(() => {
        result.current.setMinDataPoints(5);
      });

      expect(result.current.filters.minDataPoints).toBe(5);
      expect(mockReplace).toHaveBeenCalledWith('?minDataPoints=5', { scroll: false });
    });
  });

  describe('resetFilters', () => {
    it('resets all filters to defaults and clears URL', () => {
      // Start with custom filters
      const mockGet = jest.fn()
        .mockReturnValueOnce('vo2max')
        .mockReturnValueOnce('7d')
        .mockReturnValueOnce('5');

      mockUseSearchParams.mockReturnValue({ get: mockGet } as any);

      const { result } = renderHook(() => useLeaderboardFilters());
      
      act(() => {
        result.current.resetFilters();
      });

      expect(result.current.filters).toEqual(DEFAULT_FILTERS);
      expect(mockReplace).toHaveBeenCalledWith(expect.not.stringContaining('?'), { scroll: false });
    });
  });

  describe('URL handling', () => {
    it('combines multiple non-default params in URL', () => {
      const { result } = renderHook(() => useLeaderboardFilters());
      
      act(() => {
        result.current.setMetric('vo2max');
      });
      
      act(() => {
        result.current.setTimeRange('7d');
      });

      expect(mockReplace).toHaveBeenLastCalledWith(
        expect.stringContaining('metric=vo2max'),
        { scroll: false }
      );
      expect(mockReplace).toHaveBeenLastCalledWith(
        expect.stringContaining('timeRange=7d'),
        { scroll: false }
      );
    });

    it('uses replace instead of push to avoid browser history pollution', () => {
      const { result } = renderHook(() => useLeaderboardFilters());
      
      act(() => {
        result.current.setMetric('vo2max');
      });

      expect(mockReplace).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ scroll: false })
      );
    });
  });

  describe('localStorage persistence', () => {
    it('persists filters to localStorage', () => {
      const { result } = renderHook(() => useLeaderboardFilters());
      
      act(() => {
        result.current.setMetric('vo2max');
      });

      const stored = localStorage.getItem('leaderboard-filters');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored!);
      expect(parsed.metric).toBe('vo2max');
    });
  });
});
