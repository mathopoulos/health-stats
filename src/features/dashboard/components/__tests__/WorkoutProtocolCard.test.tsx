import React from 'react';
import { render, screen } from '@/test-utils';
import { WorkoutProtocolCard } from '../WorkoutProtocolCard';
import type { HealthProtocol } from '@/types/healthProtocol';

// Mock ProtocolCard
jest.mock('../ProtocolCard', () => {
  return {
    ProtocolCard: ({ title, children }: { title: string; children: React.ReactNode }) => (
      <div data-testid="protocol-card">
        <span data-testid="protocol-title">{title}</span>
        <div data-testid="protocol-content">{children}</div>
      </div>
    ),
  };
});

describe('WorkoutProtocolCard', () => {
  const mockWorkoutProtocol: HealthProtocol = {
    id: 'workout-1',
    userId: 'user-1',
    protocolType: 'exercise',
    protocol: JSON.stringify({
      workouts: [
        { type: 'strength-training', frequency: 3 },
        { type: 'cardio', frequency: 2 },
        { type: 'yoga', frequency: 1 }
      ]
    }),
    startDate: '2024-01-01T00:00:00Z',
    endDate: null,
    isActive: true,
    results: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const defaultProps = {
    currentWorkoutProtocol: mockWorkoutProtocol,
    loading: false,
  };

  describe('Basic Rendering', () => {
    it('renders protocol card with correct title', () => {
      render(<WorkoutProtocolCard {...defaultProps} />);

      expect(screen.getByTestId('protocol-card')).toBeInTheDocument();
      expect(screen.getByTestId('protocol-title')).toHaveTextContent('Workout Protocol');
    });

    it('renders individual workout cards when protocol data is valid', () => {
      render(<WorkoutProtocolCard {...defaultProps} />);

      expect(screen.getByText('Strength Training')).toBeInTheDocument();
      expect(screen.getByText('Cardio')).toBeInTheDocument();
      expect(screen.getByText('Yoga')).toBeInTheDocument();
    });

    it('renders frequency numbers', () => {
      render(<WorkoutProtocolCard {...defaultProps} />);

      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('renders start date', () => {
      render(<WorkoutProtocolCard {...defaultProps} />);

      expect(screen.getByText(/Started/)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('renders loading skeleton when loading is true', () => {
      render(<WorkoutProtocolCard {...defaultProps} loading={true} />);

      expect(screen.getByTestId('protocol-card')).toBeInTheDocument();
    });
  });

  describe('No Protocol State', () => {
    it('renders no protocol message when currentWorkoutProtocol is null', () => {
      render(<WorkoutProtocolCard {...defaultProps} currentWorkoutProtocol={null} />);

      expect(screen.getByText('None')).toBeInTheDocument();
      expect(screen.getByText('No workout protocol set')).toBeInTheDocument();
    });
  });

  describe('Invalid Protocol Data', () => {
    it('handles invalid JSON gracefully', () => {
      const invalidProtocol = {
        ...mockWorkoutProtocol,
        protocol: 'invalid-json-string',
      };

      render(<WorkoutProtocolCard {...defaultProps} currentWorkoutProtocol={invalidProtocol} />);

      expect(screen.getByText('Invalid protocol data')).toBeInTheDocument();
    });

    it('handles empty protocol field', () => {
      const emptyProtocol = {
        ...mockWorkoutProtocol,
        protocol: '',
      };

      render(<WorkoutProtocolCard {...defaultProps} currentWorkoutProtocol={emptyProtocol} />);

      expect(screen.getByText('Invalid protocol data')).toBeInTheDocument();
    });
  });

  describe('Workout Type Formatting', () => {
    it('formats workout names correctly', () => {
      render(<WorkoutProtocolCard {...defaultProps} />);

      expect(screen.getByText('Strength Training')).toBeInTheDocument();
      expect(screen.getByText('Cardio')).toBeInTheDocument();
      expect(screen.getByText('Yoga')).toBeInTheDocument();
    });

    it('handles hyphenated workout names', () => {
      const hyphenatedProtocol = {
        ...mockWorkoutProtocol,
        protocol: JSON.stringify({
          workouts: [
            { type: 'high-intensity-interval-training', frequency: 2 },
            { type: 'weight-lifting', frequency: 3 }
          ]
        }),
      };

      render(<WorkoutProtocolCard {...defaultProps} currentWorkoutProtocol={hyphenatedProtocol} />);

      expect(screen.getByText('High Intensity Interval Training')).toBeInTheDocument();
      expect(screen.getByText('Weight Lifting')).toBeInTheDocument();
    });

    it('handles unknown workout types', () => {
      const unknownTypeProtocol = {
        ...mockWorkoutProtocol,
        protocol: JSON.stringify({
          workouts: [
            { type: null, frequency: 1 },
            { frequency: 2 } // Missing type
          ]
        }),
      };

      render(<WorkoutProtocolCard {...defaultProps} currentWorkoutProtocol={unknownTypeProtocol} />);

      const unknownWorkouts = screen.getAllByText('Unknown Workout');
      expect(unknownWorkouts).toHaveLength(2);
    });
  });

  describe('Frequency Display', () => {
    it('handles zero frequency', () => {
      const zeroFrequencyProtocol = {
        ...mockWorkoutProtocol,
        protocol: JSON.stringify({
          workouts: [
            { type: 'rest-day', frequency: 0 }
          ]
        }),
      };

      render(<WorkoutProtocolCard {...defaultProps} currentWorkoutProtocol={zeroFrequencyProtocol} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('handles missing frequency', () => {
      const missingFrequencyProtocol = {
        ...mockWorkoutProtocol,
        protocol: JSON.stringify({
          workouts: [
            { type: 'yoga' } // No frequency field
          ]
        }),
      };

      render(<WorkoutProtocolCard {...defaultProps} currentWorkoutProtocol={missingFrequencyProtocol} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Empty Workouts Array', () => {
    it('handles empty workouts array', () => {
      const emptyWorkoutsProtocol = {
        ...mockWorkoutProtocol,
        protocol: JSON.stringify({
          workouts: []
        }),
      };

      render(<WorkoutProtocolCard {...defaultProps} currentWorkoutProtocol={emptyWorkoutsProtocol} />);

      expect(screen.getByTestId('protocol-card')).toBeInTheDocument();
      expect(screen.getByText(/Started/)).toBeInTheDocument();
    });

    it('handles missing workouts property', () => {
      const missingWorkoutsProtocol = {
        ...mockWorkoutProtocol,
        protocol: JSON.stringify({
          name: 'Test Protocol'
        }),
      };

      render(<WorkoutProtocolCard {...defaultProps} currentWorkoutProtocol={missingWorkoutsProtocol} />);

      expect(screen.getByTestId('protocol-card')).toBeInTheDocument();
      expect(screen.getByText(/Started/)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('handles large numbers of workouts efficiently', () => {
      const manyWorkoutsProtocol = {
        ...mockWorkoutProtocol,
        protocol: JSON.stringify({
          workouts: Array.from({ length: 10 }, (_, i) => ({
            type: `workout-${i}`,
            frequency: i + 1
          }))
        }),
      };

      expect(() => {
        render(<WorkoutProtocolCard {...defaultProps} currentWorkoutProtocol={manyWorkoutsProtocol} />);
      }).not.toThrow();

      expect(screen.getByText('Workout 0')).toBeInTheDocument();
      expect(screen.getByText('Workout 9')).toBeInTheDocument();
    });
  });
});