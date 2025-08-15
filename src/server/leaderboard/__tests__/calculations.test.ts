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
});
