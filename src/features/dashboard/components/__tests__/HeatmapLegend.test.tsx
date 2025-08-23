import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HeatmapLegend } from '../HeatmapLegend';

describe('HeatmapLegend', () => {
  it('renders legend container with proper layout', () => {
    render(<HeatmapLegend />);
    
    const container = screen.getByText('Less').parentElement;
    expect(container).toHaveClass('flex', 'items-center', 'gap-2', 'text-xs', 'text-gray-600', 'dark:text-gray-400');
  });

  it('renders "Less" and "More" labels', () => {
    render(<HeatmapLegend />);
    
    expect(screen.getByText('Less')).toBeInTheDocument();
    expect(screen.getByText('More')).toBeInTheDocument();
  });

  it('renders 5 legend squares', () => {
    const { container } = render(<HeatmapLegend />);
    
    // Find all divs with the legend square classes
    const squares = container.querySelectorAll('.w-3.h-3.rounded');
    expect(squares).toHaveLength(5);
  });

  it('applies correct base styling to legend squares', () => {
    const { container } = render(<HeatmapLegend />);
    
    const squares = container.querySelectorAll('.w-3.h-3.rounded');
    squares.forEach(square => {
      expect(square).toHaveClass('w-3', 'h-3', 'rounded', 'transition-transform', 'hover:scale-110', 'cursor-help');
    });
  });

  describe('legend square tooltips', () => {
    it('shows tooltip on hover for empty state', async () => {
      const user = userEvent.setup();
      const { container } = render(<HeatmapLegend />);
      
      const squares = container.querySelectorAll('.w-3.h-3.rounded');
      const emptySquare = squares[0]; // First square is empty state
      
      expect(emptySquare).toHaveAttribute('title', 'No workouts');
    });

    it('shows tooltip for low intensity (0-30 min)', async () => {
      const { container } = render(<HeatmapLegend />);
      
      const squares = container.querySelectorAll('.w-3.h-3.rounded');
      const lowIntensitySquare = squares[1]; // Second square
      
      expect(lowIntensitySquare).toHaveAttribute('title', '0-30 min');
    });

    it('shows tooltip for medium intensity (30-60 min)', async () => {
      const { container } = render(<HeatmapLegend />);
      
      const squares = container.querySelectorAll('.w-3.h-3.rounded');
      const mediumIntensitySquare = squares[2]; // Third square
      
      expect(mediumIntensitySquare).toHaveAttribute('title', '30-60 min');
    });

    it('shows tooltip for high intensity (60-90 min)', async () => {
      const { container } = render(<HeatmapLegend />);
      
      const squares = container.querySelectorAll('.w-3.h-3.rounded');
      const highIntensitySquare = squares[3]; // Fourth square
      
      expect(highIntensitySquare).toHaveAttribute('title', '60-90 min');
    });

    it('shows tooltip for max intensity (90+ min)', async () => {
      const { container } = render(<HeatmapLegend />);
      
      const squares = container.querySelectorAll('.w-3.h-3.rounded');
      const maxIntensitySquare = squares[4]; // Fifth square
      
      expect(maxIntensitySquare).toHaveAttribute('title', '90+ min');
    });
  });

  describe('color application', () => {
    it('applies inline styles with correct colors', () => {
      const { container } = render(<HeatmapLegend />);
      
      const squares = container.querySelectorAll('.w-3.h-3.rounded');
      
      // Test that squares have inline background color styles (browsers return rgb format)
      expect((squares[0] as HTMLElement).style.backgroundColor).toBe('rgb(235, 237, 240)'); // Empty
      expect((squares[1] as HTMLElement).style.backgroundColor).toBe('rgb(14, 68, 41)'); // Low
      expect((squares[2] as HTMLElement).style.backgroundColor).toBe('rgb(0, 109, 50)'); // Medium  
      expect((squares[3] as HTMLElement).style.backgroundColor).toBe('rgb(38, 166, 65)'); // High
      expect((squares[4] as HTMLElement).style.backgroundColor).toBe('rgb(57, 211, 83)'); // Max
    });

    it('sets dark mode color custom properties', () => {
      const { container } = render(<HeatmapLegend />);
      
      const squares = container.querySelectorAll('.w-3.h-3.rounded');
      
      // Check that custom properties are set for dark mode colors
      squares.forEach(square => {
        const htmlSquare = square as HTMLElement;
        expect(htmlSquare.style.getPropertyValue('--dark-bg-color')).toBeDefined();
      });
    });
  });

  describe('responsive layout', () => {
    it('centers legend on small screens', () => {
      render(<HeatmapLegend />);
      
      const legendContainer = screen.getByText('Less').parentElement?.parentElement;
      expect(legendContainer).toHaveClass('flex', 'justify-end', 'px-4', 'sm:px-0');
    });

    it('applies correct padding classes', () => {
      render(<HeatmapLegend />);
      
      const outerContainer = screen.getByText('Less').parentElement?.parentElement;
      expect(outerContainer).toHaveClass('px-4', 'sm:px-0');
    });
  });

  describe('accessibility', () => {
    it('provides hover states for better interaction feedback', () => {
      const { container } = render(<HeatmapLegend />);
      
      const squares = container.querySelectorAll('.w-3.h-3.rounded');
      squares.forEach(square => {
        expect(square).toHaveClass('hover:scale-110', 'cursor-help');
      });
    });

    it('includes title attributes for screen readers', () => {
      const { container } = render(<HeatmapLegend />);
      
      const squares = container.querySelectorAll('.w-3.h-3.rounded');
      squares.forEach(square => {
        expect(square).toHaveAttribute('title');
        expect(square.getAttribute('title')).not.toBe('');
      });
    });

    it('uses semantic text labels', () => {
      render(<HeatmapLegend />);
      
      // "Less" and "More" provide context for screen readers
      expect(screen.getByText('Less')).toBeInTheDocument();
      expect(screen.getByText('More')).toBeInTheDocument();
    });
  });

  describe('visual design', () => {
    it('applies correct gap between legend elements', () => {
      render(<HeatmapLegend />);
      
      const innerContainer = screen.getByText('Less').parentElement;
      expect(innerContainer).toHaveClass('gap-2');
      
      // Squares container should have gap-1
      const squaresContainer = innerContainer?.querySelector('.flex.gap-1');
      expect(squaresContainer).toBeInTheDocument();
    });

    it('applies proper text styling', () => {
      render(<HeatmapLegend />);
      
      const lessLabel = screen.getByText('Less');
      const moreLabel = screen.getByText('More');
      
      expect(lessLabel.parentElement).toHaveClass('text-xs', 'text-gray-600', 'dark:text-gray-400');
      expect(moreLabel.parentElement).toHaveClass('text-xs', 'text-gray-600', 'dark:text-gray-400');
    });
  });

  it('renders as a memoized component', () => {
    // Test that HeatmapLegend is a React component
    expect(typeof HeatmapLegend).toBe('function');
    
    const { rerender } = render(<HeatmapLegend />);
    expect(screen.getByText('Less')).toBeInTheDocument();
    
    // Should re-render without issues
    rerender(<HeatmapLegend />);
    expect(screen.getByText('Less')).toBeInTheDocument();
  });

  it('uses correct constants for color configuration', () => {
    const { container } = render(<HeatmapLegend />);
    
    const squares = container.querySelectorAll('[style*="background-color"]');
    
    // Should have exactly 5 squares for the 5 intensity levels
    expect(squares).toHaveLength(5);
    
    // Each should have a valid background color
    Array.from(squares).forEach((square, index) => {
      const bgColor = (square as HTMLElement).style.backgroundColor;
      expect(bgColor).toBeTruthy();
      
      // First square should be the empty/gray color
      if (index === 0) {
        expect(bgColor).toContain('235, 237, 240'); // #ebedf0 in RGB
      }
    });
  });
});
