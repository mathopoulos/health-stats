import {
  METRIC_CONFIGS,
  DEFAULT_FILTERS,
  RANK_COLORS,
  TIME_RANGE_OPTIONS,
  MIN_DATA_POINTS,
  CACHE_DURATION,
  MAX_LEADERBOARD_ENTRIES,
  LOADING_SKELETON_ROWS,
  RETRY_CONFIG,
} from '../constants';

describe('Leaderboard Constants', () => {
  describe('METRIC_CONFIGS', () => {
    it('contains HRV configuration', () => {
      expect(METRIC_CONFIGS.hrv).toEqual({
        label: 'HRV',
        unit: 'ms',
        icon: '❤️',
        description: 'Heart Rate Variability measures the variation in time between heartbeats',
      });
    });

    it('contains VO2 Max configuration', () => {
      expect(METRIC_CONFIGS.vo2max).toEqual({
        label: 'VO2 Max',
        unit: 'ml/kg/min',
        icon: '⚡',
        description: 'VO2 Max measures the maximum rate of oxygen consumption during exercise',
      });
    });

    it('has correct metric keys', () => {
      expect(Object.keys(METRIC_CONFIGS)).toEqual(['hrv', 'vo2max']);
    });

    it('all metrics have required properties', () => {
      Object.values(METRIC_CONFIGS).forEach(config => {
        expect(config).toHaveProperty('label');
        expect(config).toHaveProperty('unit');
        expect(config).toHaveProperty('icon');
        expect(config).toHaveProperty('description');
        
        expect(typeof config.label).toBe('string');
        expect(typeof config.unit).toBe('string');
        expect(typeof config.icon).toBe('string');
        expect(typeof config.description).toBe('string');
      });
    });
  });

  describe('DEFAULT_FILTERS', () => {
    it('has correct default values', () => {
      expect(DEFAULT_FILTERS).toEqual({
        metric: 'hrv',
        timeRange: '30d',
        minDataPoints: 1,
      });
    });

    it('has correct property types', () => {
      expect(typeof DEFAULT_FILTERS.metric).toBe('string');
      expect(typeof DEFAULT_FILTERS.timeRange).toBe('string');
      expect(typeof DEFAULT_FILTERS.minDataPoints).toBe('number');
    });

    it('has valid metric as default', () => {
      expect(METRIC_CONFIGS).toHaveProperty(DEFAULT_FILTERS.metric);
    });

    it('has valid time range as default', () => {
      const validTimeRanges = TIME_RANGE_OPTIONS.map(option => option.value);
      expect(validTimeRanges).toContain(DEFAULT_FILTERS.timeRange);
    });
  });

  describe('RANK_COLORS', () => {
    it('has colors for top 3 positions', () => {
      expect(RANK_COLORS[1]).toBe('gold');
      expect(RANK_COLORS[2]).toBe('silver');
      expect(RANK_COLORS[3]).toBe('bronze');
    });

    it('has default color', () => {
      expect(RANK_COLORS.default).toBe('indigo');
    });

    it('contains exactly 4 color mappings', () => {
      expect(Object.keys(RANK_COLORS)).toHaveLength(4);
    });

    it('all colors are strings', () => {
      Object.values(RANK_COLORS).forEach(color => {
        expect(typeof color).toBe('string');
        expect(color.length).toBeGreaterThan(0);
      });
    });
  });

  describe('TIME_RANGE_OPTIONS', () => {
    it('contains expected time ranges', () => {
      expect(TIME_RANGE_OPTIONS).toEqual([
        { value: '7d', label: 'Last 7 days' },
        { value: '30d', label: 'Last 30 days' },
        { value: '90d', label: 'Last 90 days' },
      ]);
    });

    it('has correct array length', () => {
      expect(TIME_RANGE_OPTIONS).toHaveLength(3);
    });

    it('all options have value and label properties', () => {
      TIME_RANGE_OPTIONS.forEach(option => {
        expect(option).toHaveProperty('value');
        expect(option).toHaveProperty('label');
        expect(typeof option.value).toBe('string');
        expect(typeof option.label).toBe('string');
      });
    });

    it('values follow expected pattern', () => {
      TIME_RANGE_OPTIONS.forEach(option => {
        expect(option.value).toMatch(/^\d+d$/);
      });
    });

    it('labels follow expected pattern', () => {
      TIME_RANGE_OPTIONS.forEach(option => {
        expect(option.label).toMatch(/^Last \d+ days$/);
      });
    });
  });

  describe('MIN_DATA_POINTS', () => {
    it('is a positive number', () => {
      expect(typeof MIN_DATA_POINTS).toBe('number');
      expect(MIN_DATA_POINTS).toBeGreaterThan(0);
      expect(MIN_DATA_POINTS).toBe(1);
    });

    it('matches default filter value', () => {
      expect(MIN_DATA_POINTS).toBe(DEFAULT_FILTERS.minDataPoints);
    });
  });

  describe('CACHE_DURATION', () => {
    it('is set to 5 minutes in milliseconds', () => {
      expect(typeof CACHE_DURATION).toBe('number');
      expect(CACHE_DURATION).toBe(5 * 60 * 1000);
      expect(CACHE_DURATION).toBe(300000);
    });

    it('is a positive number', () => {
      expect(CACHE_DURATION).toBeGreaterThan(0);
    });
  });

  describe('MAX_LEADERBOARD_ENTRIES', () => {
    it('is set to 100', () => {
      expect(typeof MAX_LEADERBOARD_ENTRIES).toBe('number');
      expect(MAX_LEADERBOARD_ENTRIES).toBe(100);
    });

    it('is a reasonable limit', () => {
      expect(MAX_LEADERBOARD_ENTRIES).toBeGreaterThan(0);
      expect(MAX_LEADERBOARD_ENTRIES).toBeLessThanOrEqual(1000);
    });
  });

  describe('LOADING_SKELETON_ROWS', () => {
    it('is set to 8', () => {
      expect(typeof LOADING_SKELETON_ROWS).toBe('number');
      expect(LOADING_SKELETON_ROWS).toBe(8);
    });

    it('is a reasonable number of skeleton rows', () => {
      expect(LOADING_SKELETON_ROWS).toBeGreaterThan(0);
      expect(LOADING_SKELETON_ROWS).toBeLessThanOrEqual(20);
    });
  });

  describe('RETRY_CONFIG', () => {
    it('has correct configuration structure', () => {
      expect(RETRY_CONFIG).toEqual({
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 10000,
      });
    });

    it('has valid retry attempt limit', () => {
      expect(typeof RETRY_CONFIG.maxAttempts).toBe('number');
      expect(RETRY_CONFIG.maxAttempts).toBeGreaterThan(0);
      expect(RETRY_CONFIG.maxAttempts).toBeLessThanOrEqual(10);
    });

    it('has valid delay configuration', () => {
      expect(typeof RETRY_CONFIG.baseDelay).toBe('number');
      expect(typeof RETRY_CONFIG.maxDelay).toBe('number');
      
      expect(RETRY_CONFIG.baseDelay).toBeGreaterThan(0);
      expect(RETRY_CONFIG.maxDelay).toBeGreaterThan(RETRY_CONFIG.baseDelay);
    });

    it('delays are in reasonable ranges', () => {
      expect(RETRY_CONFIG.baseDelay).toBe(1000); // 1 second
      expect(RETRY_CONFIG.maxDelay).toBe(10000); // 10 seconds
    });
  });

  describe('Constants consistency', () => {
    it('default metric exists in METRIC_CONFIGS', () => {
      expect(METRIC_CONFIGS[DEFAULT_FILTERS.metric]).toBeDefined();
    });

    it('default time range exists in TIME_RANGE_OPTIONS', () => {
      const timeRangeValues = TIME_RANGE_OPTIONS.map(option => option.value);
      expect(timeRangeValues).toContain(DEFAULT_FILTERS.timeRange);
    });

    it('minimum data points is consistent', () => {
      expect(DEFAULT_FILTERS.minDataPoints).toBe(MIN_DATA_POINTS);
    });

    it('all numeric constants are positive', () => {
      expect(MIN_DATA_POINTS).toBeGreaterThan(0);
      expect(CACHE_DURATION).toBeGreaterThan(0);
      expect(MAX_LEADERBOARD_ENTRIES).toBeGreaterThan(0);
      expect(LOADING_SKELETON_ROWS).toBeGreaterThan(0);
      expect(RETRY_CONFIG.maxAttempts).toBeGreaterThan(0);
      expect(RETRY_CONFIG.baseDelay).toBeGreaterThan(0);
      expect(RETRY_CONFIG.maxDelay).toBeGreaterThan(0);
    });
  });
});
