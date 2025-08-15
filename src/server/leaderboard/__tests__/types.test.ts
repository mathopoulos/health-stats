import {
  type HealthDataPoint,
  type UserRecord,
  type LeaderboardEntry,
  type LeaderboardResult,
  type LeaderboardMetric,
  type LeaderboardOptions,
} from '../types';

describe('Leaderboard Types', () => {
  it('should define HealthDataPoint interface correctly', () => {
    const healthDataPoint: HealthDataPoint = {
      date: '2024-01-15',
      value: 45.5,
    };

    expect(healthDataPoint).toHaveProperty('date');
    expect(healthDataPoint).toHaveProperty('value');
    expect(typeof healthDataPoint.date).toBe('string');
    expect(typeof healthDataPoint.value).toBe('number');
  });

  it('should define UserRecord interface correctly', () => {
    const userRecord: UserRecord = {
      userId: 'user123',
      name: 'John Doe',
      profileImage: 'https://example.com/image.jpg',
    };

    expect(userRecord).toHaveProperty('userId');
    expect(userRecord).toHaveProperty('name');
    expect(userRecord).toHaveProperty('profileImage');

    // Optional profileImage
    const userWithoutImage: UserRecord = {
      userId: 'user456',
      name: 'Jane Doe',
    };

    expect(userWithoutImage.profileImage).toBeUndefined();
  });

  it('should define LeaderboardEntry interface correctly', () => {
    const entry: LeaderboardEntry = {
      userId: 'user123',
      name: 'John Doe',
      profileImage: 'https://example.com/image.jpg',
      avgValue: 45.5,
      dataPoints: 10,
      latestDate: '2024-01-15',
    };

    expect(entry).toHaveProperty('userId');
    expect(entry).toHaveProperty('name');
    expect(entry).toHaveProperty('avgValue');
    expect(entry).toHaveProperty('dataPoints');
    expect(entry).toHaveProperty('latestDate');
    expect(typeof entry.avgValue).toBe('number');
    expect(typeof entry.dataPoints).toBe('number');
  });

  it('should define LeaderboardResult interface correctly', () => {
    const result: LeaderboardResult = {
      entries: [
        {
          userId: 'user123',
          name: 'John Doe',
          avgValue: 45.5,
          dataPoints: 10,
          latestDate: '2024-01-15',
        },
      ],
      totalUsers: 1,
      lastUpdated: '2024-01-15T10:30:00.000Z',
    };

    expect(result).toHaveProperty('entries');
    expect(result).toHaveProperty('totalUsers');
    expect(result).toHaveProperty('lastUpdated');
    expect(Array.isArray(result.entries)).toBe(true);
    expect(typeof result.totalUsers).toBe('number');
  });

  it('should define LeaderboardMetric type correctly', () => {
    const hrvMetric: LeaderboardMetric = 'hrv';
    const vo2maxMetric: LeaderboardMetric = 'vo2max';

    expect(hrvMetric).toBe('hrv');
    expect(vo2maxMetric).toBe('vo2max');
  });

  it('should define LeaderboardOptions interface correctly', () => {
    const options: LeaderboardOptions = {
      timeWindowDays: 30,
      minDataPoints: 5,
      maxEntries: 100,
    };

    expect(options.timeWindowDays).toBe(30);
    expect(options.minDataPoints).toBe(5);
    expect(options.maxEntries).toBe(100);

    // All properties should be optional
    const emptyOptions: LeaderboardOptions = {};
    expect(emptyOptions).toEqual({});
  });

  it('should allow partial LeaderboardOptions', () => {
    const partialOptions: LeaderboardOptions = {
      timeWindowDays: 7,
    };

    expect(partialOptions.timeWindowDays).toBe(7);
    expect(partialOptions.minDataPoints).toBeUndefined();
    expect(partialOptions.maxEntries).toBeUndefined();
  });
});
