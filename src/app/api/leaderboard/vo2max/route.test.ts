import { GET } from './route';
import { generateLeaderboard } from '@/server/leaderboard';

// Mock the server leaderboard function
jest.mock('@/server/leaderboard', () => ({
  generateLeaderboard: jest.fn(),
}));

const mockGenerateLeaderboard = generateLeaderboard as jest.MockedFunction<typeof generateLeaderboard>;

describe('/api/leaderboard/vo2max', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('successfully fetches VO2 max leaderboard data', async () => {
      // Arrange
      const mockResult = {
        entries: [
          {
            userId: 'user1',
            name: 'John Doe',
            profileImage: 'profile1.jpg',
            avgValue: 58.5,
            dataPoints: 15,
            latestDate: '2024-01-15T00:00:00.000Z',
          },
          {
            userId: 'user2', 
            name: 'Jane Smith',
            profileImage: null,
            avgValue: 55.2,
            dataPoints: 12,
            latestDate: '2024-01-14T00:00:00.000Z',
          },
        ],
        totalUsers: 2,
      };
      
      mockGenerateLeaderboard.mockResolvedValue(mockResult);
      const request = new Request('http://localhost:3000/api/leaderboard/vo2max');

      // Act
      const response = await GET(request);
      const responseData = await response.json();

      // Assert
      expect(mockGenerateLeaderboard).toHaveBeenCalledWith('vo2max', {
        timeWindowDays: 30,
        minDataPoints: 1,
        maxEntries: 100,
      });

      expect(responseData).toEqual({
        success: true,
        data: mockResult.entries, // No transformation needed for VO2 max
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
      const request = new Request('http://localhost:3000/api/leaderboard/vo2max');

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
      const request = new Request('http://localhost:3000/api/leaderboard/vo2max');

      // Act
      const response = await GET(request);
      const responseData = await response.json();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching VO2 max leaderboard:',
        expect.any(Error)
      );
      
      expect(response.status).toBe(500);
      expect(responseData).toEqual({
        success: false,
        error: 'Failed to fetch leaderboard'
      });

      consoleSpy.mockRestore();
    });

    it('passes correct parameters to generateLeaderboard', async () => {
      // Arrange
      const mockResult = { entries: [], totalUsers: 0 };
      mockGenerateLeaderboard.mockResolvedValue(mockResult);
      const request = new Request('http://localhost:3000/api/leaderboard/vo2max');

      // Act
      const response = await GET(request);
      await response.json();

      // Assert
      expect(mockGenerateLeaderboard).toHaveBeenCalledTimes(1);
      expect(mockGenerateLeaderboard).toHaveBeenCalledWith('vo2max', {
        timeWindowDays: 30,
        minDataPoints: 1, 
        maxEntries: 100,
      });
    });

    it('returns data without transformation', async () => {
      // Arrange
      const originalEntry = {
        userId: 'test-user',
        name: 'Test User',
        profileImage: 'test.jpg',
        avgValue: 60.0, // Should remain as avgValue, not transformed
        dataPoints: 20,
        latestDate: '2024-01-01T00:00:00.000Z',
      };
      
      const mockResult = {
        entries: [originalEntry],
        totalUsers: 1,
      };
      
      mockGenerateLeaderboard.mockResolvedValue(mockResult);
      const request = new Request('http://localhost:3000/api/leaderboard/vo2max');

      // Act
      const response = await GET(request);
      const responseData = await response.json();

      // Assert
      expect(responseData).toEqual({
        success: true,
        data: [originalEntry], // Should be returned as-is without transformation
        totalUsers: 1,
      });
    });
  });
});
