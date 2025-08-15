import React from 'react';
import { render, screen, fireEvent } from '@test-utils';
import { ErrorState } from '../ErrorState';

describe('ErrorState', () => {
  const defaultProps = {
    metric: 'hrv' as const,
    error: 'Network connection failed',
  };

  it('renders without crashing', () => {
    render(<ErrorState {...defaultProps} />);
    
    expect(screen.getByText('Failed to Load HRV Leaderboard')).toBeInTheDocument();
  });

  it('displays correct metric in heading', () => {
    render(<ErrorState metric="vo2max" error="Server error" />);
    
    expect(screen.getByText('Failed to Load VO2 Max Leaderboard')).toBeInTheDocument();
  });

  it('displays the error message', () => {
    render(<ErrorState {...defaultProps} />);
    
    expect(screen.getByText('Network connection failed')).toBeInTheDocument();
  });

  it('shows warning icon', () => {
    render(<ErrorState {...defaultProps} />);
    
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('displays helpful instruction text', () => {
    render(<ErrorState {...defaultProps} />);
    
    expect(screen.getByText('Please try again or check your internet connection.')).toBeInTheDocument();
  });

  it('renders retry button when onRetry provided', () => {
    const mockOnRetry = jest.fn();
    
    render(<ErrorState {...defaultProps} onRetry={mockOnRetry} />);
    
    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeInTheDocument();
  });

  it('renders clear error button when onClearError provided', () => {
    const mockOnClearError = jest.fn();
    
    render(<ErrorState {...defaultProps} onClearError={mockOnClearError} />);
    
    const clearButton = screen.getByText('Dismiss');
    expect(clearButton).toBeInTheDocument();
  });

  it('renders both buttons when both handlers provided', () => {
    const mockOnRetry = jest.fn();
    const mockOnClearError = jest.fn();
    
    render(
      <ErrorState 
        {...defaultProps} 
        onRetry={mockOnRetry} 
        onClearError={mockOnClearError} 
      />
    );
    
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Dismiss')).toBeInTheDocument();
  });

  it('does not render buttons when handlers not provided', () => {
    render(<ErrorState {...defaultProps} />);
    
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
    expect(screen.queryByText('Dismiss')).not.toBeInTheDocument();
  });

  it('calls onRetry when retry button clicked', () => {
    const mockOnRetry = jest.fn();
    
    render(<ErrorState {...defaultProps} onRetry={mockOnRetry} />);
    
    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);
    
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('calls onClearError when dismiss button clicked', () => {
    const mockOnClearError = jest.fn();
    
    render(<ErrorState {...defaultProps} onClearError={mockOnClearError} />);
    
    const dismissButton = screen.getByText('Dismiss');
    fireEvent.click(dismissButton);
    
    expect(mockOnClearError).toHaveBeenCalledTimes(1);
  });

  it('retry button functions correctly', () => {
    const mockOnRetry = jest.fn();
    
    render(<ErrorState {...defaultProps} onRetry={mockOnRetry} />);
    
    const retryButton = screen.getByRole('button', { name: /try again/i });
    
    // Focus on core functionality
    expect(retryButton).toBeEnabled();
    expect(retryButton.tagName).toBe('BUTTON');
  });

  it('dismiss button functions correctly', () => {
    const mockOnClearError = jest.fn();
    
    render(<ErrorState {...defaultProps} onClearError={mockOnClearError} />);
    
    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    
    // Focus on core functionality
    expect(dismissButton).toBeEnabled();
    expect(dismissButton.tagName).toBe('BUTTON');
  });

  it('buttons are accessible via roles', () => {
    const mockOnRetry = jest.fn();
    const mockOnClearError = jest.fn();
    
    render(
      <ErrorState 
        {...defaultProps} 
        onRetry={mockOnRetry} 
        onClearError={mockOnClearError} 
      />
    );
    
    // Check buttons are accessible
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
  });

  it('displays appropriate icons in buttons', () => {
    const mockOnRetry = jest.fn();
    const mockOnClearError = jest.fn();
    
    const { container } = render(
      <ErrorState 
        {...defaultProps} 
        onRetry={mockOnRetry} 
        onClearError={mockOnClearError} 
      />
    );
    
    // Should have refresh icon for retry button
    const refreshIcon = container.querySelector('svg[viewBox="0 0 24 24"]');
    expect(refreshIcon).toBeInTheDocument();
    
    // Should have close/x icon for dismiss button
    const closeIcons = container.querySelectorAll('svg[viewBox="0 0 24 24"]');
    expect(closeIcons.length).toBeGreaterThanOrEqual(2); // Both icons present
  });

  it('has consistent layout structure', () => {
    const { container } = render(<ErrorState {...defaultProps} />);
    
    // Should have centered container
    const mainContainer = container.querySelector('.flex.items-center.justify-center');
    expect(mainContainer).toBeInTheDocument();
    
    // Should have text-center class
    const textContainer = container.querySelector('.text-center');
    expect(textContainer).toBeInTheDocument();
  });

  it('handles long error messages gracefully', () => {
    const longError = 'This is a very long error message that should be displayed properly without breaking the layout or causing overflow issues in the component.';
    
    render(<ErrorState metric="hrv" error={longError} />);
    
    expect(screen.getByText(longError)).toBeInTheDocument();
  });

  it('handles empty error message', () => {
    render(<ErrorState metric="hrv" error="" />);
    
    // Should still render the component structure
    expect(screen.getByText('Failed to Load HRV Leaderboard')).toBeInTheDocument();
  });
});
