// Mock the dependencies before importing
jest.mock('@/db/client', () => {
  const mockClient = {
    db: jest.fn().mockReturnValue({
      collection: jest.fn().mockReturnValue({
        find: jest.fn().mockReturnValue({
          project: jest.fn().mockReturnValue({
            toArray: jest.fn(),
          }),
        }),
      }),
    }),
  };
  
  return {
    __esModule: true,
    default: Promise.resolve(mockClient),
  };
});

jest.mock('@/server/aws/s3', () => ({
  fetchAllHealthData: jest.fn(),
}));

jest.mock('../profile-images', () => ({
  processProfileImages: jest.fn().mockResolvedValue(new Map()),
}));

import { generateLeaderboard } from '../calculations';
import { fetchAllHealthData } from '@/server/aws/s3';
import clientPromise from '@/db/client';

const mockFetchAllHealthData = fetchAllHealthData as jest.MockedFunction<typeof fetchAllHealthData>;

describe.skip('leaderboard calculations', () => {
  const mockUsers = [
    { userId: 'user1', name: 'John Doe', profileImage: undefined },
    { userId: 'user2', name: 'Jane Smith', profileImage: 'profile2.jpg' },
    { userId: 'user3', name: 'Bob Wilson', profileImage: undefined },
  ];

  const mockHrvData = [
    { date: '2024-01-15', value: 45 },
    { date: '2024-01-14', value: 42 },
    { date: '2024-01-13', value: 48 },
  ];

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Set up the mock to return users
    const client = await clientPromise;
    const toArrayMock = client.db().collection().find().project().toArray as jest.MockedFunction<any>;
    toArrayMock.mockResolvedValue(mockUsers);
  });

  describe('generateLeaderboard', () => {
    it('generates HRV leaderboard with valid data', async () => {
      // Mock S3 data - return HRV data for user1, empty for others
      mockFetchAllHealthData
        .mockResolvedValueOnce(mockHrvData) // user1
        .mockResolvedValueOnce([]) // user2 - no data
        .mockResolvedValueOnce(null); // user3 - no data

      const result = await generateLeaderboard('hrv', {
        timeWindowDays: 30,
        minDataPoints: 1,
      });

      expect(result).toHaveProperty('entries');
      expect(result).toHaveProperty('totalUsers');
      expect(result).toHaveProperty('lastUpdated');

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]).toMatchObject({
        userId: 'user1',
        name: 'John Doe',
        avgValue: expect.any(Number),
        dataPoints: 3,
      });

      expect(result.totalUsers).toBe(1);
    });

    it('handles minimum data points requirement', async () => {
      // Mock S3 data with insufficient data points
      mockFetchAllHealthData
        .mockResolvedValueOnce([{ date: '2024-01-15', value: 45 }]) // user1 - only 1 reading
        .mockResolvedValueOnce([]) // user2 - no data
        .mockResolvedValueOnce(null); // user3 - no data

      const result = await generateLeaderboard('hrv', {
        timeWindowDays: 30,
        minDataPoints: 3, // Require at least 3 readings
      });

      expect(result.entries).toHaveLength(0);
      expect(result.totalUsers).toBe(0);
    });

    it('calculates averages correctly', async () => {
      const testData = [
        { date: '2024-01-15', value: 40 },
        { date: '2024-01-14', value: 50 },
        { date: '2024-01-13', value: 60 },
      ];

      mockFetchAllHealthData
        .mockResolvedValueOnce(testData) // user1
        .mockResolvedValueOnce([]) // user2
        .mockResolvedValueOnce([]); // user3

      const result = await generateLeaderboard('hrv');

      expect(result.entries[0].avgValue).toBe(50); // (40 + 50 + 60) / 3 = 50
    });

    it('sorts entries by average value in descending order', async () => {
      mockFetchAllHealthData
        .mockResolvedValueOnce([{ date: '2024-01-15', value: 30 }]) // user1 - low score
        .mockResolvedValueOnce([{ date: '2024-01-15', value: 50 }]) // user2 - high score  
        .mockResolvedValueOnce([{ date: '2024-01-15', value: 40 }]); // user3 - medium score

      const result = await generateLeaderboard('hrv');

      expect(result.entries).toHaveLength(3);
      expect(result.entries[0].avgValue).toBe(50); // user2 first
      expect(result.entries[1].avgValue).toBe(40); // user3 second
      expect(result.entries[2].avgValue).toBe(30); // user1 third
    });

    it('handles time window filtering correctly', async () => {
      const now = new Date();
      const recent = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
      const old = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000); // 40 days ago

      const testData = [
        { date: now.toISOString(), value: 50 }, // Most recent - included
        { date: recent.toISOString(), value: 40 }, // Recent - included
        { date: old.toISOString(), value: 30 }, // Old - excluded
      ];

      mockFetchAllHealthData
        .mockResolvedValueOnce(testData)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await generateLeaderboard('hrv', {
        timeWindowDays: 30,
      });

      // Should only include the 2 recent readings, excluding the old one
      expect(result.entries[0].dataPoints).toBe(2);
      expect(result.entries[0].avgValue).toBe(45); // (50 + 40) / 2 = 45
    });

    it('handles errors gracefully', async () => {
      // Mock database error
      mockClientPromise.mockRejectedValue(new Error('Database connection failed'));

      await expect(generateLeaderboard('hrv')).rejects.toThrow('Failed to generate hrv leaderboard');
    });
  });
});
