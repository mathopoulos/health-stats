import React from 'react';
import { render, screen } from '@testing-library/react';
import { WorkoutTooltip } from '../WorkoutTooltip';

// Mock the formatting utilities
jest.mock('../../utils/workoutFormatting', () => ({
  formatTooltipDate: jest.fn((dateString: string) => {
    // Simple mock implementation
    if (dateString === '2024-01-15') return 'Jan 15, 2024';
    if (dateString === '2024-12-25') return 'Dec 25, 2024';
    return 'Mock Date';
  }),
  formatDuration: jest.fn((minutes: number) => {
    if (minutes === 0) return '0m';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h 0m`;
  }),
}));

describe('WorkoutTooltip', () => {
  const mockWorkoutDetails = [
    {
      type: 'running',
      duration: '30m',
      calories: '250 cal'
    },
    {
      type: 'strength training', 
      duration: '45m',
      calories: '180 cal'
    }
  ];

  const mockHeatmapValueWithWorkouts = {
    date: '2024-01-15',
    totalMinutes: 75,
    details: {
      workouts: mockWorkoutDetails
    }
  };

  const mockHeatmapValueEmpty = {
    date: '2024-01-15',
    totalMinutes: 0,
    details: {
      workouts: []
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when value is null', () => {
    it('renders fallback message', () => {
      render(<WorkoutTooltip value={null} />);
      
      expect(screen.getByText('No workouts')).toBeInTheDocument();
    });
  });

  describe('when value has no workouts', () => {
    it('renders date with no workouts message', () => {
      render(<WorkoutTooltip value={mockHeatmapValueEmpty} />);
      
      expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
      expect(screen.getByText('No workouts')).toBeInTheDocument();
    });

    it('applies correct styling classes', () => {
      const { container } = render(<WorkoutTooltip value={mockHeatmapValueEmpty} />);
      
      const tooltipContainer = container.firstChild as HTMLElement;
      expect(tooltipContainer).toHaveClass('min-w-[200px]', 'max-w-[300px]');
    });

    it('displays date with proper text styling', () => {
      render(<WorkoutTooltip value={mockHeatmapValueEmpty} />);
      
      const dateElement = screen.getByText('Jan 15, 2024');
      expect(dateElement).toHaveClass('font-medium', 'text-base');
      
      const noWorkoutsElement = screen.getByText('No workouts');
      expect(noWorkoutsElement).toHaveClass('text-sm', 'text-gray-500', 'dark:text-gray-400', 'mt-1');
    });
  });

  describe('when value has workouts', () => {
    it('renders date and total duration header', () => {
      render(<WorkoutTooltip value={mockHeatmapValueWithWorkouts} />);
      
      expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
      expect(screen.getByText('1h 15m total')).toBeInTheDocument();
    });

    it('renders all workout items', () => {
      render(<WorkoutTooltip value={mockHeatmapValueWithWorkouts} />);
      
      expect(screen.getByText('running')).toBeInTheDocument();
      expect(screen.getByText('strength training')).toBeInTheDocument();
      expect(screen.getByText('30m')).toBeInTheDocument();
      expect(screen.getByText('45m')).toBeInTheDocument();
    });

    it('applies correct header styling', () => {
      render(<WorkoutTooltip value={mockHeatmapValueWithWorkouts} />);
      
      const dateElement = screen.getByText('Jan 15, 2024');
      expect(dateElement).toHaveClass('font-medium', 'text-base');
      
      const totalElement = screen.getByText('1h 15m total');
      expect(totalElement).toHaveClass('text-sm', 'text-emerald-600', 'dark:text-emerald-400', 'font-medium');
    });

    it('applies correct container styling', () => {
      const { container } = render(<WorkoutTooltip value={mockHeatmapValueWithWorkouts} />);
      
      const tooltipContainer = container.firstChild as HTMLElement;
      expect(tooltipContainer).toHaveClass('min-w-[200px]', 'max-w-[300px]');
    });

    it('separates header and workout items with border', () => {
      render(<WorkoutTooltip value={mockHeatmapValueWithWorkouts} />);
      
      const headerContainer = screen.getByText('Jan 15, 2024').parentElement;
      expect(headerContainer).toHaveClass('border-b', 'border-gray-200', 'dark:border-gray-700', 'pb-2', 'mb-2');
    });

    it('styles individual workout items correctly', () => {
      render(<WorkoutTooltip value={mockHeatmapValueWithWorkouts} />);
      
      const workoutType = screen.getByText('running');
      expect(workoutType).toHaveClass('text-sm', 'font-medium', 'capitalize');
      
      const workoutDuration = screen.getByText('30m');
      expect(workoutDuration).toHaveClass('text-xs', 'text-gray-500', 'dark:text-gray-400');
    });
  });

  describe('formatting integration', () => {
    it('calls formatTooltipDate with correct date', () => {
      const { formatTooltipDate } = require('../../utils/workoutFormatting');
      
      render(<WorkoutTooltip value={mockHeatmapValueWithWorkouts} />);
      
      expect(formatTooltipDate).toHaveBeenCalledWith('2024-01-15');
    });

    it('calls formatDuration with correct total minutes', () => {
      const { formatDuration } = require('../../utils/workoutFormatting');
      
      render(<WorkoutTooltip value={mockHeatmapValueWithWorkouts} />);
      
      expect(formatDuration).toHaveBeenCalledWith(75);
    });

    it('handles zero total minutes correctly', () => {
      const { formatDuration } = require('../../utils/workoutFormatting');
      
      render(<WorkoutTooltip value={mockHeatmapValueEmpty} />);
      
      // formatDuration should not be called for empty workouts case
      expect(formatDuration).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('handles single workout correctly', () => {
      const singleWorkoutValue = {
        date: '2024-12-25',
        totalMinutes: 30,
        details: {
          workouts: [{
            type: 'yoga',
            duration: '30m',
            calories: '120 cal'
          }]
        }
      };
      
      render(<WorkoutTooltip value={singleWorkoutValue} />);
      
      expect(screen.getByText('Dec 25, 2024')).toBeInTheDocument();
      expect(screen.getByText('30m total')).toBeInTheDocument();
      expect(screen.getByText('yoga')).toBeInTheDocument();
      expect(screen.getByText('30m')).toBeInTheDocument();
    });

    it('handles many workouts correctly', () => {
      const manyWorkoutsValue = {
        date: '2024-01-15',
        totalMinutes: 180,
        details: {
          workouts: [
            { type: 'morning run', duration: '45m', calories: '300 cal' },
            { type: 'strength training', duration: '60m', calories: '200 cal' },
            { type: 'evening walk', duration: '30m', calories: '100 cal' },
            { type: 'yoga', duration: '45m', calories: '150 cal' }
          ]
        }
      };
      
      render(<WorkoutTooltip value={manyWorkoutsValue} />);
      
      expect(screen.getByText('3h 0m total')).toBeInTheDocument();
      expect(screen.getByText('morning run')).toBeInTheDocument();
      expect(screen.getByText('strength training')).toBeInTheDocument();
      expect(screen.getByText('evening walk')).toBeInTheDocument();
      expect(screen.getByText('yoga')).toBeInTheDocument();
    });

    it('handles workout with no calories field', () => {
      const workoutWithoutCalories = {
        date: '2024-01-15',
        totalMinutes: 30,
        details: {
          workouts: [{
            type: 'walking',
            duration: '30m'
            // No calories field
          }]
        }
      };
      
      render(<WorkoutTooltip value={workoutWithoutCalories} />);
      
      expect(screen.getByText('walking')).toBeInTheDocument();
      expect(screen.getByText('30m')).toBeInTheDocument();
    });
  });
});
