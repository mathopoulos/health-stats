import { renderHook, act, waitFor } from '@testing-library/react';
import { useLeaderboardData } from '../useLeaderboardData';

// Mock the processLeaderboardData utility
jest.mock('../../utils', () => ({
  processLeaderboardData: jest.fn(),
}));

import { processLeaderboardData } from '../../utils';

const mockProcessLeaderboardData = processLeaderboardData as jest.MockedFunction<typeof processLeaderboardData>;

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
} as unknown as Storage;
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useLeaderboardData', () => {
  const mockHrvResponse = {
    success: true,
    data: [
      { userId: 'user1', name: 'John', avgHRV: 45, dataPoints: 10, latestDate: '2024-01-15' },
    ],
    totalUsers: 1,
  };

  const mockVo2Response = {
    success: true,
    data: [
      { userId: 'user2', name: 'Jane', avgValue: 35, dataPoints: 8, latestDate: '2024-01-14' },
    ],
    totalUsers: 1,
  };

  const mockProcessedEntries = [
    {
      userId: 'user1',
      name: 'John',
      value: 45,
      dataPoints: 10,
      latestDate: '2024-01-15',
      rank: 1,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset localStorage mock
    (localStorageMock.getItem as jest.Mock).mockReturnValue(null);
    (localStorageMock.setItem as jest.Mock).mockClear();
    (localStorageMock.removeItem as jest.Mock).mockClear();
    
    // Default mock for processLeaderboardData
    mockProcessLeaderboardData.mockReturnValue(mockProcessedEntries);

    // Suppress console warnings and errors for cleaner test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialization', () => {
    it('initializes with correct loading states', () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockHrvResponse),
      });

      const { result } = renderHook(() => useLeaderboardData());

      expect(result.current.state).toEqual({
        hrv: null,
        vo2max: null,
        loading: { hrv: true, vo2max: true },
        error: { hrv: null, vo2max: null },
      });
    });

    it('fetches both metrics on mount', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockHrvResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockVo2Response),
        });

      renderHook(() => useLeaderboardData());

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/leaderboard/hrv', expect.objectContaining({
        headers: expect.objectContaining({
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }),
      }));

      expect(mockFetch).toHaveBeenCalledWith('/api/leaderboard/vo2max', expect.objectContaining({
        headers: expect.objectContaining({
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }),
      }));
    });
  });

  describe('successful data fetching', () => {
    it('updates state with successful HRV data', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockHrvResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockVo2Response),
        });

      const { result } = renderHook(() => useLeaderboardData());

      await waitFor(() => {
        expect(result.current.state.loading.hrv).toBe(false);
      });

      expect(result.current.state.hrv).toEqual({
        entries: mockProcessedEntries,
        totalUsers: 1,
        lastUpdated: expect.any(String),
        metric: 'hrv',
      });

      expect(result.current.state.error.hrv).toBe(null);
    });

    it('processes both metrics correctly', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockHrvResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockVo2Response),
        });

      const { result } = renderHook(() => useLeaderboardData());

      await waitFor(() => {
        expect(result.current.state.loading.hrv).toBe(false);
        expect(result.current.state.loading.vo2max).toBe(false);
      });

      expect(mockProcessLeaderboardData).toHaveBeenCalledWith(mockHrvResponse, 'hrv');
      expect(mockProcessLeaderboardData).toHaveBeenCalledWith(mockVo2Response, 'vo2max');
    });
  });

  describe('error handling', () => {
    it('handles fetch network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useLeaderboardData());

      await waitFor(() => {
        expect(result.current.state.loading.hrv).toBe(false);
        expect(result.current.state.loading.vo2max).toBe(false);
      });

      expect(result.current.state.error.hrv).toBe('Network error');
      expect(result.current.state.error.vo2max).toBe('Network error');
    });

    it('handles HTTP error responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ success: false, error: 'Server error' }),
      });

      const { result } = renderHook(() => useLeaderboardData());

      await waitFor(() => {
        expect(result.current.state.loading.hrv).toBe(false);
      });

      expect(result.current.state.error.hrv).toBe('Server error');
    });

    it('handles API success false responses', async () => {
      const errorResponse = {
        success: false,
        error: 'API validation failed',
        data: [],
        totalUsers: 0,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(errorResponse),
      });

      const { result } = renderHook(() => useLeaderboardData());

      await waitFor(() => {
        expect(result.current.state.loading.hrv).toBe(false);
      });

      expect(result.current.state.error.hrv).toBe('API validation failed');
    });

    it('handles malformed JSON responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      const { result } = renderHook(() => useLeaderboardData());

      await waitFor(() => {
        expect(result.current.state.loading.hrv).toBe(false);
      });

      expect(result.current.state.error.hrv).toBe('Invalid JSON');
    });
  });

  describe('caching', () => {
    const cacheKey = 'leaderboard-cache-hrv';
    const validCacheData = {
      data: mockHrvResponse,
      timestamp: Date.now() - 60000, // 1 minute ago
      metric: 'hrv',
    };

    it('uses cached data when available and fresh', async () => {
      // Mock getItem to return cache only for HRV
      (localStorageMock.getItem as jest.Mock).mockImplementation((key: string) => {
        if (key === 'leaderboard-cache-hrv') {
          return JSON.stringify(validCacheData);
        }
        return null; // No cache for vo2max
      });

      // Mock fetch for vo2max (since it's not cached)
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockVo2Response),
      });

      const { result } = renderHook(() => useLeaderboardData());

      await waitFor(() => {
        expect(result.current.state.loading.hrv).toBe(false);
        expect(result.current.state.loading.vo2max).toBe(false);
      });

      expect(result.current.state.hrv?.entries).toEqual(mockProcessedEntries);
      // Should make fetch call only for vo2max (not cached)
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/leaderboard/vo2max', expect.any(Object));
    });

    it('ignores expired cache data', async () => {
      const expiredCacheData = {
        ...validCacheData,
        timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago (expired)
      };

      (localStorageMock.getItem as jest.Mock).mockReturnValue(JSON.stringify(expiredCacheData));
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockHrvResponse),
      });

      renderHook(() => useLeaderboardData());

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/leaderboard/hrv', expect.any(Object));
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(cacheKey);
    });

    it('handles corrupted cache data gracefully', async () => {
      (localStorageMock.getItem as jest.Mock).mockReturnValue('corrupted-json');
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockHrvResponse),
      });

      const { result } = renderHook(() => useLeaderboardData());

      await waitFor(() => {
        expect(result.current.state.loading.hrv).toBe(false);
      });

      // Should fetch fresh data when cache is corrupted
      expect(mockFetch).toHaveBeenCalledWith('/api/leaderboard/hrv', expect.any(Object));
      expect(result.current.state.hrv?.entries).toEqual(mockProcessedEntries);
    });

    it('saves successful responses to cache', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockHrvResponse),
      });

      renderHook(() => useLeaderboardData());

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          cacheKey,
          expect.stringContaining('"metric":"hrv"')
        );
      });
    });
  });

  describe('refresh functionality', () => {
    it('refreshes specific metric', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockHrvResponse),
      });

      const { result } = renderHook(() => useLeaderboardData());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.state.loading.hrv).toBe(false);
      });

      mockFetch.mockClear();

      // Refresh HRV only
      await act(async () => {
        await result.current.refreshData('hrv');
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/leaderboard/hrv', expect.any(Object));
    });

    it('refreshes all metrics when no specific metric provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockHrvResponse),
      });

      const { result } = renderHook(() => useLeaderboardData());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.state.loading.hrv).toBe(false);
      });

      mockFetch.mockClear();

      // Refresh all
      await act(async () => {
        await result.current.refreshData();
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('error clearing', () => {
    it('clears error for specific metric', async () => {
      // Start with an error state
      mockFetch.mockRejectedValue(new Error('Initial error'));

      const { result } = renderHook(() => useLeaderboardData());

      await waitFor(() => {
        expect(result.current.state.error.hrv).toBe('Initial error');
      });

      // Clear the error
      act(() => {
        result.current.clearError('hrv');
      });

      expect(result.current.state.error.hrv).toBe(null);
      expect(result.current.state.error.vo2max).toBe('Initial error'); // Other error unchanged
    });
  });

  describe('edge cases', () => {
    it('handles localStorage write failures gracefully', async () => {
      (localStorageMock.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockHrvResponse),
      });

      const { result } = renderHook(() => useLeaderboardData());

      await waitFor(() => {
        expect(result.current.state.loading.hrv).toBe(false);
      });

      // Should still update state even if caching fails
      expect(result.current.state.hrv?.entries).toEqual(mockProcessedEntries);
    });

    it('handles concurrent refresh calls correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockHrvResponse),
      });

      const { result } = renderHook(() => useLeaderboardData());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.state.loading.hrv).toBe(false);
      });

      mockFetch.mockClear();

      // Make multiple concurrent refresh calls
      await act(async () => {
        await Promise.all([
          result.current.refreshData('hrv'),
          result.current.refreshData('hrv'),
          result.current.refreshData('hrv'),
        ]);
      });

      // Should make requests (fetch calls aren't deduplicated in this simple implementation)
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });
});
