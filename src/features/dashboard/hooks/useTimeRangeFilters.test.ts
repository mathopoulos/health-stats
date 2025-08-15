import { renderHook, act } from '@testing-library/react';
import { useTimeRangeFilters } from './useTimeRangeFilters';
import type { HealthData } from '@/types/dashboard';

describe('useTimeRangeFilters', () => {
  const mockHealthData: HealthData[] = [
    { date: '2024-01-01', value: 100 },
    { date: '2024-01-15', value: 110 },
    { date: '2023-12-01', value: 90 },  // 1 month ago
    { date: '2023-11-01', value: 85 },  // 2 months ago
    { date: '2023-10-01', value: 80 },  // 3 months ago
    { date: '2023-07-01', value: 75 },  // 6 months ago
    { date: '2023-01-01', value: 70 },  // 1 year ago
    { date: '2022-01-01', value: 65 },  // 2 years ago
    { date: '2021-01-01', value: 60 }   // 3+ years ago
  ];

  beforeEach(() => {
    // Mock current date to be consistent
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-31')); // End of January 2024
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with default time ranges', () => {
    const { result } = renderHook(() => useTimeRangeFilters());

    expect(result.current.timeRanges).toEqual({
      weight: 'last1year',
      bodyFat: 'last1year',
      hrv: 'last1year',
      vo2max: 'last1year'
    });
  });

  it('should update weight time range', () => {
    const { result } = renderHook(() => useTimeRangeFilters());

    act(() => {
      result.current.setWeightTimeRange('last3months');
    });

    expect(result.current.timeRanges.weight).toBe('last3months');
    expect(result.current.timeRanges.bodyFat).toBe('last1year'); // unchanged
  });

  it('should update body fat time range', () => {
    const { result } = renderHook(() => useTimeRangeFilters());

    act(() => {
      result.current.setBodyFatTimeRange('last6months');
    });

    expect(result.current.timeRanges.bodyFat).toBe('last6months');
    expect(result.current.timeRanges.weight).toBe('last1year'); // unchanged
  });

  it('should update HRV time range', () => {
    const { result } = renderHook(() => useTimeRangeFilters());

    act(() => {
      result.current.setHrvTimeRange('last30days');
    });

    expect(result.current.timeRanges.hrv).toBe('last30days');
    expect(result.current.timeRanges.vo2max).toBe('last1year'); // unchanged
  });

  it('should update VO2max time range', () => {
    const { result } = renderHook(() => useTimeRangeFilters());

    act(() => {
      result.current.setVo2maxTimeRange('last3years');
    });

    expect(result.current.timeRanges.vo2max).toBe('last3years');
    expect(result.current.timeRanges.hrv).toBe('last1year'); // unchanged
  });

  it('should update multiple time ranges independently', () => {
    const { result } = renderHook(() => useTimeRangeFilters());

    act(() => {
      result.current.setWeightTimeRange('last30days');
      result.current.setBodyFatTimeRange('last3months');
      result.current.setHrvTimeRange('last6months');
      result.current.setVo2maxTimeRange('last3years');
    });

    expect(result.current.timeRanges).toEqual({
      weight: 'last30days',
      bodyFat: 'last3months',
      hrv: 'last6months',
      vo2max: 'last3years'
    });
  });

  describe('getTimeRangeData function', () => {
    it('should filter data for last30days correctly', () => {
      const { result } = renderHook(() => useTimeRangeFilters());

      const filtered = result.current.getTimeRangeData(mockHealthData, 'last30days');
      
      // Should include data from last 30 days (after 2024-01-01)
      const expectedData = mockHealthData.filter(item => new Date(item.date) >= new Date('2024-01-01'));
      expect(filtered).toEqual(expectedData);
    });

    it('should filter data for last3months correctly', () => {
      const { result } = renderHook(() => useTimeRangeFilters());

      const filtered = result.current.getTimeRangeData(mockHealthData, 'last3months');
      
      // Should include data from last 90 days (after approximately 2023-11-02)
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every(item => new Date(item.date) >= new Date('2023-11-02'))).toBe(true);
    });

    it('should filter data for last6months correctly', () => {
      const { result } = renderHook(() => useTimeRangeFilters());

      const filtered = result.current.getTimeRangeData(mockHealthData, 'last6months');
      
      // Should include data from last 180 days (after approximately 2023-08-04)
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every(item => new Date(item.date) >= new Date('2023-08-04'))).toBe(true);
    });

    it('should filter data for last1year correctly', () => {
      const { result } = renderHook(() => useTimeRangeFilters());

      const filtered = result.current.getTimeRangeData(mockHealthData, 'last1year');
      
      // Should include data from last 365 days (after approximately 2023-01-31)
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every(item => new Date(item.date) >= new Date('2023-01-31'))).toBe(true);
    });

    it('should filter data for last3years correctly', () => {
      const { result } = renderHook(() => useTimeRangeFilters());

      const filtered = result.current.getTimeRangeData(mockHealthData, 'last3years');
      
      // Should include data from last 3 years (after approximately 2021-01-31)
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every(item => new Date(item.date) >= new Date('2021-01-31'))).toBe(true);
    });

    it('should return all data for unknown time range', () => {
      const { result } = renderHook(() => useTimeRangeFilters());

      // @ts-expect-error - Testing invalid time range
      const filtered = result.current.getTimeRangeData(mockHealthData, 'invalid');
      
      expect(filtered).toEqual(mockHealthData);
    });

    it('should handle empty data array', () => {
      const { result } = renderHook(() => useTimeRangeFilters());

      const filtered = result.current.getTimeRangeData([], 'last30days');
      
      expect(filtered).toEqual([]);
    });

    it('should handle data array with one item', () => {
      const { result } = renderHook(() => useTimeRangeFilters());
      const singleItemData: HealthData[] = [{ date: '2024-01-15', value: 100 }];

      const filtered = result.current.getTimeRangeData(singleItemData, 'last30days');
      
      expect(filtered).toEqual(singleItemData);
    });

    it('should handle data with dates equal to cutoff date', () => {
      const { result } = renderHook(() => useTimeRangeFilters());
      
      // Create data exactly at the 30-day boundary
      const boundaryDate = new Date('2024-01-31');
      boundaryDate.setDate(boundaryDate.getDate() - 30);
      
      const boundaryData: HealthData[] = [
        { date: boundaryDate.toISOString().split('T')[0], value: 100 },
        { date: '2024-01-30', value: 110 }
      ];

      const filtered = result.current.getTimeRangeData(boundaryData, 'last30days');
      
      // Should include the boundary date (>= comparison)
      expect(filtered).toHaveLength(2);
    });

    it('should correctly filter with various date formats', () => {
      const { result } = renderHook(() => useTimeRangeFilters());
      const mixedFormatData: HealthData[] = [
        { date: '2024-01-15', value: 100 },        // YYYY-MM-DD
        { date: '2024-01-01T10:00:00Z', value: 110 }, // ISO string
      ];

      const filtered = result.current.getTimeRangeData(mixedFormatData, 'last30days');
      
      expect(filtered).toHaveLength(2); // Both should be included
    });

    it('should maintain original data order after filtering', () => {
      const { result } = renderHook(() => useTimeRangeFilters());
      const orderedData: HealthData[] = [
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-15', value: 110 },
        { date: '2024-01-20', value: 120 }
      ];

      const filtered = result.current.getTimeRangeData(orderedData, 'last30days');
      
      expect(filtered[0].date).toBe('2024-01-01');
      expect(filtered[1].date).toBe('2024-01-15');
      expect(filtered[2].date).toBe('2024-01-20');
    });
  });

  describe('edge cases', () => {
    it('should handle rapid successive updates', () => {
      const { result } = renderHook(() => useTimeRangeFilters());

      act(() => {
        result.current.setWeightTimeRange('last30days');
        result.current.setWeightTimeRange('last3months');
        result.current.setWeightTimeRange('last1year');
      });

      expect(result.current.timeRanges.weight).toBe('last1year');
    });

    it('should handle all valid time range values', () => {
      const { result } = renderHook(() => useTimeRangeFilters());
      const validRanges = ['last30days', 'last3months', 'last6months', 'last1year', 'last3years'] as const;

      validRanges.forEach(range => {
        act(() => {
          result.current.setWeightTimeRange(range);
        });
        expect(result.current.timeRanges.weight).toBe(range);
      });
    });

    it('should not mutate original data array when filtering', () => {
      const { result } = renderHook(() => useTimeRangeFilters());
      const originalData = [...mockHealthData];

      result.current.getTimeRangeData(mockHealthData, 'last30days');
      
      expect(mockHealthData).toEqual(originalData);
    });

    it('should handle data with future dates', () => {
      const { result } = renderHook(() => useTimeRangeFilters());
      const futureData: HealthData[] = [
        { date: '2025-01-01', value: 100 }, // Future date
        { date: '2024-01-15', value: 110 }  // Current period
      ];

      const filtered = result.current.getTimeRangeData(futureData, 'last30days');
      
      // Should include both (future dates are >= cutoff)
      expect(filtered).toHaveLength(2);
    });
  });
});
