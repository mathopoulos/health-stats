import React from 'react';
import { render, screen } from '@/test-utils';
import { DietProtocolCard } from '../DietProtocolCard';
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

describe('DietProtocolCard', () => {
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

  const defaultProps = {
    currentDietProtocol: mockDietProtocol,
    loading: false,
  };

  describe('Basic Rendering', () => {
    it('renders protocol card with correct title', () => {
      render(<DietProtocolCard {...defaultProps} />);

      expect(screen.getByTestId('protocol-card')).toBeInTheDocument();
      expect(screen.getByTestId('protocol-title')).toHaveTextContent('Diet Protocol');
    });

    it('renders formatted protocol name', () => {
      render(<DietProtocolCard {...defaultProps} />);

      expect(screen.getByText('Intermittent Fasting')).toBeInTheDocument();
    });

    it('renders start date', () => {
      render(<DietProtocolCard {...defaultProps} />);

      expect(screen.getByText(/Started/)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator when loading is true', () => {
      render(<DietProtocolCard {...defaultProps} loading={true} />);

      expect(screen.getByText('...')).toBeInTheDocument();
    });

    it('does not show protocol name during loading', () => {
      render(<DietProtocolCard {...defaultProps} loading={true} />);

      expect(screen.queryByText('Intermittent Fasting')).not.toBeInTheDocument();
    });
  });

  describe('No Protocol State', () => {
    it('shows "None" when currentDietProtocol is null', () => {
      render(<DietProtocolCard {...defaultProps} currentDietProtocol={null} />);

      expect(screen.getByText('None')).toBeInTheDocument();
    });

    it('does not show start date when no protocol', () => {
      render(<DietProtocolCard {...defaultProps} currentDietProtocol={null} />);

      expect(screen.queryByText(/Started/)).not.toBeInTheDocument();
    });
  });

  describe('Protocol Name Formatting', () => {
    it('formats hyphenated protocol names correctly', () => {
      const hyphenatedProtocol = {
        ...mockDietProtocol,
        protocol: 'ketogenic-diet',
      };

      render(<DietProtocolCard {...defaultProps} currentDietProtocol={hyphenatedProtocol} />);

      expect(screen.getByText('Ketogenic Diet')).toBeInTheDocument();
    });

    it('formats multiple hyphenated words correctly', () => {
      const multiHyphenProtocol = {
        ...mockDietProtocol,
        protocol: 'low-carb-high-fat-diet',
      };

      render(<DietProtocolCard {...defaultProps} currentDietProtocol={multiHyphenProtocol} />);

      expect(screen.getByText('Low Carb High Fat Diet')).toBeInTheDocument();
    });

    it('handles invalid protocol values', () => {
      const invalidProtocol = {
        ...mockDietProtocol,
        protocol: null as any,
      };

      render(<DietProtocolCard {...defaultProps} currentDietProtocol={invalidProtocol} />);

      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles very long protocol names', () => {
      const longNameProtocol = {
        ...mockDietProtocol,
        protocol: 'very-long-diet-protocol-name-that-should-be-displayed',
      };

      render(<DietProtocolCard {...defaultProps} currentDietProtocol={longNameProtocol} />);

      expect(screen.getByText('Very Long Diet Protocol Name That Should Be Displayed')).toBeInTheDocument();
    });

    it('handles single word protocols', () => {
      const singleWordProtocol = {
        ...mockDietProtocol,
        protocol: 'paleo',
      };

      render(<DietProtocolCard {...defaultProps} currentDietProtocol={singleWordProtocol} />);

      expect(screen.getByText('Paleo')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('handles prop changes efficiently', () => {
      const { rerender } = render(<DietProtocolCard {...defaultProps} />);

      expect(screen.getByText('Intermittent Fasting')).toBeInTheDocument();

      const newProtocol = {
        ...mockDietProtocol,
        protocol: 'ketogenic-diet',
      };

      rerender(<DietProtocolCard {...defaultProps} currentDietProtocol={newProtocol} />);

      expect(screen.getByText('Ketogenic Diet')).toBeInTheDocument();
    });
  });
});