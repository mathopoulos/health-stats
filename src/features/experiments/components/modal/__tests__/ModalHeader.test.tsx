import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ModalHeader from '../ModalHeader';
import { Experiment } from '../../../types/experiment';

const mockExperiment: Experiment = {
  id: '1',
  name: 'Test Experiment',
  description: 'This is a test experiment description',
  frequency: 'Daily',
  duration: '30 days',
  fitnessMarkers: ['Weight'],
  bloodMarkers: ['Glucose'],
  startDate: '2023-01-01',
  endDate: '2023-01-31',
  status: 'active',
  progress: 50,
  createdAt: '2023-01-01',
  updatedAt: '2023-01-15'
};

describe('ModalHeader', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('should render experiment name and description', () => {
    render(<ModalHeader experiment={mockExperiment} onClose={mockOnClose} />);
    
    expect(screen.getByText('Test Experiment')).toBeInTheDocument();
    expect(screen.getByText('This is a test experiment description')).toBeInTheDocument();
  });

  it('should render close button with correct styling', () => {
    render(<ModalHeader experiment={mockExperiment} onClose={mockOnClose} />);
    
    const closeButton = screen.getByTestId('close-modal-button');
    expect(closeButton).toBeInTheDocument();
    expect(closeButton).toHaveClass('p-2', 'hover:bg-gray-100', 'dark:hover:bg-gray-700', 'rounded-lg', 'transition-colors');
  });

  it('should call onClose when close button is clicked', () => {
    render(<ModalHeader experiment={mockExperiment} onClose={mockOnClose} />);
    
    const closeButton = screen.getByTestId('close-modal-button');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should render SVG icon in close button', () => {
    render(<ModalHeader experiment={mockExperiment} onClose={mockOnClose} />);
    
    const svgIcon = screen.getByTestId('close-modal-button').querySelector('svg');
    expect(svgIcon).toBeInTheDocument();
    expect(svgIcon).toHaveAttribute('viewBox', '0 0 24 24');
  });

  it('should handle experiment with empty description', () => {
    const experimentWithEmptyDescription = { ...mockExperiment, description: '' };
    const { container } = render(<ModalHeader experiment={experimentWithEmptyDescription} onClose={mockOnClose} />);
    
    expect(screen.getByText('Test Experiment')).toBeInTheDocument();
    
    // Check that the description paragraph exists, even if empty
    const descriptionElement = container.querySelector('p.text-gray-600');
    expect(descriptionElement).toBeInTheDocument();
    expect(descriptionElement?.textContent).toBe('');
  });

  it('should handle experiment with long name and description', () => {
    const longExperiment = {
      ...mockExperiment,
      name: 'This is a very long experiment name that might wrap to multiple lines in the UI',
      description: 'This is a very long description that contains a lot of detailed information about what this experiment is testing and what the expected outcomes might be.'
    };
    
    render(<ModalHeader experiment={longExperiment} onClose={mockOnClose} />);
    
    expect(screen.getByText(longExperiment.name)).toBeInTheDocument();
    expect(screen.getByText(longExperiment.description)).toBeInTheDocument();
  });
});
