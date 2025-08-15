import type {
  LeaderboardMetric,
  TimeRange,
  LeaderboardEntry,
  LeaderboardData,
  LeaderboardFilters,
  LeaderboardState,
  LeaderboardApiResponse,
  LeaderboardTabsProps,
  LeaderboardTableProps,
  LeaderboardEntryProps,
  LeaderboardHeaderProps,
  RankConfig,
  MetricConfig,
  UseLeaderboardDataReturn,
  UseLeaderboardFiltersReturn,
} from '../index';

// Type utilities for testing
function isLeaderboardMetric(value: string): value is LeaderboardMetric {
  return value === 'hrv' || value === 'vo2max';
}

function isTimeRange(value: string): value is TimeRange {
  return value === '7d' || value === '30d' || value === '90d';
}

function isValidLeaderboardEntry(entry: any): entry is LeaderboardEntry {
  return (
    typeof entry === 'object' &&
    entry !== null &&
    typeof entry.userId === 'string' &&
    typeof entry.name === 'string' &&
    (entry.profileImage === undefined || typeof entry.profileImage === 'string') &&
    typeof entry.value === 'number' &&
    typeof entry.dataPoints === 'number' &&
    typeof entry.latestDate === 'string' &&
    typeof entry.rank === 'number'
  );
}

describe('Leaderboard Types', () => {
  describe('LeaderboardMetric', () => {
    it('accepts valid metric values', () => {
      const hrvMetric: LeaderboardMetric = 'hrv';
      const vo2maxMetric: LeaderboardMetric = 'vo2max';

      expect(isLeaderboardMetric(hrvMetric)).toBe(true);
      expect(isLeaderboardMetric(vo2maxMetric)).toBe(true);
    });

    it('type guard works correctly', () => {
      expect(isLeaderboardMetric('hrv')).toBe(true);
      expect(isLeaderboardMetric('vo2max')).toBe(true);
      expect(isLeaderboardMetric('invalid')).toBe(false);
      expect(isLeaderboardMetric('')).toBe(false);
    });
  });

  describe('TimeRange', () => {
    it('accepts valid time range values', () => {
      const sevenDays: TimeRange = '7d';
      const thirtyDays: TimeRange = '30d';
      const ninetyDays: TimeRange = '90d';

      expect(isTimeRange(sevenDays)).toBe(true);
      expect(isTimeRange(thirtyDays)).toBe(true);
      expect(isTimeRange(ninetyDays)).toBe(true);
    });

    it('type guard works correctly', () => {
      expect(isTimeRange('7d')).toBe(true);
      expect(isTimeRange('30d')).toBe(true);
      expect(isTimeRange('90d')).toBe(true);
      expect(isTimeRange('1d')).toBe(false);
      expect(isTimeRange('invalid')).toBe(false);
    });
  });

  describe('LeaderboardEntry', () => {
    it('creates valid entry objects', () => {
      const entry: LeaderboardEntry = {
        userId: 'user-123',
        name: 'John Doe',
        profileImage: 'profile.jpg',
        value: 45.5,
        dataPoints: 10,
        latestDate: '2024-01-15T00:00:00.000Z',
        rank: 1,
      };

      expect(isValidLeaderboardEntry(entry)).toBe(true);
      expect(entry.userId).toBe('user-123');
      expect(entry.name).toBe('John Doe');
      expect(entry.profileImage).toBe('profile.jpg');
      expect(entry.value).toBe(45.5);
      expect(entry.dataPoints).toBe(10);
      expect(entry.latestDate).toBe('2024-01-15T00:00:00.000Z');
      expect(entry.rank).toBe(1);
    });

    it('allows optional profileImage', () => {
      const entryWithoutImage: LeaderboardEntry = {
        userId: 'user-456',
        name: 'Jane Smith',
        value: 42.3,
        dataPoints: 8,
        latestDate: '2024-01-14T00:00:00.000Z',
        rank: 2,
      };

      expect(isValidLeaderboardEntry(entryWithoutImage)).toBe(true);
      expect(entryWithoutImage.profileImage).toBeUndefined();
    });

    it('validates entry structure', () => {
      const invalidEntry = {
        userId: 'user-789',
        name: 'Invalid Entry',
        // missing required properties
      };

      expect(isValidLeaderboardEntry(invalidEntry)).toBe(false);
    });
  });

  describe('LeaderboardData', () => {
    it('creates valid leaderboard data objects', () => {
      const leaderboardData: LeaderboardData = {
        entries: [
          {
            userId: 'user-1',
            name: 'User One',
            value: 45.5,
            dataPoints: 10,
            latestDate: '2024-01-15T00:00:00.000Z',
            rank: 1,
          },
        ],
        totalUsers: 100,
        lastUpdated: '2024-01-15T12:00:00.000Z',
        metric: 'hrv',
      };

      expect(leaderboardData.entries).toHaveLength(1);
      expect(leaderboardData.totalUsers).toBe(100);
      expect(leaderboardData.lastUpdated).toBe('2024-01-15T12:00:00.000Z');
      expect(leaderboardData.metric).toBe('hrv');
    });

    it('allows empty entries array', () => {
      const emptyData: LeaderboardData = {
        entries: [],
        totalUsers: 0,
        lastUpdated: '2024-01-15T12:00:00.000Z',
        metric: 'vo2max',
      };

      expect(emptyData.entries).toHaveLength(0);
      expect(emptyData.totalUsers).toBe(0);
    });
  });

  describe('LeaderboardFilters', () => {
    it('creates valid filter objects', () => {
      const filters: LeaderboardFilters = {
        metric: 'hrv',
        timeRange: '30d',
        minDataPoints: 1,
      };

      expect(filters.metric).toBe('hrv');
      expect(filters.timeRange).toBe('30d');
      expect(filters.minDataPoints).toBe(1);
    });

    it('allows optional minDataPoints', () => {
      const filtersWithoutMin: LeaderboardFilters = {
        metric: 'vo2max',
        timeRange: '7d',
      };

      expect(filtersWithoutMin.metric).toBe('vo2max');
      expect(filtersWithoutMin.timeRange).toBe('7d');
      expect(filtersWithoutMin.minDataPoints).toBeUndefined();
    });
  });

  describe('LeaderboardState', () => {
    it('creates valid state objects', () => {
      const state: LeaderboardState = {
        hrv: {
          entries: [],
          totalUsers: 0,
          lastUpdated: '2024-01-15T12:00:00.000Z',
          metric: 'hrv',
        },
        vo2max: null,
        loading: {
          hrv: false,
          vo2max: true,
        },
        error: {
          hrv: null,
          vo2max: 'Connection failed',
        },
      };

      expect(state.hrv).not.toBeNull();
      expect(state.vo2max).toBeNull();
      expect(state.loading.hrv).toBe(false);
      expect(state.loading.vo2max).toBe(true);
      expect(state.error.hrv).toBeNull();
      expect(state.error.vo2max).toBe('Connection failed');
    });
  });

  describe('LeaderboardApiResponse', () => {
    it('creates valid success response', () => {
      const response: LeaderboardApiResponse = {
        success: true,
        data: [
          {
            userId: 'user-1',
            name: 'Test User',
            profileImage: 'profile.jpg',
            avgHRV: 45.5,
            dataPoints: 10,
            latestDate: '2024-01-15T00:00:00.000Z',
          },
        ],
        totalUsers: 1,
      };

      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(1);
      expect(response.totalUsers).toBe(1);
      expect(response.error).toBeUndefined();
    });

    it('creates valid error response', () => {
      const errorResponse: LeaderboardApiResponse = {
        success: false,
        data: [],
        totalUsers: 0,
        error: 'Failed to fetch data',
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.data).toHaveLength(0);
      expect(errorResponse.error).toBe('Failed to fetch data');
    });

    it('supports both avgHRV and avgValue in data', () => {
      const responseWithAvgValue: LeaderboardApiResponse = {
        success: true,
        data: [
          {
            userId: 'user-1',
            name: 'Test User',
            avgValue: 58.5, // VO2 max uses avgValue
            dataPoints: 15,
            latestDate: '2024-01-15T00:00:00.000Z',
          },
        ],
        totalUsers: 1,
      };

      expect(responseWithAvgValue.data[0].avgValue).toBe(58.5);
      expect(responseWithAvgValue.data[0].avgHRV).toBeUndefined();
    });
  });

  describe('Component Props Types', () => {
    it('validates LeaderboardTabsProps', () => {
      const tabsProps: LeaderboardTabsProps = {
        activeTab: 'hrv',
        onTabChange: jest.fn(),
        loading: {
          hrv: false,
          vo2max: true,
        },
      };

      expect(tabsProps.activeTab).toBe('hrv');
      expect(typeof tabsProps.onTabChange).toBe('function');
      expect(tabsProps.loading?.hrv).toBe(false);
      expect(tabsProps.loading?.vo2max).toBe(true);
    });

    it('validates LeaderboardTableProps', () => {
      const tableProps: LeaderboardTableProps = {
        data: [],
        loading: true,
        error: null,
        metric: 'vo2max',
        onRetry: jest.fn(),
      };

      expect(tableProps.data).toHaveLength(0);
      expect(tableProps.loading).toBe(true);
      expect(tableProps.error).toBeNull();
      expect(tableProps.metric).toBe('vo2max');
      expect(typeof tableProps.onRetry).toBe('function');
    });

    it('validates LeaderboardEntryProps', () => {
      const entryProps: LeaderboardEntryProps = {
        entry: {
          userId: 'user-1',
          name: 'Test User',
          value: 45.5,
          dataPoints: 10,
          latestDate: '2024-01-15T00:00:00.000Z',
          rank: 1,
        },
        metric: 'hrv',
        isTopThree: true,
      };

      expect(entryProps.entry.userId).toBe('user-1');
      expect(entryProps.metric).toBe('hrv');
      expect(entryProps.isTopThree).toBe(true);
    });

    it('validates LeaderboardHeaderProps', () => {
      const headerProps: LeaderboardHeaderProps = {
        totalUsers: 150,
        lastUpdated: '2024-01-15T12:00:00.000Z',
        loading: false,
      };

      expect(headerProps.totalUsers).toBe(150);
      expect(headerProps.lastUpdated).toBe('2024-01-15T12:00:00.000Z');
      expect(headerProps.loading).toBe(false);
    });
  });

  describe('Utility Types', () => {
    it('validates RankConfig', () => {
      const rankConfig: RankConfig = {
        text: '1st',
        color: 'text-yellow-500',
        gradient: 'from-yellow-400',
        icon: '🏆',
      };

      expect(rankConfig.text).toBe('1st');
      expect(rankConfig.color).toBe('text-yellow-500');
      expect(rankConfig.gradient).toBe('from-yellow-400');
      expect(rankConfig.icon).toBe('🏆');
    });

    it('validates MetricConfig', () => {
      const metricConfig: MetricConfig = {
        label: 'HRV',
        unit: 'ms',
        icon: '❤️',
        description: 'Heart Rate Variability',
      };

      expect(metricConfig.label).toBe('HRV');
      expect(metricConfig.unit).toBe('ms');
      expect(metricConfig.icon).toBe('❤️');
      expect(metricConfig.description).toBe('Heart Rate Variability');
    });
  });

  describe('Hook Return Types', () => {
    it('validates UseLeaderboardDataReturn', () => {
      const hookReturn: UseLeaderboardDataReturn = {
        state: {
          hrv: null,
          vo2max: null,
          loading: { hrv: false, vo2max: false },
          error: { hrv: null, vo2max: null },
        },
        refreshData: jest.fn(),
        clearError: jest.fn(),
      };

      expect(hookReturn.state).toBeDefined();
      expect(typeof hookReturn.refreshData).toBe('function');
      expect(typeof hookReturn.clearError).toBe('function');
    });

    it('validates UseLeaderboardFiltersReturn', () => {
      const filtersReturn: UseLeaderboardFiltersReturn = {
        filters: {
          metric: 'hrv',
          timeRange: '30d',
          minDataPoints: 1,
        },
        setMetric: jest.fn(),
        setTimeRange: jest.fn(),
        setMinDataPoints: jest.fn(),
        resetFilters: jest.fn(),
      };

      expect(filtersReturn.filters).toBeDefined();
      expect(typeof filtersReturn.setMetric).toBe('function');
      expect(typeof filtersReturn.setTimeRange).toBe('function');
      expect(typeof filtersReturn.setMinDataPoints).toBe('function');
      expect(typeof filtersReturn.resetFilters).toBe('function');
    });
  });

  describe('Type Compatibility', () => {
    it('LeaderboardEntry is compatible with API response data', () => {
      const apiData = {
        userId: 'user-1',
        name: 'Test User',
        profileImage: 'profile.jpg',
        avgHRV: 45.5,
        dataPoints: 10,
        latestDate: '2024-01-15T00:00:00.000Z',
      };

      // Should be able to transform API data to LeaderboardEntry
      const entry: LeaderboardEntry = {
        ...apiData,
        value: apiData.avgHRV!, // Transform avgHRV to value
        rank: 1, // Add rank
      };

      expect(entry.userId).toBe(apiData.userId);
      expect(entry.value).toBe(apiData.avgHRV);
    });

    it('filters work with all supported metrics and time ranges', () => {
      const metrics: LeaderboardMetric[] = ['hrv', 'vo2max'];
      const timeRanges: TimeRange[] = ['7d', '30d', '90d'];

      metrics.forEach(metric => {
        timeRanges.forEach(timeRange => {
          const filter: LeaderboardFilters = {
            metric,
            timeRange,
            minDataPoints: 1,
          };

          expect(isLeaderboardMetric(filter.metric)).toBe(true);
          expect(isTimeRange(filter.timeRange)).toBe(true);
        });
      });
    });
  });
});
