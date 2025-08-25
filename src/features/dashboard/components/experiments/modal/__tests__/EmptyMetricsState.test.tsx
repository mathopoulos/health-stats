import React from 'react';
import { render, screen } from '@testing-library/react';
import EmptyMetricsState from '../EmptyMetricsState';

describe('EmptyMetricsState', () => {
  it('should render empty state message', () => {
    render(<EmptyMetricsState />);
    
    expect(screen.getByText('No Metrics Selected')).toBeInTheDocument();
    expect(screen.getByText('This experiment is not tracking any fitness metrics or blood markers.')).toBeInTheDocument();
  });

  it('should render with correct test id', () => {
    render(<EmptyMetricsState />);
    
    expect(screen.getByTestId('empty-metrics-state')).toBeInTheDocument();
  });

  it('should render SVG icon', () => {
    const { container } = render(<EmptyMetricsState />);
    
    const svgIcon = container.querySelector('svg');
    expect(svgIcon).toBeInTheDocument();
    expect(svgIcon).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svgIcon).toHaveClass('w-8', 'h-8', 'text-gray-400');
  });

  it('should apply correct styling classes', () => {
    const { container } = render(<EmptyMetricsState />);
    
    const mainContainer = screen.getByTestId('empty-metrics-state');
    expect(mainContainer).toHaveClass('text-center', 'py-8');
    
    const iconContainer = container.querySelector('.w-16.h-16');
    expect(iconContainer).toHaveClass('mx-auto', 'w-16', 'h-16', 'bg-gray-100', 'dark:bg-gray-700', 'rounded-full', 'flex', 'items-center', 'justify-center', 'mb-4');
    
    const heading = screen.getByText('No Metrics Selected');
    expect(heading).toHaveClass('text-lg', 'font-semibold', 'text-gray-900', 'dark:text-white', 'mb-2');
    
    const description = screen.getByText('This experiment is not tracking any fitness metrics or blood markers.');
    expect(description).toHaveClass('text-gray-500', 'dark:text-gray-400');
  });

  it('should render path element in SVG', () => {
    const { container } = render(<EmptyMetricsState />);
    
    const pathElement = container.querySelector('svg path');
    expect(pathElement).toBeInTheDocument();
    expect(pathElement).toHaveAttribute('stroke-linecap', 'round');
    expect(pathElement).toHaveAttribute('stroke-linejoin', 'round');
    expect(pathElement).toHaveAttribute('stroke-width', '2');
  });
});
