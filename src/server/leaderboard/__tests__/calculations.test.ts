// Comprehensive tests focused on coverage for calculations.ts
// Mock dependencies first before any imports
jest.mock('@/db/client', () => ({
  default: jest.fn(),
}));

jest.mock('@/server/aws/s3', () => ({
  fetchAllHealthData: jest.fn(),
}));

jest.mock('../profile-images', () => ({
  processProfileImages: jest.fn(),
}));

// Import the functions we want to test
import {
  filterByTimeWindow,
  calculateAverage,
} from '../calculations';

describe('Leaderboard Calculations - Simple Coverage Tests', () => {
  // Mock console to avoid noise
  const consoleSpy = {
    log: jest.spyOn(console, 'log').mockImplementation(),
    error: jest.spyOn(console, 'error').mockImplementation(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
  });

  it('should handle database connection errors gracefully', async () => {
    const mockClientPromise = require('@/db/client').default;
    mockClientPromise.mockRejectedValue(new Error('Database connection failed'));

    const { generateLeaderboard } = require('../calculations');

    await expect(generateLeaderboard('hrv')).rejects.toThrow('Failed to generate hrv leaderboard');
    expect(consoleSpy.error).toHaveBeenCalledWith(
      'Error generating hrv leaderboard:',
      expect.any(Error)
    );
  });

  it('should call generateLeaderboard for each metric in generateMultipleLeaderboards', async () => {
    const mockClientPromise = require('@/db/client').default;
    mockClientPromise.mockRejectedValue(new Error('Test error'));

    const { generateMultipleLeaderboards } = require('../calculations');

    await expect(generateMultipleLeaderboards(['hrv', 'vo2max'])).rejects.toThrow();
  });

  it('should return empty object for empty metrics array', async () => {
    const { generateMultipleLeaderboards } = require('../calculations');

    const result = await generateMultipleLeaderboards([]);
    expect(result).toEqual({});
  });

  it('should log leaderboard generation with options', async () => {
    const mockClientPromise = require('@/db/client').default;
    mockClientPromise.mockRejectedValue(new Error('Test error'));

    const { generateLeaderboard } = require('../calculations');

    try {
      await generateLeaderboard('hrv', { timeWindowDays: 7 });
    } catch {
      // Expected to throw
    }

    expect(consoleSpy.log).toHaveBeenCalledWith(
      'Generating hrv leaderboard with options:',
      { timeWindowDays: 7 }
    );
  });

  it('should attempt to generate vo2max leaderboard', async () => {
    const mockClientPromise = require('@/db/client').default;
    mockClientPromise.mockRejectedValue(new Error('Test error'));

    const { generateLeaderboard } = require('../calculations');

    await expect(generateLeaderboard('vo2max')).rejects.toThrow('Failed to generate vo2max leaderboard');
    expect(consoleSpy.log).toHaveBeenCalledWith(
      'Generating vo2max leaderboard with options:',
      {}
    );
  });

  it('should test generateMultipleLeaderboards with errors for coverage', async () => {
    const mockClientPromise = require('@/db/client').default;
    mockClientPromise.mockRejectedValue(new Error('Test error'));

    const { generateMultipleLeaderboards } = require('../calculations');

    // Test multiple metrics to exercise more code paths
    await expect(generateMultipleLeaderboards(['hrv', 'vo2max'], { 
      timeWindowDays: 14, 
      minDataPoints: 3 
    })).rejects.toThrow();

    // Should have called generateLeaderboard for each metric
    expect(consoleSpy.log).toHaveBeenCalledWith(
      'Generating hrv leaderboard with options:',
      { timeWindowDays: 14, minDataPoints: 3 }
    );
    expect(consoleSpy.log).toHaveBeenCalledWith(
      'Generating vo2max leaderboard with options:',
      { timeWindowDays: 14, minDataPoints: 3 }
    );
  });


  // Unit tests for pure helper functions
  describe('filterByTimeWindow', () => {
    it('should return empty array for empty input', () => {
      const result = filterByTimeWindow([], 7);
      expect(result).toEqual([]);
    });

    it('should filter data within time window from most recent date', () => {
      const now = new Date();
      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
      
      const healthData = [
        { date: now.toISOString(), value: 50 },
        { date: fiveDaysAgo.toISOString(), value: 45 },
        { date: tenDaysAgo.toISOString(), value: 40 },
      ];

      const result = filterByTimeWindow(healthData, 7);

      // Should include recent data (now and 5 days ago) but exclude 10 days ago
      expect(result.length).toBe(2);
      expect(result.map(r => r.value)).toContain(50);
      expect(result.map(r => r.value)).toContain(45);
      expect(result.map(r => r.value)).not.toContain(40);
    });

    it('should handle unsorted input data correctly', () => {
      const baseDate = new Date('2024-01-15');
      const healthData = [
        { date: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), value: 45 }, // 2 days ago
        { date: baseDate.toISOString(), value: 50 }, // most recent
        { date: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), value: 47 }, // 1 day ago
      ];

      const result = filterByTimeWindow(healthData, 7);

      // Should return all data within 7 days, sorted by date descending
      expect(result.length).toBe(3);
      expect(result[0].value).toBe(50); // most recent first
    });

    it('should exclude data outside time window', () => {
      const baseDate = new Date('2024-01-15');
      const healthData = [
        { date: baseDate.toISOString(), value: 50 },
        { date: new Date(baseDate.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(), value: 40 }, // 8 days ago
      ];

      const result = filterByTimeWindow(healthData, 7);

      expect(result.length).toBe(1);
      expect(result[0].value).toBe(50);
    });
  });

  describe('calculateAverage', () => {
    it('should return 0 for empty array', () => {
      const result = calculateAverage([]);
      expect(result).toBe(0);
    });

    it('should calculate correct average for single value', () => {
      const healthData = [{ date: '2024-01-15', value: 42 }];
      const result = calculateAverage(healthData);
      expect(result).toBe(42);
    });

    it('should calculate correct average for multiple values', () => {
      const healthData = [
        { date: '2024-01-15', value: 40 },
        { date: '2024-01-14', value: 50 },
        { date: '2024-01-13', value: 60 },
      ];
      const result = calculateAverage(healthData);
      expect(result).toBe(50); // (40 + 50 + 60) / 3
    });

    it('should handle decimal values correctly', () => {
      const healthData = [
        { date: '2024-01-15', value: 45.5 },
        { date: '2024-01-14', value: 46.5 },
      ];
      const result = calculateAverage(healthData);
      expect(result).toBe(46.0);
    });

    it('should handle negative values', () => {
      const healthData = [
        { date: '2024-01-15', value: -10 },
        { date: '2024-01-14', value: 10 },
      ];
      const result = calculateAverage(healthData);
      expect(result).toBe(0);
    });
  });
});
