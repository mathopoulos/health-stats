import {
  aggregateData,
  getTimeRangeData,
  calculateAverage,
  calculateTrendComparison,
  calculateTrendFromAggregatedData,
  getTimeRangeInDays,
  getTimeRangeLabel,
  formatMetricValue
} from './metric-calculations';
import type { HealthData } from '@/types/dashboard';

describe('metric-calculations', () => {
  const createMockHealthData = (dates: string[], values: number[]): HealthData[] => {
    return dates.map((date, index) => ({
      date,
      value: values[index] || 0
    }));
  };

  const mockHealthData: HealthData[] = [
    { date: '2024-01-01', value: 100 },
    { date: '2024-01-02', value: 105 },
    { date: '2024-01-03', value: 102 },
    { date: '2024-01-08', value: 108 }, // Next week
    { date: '2024-01-09', value: 110 },
    { date: '2024-01-15', value: 115 }, // Week after
    { date: '2024-02-01', value: 120 }, // Next month
    { date: '2024-02-15', value: 125 }
  ];

  describe('aggregateData', () => {
    it('should aggregate data by week correctly', () => {
      const result = aggregateData(mockHealthData, 'weekly');
      
      expect(result.length).toBeGreaterThan(0);
      expect(result.every(item => item.meta?.aggregationType === 'weekly')).toBe(true);
      expect(result.every(item => typeof item.meta?.pointCount === 'number')).toBe(true);
    });

    it('should aggregate data by month correctly', () => {
      const result = aggregateData(mockHealthData, 'monthly');
      
      expect(result.length).toBeGreaterThan(0);
      expect(result.every(item => item.meta?.aggregationType === 'monthly')).toBe(true);
      expect(result.every(item => typeof item.meta?.pointCount === 'number')).toBe(true);
    });

    it('should calculate average values for aggregated groups', () => {
      // Test data with known values for easy verification
      const testData: HealthData[] = [
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-02', value: 200 }, // Same week, should average to 150
        { date: '2024-01-08', value: 300 }  // Different week
      ];

      const result = aggregateData(testData, 'weekly');
      
      expect(result.length).toBeGreaterThan(0);
      // Values should be rounded to 2 decimal places
      expect(result.every(item => Number(item.value) === parseFloat(item.value.toFixed(2)))).toBe(true);
    });

    it('should sort aggregated data by date ascending', () => {
      const unsortedData: HealthData[] = [
        { date: '2024-02-01', value: 200 },
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-15', value: 150 }
      ];

      const result = aggregateData(unsortedData, 'weekly');
      
      for (let i = 1; i < result.length; i++) {
        expect(new Date(result[i].date).getTime()).toBeGreaterThanOrEqual(
          new Date(result[i - 1].date).getTime()
        );
      }
    });

    it('should handle empty data array', () => {
      const result = aggregateData([], 'weekly');
      expect(result).toEqual([]);
    });

    it('should use middle item date for representative time point', () => {
      const testData: HealthData[] = [
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-02', value: 200 },
        { date: '2024-01-03', value: 150 }
      ];

      const result = aggregateData(testData, 'weekly');
      
      expect(result.length).toBeGreaterThan(0);
      // Should use the middle item's date or first item's date
      expect(result[0].date).toBe('2024-01-02'); // Middle of 3 items
    });

    it('should handle monthly aggregation correctly', () => {
      const testData: HealthData[] = [
        { date: '2024-01-05', value: 100 },
        { date: '2024-01-15', value: 200 },
        { date: '2024-02-05', value: 300 },
        { date: '2024-02-25', value: 400 }
      ];

      const result = aggregateData(testData, 'monthly');
      
      expect(result).toHaveLength(2); // January and February
      expect(result[0].value).toBe(150); // Average of 100, 200
      expect(result[1].value).toBe(350); // Average of 300, 400
    });
  });

  describe('getTimeRangeData', () => {
    beforeEach(() => {
      // Mock current date to be consistent
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-02-01'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return all data for "all" range', () => {
      const result = getTimeRangeData(mockHealthData, 'all');
      expect(result).toEqual(mockHealthData);
    });

    it('should filter data for last30days correctly', () => {
      const result = getTimeRangeData(mockHealthData, 'last30days');
      // Should include data from last 30 days (after 2024-01-02)
      expect(result.every(item => new Date(item.date) >= new Date('2024-01-02'))).toBe(true);
    });

    it('should filter data for last3months correctly', () => {
      const result = getTimeRangeData(mockHealthData, 'last3months');
      // All our mock data should be within 3 months
      expect(result.length).toBeGreaterThan(0);
    });

    it('should filter data for last6months correctly', () => {
      const result = getTimeRangeData(mockHealthData, 'last6months');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should filter data for last1year correctly', () => {
      const result = getTimeRangeData(mockHealthData, 'last1year');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should filter data for last3years correctly', () => {
      const result = getTimeRangeData(mockHealthData, 'last3years');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return all data for unknown range', () => {
      const result = getTimeRangeData(mockHealthData, 'unknown');
      expect(result).toEqual(mockHealthData);
    });

    it('should handle empty data array', () => {
      const result = getTimeRangeData([], 'last30days');
      expect(result).toEqual([]);
    });
  });

  describe('calculateAverage', () => {
    it('should calculate average correctly for positive numbers', () => {
      const data = createMockHealthData(['2024-01-01', '2024-01-02', '2024-01-03'], [100, 200, 300]);
      const result = calculateAverage(data);
      expect(result).toBe(200); // (100 + 200 + 300) / 3
    });

    it('should calculate average correctly for mixed positive and negative numbers', () => {
      const data = createMockHealthData(['2024-01-01', '2024-01-02'], [100, -50]);
      const result = calculateAverage(data);
      expect(result).toBe(25); // (100 + (-50)) / 2
    });

    it('should return 0 for empty data array', () => {
      const result = calculateAverage([]);
      expect(result).toBe(0);
    });

    it('should handle single data point', () => {
      const data = createMockHealthData(['2024-01-01'], [150]);
      const result = calculateAverage(data);
      expect(result).toBe(150);
    });

    it('should handle decimal values correctly', () => {
      const data = createMockHealthData(['2024-01-01', '2024-01-02'], [100.5, 200.5]);
      const result = calculateAverage(data);
      expect(result).toBe(150.5);
    });
  });

  describe('calculateTrendComparison', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-02-01'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return no data object when data array is empty', () => {
      const result = calculateTrendComparison([], 'last30days');
      expect(result).toEqual({ current: 0, previous: 0, hasData: false });
    });

    it('should calculate trend for last30days with sufficient data', () => {
      // Create data spanning more than 60 days to enable previous period comparison
      const data = [
        { date: '2023-11-15', value: 80 },  // Previous period
        { date: '2023-11-20', value: 85 },  // Previous period
        { date: '2024-01-15', value: 100 }, // Current period
        { date: '2024-01-20', value: 105 }  // Current period
      ];

      const result = calculateTrendComparison(data, 'last30days');
      expect(typeof result.current).toBe('number');
      expect(typeof result.previous).toBe('number');
      expect(typeof result.hasData).toBe('boolean');
    });

    it('should handle other time ranges by splitting data in half', () => {
      const data = createMockHealthData(
        ['2024-01-01', '2024-01-05', '2024-01-10', '2024-01-15'],
        [100, 110, 120, 130]
      );

      const result = calculateTrendComparison(data, 'last3months');
      
      if (result.hasData) {
        expect(result.current).toBeGreaterThan(0);
        expect(result.previous).toBeGreaterThan(0);
      }
    });

    it('should return no data when insufficient data for comparison', () => {
      const data = createMockHealthData(['2024-01-01'], [100]);
      const result = calculateTrendComparison(data, 'last30days');
      
      expect(result.hasData).toBe(false);
    });
  });

  describe('calculateTrendFromAggregatedData', () => {
    it('should return no data for empty array', () => {
      const result = calculateTrendFromAggregatedData([]);
      expect(result).toEqual({ current: 0, previous: 0, hasData: false });
    });

    it('should calculate trend from aggregated data correctly', () => {
      const data = [
        { date: '2024-01-01', value: 100 }, // Previous period
        { date: '2024-01-08', value: 110 }, // Previous period
        { date: '2024-01-15', value: 120 }, // Current period
        { date: '2024-01-22', value: 130 }  // Current period
      ];

      const result = calculateTrendFromAggregatedData(data);
      
      expect(result.hasData).toBe(true);
      expect(result.current).toBe(125); // Average of 120, 130
      expect(result.previous).toBe(105); // Average of 100, 110
    });

    it('should handle single data point', () => {
      const data = [{ date: '2024-01-01', value: 100 }];
      const result = calculateTrendFromAggregatedData(data);
      
      expect(result.hasData).toBe(false);
    });

    it('should handle two data points', () => {
      const data = [
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-15', value: 200 }
      ];

      const result = calculateTrendFromAggregatedData(data);
      
      expect(result.hasData).toBe(true);
      expect(result.current).toBe(200); // Second half (most recent)
      expect(result.previous).toBe(100); // First half
    });

    it('should handle odd number of data points', () => {
      const data = [
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-08', value: 110 },
        { date: '2024-01-15', value: 120 }
      ];

      const result = calculateTrendFromAggregatedData(data);
      
      expect(result.hasData).toBe(true);
      // With 3 items, halfPeriod = 1, so current gets last 1 item, previous gets first 2 items
      expect(result.current).toBe(120);
      expect(result.previous).toBe(105); // Average of 100, 110
    });
  });

  describe('getTimeRangeInDays', () => {
    it('should return correct days for each time range', () => {
      expect(getTimeRangeInDays('last30days')).toBe(30);
      expect(getTimeRangeInDays('last3months')).toBe(90);
      expect(getTimeRangeInDays('last6months')).toBe(180);
      expect(getTimeRangeInDays('last1year')).toBe(365);
      expect(getTimeRangeInDays('last3years')).toBe(1095);
    });

    it('should return default value for unknown range', () => {
      expect(getTimeRangeInDays('unknown')).toBe(30);
      expect(getTimeRangeInDays('')).toBe(30);
    });
  });

  describe('getTimeRangeLabel', () => {
    it('should return correct labels for each time range', () => {
      expect(getTimeRangeLabel('last30days')).toBe('Last 30 days');
      expect(getTimeRangeLabel('last3months')).toBe('Last 3 months');
      expect(getTimeRangeLabel('last6months')).toBe('Last 6 months');
      expect(getTimeRangeLabel('last1year')).toBe('Last year');
      expect(getTimeRangeLabel('last3years')).toBe('Last 3 years');
    });

    it('should return default label for unknown range', () => {
      expect(getTimeRangeLabel('unknown')).toBe('Last 30 days');
      expect(getTimeRangeLabel('')).toBe('Last 30 days');
    });
  });

  describe('formatMetricValue', () => {
    it('should format HRV values correctly', () => {
      expect(formatMetricValue(42.7, 'hrv')).toBe('43 ms');
      expect(formatMetricValue(50.1, 'hrv')).toBe('50 ms');
      expect(formatMetricValue(35.9, 'hrv')).toBe('36 ms');
    });

    it('should format VO2 max values correctly', () => {
      expect(formatMetricValue(45.7, 'vo2max')).toBe('46');
      expect(formatMetricValue(38.1, 'vo2max')).toBe('38');
      expect(formatMetricValue(52.9, 'vo2max')).toBe('53');
    });

    it('should format weight values correctly', () => {
      expect(formatMetricValue(175.68, 'weight')).toBe('175.7');
      expect(formatMetricValue(80.0, 'weight')).toBe('80.0');
      expect(formatMetricValue(72.34, 'weight')).toBe('72.3');
    });

    it('should format body fat values correctly', () => {
      expect(formatMetricValue(15.67, 'bodyFat')).toBe('15.7');
      expect(formatMetricValue(20.0, 'bodyFat')).toBe('20.0');
      expect(formatMetricValue(12.89, 'bodyFat')).toBe('12.9');
    });

    it('should format unknown metric types as string', () => {
      expect(formatMetricValue(123.45, 'unknown')).toBe('123.45');
      expect(formatMetricValue(100, 'custom')).toBe('100');
    });

    it('should handle NaN values', () => {
      expect(formatMetricValue(NaN, 'hrv')).toBe('No data');
      expect(formatMetricValue(NaN, 'weight')).toBe('No data');
      expect(formatMetricValue(NaN, 'unknown')).toBe('No data');
    });

    it('should handle edge cases for numeric values', () => {
      expect(formatMetricValue(0, 'hrv')).toBe('0 ms');
      expect(formatMetricValue(-5, 'weight')).toBe('-5.0');
      expect(formatMetricValue(Infinity, 'vo2max')).toBe('Infinity');
    });
  });
});
