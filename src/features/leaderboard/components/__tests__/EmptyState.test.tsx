import React from 'react';
import { render, screen, fireEvent } from '@test-utils';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  const defaultProps = {
    metric: 'hrv' as const,
  };

  it('renders without crashing', () => {
    render(<EmptyState {...defaultProps} />);
    
    expect(screen.getByText('No HRV Data Available')).toBeInTheDocument();
  });

  it('displays correct metric name in heading', () => {
    render(<EmptyState metric="vo2max" />);
    
    expect(screen.getByText('No VO2 Max Data Available')).toBeInTheDocument();
  });

  it('shows appropriate icon', () => {
    render(<EmptyState {...defaultProps} />);
    
    expect(screen.getByText('📊')).toBeInTheDocument();
  });

  it('displays descriptive text about the metric', () => {
    render(<EmptyState metric="hrv" />);
    
    expect(screen.getByText(/heart rate variability measures/i)).toBeInTheDocument();
    expect(screen.getByText('❤️')).toBeInTheDocument();
  });

  it('displays VO2 Max description correctly', () => {
    render(<EmptyState metric="vo2max" />);
    
    expect(screen.getByText(/vo2 max measures/i)).toBeInTheDocument();
    expect(screen.getByText('⚡')).toBeInTheDocument();
  });

  it('renders refresh button when onRefresh provided', () => {
    const mockOnRefresh = jest.fn();
    
    render(<EmptyState {...defaultProps} onRefresh={mockOnRefresh} />);
    
    const refreshButton = screen.getByText('Check for Updates');
    expect(refreshButton).toBeInTheDocument();
  });

  it('does not render refresh button when onRefresh not provided', () => {
    render(<EmptyState {...defaultProps} />);
    
    expect(screen.queryByText('Check for Updates')).not.toBeInTheDocument();
  });

  it('calls onRefresh when refresh button clicked', () => {
    const mockOnRefresh = jest.fn();
    
    render(<EmptyState {...defaultProps} onRefresh={mockOnRefresh} />);
    
    const refreshButton = screen.getByText('Check for Updates');
    fireEvent.click(refreshButton);
    
    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });

  it('refresh button is accessible via role', () => {
    const mockOnRefresh = jest.fn();
    
    render(<EmptyState {...defaultProps} onRefresh={mockOnRefresh} />);
    
    // Check button is accessible
    expect(screen.getByRole('button', { name: /check for updates/i })).toBeInTheDocument();
  });

  it('displays informative message about data requirement', () => {
    render(<EmptyState {...defaultProps} />);
    
    expect(screen.getByText(/users need to sync their health data/i)).toBeInTheDocument();
  });

  it('has consistent styling structure', () => {
    const { container } = render(<EmptyState {...defaultProps} />);
    
    // Should have centered container
    const mainContainer = container.querySelector('.flex.items-center.justify-center');
    expect(mainContainer).toBeInTheDocument();
    
    // Should have text-center class
    const textContainer = container.querySelector('.text-center');
    expect(textContainer).toBeInTheDocument();
  });

  it('refresh button functions correctly', () => {
    const mockOnRefresh = jest.fn();
    
    render(<EmptyState {...defaultProps} onRefresh={mockOnRefresh} />);
    
    const refreshButton = screen.getByRole('button', { name: /check for updates/i });
    
    // Focus on core functionality
    expect(refreshButton).toBeEnabled();
    expect(refreshButton.tagName).toBe('BUTTON');
  });

  it('displays refresh icon in button', () => {
    const mockOnRefresh = jest.fn();
    
    const { container } = render(<EmptyState {...defaultProps} onRefresh={mockOnRefresh} />);
    
    // Should have refresh icon SVG
    const refreshIcon = container.querySelector('svg[viewBox="0 0 24 24"]');
    expect(refreshIcon).toBeInTheDocument();
  });
});
