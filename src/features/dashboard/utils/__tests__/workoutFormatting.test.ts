import {
  formatDuration,
  formatWorkoutDuration,
  getDurationColorClass,
  formatActivityType,
  formatTooltipDate,
  extractDateFromDateTime,
  calculateWorkoutMinutes,
  createWorkoutSummary,
} from '../workoutFormatting';

describe('workoutFormatting', () => {
  describe('formatDuration', () => {
    it('formats minutes only when less than 60', () => {
      expect(formatDuration(0)).toBe('0m');
      expect(formatDuration(1)).toBe('1m');
      expect(formatDuration(30)).toBe('30m');
      expect(formatDuration(59)).toBe('59m');
    });

    it('formats hours and minutes when 60 or more minutes', () => {
      expect(formatDuration(60)).toBe('1h 0m');
      expect(formatDuration(61)).toBe('1h 1m');
      expect(formatDuration(90)).toBe('1h 30m');
      expect(formatDuration(120)).toBe('2h 0m');
      expect(formatDuration(150)).toBe('2h 30m');
    });

    it('handles edge cases', () => {
      expect(formatDuration(0)).toBe('0m');
      expect(formatDuration(999)).toBe('16h 39m');
    });
  });

  describe('formatWorkoutDuration', () => {
    it('converts seconds to minutes and formats correctly', () => {
      expect(formatWorkoutDuration(0)).toBe('0m');
      expect(formatWorkoutDuration(60)).toBe('1m'); // 1 minute in seconds
      expect(formatWorkoutDuration(1800)).toBe('30m'); // 30 minutes in seconds
      expect(formatWorkoutDuration(3600)).toBe('1h 0m'); // 1 hour in seconds
      expect(formatWorkoutDuration(5400)).toBe('1h 30m'); // 1.5 hours in seconds
    });

    it('rounds seconds properly', () => {
      expect(formatWorkoutDuration(89)).toBe('1m'); // 89 seconds rounds to 1 minute
      expect(formatWorkoutDuration(149)).toBe('2m'); // 149 seconds rounds to 2 minutes
      expect(formatWorkoutDuration(3659)).toBe('1h 1m'); // 3659 seconds rounds to 1h 1m
    });
  });

  describe('getDurationColorClass', () => {
    it('returns empty class for 0 minutes', () => {
      expect(getDurationColorClass(0)).toBe('color-empty');
    });

    it('returns correct class for low intensity (0-30 min)', () => {
      expect(getDurationColorClass(1)).toBe('color-scale-4');
      expect(getDurationColorClass(15)).toBe('color-scale-4');
      expect(getDurationColorClass(30)).toBe('color-scale-4');
    });

    it('returns correct class for medium intensity (30-60 min)', () => {
      expect(getDurationColorClass(31)).toBe('color-scale-3');
      expect(getDurationColorClass(45)).toBe('color-scale-3');
      expect(getDurationColorClass(60)).toBe('color-scale-3');
    });

    it('returns correct class for high intensity (60-90 min)', () => {
      expect(getDurationColorClass(61)).toBe('color-scale-2');
      expect(getDurationColorClass(75)).toBe('color-scale-2');
      expect(getDurationColorClass(90)).toBe('color-scale-2');
    });

    it('returns correct class for max intensity (90+ min)', () => {
      expect(getDurationColorClass(91)).toBe('color-scale-1');
      expect(getDurationColorClass(120)).toBe('color-scale-1');
      expect(getDurationColorClass(999)).toBe('color-scale-1');
    });
  });

  describe('formatActivityType', () => {
    it('replaces underscores with spaces', () => {
      expect(formatActivityType('strength_training')).toBe('strength training');
      expect(formatActivityType('high_intensity_interval_training')).toBe('high intensity interval training');
      expect(formatActivityType('trail_running')).toBe('trail running');
    });

    it('handles activity types without underscores', () => {
      expect(formatActivityType('running')).toBe('running');
      expect(formatActivityType('cycling')).toBe('cycling');
      expect(formatActivityType('swimming')).toBe('swimming');
    });

    it('handles empty and edge cases', () => {
      expect(formatActivityType('')).toBe('');
      expect(formatActivityType('_')).toBe(' ');
      expect(formatActivityType('__')).toBe('  ');
    });
  });

  describe('formatTooltipDate', () => {
    it('formats ISO date strings correctly', () => {
      expect(formatTooltipDate('2024-01-15')).toBe('Jan 15, 2024');
      expect(formatTooltipDate('2024-12-25')).toBe('Dec 25, 2024');
      expect(formatTooltipDate('2023-07-04')).toBe('Jul 4, 2023');
    });

    it('handles different months correctly', () => {
      expect(formatTooltipDate('2024-01-01')).toBe('Jan 1, 2024');
      expect(formatTooltipDate('2024-02-29')).toBe('Feb 29, 2024'); // Leap year
      expect(formatTooltipDate('2024-12-31')).toBe('Dec 31, 2024');
    });
  });

  describe('extractDateFromDateTime', () => {
    it('extracts date from ISO datetime strings', () => {
      expect(extractDateFromDateTime('2024-01-15T06:00:00Z')).toBe('2024-01-15');
      expect(extractDateFromDateTime('2023-12-25T14:30:45.123Z')).toBe('2023-12-25');
      expect(extractDateFromDateTime('2024-06-30T23:59:59Z')).toBe('2024-06-30');
    });

    it('handles different timezone formats', () => {
      expect(extractDateFromDateTime('2024-01-15T06:00:00+05:30')).toBe('2024-01-15');
      expect(extractDateFromDateTime('2024-01-15T06:00:00-08:00')).toBe('2024-01-15');
    });

    it('handles datetime without timezone', () => {
      expect(extractDateFromDateTime('2024-01-15T06:00:00')).toBe('2024-01-15');
    });
  });

  describe('calculateWorkoutMinutes', () => {
    it('converts seconds to minutes and rounds correctly', () => {
      expect(calculateWorkoutMinutes(0)).toBe(0);
      expect(calculateWorkoutMinutes(60)).toBe(1);
      expect(calculateWorkoutMinutes(1800)).toBe(30);
      expect(calculateWorkoutMinutes(3600)).toBe(60);
    });

    it('rounds seconds properly', () => {
      expect(calculateWorkoutMinutes(89)).toBe(1); // 89 seconds rounds to 1 minute
      expect(calculateWorkoutMinutes(149)).toBe(2); // 149 seconds rounds to 2 minutes
      expect(calculateWorkoutMinutes(3659)).toBe(61); // 3659 seconds rounds to 61 minutes
    });

    it('ensures non-negative results', () => {
      expect(calculateWorkoutMinutes(-60)).toBe(0); // Negative values become 0
      expect(calculateWorkoutMinutes(-1)).toBe(0);
    });
  });

  describe('createWorkoutSummary', () => {
    it('returns "No workouts" for 0 minutes', () => {
      expect(createWorkoutSummary(0)).toBe('No workouts');
    });

    it('returns correct summary for positive minutes', () => {
      expect(createWorkoutSummary(1)).toBe('1 minutes of exercise');
      expect(createWorkoutSummary(30)).toBe('30 minutes of exercise');
      expect(createWorkoutSummary(90)).toBe('90 minutes of exercise');
    });

    it('handles edge cases', () => {
      expect(createWorkoutSummary(999)).toBe('999 minutes of exercise');
    });
  });
});
