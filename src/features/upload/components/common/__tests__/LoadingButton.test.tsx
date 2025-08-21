import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LoadingButton from '../LoadingButton';

describe('LoadingButton', () => {
  const defaultProps = {
    children: 'Click Me',
    onClick: jest.fn(),
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders button with children when not loading', () => {
    render(<LoadingButton {...defaultProps} />);
    
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('calls onClick when clicked and not loading', () => {
    const onClick = jest.fn();
    render(<LoadingButton {...defaultProps} onClick={onClick} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading spinner when loading is true', () => {
    render(<LoadingButton {...defaultProps} loading={true} />);
    
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('is disabled when loading is true', () => {
    render(<LoadingButton {...defaultProps} loading={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('does not call onClick when loading', () => {
    const onClick = jest.fn();
    render(<LoadingButton {...defaultProps} onClick={onClick} loading={true} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(onClick).not.toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<LoadingButton {...defaultProps} disabled={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('applies custom className', () => {
    render(<LoadingButton {...defaultProps} className="custom-class" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('applies default button styles', () => {
    render(<LoadingButton {...defaultProps} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center');
  });

  it('shows both spinner and text when loading', () => {
    render(<LoadingButton {...defaultProps} loading={true}>Saving...</LoadingButton>);
    
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('applies variant styles correctly', () => {
    render(<LoadingButton {...defaultProps} variant="secondary" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('border-gray-300', 'text-gray-700', 'bg-white');
  });

  it('applies primary variant by default', () => {
    render(<LoadingButton {...defaultProps} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-indigo-600', 'text-white');
  });

  it('applies danger variant styles correctly', () => {
    render(<LoadingButton {...defaultProps} variant="danger" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-red-600', 'text-white');
  });

  it('applies size styles correctly', () => {
    render(<LoadingButton {...defaultProps} size="sm" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm');
  });

  it('applies medium size by default', () => {
    render(<LoadingButton {...defaultProps} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-4', 'py-2', 'text-sm');
  });

  it('applies large size styles correctly', () => {
    render(<LoadingButton {...defaultProps} size="lg" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-6', 'py-3', 'text-base');
  });
});
