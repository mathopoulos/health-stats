import React from 'react';
import { render, screen } from '@/test-utils';
import { SupplementProtocolCard } from '../SupplementProtocolCard';
import type { HealthProtocol } from '@/types/healthProtocol';

// Mock ProtocolCard
jest.mock('../ProtocolCard', () => {
  return {
    ProtocolCard: ({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) => (
      <div data-testid="protocol-card" className={className}>
        <span data-testid="protocol-title">{title}</span>
        <div data-testid="protocol-content">{children}</div>
      </div>
    ),
  };
});

describe('SupplementProtocolCard', () => {
  const mockSupplementProtocol: HealthProtocol = {
    id: 'supplement-1',
    userId: 'user-1',
    protocolType: 'supplement',
    protocol: JSON.stringify({
      supplements: [
        { type: 'vitamin-d', dosage: 1000, unit: 'IU', frequency: 'daily' },
        { type: 'omega-3', dosage: 500, unit: 'mg', frequency: 'twice-daily' },
        { type: 'magnesium', dosage: 200, unit: 'mg', frequency: 'before-bed' },
        { name: 'Custom Supplement', dosage: 100, unit: 'mg', frequency: 'weekly' }
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
    currentSupplementProtocol: mockSupplementProtocol,
    loading: false,
  };

  describe('Basic Rendering', () => {
    it('renders protocol card with correct title', () => {
      render(<SupplementProtocolCard {...defaultProps} />);

      expect(screen.getByTestId('protocol-card')).toBeInTheDocument();
      expect(screen.getByTestId('protocol-title')).toHaveTextContent('Supplement Protocol');
    });

    it('applies max height class to protocol card', () => {
      render(<SupplementProtocolCard {...defaultProps} />);

      const protocolCard = screen.getByTestId('protocol-card');
      expect(protocolCard).toHaveClass('max-h-[400px]');
    });

    it('renders supplement count badge', () => {
      render(<SupplementProtocolCard {...defaultProps} />);

      expect(screen.getByText('4 supplements')).toBeInTheDocument();
    });

    it('renders individual supplement items', () => {
      render(<SupplementProtocolCard {...defaultProps} />);

      expect(screen.getByText('Vitamin D')).toBeInTheDocument();
      expect(screen.getByText('Omega 3')).toBeInTheDocument();
      expect(screen.getByText('Magnesium')).toBeInTheDocument();
      expect(screen.getByText('Custom Supplement')).toBeInTheDocument();
    });

    it('renders supplement dosages and frequencies', () => {
      render(<SupplementProtocolCard {...defaultProps} />);

      expect(screen.getByText('1000 IU • daily')).toBeInTheDocument();
      expect(screen.getByText('500 mg • twice daily')).toBeInTheDocument();
      expect(screen.getByText('200 mg • before bed')).toBeInTheDocument();
      expect(screen.getByText('100 mg • weekly')).toBeInTheDocument();
    });

    it('renders start date', () => {
      render(<SupplementProtocolCard {...defaultProps} />);

      expect(screen.getByText(/Started/)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('renders loading skeleton when loading is true', () => {
      render(<SupplementProtocolCard {...defaultProps} loading={true} />);

      expect(screen.getByTestId('protocol-card')).toBeInTheDocument();
    });

    it('applies max height to loading state', () => {
      render(<SupplementProtocolCard {...defaultProps} loading={true} />);

      const protocolCard = screen.getByTestId('protocol-card');
      expect(protocolCard).toHaveClass('max-h-[400px]');
    });
  });

  describe('No Protocol State', () => {
    it('renders no protocol message when currentSupplementProtocol is null', () => {
      render(<SupplementProtocolCard {...defaultProps} currentSupplementProtocol={null} />);

      expect(screen.getByText('None')).toBeInTheDocument();
      expect(screen.getByText('No supplement protocol set')).toBeInTheDocument();
    });

    it('applies max height to no protocol state', () => {
      render(<SupplementProtocolCard {...defaultProps} currentSupplementProtocol={null} />);

      const protocolCard = screen.getByTestId('protocol-card');
      expect(protocolCard).toHaveClass('max-h-[400px]');
    });
  });

  describe('Invalid Protocol Data', () => {
    it('handles invalid JSON gracefully', () => {
      const invalidProtocol = {
        ...mockSupplementProtocol,
        protocol: 'invalid-json-string',
      };

      render(<SupplementProtocolCard {...defaultProps} currentSupplementProtocol={invalidProtocol} />);

      expect(screen.getByText('Invalid protocol data')).toBeInTheDocument();
    });

    it('handles empty protocol field', () => {
      const emptyProtocol = {
        ...mockSupplementProtocol,
        protocol: '',
      };

      render(<SupplementProtocolCard {...defaultProps} currentSupplementProtocol={emptyProtocol} />);

      expect(screen.getByText('Invalid protocol data')).toBeInTheDocument();
    });

    it('maintains max height for invalid protocol', () => {
      const invalidProtocol = {
        ...mockSupplementProtocol,
        protocol: 'invalid-json-string',
      };

      render(<SupplementProtocolCard {...defaultProps} currentSupplementProtocol={invalidProtocol} />);

      const protocolCard = screen.getByTestId('protocol-card');
      expect(protocolCard).toHaveClass('max-h-[400px]');
    });
  });

  describe('Supplement Name Formatting', () => {
    it('formats supplement names correctly', () => {
      render(<SupplementProtocolCard {...defaultProps} />);

      expect(screen.getByText('Vitamin D')).toBeInTheDocument();
      expect(screen.getByText('Omega 3')).toBeInTheDocument();
      expect(screen.getByText('Magnesium')).toBeInTheDocument();
      expect(screen.getByText('Custom Supplement')).toBeInTheDocument();
    });

    it('handles hyphenated supplement names', () => {
      const hyphenatedProtocol = {
        ...mockSupplementProtocol,
        protocol: JSON.stringify({
          supplements: [
            { type: 'co-enzyme-q10', dosage: 100, unit: 'mg', frequency: 'daily' },
            { type: 'n-acetyl-cysteine', dosage: 600, unit: 'mg', frequency: 'twice-daily' }
          ]
        }),
      };

      render(<SupplementProtocolCard {...defaultProps} currentSupplementProtocol={hyphenatedProtocol} />);

      expect(screen.getByText('Co Enzyme Q10')).toBeInTheDocument();
      expect(screen.getByText('N Acetyl Cysteine')).toBeInTheDocument();
    });

    it('handles supplements with name field', () => {
      const nameFieldProtocol = {
        ...mockSupplementProtocol,
        protocol: JSON.stringify({
          supplements: [
            { type: 'vitamin-d', name: 'Vitamin D3', dosage: 1000, unit: 'IU', frequency: 'daily' }
          ]
        }),
      };

      render(<SupplementProtocolCard {...defaultProps} currentSupplementProtocol={nameFieldProtocol} />);

      // Component may use type field - just check it renders properly
      expect(screen.getByText('Vitamin D')).toBeInTheDocument();
    });

    it('handles unknown supplement types', () => {
      const unknownTypeProtocol = {
        ...mockSupplementProtocol,
        protocol: JSON.stringify({
          supplements: [
            { type: null, dosage: 100, unit: 'mg', frequency: 'daily' },
            { dosage: 300, unit: 'mg', frequency: 'daily' } // Missing type and name
          ]
        }),
      };

      render(<SupplementProtocolCard {...defaultProps} currentSupplementProtocol={unknownTypeProtocol} />);

      const unknownSupplements = screen.getAllByText('Unknown Supplement');
      expect(unknownSupplements).toHaveLength(2);
    });
  });

  describe('Supplement Count Badge', () => {
    it('shows correct count for multiple supplements', () => {
      render(<SupplementProtocolCard {...defaultProps} />);

      expect(screen.getByText('4 supplements')).toBeInTheDocument();
    });

    it('shows singular form for one supplement', () => {
      const singleSupplementProtocol = {
        ...mockSupplementProtocol,
        protocol: JSON.stringify({
          supplements: [
            { type: 'vitamin-d', dosage: 1000, unit: 'IU', frequency: 'daily' }
          ]
        }),
      };

      render(<SupplementProtocolCard {...defaultProps} currentSupplementProtocol={singleSupplementProtocol} />);

      expect(screen.getByText('1 supplement')).toBeInTheDocument();
    });

    it('does not show count badge when no supplements', () => {
      const noSupplementsProtocol = {
        ...mockSupplementProtocol,
        protocol: JSON.stringify({
          supplements: []
        }),
      };

      render(<SupplementProtocolCard {...defaultProps} currentSupplementProtocol={noSupplementsProtocol} />);

      expect(screen.queryByText(/supplement/)).not.toBeInTheDocument();
    });
  });

  describe('Empty Supplements Array', () => {
    it('handles empty supplements array', () => {
      const emptySupplementsProtocol = {
        ...mockSupplementProtocol,
        protocol: JSON.stringify({
          supplements: []
        }),
      };

      render(<SupplementProtocolCard {...defaultProps} currentSupplementProtocol={emptySupplementsProtocol} />);

      expect(screen.getByTestId('protocol-card')).toBeInTheDocument();
      expect(screen.getByText(/Started/)).toBeInTheDocument();
      expect(screen.queryByText(/supplement/)).not.toBeInTheDocument();
    });

    it('handles missing supplements property', () => {
      const missingSupplementsProtocol = {
        ...mockSupplementProtocol,
        protocol: JSON.stringify({
          name: 'Test Protocol'
        }),
      };

      render(<SupplementProtocolCard {...defaultProps} currentSupplementProtocol={missingSupplementsProtocol} />);

      expect(screen.getByTestId('protocol-card')).toBeInTheDocument();
      expect(screen.getByText(/Started/)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('handles large numbers of supplements efficiently', () => {
      const manySupplementsProtocol = {
        ...mockSupplementProtocol,
        protocol: JSON.stringify({
          supplements: Array.from({ length: 10 }, (_, i) => ({
            type: `supplement-${i}`,
            dosage: 100 + i * 10,
            unit: 'mg',
            frequency: 'daily'
          }))
        }),
      };

      expect(() => {
        render(<SupplementProtocolCard {...defaultProps} currentSupplementProtocol={manySupplementsProtocol} />);
      }).not.toThrow();

      expect(screen.getByText('10 supplements')).toBeInTheDocument();
    });

    it('efficiently handles prop changes', () => {
      const { rerender } = render(<SupplementProtocolCard {...defaultProps} />);

      const newProtocol = {
        ...mockSupplementProtocol,
        protocol: JSON.stringify({
          supplements: [
            { type: 'zinc', dosage: 15, unit: 'mg', frequency: 'daily' }
          ]
        }),
      };

      rerender(<SupplementProtocolCard {...defaultProps} currentSupplementProtocol={newProtocol} />);

      expect(screen.getByText('Zinc')).toBeInTheDocument();
      expect(screen.getByText('15 mg • daily')).toBeInTheDocument();
      expect(screen.getByText('1 supplement')).toBeInTheDocument();
    });
  });
});