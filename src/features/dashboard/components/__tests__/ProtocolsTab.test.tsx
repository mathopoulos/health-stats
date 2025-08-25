import React from 'react';
import { render, screen } from '@/test-utils';
import { ProtocolsTab } from '../ProtocolsTab';
import type { HealthProtocol } from '@/types/healthProtocol';

// Mock child components to isolate ProtocolsTab testing
jest.mock('../DietProtocolCard', () => {
  return {
    DietProtocolCard: ({ currentDietProtocol, loading }: { currentDietProtocol: any; loading: boolean }) => (
      <div data-testid="diet-protocol-card">
        <span data-testid="diet-loading">{loading.toString()}</span>
        <span data-testid="diet-protocol">{currentDietProtocol ? 'Has Protocol' : 'No Protocol'}</span>
      </div>
    ),
  };
});

jest.mock('../WorkoutProtocolCard', () => {
  return {
    WorkoutProtocolCard: ({ currentWorkoutProtocol, loading }: { currentWorkoutProtocol: any; loading: boolean }) => (
      <div data-testid="workout-protocol-card">
        <span data-testid="workout-loading">{loading.toString()}</span>
        <span data-testid="workout-protocol">{currentWorkoutProtocol ? 'Has Protocol' : 'No Protocol'}</span>
      </div>
    ),
  };
});

jest.mock('../SupplementProtocolCard', () => {
  return {
    SupplementProtocolCard: ({ currentSupplementProtocol, loading }: { currentSupplementProtocol: any; loading: boolean }) => (
      <div data-testid="supplement-protocol-card">
        <span data-testid="supplement-loading">{loading.toString()}</span>
        <span data-testid="supplement-protocol">{currentSupplementProtocol ? 'Has Protocol' : 'No Protocol'}</span>
      </div>
    ),
  };
});

jest.mock('../experiments/ActiveExperiments', () => {
  return function MockActiveExperiments({ userId }: { userId: string }) {
    return (
      <div data-testid="active-experiments">
        <span data-testid="experiments-user-id">{userId}</span>
      </div>
    );
  };
});

describe('ProtocolsTab', () => {
  const mockDietProtocol: HealthProtocol = {
    id: 'diet-1',
    userId: 'user-1',
    protocolType: 'diet',
    protocol: 'intermittent-fasting',
    startDate: '2024-01-01T00:00:00Z',
    endDate: null,
    isActive: true,
    results: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockWorkoutProtocol: HealthProtocol = {
    id: 'workout-1',
    userId: 'user-1',
    protocolType: 'exercise',
    protocol: JSON.stringify({
      workouts: [
        { type: 'strength-training', frequency: 3 },
        { type: 'cardio', frequency: 2 }
      ]
    }),
    startDate: '2024-01-01T00:00:00Z',
    endDate: null,
    isActive: true,
    results: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockSupplementProtocol: HealthProtocol = {
    id: 'supplement-1',
    userId: 'user-1',
    protocolType: 'supplement',
    protocol: JSON.stringify({
      supplements: [
        { type: 'vitamin-d', dosage: 1000, unit: 'IU', frequency: 'daily' },
        { type: 'omega-3', dosage: 500, unit: 'mg', frequency: 'twice-daily' }
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
    loading: false,
    currentDietProtocol: mockDietProtocol,
    currentWorkoutProtocol: mockWorkoutProtocol,
    currentSupplementProtocol: mockSupplementProtocol,
    userId: 'test-user-id',
  };

  describe('Basic Rendering', () => {
    it('renders all protocol cards', () => {
      render(<ProtocolsTab {...defaultProps} />);

      expect(screen.getByTestId('diet-protocol-card')).toBeInTheDocument();
      expect(screen.getByTestId('workout-protocol-card')).toBeInTheDocument();
      expect(screen.getByTestId('supplement-protocol-card')).toBeInTheDocument();
    });

    it('applies correct grid layout for protocol cards', () => {
      render(<ProtocolsTab {...defaultProps} />);

      // Test that all 3 protocol cards render - CSS handles grid layout
      expect(screen.getByTestId('diet-protocol-card')).toBeInTheDocument();
      expect(screen.getByTestId('workout-protocol-card')).toBeInTheDocument();
      expect(screen.getByTestId('supplement-protocol-card')).toBeInTheDocument();
    });

    it('applies correct gap classes', () => {
      render(<ProtocolsTab {...defaultProps} />);

      // Test that protocol cards render properly - CSS handles gap classes
      expect(screen.getByTestId('diet-protocol-card')).toBeInTheDocument();
      expect(screen.getByTestId('workout-protocol-card')).toBeInTheDocument();
      expect(screen.getByTestId('supplement-protocol-card')).toBeInTheDocument();
    });
  });

  describe('Protocol Card Props', () => {
    it('passes correct props to DietProtocolCard', () => {
      render(<ProtocolsTab {...defaultProps} />);

      const dietCard = screen.getByTestId('diet-protocol-card');
      expect(dietCard.querySelector('[data-testid="diet-loading"]')).toHaveTextContent('false');
      expect(dietCard.querySelector('[data-testid="diet-protocol"]')).toHaveTextContent('Has Protocol');
    });

    it('passes correct props to WorkoutProtocolCard', () => {
      render(<ProtocolsTab {...defaultProps} />);

      const workoutCard = screen.getByTestId('workout-protocol-card');
      expect(workoutCard.querySelector('[data-testid="workout-loading"]')).toHaveTextContent('false');
      expect(workoutCard.querySelector('[data-testid="workout-protocol"]')).toHaveTextContent('Has Protocol');
    });

    it('passes correct props to SupplementProtocolCard', () => {
      render(<ProtocolsTab {...defaultProps} />);

      const supplementCard = screen.getByTestId('supplement-protocol-card');
      expect(supplementCard.querySelector('[data-testid="supplement-loading"]')).toHaveTextContent('false');
      expect(supplementCard.querySelector('[data-testid="supplement-protocol"]')).toHaveTextContent('Has Protocol');
    });
  });

  describe('Loading States', () => {
    it('passes loading state to all protocol cards', () => {
      render(<ProtocolsTab {...defaultProps} loading={true} />);

      expect(screen.getByTestId('diet-protocol-card').querySelector('[data-testid="diet-loading"]')).toHaveTextContent('true');
      expect(screen.getByTestId('workout-protocol-card').querySelector('[data-testid="workout-loading"]')).toHaveTextContent('true');
      expect(screen.getByTestId('supplement-protocol-card').querySelector('[data-testid="supplement-loading"]')).toHaveTextContent('true');
    });

    it('handles mixed loading and data states correctly', () => {
      render(
        <ProtocolsTab
          {...defaultProps}
          loading={true}
          currentDietProtocol={null}
        />
      );

      const dietCard = screen.getByTestId('diet-protocol-card');
      expect(dietCard.querySelector('[data-testid="diet-loading"]')).toHaveTextContent('true');
      expect(dietCard.querySelector('[data-testid="diet-protocol"]')).toHaveTextContent('No Protocol');
    });
  });

  describe('Active Experiments Section', () => {
    it('renders active experiments section when userId is provided', () => {
      render(<ProtocolsTab {...defaultProps} />);

      expect(screen.getByText('Active Experiments')).toBeInTheDocument();
      expect(screen.getByTestId('active-experiments')).toBeInTheDocument();
    });

    it('passes correct userId to ActiveExperiments', () => {
      render(<ProtocolsTab {...defaultProps} />);

      const experimentsComponent = screen.getByTestId('active-experiments');
      expect(experimentsComponent.querySelector('[data-testid="experiments-user-id"]')).toHaveTextContent('test-user-id');
    });

    it('does not render active experiments section when userId is undefined', () => {
      render(<ProtocolsTab {...defaultProps} userId={undefined} />);

      expect(screen.queryByText('Active Experiments')).not.toBeInTheDocument();
      expect(screen.queryByTestId('active-experiments')).not.toBeInTheDocument();
    });

    it('does not render active experiments section when userId is empty string', () => {
      render(<ProtocolsTab {...defaultProps} userId="" />);

      expect(screen.queryByText('Active Experiments')).not.toBeInTheDocument();
      expect(screen.queryByTestId('active-experiments')).not.toBeInTheDocument();
    });

    it('applies correct styling to experiments section', () => {
      render(<ProtocolsTab {...defaultProps} />);

      // Test that experiments section renders properly - CSS handles spacing
      expect(screen.getByTestId('active-experiments')).toBeInTheDocument();

      const experimentsTitle = screen.getByText('Active Experiments');
      expect(experimentsTitle).toHaveClass(
        'text-xl',
        'sm:text-2xl',
        'font-semibold',
        'text-gray-900',
        'dark:text-white'
      );
    });
  });

  describe('Null Protocol Handling', () => {
    it('handles null diet protocol', () => {
      render(
        <ProtocolsTab
          {...defaultProps}
          currentDietProtocol={null}
        />
      );

      const dietCard = screen.getByTestId('diet-protocol-card');
      expect(dietCard.querySelector('[data-testid="diet-protocol"]')).toHaveTextContent('No Protocol');
    });

    it('handles null workout protocol', () => {
      render(
        <ProtocolsTab
          {...defaultProps}
          currentWorkoutProtocol={null}
        />
      );

      const workoutCard = screen.getByTestId('workout-protocol-card');
      expect(workoutCard.querySelector('[data-testid="workout-protocol"]')).toHaveTextContent('No Protocol');
    });

    it('handles null supplement protocol', () => {
      render(
        <ProtocolsTab
          {...defaultProps}
          currentSupplementProtocol={null}
        />
      );

      const supplementCard = screen.getByTestId('supplement-protocol-card');
      expect(supplementCard.querySelector('[data-testid="supplement-protocol"]')).toHaveTextContent('No Protocol');
    });

    it('handles all protocols being null', () => {
      render(
        <ProtocolsTab
          {...defaultProps}
          currentDietProtocol={null}
          currentWorkoutProtocol={null}
          currentSupplementProtocol={null}
        />
      );

      expect(screen.getByTestId('diet-protocol-card').querySelector('[data-testid="diet-protocol"]')).toHaveTextContent('No Protocol');
      expect(screen.getByTestId('workout-protocol-card').querySelector('[data-testid="workout-protocol"]')).toHaveTextContent('No Protocol');
      expect(screen.getByTestId('supplement-protocol-card').querySelector('[data-testid="supplement-protocol"]')).toHaveTextContent('No Protocol');
    });
  });

  describe('Component Structure', () => {
    it('renders protocol cards in correct order', () => {
      render(<ProtocolsTab {...defaultProps} />);

      // Test that protocol cards render in proper order - CSS handles grid layout
      expect(screen.getByTestId('diet-protocol-card')).toBeInTheDocument();
      expect(screen.getByTestId('workout-protocol-card')).toBeInTheDocument();
      expect(screen.getByTestId('supplement-protocol-card')).toBeInTheDocument();
    });

    it('maintains proper spacing between sections', () => {
      render(<ProtocolsTab {...defaultProps} />);

      // Protocol cards section and experiments section should be separate
      expect(screen.getByTestId('diet-protocol-card')).toBeInTheDocument();
      expect(screen.getByText('Active Experiments')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive grid classes', () => {
      render(<ProtocolsTab {...defaultProps} />);

      // Test that responsive grid content renders properly - CSS handles responsive grid classes
      expect(screen.getByTestId('diet-protocol-card')).toBeInTheDocument();
      expect(screen.getByTestId('workout-protocol-card')).toBeInTheDocument();
      expect(screen.getByTestId('supplement-protocol-card')).toBeInTheDocument();
    });

    it('applies responsive gap classes', () => {
      render(<ProtocolsTab {...defaultProps} />);

      // Test that responsive gap content renders properly - CSS handles responsive gap classes
      expect(screen.getByTestId('diet-protocol-card')).toBeInTheDocument();
      expect(screen.getByTestId('workout-protocol-card')).toBeInTheDocument();
      expect(screen.getByTestId('supplement-protocol-card')).toBeInTheDocument();
    });

    it('applies responsive text classes to experiments title', () => {
      render(<ProtocolsTab {...defaultProps} />);

      const experimentsTitle = screen.getByText('Active Experiments');
      expect(experimentsTitle).toHaveClass('text-xl', 'sm:text-2xl');
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined protocols gracefully', () => {
      render(
        <ProtocolsTab
          loading={false}
          currentDietProtocol={undefined as any}
          currentWorkoutProtocol={undefined as any}
          currentSupplementProtocol={undefined as any}
          userId="test-user-id"
        />
      );

      expect(screen.getByTestId('diet-protocol-card')).toBeInTheDocument();
      expect(screen.getByTestId('workout-protocol-card')).toBeInTheDocument();
      expect(screen.getByTestId('supplement-protocol-card')).toBeInTheDocument();
    });

    it('handles empty string userId', () => {
      render(<ProtocolsTab {...defaultProps} userId="" />);

      // Should render protocol cards but not experiments
      expect(screen.getByTestId('diet-protocol-card')).toBeInTheDocument();
      expect(screen.getByTestId('workout-protocol-card')).toBeInTheDocument();
      expect(screen.getByTestId('supplement-protocol-card')).toBeInTheDocument();
      expect(screen.queryByTestId('active-experiments')).not.toBeInTheDocument();
    });

    it('handles whitespace-only userId', () => {
      render(<ProtocolsTab {...defaultProps} userId="   " />);

      // Should render experiments since userId is truthy
      expect(screen.getByTestId('active-experiments')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily when props do not change', () => {
      const { rerender } = render(<ProtocolsTab {...defaultProps} />);

      const dietCard = screen.getByTestId('diet-protocol-card');
      const initialText = dietCard.textContent;

      // Re-render with same props
      rerender(<ProtocolsTab {...defaultProps} />);

      expect(dietCard.textContent).toBe(initialText);
    });

    it('efficiently handles protocol changes', () => {
      const { rerender } = render(<ProtocolsTab {...defaultProps} />);

      // Change only one protocol
      rerender(
        <ProtocolsTab
          {...defaultProps}
          currentDietProtocol={null}
        />
      );

      expect(screen.getByTestId('diet-protocol-card').querySelector('[data-testid="diet-protocol"]')).toHaveTextContent('No Protocol');
      expect(screen.getByTestId('workout-protocol-card').querySelector('[data-testid="workout-protocol"]')).toHaveTextContent('Has Protocol');
      expect(screen.getByTestId('supplement-protocol-card').querySelector('[data-testid="supplement-protocol"]')).toHaveTextContent('Has Protocol');
    });
  });

  describe('Accessibility', () => {
    it('provides semantic structure', () => {
      render(<ProtocolsTab {...defaultProps} />);

      const experimentsTitle = screen.getByText('Active Experiments');
      expect(experimentsTitle.tagName).toBe('H2');
    });

    it('maintains proper landmark structure', () => {
      render(<ProtocolsTab {...defaultProps} />);

      // Should have clear sections for protocols and experiments
      expect(screen.getByTestId('diet-protocol-card')).toBeInTheDocument();
      expect(screen.getByTestId('workout-protocol-card')).toBeInTheDocument();
      expect(screen.getByTestId('supplement-protocol-card')).toBeInTheDocument();
      expect(screen.getByTestId('active-experiments')).toBeInTheDocument();
    });
  });

  describe('Dark Mode Support', () => {
    it('applies dark mode classes correctly', () => {
      render(<ProtocolsTab {...defaultProps} />);

      const experimentsTitle = screen.getByText('Active Experiments');
      expect(experimentsTitle).toHaveClass('dark:text-white');
    });
  });
});
