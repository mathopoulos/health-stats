import {
  calculateProgress,
  calculateTrend,
  calculateBloodMarkerTrend,
  getAdaptiveYAxisDomain
} from '../experimentCalculations';

describe('experimentCalculations', () => {
  describe('calculateProgress', () => {
    it('should return 0 for experiments that have not started', () => {
      const futureStart = new Date(Date.now() + 86400000).toISOString(); // Tomorrow
      const futureEnd = new Date(Date.now() + 172800000).toISOString(); // Day after tomorrow
      
      expect(calculateProgress(futureStart, futureEnd)).toBe(0);
    });

    it('should return 100 for experiments that have ended', () => {
      const pastStart = new Date(Date.now() - 172800000).toISOString(); // 2 days ago
      const pastEnd = new Date(Date.now() - 86400000).toISOString(); // Yesterday
      
      expect(calculateProgress(pastStart, pastEnd)).toBe(100);
    });

    it('should calculate correct progress for ongoing experiments', () => {
      const start = new Date(Date.now() - 86400000).toISOString(); // Yesterday
      const end = new Date(Date.now() + 86400000).toISOString(); // Tomorrow
      
      // Should be approximately 50%
      const progress = calculateProgress(start, end);
      expect(progress).toBeGreaterThan(40);
      expect(progress).toBeLessThan(60);
    });

    it('should return exactly 50% for mid-point experiments', () => {
      const totalDuration = 10 * 24 * 60 * 60 * 1000; // 10 days
      const halfDuration = totalDuration / 2;
      
      const start = new Date(Date.now() - halfDuration).toISOString();
      const end = new Date(Date.now() + halfDuration).toISOString();
      
      expect(calculateProgress(start, end)).toBe(50);
    });
  });

  describe('calculateTrend', () => {
    const mockExperiment = {
      startDate: '2023-01-01',
      endDate: '2023-01-31',
      status: 'completed' as const
    };

    it('should return null for insufficient data', () => {
      const data = [
        { date: '2023-01-01', value: 100 },
        { date: '2023-01-02', value: 105 }
      ];

      expect(calculateTrend(data, 'Weight', mockExperiment)).toBeNull();
    });

    it('should calculate trend for sufficient data', () => {
      const data = [
        { date: '2023-01-01', value: 100 },
        { date: '2023-01-08', value: 102 },
        { date: '2023-01-15', value: 98 },
        { date: '2023-01-22', value: 96 }
      ];

      const trend = calculateTrend(data, 'Weight', mockExperiment);
      
      expect(trend).not.toBeNull();
      expect(trend!.current).toBe(97); // Average of last two values
      expect(trend!.previous).toBe(101); // Average of first two values
      expect(trend!.isBodyFat).toBe(false);
    });

    it('should identify body fat metrics', () => {
      const data = [
        { date: '2023-01-01', value: 20 },
        { date: '2023-01-08', value: 19 },
        { date: '2023-01-15', value: 18 },
        { date: '2023-01-22', value: 17 }
      ];

      const trend = calculateTrend(data, 'Body Fat %', mockExperiment);
      
      expect(trend!.isBodyFat).toBe(true);
    });

    it('should return null when first half average is zero', () => {
      const data = [
        { date: '2023-01-01', value: 0 },
        { date: '2023-01-08', value: 0 },
        { date: '2023-01-15', value: 10 },
        { date: '2023-01-22', value: 20 }
      ];

      expect(calculateTrend(data, 'Weight', mockExperiment)).toBeNull();
    });

    it('should generate appropriate time range labels', () => {
      const longExperiment = {
        startDate: '2022-01-01',
        endDate: '2023-01-01',
        status: 'completed' as const
      };

      const data = [
        { date: '2022-01-01', value: 100 },
        { date: '2022-06-01', value: 102 },
        { date: '2022-09-01', value: 98 },
        { date: '2023-01-01', value: 96 }
      ];

      const trend = calculateTrend(data, 'Weight', longExperiment);
      expect(trend!.timeRangeLabel).toBe('past year');
    });
  });

  describe('calculateBloodMarkerTrend', () => {
    const mockExperiment = {
      startDate: '2023-01-01',
      endDate: '2023-01-31',
      status: 'completed' as const
    };

    it('should return null for insufficient data', () => {
      const data = [{ date: '2023-01-01', value: 100, unit: 'mg/dL' }];

      expect(calculateBloodMarkerTrend(data, mockExperiment)).toBeNull();
    });

    it('should calculate trend for blood marker data', () => {
      const data = [
        { date: '2023-01-01', value: 100, unit: 'mg/dL' },
        { date: '2023-01-15', value: 95, unit: 'mg/dL' },
        { date: '2023-01-20', value: 90, unit: 'mg/dL' },
        { date: '2023-01-31', value: 85, unit: 'mg/dL' }
      ];

      const trend = calculateBloodMarkerTrend(data, mockExperiment);
      
      expect(trend).not.toBeNull();
      expect(trend!.current).toBe(87.5); // Average of last two values
      expect(trend!.previous).toBe(97.5); // Average of first two values
      expect(trend!.min).toBe(0);
      expect(trend!.max).toBe(100);
    });

    it('should use reference ranges when available', () => {
      const data = [
        { 
          date: '2023-01-01', 
          value: 100, 
          unit: 'mg/dL', 
          referenceRange: { min: 70, max: 110 } 
        },
        { 
          date: '2023-01-15', 
          value: 95, 
          unit: 'mg/dL', 
          referenceRange: { min: 70, max: 110 } 
        }
      ];

      const trend = calculateBloodMarkerTrend(data, mockExperiment);
      
      expect(trend!.min).toBe(70);
      expect(trend!.max).toBe(110);
    });

    it('should return null when first half average is zero', () => {
      const data = [
        { date: '2023-01-01', value: 0, unit: 'mg/dL' },
        { date: '2023-01-15', value: 0, unit: 'mg/dL' },
        { date: '2023-01-20', value: 90, unit: 'mg/dL' },
        { date: '2023-01-31', value: 85, unit: 'mg/dL' }
      ];

      expect(calculateBloodMarkerTrend(data, mockExperiment)).toBeNull();
    });
  });

  describe('getAdaptiveYAxisDomain', () => {
    it('should return default domain for empty data', () => {
      expect(getAdaptiveYAxisDomain([], 'Weight')).toEqual([0, 100]);
    });

    it('should calculate domain with padding for weight', () => {
      const data = [
        { date: '2023-01-01', value: 150 },
        { date: '2023-01-15', value: 160 }
      ];

      const [min, max] = getAdaptiveYAxisDomain(data, 'Weight');
      
      // Range is 10, 5% padding = 0.5
      expect(min).toBe(149.5); // 150 - 0.5
      expect(max).toBe(160.5); // 160 + 0.5
    });

    it('should calculate domain with padding for body fat', () => {
      const data = [
        { date: '2023-01-01', value: 15 },
        { date: '2023-01-15', value: 25 }
      ];

      const [min, max] = getAdaptiveYAxisDomain(data, 'Body Fat %');
      
      // Range is 10, 15% padding = 1.5
      expect(min).toBe(13.5); // 15 - 1.5
      expect(max).toBe(26.5); // 25 + 1.5
    });

    it('should calculate domain with padding for HRV', () => {
      const data = [
        { date: '2023-01-01', value: 30 },
        { date: '2023-01-15', value: 40 }
      ];

      const [min, max] = getAdaptiveYAxisDomain(data, 'HRV');
      
      // Range is 10, 20% padding = 2
      expect(min).toBe(28); // 30 - 2
      expect(max).toBe(42); // 40 + 2
    });

    it('should not allow negative minimums', () => {
      const data = [
        { date: '2023-01-01', value: 1 },
        { date: '2023-01-15', value: 2 }
      ];

      const [min] = getAdaptiveYAxisDomain(data, 'Weight');
      expect(min).toBeGreaterThanOrEqual(0);
    });
  });
});
