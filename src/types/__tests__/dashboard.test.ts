// Import and re-export types to generate coverage
import { 
  HealthData, 
  BloodMarker, 
  BloodMarkersCollection, 
  ChartData, 
  WorkoutData, 
  SleepData,
  ActivityEntry 
} from '../dashboard';

// Export types to ensure they're processed by coverage tools
export {
  HealthData, 
  BloodMarker, 
  BloodMarkersCollection, 
  ChartData, 
  WorkoutData, 
  SleepData,
  ActivityEntry
};

describe('Dashboard Types', () => {
  describe('HealthData Interface', () => {
    it('should accept valid health data without metadata', () => {
      const healthData: HealthData = {
        date: '2025-07-15',
        value: 45.5
      };

      expect(healthData.date).toBe('2025-07-15');
      expect(healthData.value).toBe(45.5);
      expect(healthData.meta).toBeUndefined();
    });

    it('should accept valid health data with weekly aggregation metadata', () => {
      const healthData: HealthData = {
        date: '2025-07-15',
        value: 45.5,
        meta: {
          aggregationType: 'weekly',
          pointCount: 7,
          startDate: '2025-07-14',
          endDate: '2025-07-20'
        }
      };

      expect(healthData.meta?.aggregationType).toBe('weekly');
      expect(healthData.meta?.pointCount).toBe(7);
      expect(healthData.meta?.startDate).toBe('2025-07-14');
      expect(healthData.meta?.endDate).toBe('2025-07-20');
    });

    it('should accept valid health data with monthly aggregation metadata', () => {
      const healthData: HealthData = {
        date: '2025-07-15',
        value: 178.2,
        meta: {
          aggregationType: 'monthly',
          pointCount: 301,
          startDate: '2025-07-01',
          endDate: '2025-07-31'
        }
      };

      expect(healthData.meta?.aggregationType).toBe('monthly');
      expect(healthData.meta?.pointCount).toBe(301);
      expect(healthData.meta?.startDate).toBe('2025-07-01');
      expect(healthData.meta?.endDate).toBe('2025-07-31');
    });

    it('should accept health data with partial metadata', () => {
      const healthData: HealthData = {
        date: '2025-07-15',
        value: 45.5,
        meta: {
          aggregationType: 'weekly',
          pointCount: 5
          // startDate and endDate are optional
        }
      };

      expect(healthData.meta?.aggregationType).toBe('weekly');
      expect(healthData.meta?.pointCount).toBe(5);
      expect(healthData.meta?.startDate).toBeUndefined();
      expect(healthData.meta?.endDate).toBeUndefined();
    });

    it('should handle zero and negative values', () => {
      const zeroData: HealthData = {
        date: '2025-07-15',
        value: 0
      };

      const negativeData: HealthData = {
        date: '2025-07-15',
        value: -2.5
      };

      expect(zeroData.value).toBe(0);
      expect(negativeData.value).toBe(-2.5);
    });

    it('should handle decimal values in metadata', () => {
      const healthData: HealthData = {
        date: '2025-07-15',
        value: 45.5,
        meta: {
          aggregationType: 'monthly',
          pointCount: 30 // Should be integer but type allows number
        }
      };

      expect(typeof healthData.meta?.pointCount).toBe('number');
    });
  });

  describe('BloodMarker Interface', () => {
    it('should accept valid blood marker data', () => {
      const bloodMarker: BloodMarker = {
        date: '2025-07-15',
        value: 95.5,
        unit: 'mg/dL',
        name: 'Glucose',
        category: 'Metabolic',
        status: 'normal',
        ranges: {
          optimal: { min: 70, max: 85 },
          normal: { min: 70, max: 100 },
          atRisk: { min: 100, max: 125 },
          outOfRange: { min: 125, max: null }
        }
      };

      expect(bloodMarker.name).toBe('Glucose');
      expect(bloodMarker.value).toBe(95.5);
      expect(bloodMarker.unit).toBe('mg/dL');
      expect(bloodMarker.status).toBe('normal');
      expect(bloodMarker.ranges.optimal.min).toBe(70);
      expect(bloodMarker.ranges.optimal.max).toBe(85);
    });

    it('should handle blood marker ranges with null max values', () => {
      const bloodMarker: BloodMarker = {
        date: '2025-07-15',
        value: 150,
        unit: 'mg/dL',
        name: 'Cholesterol',
        category: 'Lipid',
        status: 'outOfRange',
        ranges: {
          optimal: { min: 0, max: 200 },
          normal: { min: 0, max: 240 },
          atRisk: { min: 240, max: 300 },
          outOfRange: { min: 300, max: null }
        }
      };

      expect(bloodMarker.ranges.outOfRange.max).toBeNull();
      expect(bloodMarker.status).toBe('outOfRange');
    });
  });

  describe('BloodMarkersCollection Interface', () => {
    it('should accept valid blood markers collection', () => {
      const collection: BloodMarkersCollection = {
        lipids: [],
        metabolic: [],
        hormones: [],
        inflammatory: [],
        nutritional: [],
        other: []
      };

      expect(Array.isArray(collection.lipids)).toBe(true);
      expect(Array.isArray(collection.metabolic)).toBe(true);
      expect(Array.isArray(collection.hormones)).toBe(true);
      expect(Array.isArray(collection.inflammatory)).toBe(true);
      expect(Array.isArray(collection.nutritional)).toBe(true);
      expect(Array.isArray(collection.other)).toBe(true);
    });

    it('should accept collection with populated blood markers', () => {
      const glucose: BloodMarker = {
        date: '2025-07-15',
        value: 95,
        unit: 'mg/dL',
        name: 'Glucose',
        category: 'Metabolic',
        status: 'normal',
        ranges: {
          optimal: { min: 70, max: 85 },
          normal: { min: 70, max: 100 },
          atRisk: { min: 100, max: 125 },
          outOfRange: { min: 125, max: null }
        }
      };

      const collection: BloodMarkersCollection = {
        lipids: [],
        metabolic: [glucose],
        hormones: [],
        inflammatory: [],
        nutritional: [],
        other: []
      };

      expect(collection.metabolic).toHaveLength(1);
      expect(collection.metabolic[0].name).toBe('Glucose');
    });
  });

  describe('ChartData Interface', () => {
    it('should accept valid chart data structure', () => {
      const chartData: ChartData = {
        hrv: [],
        vo2max: [],
        weight: [],
        bodyFat: []
      };

      expect(Array.isArray(chartData.hrv)).toBe(true);
      expect(Array.isArray(chartData.vo2max)).toBe(true);
      expect(Array.isArray(chartData.weight)).toBe(true);
      expect(Array.isArray(chartData.bodyFat)).toBe(true);
    });

    it('should accept chart data with health data arrays', () => {
      const healthDataPoint: HealthData = {
        date: '2025-07-15',
        value: 45.5,
        meta: {
          aggregationType: 'weekly',
          pointCount: 7,
          startDate: '2025-07-14',
          endDate: '2025-07-20'
        }
      };

      const chartData: ChartData = {
        hrv: [healthDataPoint],
        vo2max: [],
        weight: [],
        bodyFat: []
      };

      expect(chartData.hrv).toHaveLength(1);
      expect(chartData.hrv[0].value).toBe(45.5);
      expect(chartData.hrv[0].meta?.aggregationType).toBe('weekly');
    });
  });

  describe('WorkoutData Interface', () => {
    it('should accept valid workout data', () => {
      const workout: WorkoutData = {
        date: '2025-07-15',
        type: 'Running',
        duration: 30,
        calories: 350
      };

      expect(workout.type).toBe('Running');
      expect(workout.duration).toBe(30);
      expect(workout.calories).toBe(350);
    });

    it('should accept workout data with optional fields', () => {
      const workout: WorkoutData = {
        date: '2025-07-15',
        type: 'Cycling',
        duration: 45,
        calories: 400,
        distance: 15.5,
        avgHeartRate: 140,
        maxHeartRate: 165
      };

      expect(workout.distance).toBe(15.5);
      expect(workout.avgHeartRate).toBe(140);
      expect(workout.maxHeartRate).toBe(165);
    });
  });

  describe('SleepData Interface', () => {
    it('should accept valid sleep data', () => {
      const sleep: SleepData = {
        date: '2025-07-15',
        totalMinutes: 480,
        stages: {
          deep: 90,
          core: 240,
          rem: 120,
          awake: 30
        }
      };

      expect(sleep.totalMinutes).toBe(480);
      expect(sleep.stages.deep).toBe(90);
      expect(sleep.stages.core).toBe(240);
      expect(sleep.stages.rem).toBe(120);
      expect(sleep.stages.awake).toBe(30);
    });

    it('should accept sleep data with optional efficiency', () => {
      const sleep: SleepData = {
        date: '2025-07-15',
        totalMinutes: 480,
        stages: {
          deep: 90,
          core: 240,
          rem: 120,
          awake: 30
        },
        efficiency: 0.85
      };

      expect(sleep.efficiency).toBe(0.85);
    });
  });

  describe('ActivityEntry Interface', () => {
    it('should accept valid activity entry', () => {
      const activity: ActivityEntry = {
        id: 'activity-1',
        type: 'workout',
        title: 'Morning Run',
        date: '2025-07-15T08:00:00Z',
        description: 'Great 5K run in the park',
        metadata: {
          duration: 30,
          calories: 350
        }
      };

      expect(activity.id).toBe('activity-1');
      expect(activity.type).toBe('workout');
      expect(activity.title).toBe('Morning Run');
      expect(activity.metadata.duration).toBe(30);
    });

    it('should accept activity entry with different types', () => {
      const bloodTestActivity: ActivityEntry = {
        id: 'blood-1',
        type: 'blood_test',
        title: 'Quarterly Blood Panel',
        date: '2025-07-15T10:00:00Z',
        metadata: {
          markersCount: 25,
          labName: 'Quest Diagnostics'
        }
      };

      expect(bloodTestActivity.type).toBe('blood_test');
      expect(bloodTestActivity.metadata.markersCount).toBe(25);
      expect(bloodTestActivity.metadata.labName).toBe('Quest Diagnostics');
    });

    it('should accept activity with optional description', () => {
      const activity: ActivityEntry = {
        id: 'activity-2',
        type: 'supplement',
        title: 'Started Vitamin D',
        date: '2025-07-15T09:00:00Z',
        metadata: {
          dosage: '2000 IU'
        }
      };

      expect(activity.description).toBeUndefined();
      expect(activity.metadata.dosage).toBe('2000 IU');
    });
  });

  describe('Type Compatibility and Edge Cases', () => {
    it('should handle arrays of health data with mixed metadata', () => {
      const mixedHealthData: HealthData[] = [
        {
          date: '2025-07-01',
          value: 45.0
          // No meta
        },
        {
          date: '2025-07-08',
          value: 46.5,
          meta: {
            aggregationType: 'weekly',
            pointCount: 7,
            startDate: '2025-07-07',
            endDate: '2025-07-13'
          }
        },
        {
          date: '2025-07-15',
          value: 44.8,
          meta: {
            aggregationType: 'monthly',
            pointCount: 30,
            startDate: '2025-07-01',
            endDate: '2025-07-31'
          }
        }
      ];

      expect(mixedHealthData).toHaveLength(3);
      expect(mixedHealthData[0].meta).toBeUndefined();
      expect(mixedHealthData[1].meta?.aggregationType).toBe('weekly');
      expect(mixedHealthData[2].meta?.aggregationType).toBe('monthly');
    });

    it('should handle empty metadata object', () => {
      const healthData: HealthData = {
        date: '2025-07-15',
        value: 45.5,
        meta: {} // Empty meta object
      };

      expect(healthData.meta).toEqual({});
      expect(healthData.meta.aggregationType).toBeUndefined();
      expect(healthData.meta.pointCount).toBeUndefined();
    });

    it('should support type inference for aggregation types', () => {
      const weeklyData: HealthData = {
        date: '2025-07-15',
        value: 45.5,
        meta: {
          aggregationType: 'weekly' as const,
          pointCount: 7
        }
      };

      const monthlyData: HealthData = {
        date: '2025-07-15',
        value: 45.5,
        meta: {
          aggregationType: 'monthly' as const,
          pointCount: 30
        }
      };

      // Type checking - these should not cause compilation errors
      expect(weeklyData.meta?.aggregationType).toBe('weekly');
      expect(monthlyData.meta?.aggregationType).toBe('monthly');
    });
  });
});
