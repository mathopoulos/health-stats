import { GET } from './route';
import { generateLeaderboard } from '@/server/leaderboard';

// Mock the server leaderboard function
jest.mock('@/server/leaderboard', () => ({
  generateLeaderboard: jest.fn(),
}));

const mockGenerateLeaderboard = generateLeaderboard as jest.MockedFunction<typeof generateLeaderboard>;

describe('/api/leaderboard/hrv', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('successfully fetches HRV leaderboard data', async () => {
      // Arrange
      const mockResult = {
        entries: [
          {
            userId: 'user1',
            name: 'John Doe', 
            profileImage: 'profile1.jpg',
            avgValue: 45.5,
            dataPoints: 10,
            latestDate: '2024-01-15T00:00:00.000Z',
          },
          {
            userId: 'user2',
            name: 'Jane Smith',
            profileImage: null,
            avgValue: 42.3,
            dataPoints: 8,
            latestDate: '2024-01-14T00:00:00.000Z',
          },
        ],
        totalUsers: 2,
      };
      
      mockGenerateLeaderboard.mockResolvedValue(mockResult);
      const request = new Request('http://localhost:3000/api/leaderboard/hrv');

      // Act
      const response = await GET(request);
      const responseData = await response.json();

      // Assert
      expect(mockGenerateLeaderboard).toHaveBeenCalledWith('hrv', {
        timeWindowDays: 30,
        minDataPoints: 1,
        maxEntries: 100,
      });

      expect(responseData).toEqual({
        success: true,
        data: [
          {
            userId: 'user1',
            name: 'John Doe',
            profileImage: 'profile1.jpg',
            avgHRV: 45.5, // Transformed from avgValue to avgHRV
            dataPoints: 10,
            latestDate: '2024-01-15T00:00:00.000Z',
          },
          {
            userId: 'user2',
            name: 'Jane Smith',
            profileImage: null,
            avgHRV: 42.3, // Transformed from avgValue to avgHRV
            dataPoints: 8,
            latestDate: '2024-01-14T00:00:00.000Z',
          },
        ],
        totalUsers: 2,
      });
    });

    it('handles empty leaderboard data', async () => {
      // Arrange
      const mockResult = {
        entries: [],
        totalUsers: 0,
      };
      
      mockGenerateLeaderboard.mockResolvedValue(mockResult);
      const request = new Request('http://localhost:3000/api/leaderboard/hrv');

      // Act
      const response = await GET(request);
      const responseData = await response.json();

      // Assert
      expect(responseData).toEqual({
        success: true,
        data: [],
        totalUsers: 0,
      });
    });

    it('handles server errors gracefully', async () => {
      // Arrange
      const errorMessage = 'Database connection failed';
      mockGenerateLeaderboard.mockRejectedValue(new Error(errorMessage));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const request = new Request('http://localhost:3000/api/leaderboard/hrv');

      // Act
      const response = await GET(request);
      const responseData = await response.json();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching HRV leaderboard:', 
        expect.any(Error)
      );
      
      expect(response.status).toBe(500);
      expect(responseData).toEqual({
        success: false,
        error: 'Failed to fetch leaderboard data'
      });

      consoleSpy.mockRestore();
    });

    it('transforms avgValue to avgHRV for backward compatibility', async () => {
      // Arrange
      const mockResult = {
        entries: [
          {
            userId: 'test-user',
            name: 'Test User',
            profileImage: undefined,
            avgValue: 50.0,
            dataPoints: 5,
            latestDate: '2024-01-01T00:00:00.000Z',
          },
        ],
        totalUsers: 1,
      };
      
      mockGenerateLeaderboard.mockResolvedValue(mockResult);
      const request = new Request('http://localhost:3000/api/leaderboard/hrv');

      // Act
      const response = await GET(request);
      const responseData = await response.json();

      // Assert
      const expectedTransformedData = [{
        userId: 'test-user',
        name: 'Test User',
        profileImage: undefined,
        avgHRV: 50.0, // This should be transformed from avgValue
        dataPoints: 5,
        latestDate: '2024-01-01T00:00:00.000Z',
      }];

      expect(responseData).toEqual({
        success: true,
        data: expectedTransformedData,
        totalUsers: 1,
      });
    });
  });
});
