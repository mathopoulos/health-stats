import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingState from '../LoadingState';

describe('LoadingState', () => {
  it('should render loading message', () => {
    render(<LoadingState />);
    
    expect(screen.getByText('Loading metrics data...')).toBeInTheDocument();
  });

  it('should render with correct test id', () => {
    render(<LoadingState />);
    
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
  });

  it('should render spinning loader', () => {
    const { container } = render(<LoadingState />);
    
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin', 'rounded-full', 'h-8', 'w-8', 'border-b-2', 'border-indigo-600');
  });

  it('should apply correct styling classes', () => {
    const { container } = render(<LoadingState />);
    
    const mainContainer = screen.getByTestId('loading-state');
    expect(mainContainer).toHaveClass('flex', 'items-center', 'justify-center', 'py-12');
    
    const textElement = screen.getByText('Loading metrics data...');
    expect(textElement).toHaveClass('ml-3', 'text-gray-600', 'dark:text-gray-400');
  });

  it('should center the loading content', () => {
    const { container } = render(<LoadingState />);
    
    const mainContainer = screen.getByTestId('loading-state');
    expect(mainContainer).toHaveClass('flex', 'items-center', 'justify-center');
  });

  it('should have proper spacing between spinner and text', () => {
    const { container } = render(<LoadingState />);
    
    const textElement = screen.getByText('Loading metrics data...');
    expect(textElement).toHaveClass('ml-3');
  });
});
