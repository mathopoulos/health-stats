import { renderHook } from '@testing-library/react';
import { useWorkoutHeatmapData } from '../useWorkoutHeatmapData';
import { subYears } from 'date-fns';

// Mock the WeeklyWorkoutProvider hook
const mockSetWorkoutCount = jest.fn();
jest.mock('@providers/WeeklyWorkoutProvider', () => ({
  useWeeklyWorkout: () => ({
    setWorkoutCount: mockSetWorkoutCount,
  }),
}));

// Mock the utility functions
jest.mock('../../utils/dateRangeUtils', () => ({
  createHeatmapDateRange: jest.fn((today) => ({
    startDate: subYears(today, 1),
    endDate: today,
  })),
  generateDateRange: jest.fn((start, end) => {
    // Simple mock implementation for testing
    const dates: string[] = [];
    const currentDate = new Date(start);
    while (currentDate <= end) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  }),
  countWorkoutDaysThisWeek: jest.fn((workoutsByDate) => {
    // Mock implementation - count total entries for testing
    return Object.keys(workoutsByDate).length;
  }),
}));

jest.mock('../../utils/workoutFormatting', () => ({
  extractDateFromDateTime: jest.fn((datetime: string) => datetime.split('T')[0]),
  formatWorkoutDuration: jest.fn((seconds: number) => {
    const minutes = Math.round(seconds / 60);
    return minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  }),
  formatActivityType: jest.fn((type: string) => type.replace(/_/g, ' ')),
  calculateWorkoutMinutes: jest.fn((seconds: number) => Math.round(seconds / 60)),
}));

describe('useWorkoutHeatmapData', () => {
  const mockWorkouts = [
    {
      data: {
        startDate: '2024-01-15T06:00:00Z',
        activityType: 'running',
        metrics: {
          duration: 1800, // 30 minutes in seconds
          energyBurned: 250,
        },
      },
    },
    {
      data: {
        startDate: '2024-01-15T18:00:00Z',
        activityType: 'strength_training',
        metrics: {
          duration: 2700, // 45 minutes in seconds
          energyBurned: 180,
        },
      },
    },
    {
      data: {
        startDate: '2024-01-16T07:00:00Z',
        activityType: 'cycling',
        metrics: {
          duration: 3600, // 60 minutes in seconds
          energyBurned: 400,
        },
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock current date to be consistent in tests
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-06-15T10:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates date range correctly', () => {
    const { result } = renderHook(() =>
      useWorkoutHeatmapData({ workouts: [] })
    );

    expect(result.current.dateRange).toEqual({
      startDate: expect.any(Date),
      endDate: expect.any(Date),
    });

    // Check that endDate is roughly current date
    const endDate = result.current.dateRange.endDate;
    expect(endDate.getFullYear()).toBe(2024);
    expect(endDate.getMonth()).toBe(5); // June (0-indexed)
    expect(endDate.getDate()).toBe(15);
  });

  it('processes empty workout array correctly', () => {
    const { result } = renderHook(() =>
      useWorkoutHeatmapData({ workouts: [] })
    );

    expect(result.current.values).toEqual(expect.any(Array));
    expect(result.current.values.length).toBeGreaterThan(0); // Should have placeholder entries for all days
  });

  it('groups workouts by date correctly', () => {
    const { result } = renderHook(() =>
      useWorkoutHeatmapData({ workouts: mockWorkouts })
    );

    // Find the values for the test dates
    const jan15Value = result.current.values.find(v => v.date === '2024-01-15');
    const jan16Value = result.current.values.find(v => v.date === '2024-01-16');

    expect(jan15Value).toBeDefined();
    expect(jan16Value).toBeDefined();

    // Jan 15 should have 2 workouts (running + strength training)
    expect(jan15Value?.details.workouts).toHaveLength(2);
    expect(jan15Value?.totalMinutes).toBe(75); // 30 + 45 minutes

    // Jan 16 should have 1 workout (cycling)
    expect(jan16Value?.details.workouts).toHaveLength(1);
    expect(jan16Value?.totalMinutes).toBe(60); // 60 minutes
  });

  it('formats workout details correctly', () => {
    const { result } = renderHook(() =>
      useWorkoutHeatmapData({ workouts: mockWorkouts })
    );

    const jan15Value = result.current.values.find(v => v.date === '2024-01-15');
    const workouts = jan15Value?.details.workouts || [];

    expect(workouts[0]).toEqual({
      type: 'running',
      duration: '30m',
      calories: '250 cal',
    });

    expect(workouts[1]).toEqual({
      type: 'strength training', // Should replace underscores
      duration: '45m',
      calories: '180 cal',
    });
  });

  it('handles workouts without energy burned', () => {
    const workoutsWithoutCalories = [
      {
        data: {
          startDate: '2024-01-15T06:00:00Z',
          activityType: 'yoga',
          metrics: {
            duration: 2400, // 40 minutes
            // No energyBurned field
          },
        },
      },
    ];

    const { result } = renderHook(() =>
      useWorkoutHeatmapData({ workouts: workoutsWithoutCalories })
    );

    const jan15Value = result.current.values.find(v => v.date === '2024-01-15');
    const workout = jan15Value?.details.workouts[0];

    expect(workout).toEqual({
      type: 'yoga',
      duration: '40m',
      calories: undefined,
    });
  });

  it('creates placeholder entries for days without workouts', () => {
    const singleWorkout = [mockWorkouts[0]]; // Only Jan 15

    const { result } = renderHook(() =>
      useWorkoutHeatmapData({ workouts: singleWorkout })
    );

    // Should have entries for all days in the year, not just workout days
    expect(result.current.values.length).toBeGreaterThan(300); // Roughly a year's worth of days

    // Find a day without workouts
    const emptyDay = result.current.values.find(v => 
      v.date !== '2024-01-15' && v.totalMinutes === 0
    );

    expect(emptyDay).toBeDefined();
    expect(emptyDay?.details.workouts).toHaveLength(0);
    expect(emptyDay?.totalMinutes).toBe(0);
  });

  it('updates weekly workout count', () => {
    renderHook(() =>
      useWorkoutHeatmapData({ workouts: mockWorkouts })
    );

    // Should call setWorkoutCount with the result from countWorkoutDaysThisWeek
    expect(mockSetWorkoutCount).toHaveBeenCalledWith(expect.any(Number));
  });

  it('memoizes date calculation correctly', () => {
    const { result, rerender } = renderHook(
      (props) => useWorkoutHeatmapData(props),
      { initialProps: { workouts: mockWorkouts } }
    );

    const initialDateRange = result.current.dateRange;

    // Rerender with same props
    rerender({ workouts: mockWorkouts });

    // Date range should be the same object (memoized)
    expect(result.current.dateRange).toBe(initialDateRange);
  });

  it('recalculates when workouts change', () => {
    const { result, rerender } = renderHook(
      (props) => useWorkoutHeatmapData(props),
      { initialProps: { workouts: [mockWorkouts[0]] } }
    );

    const initialValues = result.current.values;
    const initialJan15 = initialValues.find(v => v.date === '2024-01-15');
    expect(initialJan15?.details.workouts).toHaveLength(1);

    // Update with more workouts
    rerender({ workouts: mockWorkouts });

    const updatedValues = result.current.values;
    const updatedJan15 = updatedValues.find(v => v.date === '2024-01-15');
    expect(updatedJan15?.details.workouts).toHaveLength(2);
  });

  it('handles edge cases gracefully', () => {
    const edgeCaseWorkouts = [
      {
        data: {
          startDate: '2024-02-29T12:00:00Z', // Leap year date
          activityType: 'swimming',
          metrics: {
            duration: 0, // Zero duration
            energyBurned: 0, // Zero calories
          },
        },
      },
    ];

    const { result } = renderHook(() =>
      useWorkoutHeatmapData({ workouts: edgeCaseWorkouts })
    );

    const leapDayValue = result.current.values.find(v => v.date === '2024-02-29');
    expect(leapDayValue).toBeDefined();
    expect(leapDayValue?.totalMinutes).toBe(0);
    expect(leapDayValue?.details.workouts).toHaveLength(1);
    expect(leapDayValue?.details.workouts[0].calories).toBeUndefined(); // Calories removed from tooltip
  });

  it('accumulates multiple workouts on same day correctly', () => {
    const multipleWorkoutsOneDay = [
      {
        data: {
          startDate: '2024-01-15T06:00:00Z',
          activityType: 'running',
          metrics: { duration: 1800, energyBurned: 250 },
        },
      },
      {
        data: {
          startDate: '2024-01-15T12:00:00Z',
          activityType: 'cycling',
          metrics: { duration: 2400, energyBurned: 300 },
        },
      },
      {
        data: {
          startDate: '2024-01-15T18:00:00Z',
          activityType: 'yoga',
          metrics: { duration: 3000, energyBurned: 150 },
        },
      },
    ];

    const { result } = renderHook(() =>
      useWorkoutHeatmapData({ workouts: multipleWorkoutsOneDay })
    );

    const jan15Value = result.current.values.find(v => v.date === '2024-01-15');
    
    expect(jan15Value?.details.workouts).toHaveLength(3);
    expect(jan15Value?.totalMinutes).toBe(120); // 30 + 40 + 50 minutes
  });
});
