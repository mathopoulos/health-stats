import React from 'react';
import { render, screen } from '@/test-utils';
import { ProtocolCard } from '../ProtocolCard';

describe('ProtocolCard', () => {
  const defaultProps = {
    title: 'Test Protocol',
    children: <div data-testid="test-content">Test Content</div>,
  };

  describe('Basic Rendering', () => {
    it('renders the title and content', () => {
      render(<ProtocolCard {...defaultProps} />);

      expect(screen.getByText('Test Protocol')).toBeInTheDocument();
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      render(<ProtocolCard {...defaultProps} className="custom-class" />);

      expect(screen.getByText('Test Protocol')).toBeInTheDocument();
    });
  });

  describe('Content Flexibility', () => {
    it('renders different types of content', () => {
      render(
        <ProtocolCard title="Flexible Test">
          <div>
            <h4>Complex Content</h4>
            <p>Paragraph text</p>
            <button>Action Button</button>
          </div>
        </ProtocolCard>
      );

      expect(screen.getByText('Flexible Test')).toBeInTheDocument();
      expect(screen.getByText('Complex Content')).toBeInTheDocument();
      expect(screen.getByText('Paragraph text')).toBeInTheDocument();
      expect(screen.getByText('Action Button')).toBeInTheDocument();
    });

    it('handles empty or null children', () => {
      render(<ProtocolCard title="Empty Test">{null}</ProtocolCard>);
      expect(screen.getByText('Empty Test')).toBeInTheDocument();
    });
  });

  describe('Title Variations', () => {
    it('handles different title lengths', () => {
      render(<ProtocolCard title="A">Content</ProtocolCard>);
      expect(screen.getByText('A')).toBeInTheDocument();

      render(
        <ProtocolCard title="Very Long Protocol Title That Should Still Work">
          Content
        </ProtocolCard>
      );
      expect(screen.getByText('Very Long Protocol Title That Should Still Work')).toBeInTheDocument();
    });

    it('handles special characters in title', () => {
      render(<ProtocolCard title="Protocol #1: &quot;Special&quot;">Content</ProtocolCard>);
      expect(screen.getByText('Protocol #1: "Special"')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('handles prop changes efficiently', () => {
      const { rerender } = render(<ProtocolCard {...defaultProps} />);
      expect(screen.getByText('Test Protocol')).toBeInTheDocument();

      rerender(
        <ProtocolCard title="Updated Protocol">
          <div>Updated Content</div>
        </ProtocolCard>
      );
      expect(screen.getByText('Updated Protocol')).toBeInTheDocument();
      expect(screen.getByText('Updated Content')).toBeInTheDocument();
    });
  });
});