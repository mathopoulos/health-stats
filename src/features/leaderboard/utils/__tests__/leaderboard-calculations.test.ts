import {
  calculateAverage,
  filterByTimeRange,
  sortByMetric,
  processLeaderboardData,
  formatMetricValue,
  getTimeRangeDays,
  hasValidData,
} from '../leaderboard-calculations';
import type { LeaderboardApiResponse, LeaderboardEntry } from '../../types';

describe('leaderboard-calculations', () => {
  describe('calculateAverage', () => {
    it('calculates average of positive numbers correctly', () => {
      expect(calculateAverage([10, 20, 30])).toBe(20);
      expect(calculateAverage([1, 2, 3, 4, 5])).toBe(3);
      expect(calculateAverage([100])).toBe(100);
    });

    it('handles decimal numbers correctly', () => {
      expect(calculateAverage([1.5, 2.5, 3])).toBe(2.3333333333333335);
      expect(calculateAverage([0.1, 0.2, 0.3])).toBeCloseTo(0.2, 5);
    });

    it('returns 0 for empty array', () => {
      expect(calculateAverage([])).toBe(0);
    });

    it('handles negative numbers', () => {
      expect(calculateAverage([-10, -20, -30])).toBe(-20);
      expect(calculateAverage([-5, 5])).toBe(0);
    });

    it('handles zero values', () => {
      expect(calculateAverage([0, 0, 0])).toBe(0);
      expect(calculateAverage([0, 10, 20])).toBe(10);
    });
  });

  describe('filterByTimeRange', () => {
    const now = new Date('2024-01-15T10:00:00Z');
    const mockData = [
      { date: '2024-01-15T10:00:00Z', value: 50 }, // Today (most recent)
      { date: '2024-01-10T10:00:00Z', value: 45 }, // 5 days ago
      { date: '2024-01-05T10:00:00Z', value: 40 }, // 10 days ago
      { date: '2024-01-01T10:00:00Z', value: 35 }, // 14 days ago
      { date: '2023-12-15T10:00:00Z', value: 30 }, // 31 days ago (should be excluded)
    ];

    beforeAll(() => {
      // Mock Date to have consistent test results
      jest.useFakeTimers();
      jest.setSystemTime(now);
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('filters data within time range correctly', () => {
      const result = filterByTimeRange(mockData, 30);
      
      // Should include all except the 31-day-old entry
      expect(result).toHaveLength(4);
      expect(result.map(item => item.value)).toEqual([50, 45, 40, 35]);
    });

    it('handles shorter time ranges', () => {
      const result = filterByTimeRange(mockData, 7);
      
      // Should only include entries within 7 days
      expect(result).toHaveLength(2);
      expect(result.map(item => item.value)).toEqual([50, 45]);
    });

    it('returns empty array for empty input', () => {
      expect(filterByTimeRange([], 30)).toEqual([]);
    });

    it('uses most recent date as reference point', () => {
      const unsortedData = [
        { date: '2024-01-10T10:00:00Z', value: 45 }, // 5 days ago
        { date: '2024-01-15T10:00:00Z', value: 50 }, // Most recent (not first)
        { date: '2024-01-05T10:00:00Z', value: 40 }, // 10 days ago
      ];

      const result = filterByTimeRange(unsortedData, 7);
      
      // Should use 2024-01-15 as reference and include 7 days back
      expect(result).toHaveLength(2);
      expect(result[0].value).toBe(50); // Most recent first
      expect(result[1].value).toBe(45); // Within 7 days
    });

    it('handles single data point', () => {
      const singlePoint = [{ date: '2024-01-15T10:00:00Z', value: 100 }];
      const result = filterByTimeRange(singlePoint, 30);
      
      expect(result).toEqual(singlePoint);
    });
  });

  describe('sortByMetric', () => {
    const mockEntries: LeaderboardEntry[] = [
      { userId: 'user1', name: 'User 1', value: 30, dataPoints: 5, latestDate: '2024-01-15', rank: 1 },
      { userId: 'user2', name: 'User 2', value: 50, dataPoints: 8, latestDate: '2024-01-15', rank: 2 },
      { userId: 'user3', name: 'User 3', value: 40, dataPoints: 3, latestDate: '2024-01-15', rank: 3 },
    ];

    it('sorts entries by value in descending order', () => {
      const result = sortByMetric(mockEntries);
      
      expect(result.map(entry => entry.value)).toEqual([50, 40, 30]);
      expect(result.map(entry => entry.userId)).toEqual(['user2', 'user3', 'user1']);
    });

    it('preserves original array (does not mutate)', () => {
      const original = [...mockEntries];
      const result = sortByMetric(mockEntries);
      
      expect(mockEntries).toEqual(original);
      expect(result).not.toBe(mockEntries);
    });

    it('handles empty array', () => {
      expect(sortByMetric([])).toEqual([]);
    });

    it('handles single entry', () => {
      const singleEntry = [mockEntries[0]];
      expect(sortByMetric(singleEntry)).toEqual(singleEntry);
    });

    it('handles equal values correctly', () => {
      const equalValues: LeaderboardEntry[] = [
        { userId: 'user1', name: 'User 1', value: 40, dataPoints: 5, latestDate: '2024-01-15', rank: 1 },
        { userId: 'user2', name: 'User 2', value: 40, dataPoints: 8, latestDate: '2024-01-15', rank: 2 },
      ];

      const result = sortByMetric(equalValues);
      expect(result).toHaveLength(2);
      expect(result[0].value).toBe(40);
      expect(result[1].value).toBe(40);
    });
  });

  describe('processLeaderboardData', () => {
    const mockApiResponse: LeaderboardApiResponse = {
      success: true,
      data: [
        { userId: 'user1', name: 'John Doe', avgHRV: 45, dataPoints: 10, latestDate: '2024-01-15' },
        { userId: 'user2', name: 'Jane Smith', avgValue: 35, dataPoints: 8, latestDate: '2024-01-14' },
        { userId: 'user3', name: '', avgHRV: 55, dataPoints: 5, latestDate: '2024-01-13' },
      ],
      totalUsers: 3,
    };

    it('processes HRV data correctly', () => {
      const result = processLeaderboardData(mockApiResponse, 'hrv');
      
      expect(result).toHaveLength(3);
      
      // Should be sorted by value descending
      expect(result[0].value).toBe(55); // user3
      expect(result[1].value).toBe(45); // user1  
      expect(result[2].value).toBe(0);  // user2 (no avgHRV)
      
      // Should assign correct ranks
      expect(result[0].rank).toBe(1);
      expect(result[1].rank).toBe(2);
      expect(result[2].rank).toBe(3);
    });

    it('processes VO2 Max data correctly', () => {
      const result = processLeaderboardData(mockApiResponse, 'vo2max');
      
      expect(result).toHaveLength(3);
      
      // Should be sorted by avgValue descending
      expect(result[0].value).toBe(35); // user2
      expect(result[1].value).toBe(0);  // user1 (no avgValue)
      expect(result[2].value).toBe(0);  // user3 (no avgValue)
    });

    it('handles empty names with fallback', () => {
      const result = processLeaderboardData(mockApiResponse, 'hrv');
      
      expect(result[0].name).toBe('Anonymous'); // user3 has empty name
      expect(result[1].name).toBe('John Doe');
      expect(result[2].name).toBe('Jane Smith');
    });

    it('handles failed API response', () => {
      const failedResponse: LeaderboardApiResponse = {
        success: false,
        data: [],
        totalUsers: 0,
        error: 'API Error',
      };
      
      const result = processLeaderboardData(failedResponse, 'hrv');
      expect(result).toEqual([]);
    });

    it('handles null/undefined data', () => {
      const nullResponse: LeaderboardApiResponse = {
        success: true,
        data: null as any,
        totalUsers: 0,
      };
      
      const result = processLeaderboardData(nullResponse, 'hrv');
      expect(result).toEqual([]);
    });
  });

  describe('formatMetricValue', () => {
    it('formats HRV values correctly', () => {
      expect(formatMetricValue(45.678, 'hrv')).toBe('45.68');
      expect(formatMetricValue(45, 'hrv')).toBe('45');
      expect(formatMetricValue(45.1, 'hrv')).toBe('45.1');
    });

    it('formats VO2 Max values with one decimal', () => {
      expect(formatMetricValue(35.678, 'vo2max')).toBe('35.7');
      expect(formatMetricValue(35, 'vo2max')).toBe('35.0');
      expect(formatMetricValue(35.1, 'vo2max')).toBe('35.1');
    });

    it('handles zero values', () => {
      expect(formatMetricValue(0, 'hrv')).toBe('0');
      expect(formatMetricValue(0, 'vo2max')).toBe('0.0');
    });

    it('handles large numbers', () => {
      expect(formatMetricValue(999.999, 'hrv')).toBe('1000');
      expect(formatMetricValue(999.999, 'vo2max')).toBe('1000.0');
    });
  });

  describe('getTimeRangeDays', () => {
    it('converts time range strings to days correctly', () => {
      expect(getTimeRangeDays('7d')).toBe(7);
      expect(getTimeRangeDays('30d')).toBe(30);
      expect(getTimeRangeDays('90d')).toBe(90);
    });

    it('returns default for invalid range', () => {
      expect(getTimeRangeDays('invalid' as any)).toBe(30);
    });
  });

  describe('hasValidData', () => {
    it('validates complete entry data', () => {
      const validEntry: Partial<LeaderboardEntry> = {
        value: 45,
        dataPoints: 5,
      };
      
      expect(hasValidData(validEntry, 1)).toBe(true);
      expect(hasValidData(validEntry, 5)).toBe(true);
    });

    it('rejects entry with insufficient data points', () => {
      const entry: Partial<LeaderboardEntry> = {
        value: 45,
        dataPoints: 2,
      };
      
      expect(hasValidData(entry, 3)).toBe(false);
    });

    it('rejects entry with zero or negative values', () => {
      expect(hasValidData({ value: 0, dataPoints: 5 }, 1)).toBe(false);
      expect(hasValidData({ value: -10, dataPoints: 5 }, 1)).toBe(false);
    });

    it('rejects entry with missing fields', () => {
      expect(hasValidData({ value: 45 }, 1)).toBe(false);
      expect(hasValidData({ dataPoints: 5 }, 1)).toBe(false);
      expect(hasValidData({}, 1)).toBe(false);
    });

    it('uses default minimum data points', () => {
      const entry: Partial<LeaderboardEntry> = {
        value: 45,
        dataPoints: 1,
      };
      
      expect(hasValidData(entry)).toBe(true); // default minDataPoints = 1
    });
  });
});
