import React from 'react';
import { render, screen } from '@testing-library/react';
import ExperimentOverview from '../ExperimentOverview';
import { Experiment } from '../../../types/experiment';

const createMockExperiment = (overrides?: Partial<Experiment>): Experiment => ({
  id: '1',
  name: 'Test Experiment',
  description: 'Test description',
  frequency: 'Daily',
  duration: '30 days',
  fitnessMarkers: ['Weight'],
  bloodMarkers: ['Glucose'],
  startDate: '2023-01-01',
  endDate: '2023-01-31',
  status: 'active',
  progress: 50,
  createdAt: '2023-01-01',
  updatedAt: '2023-01-15',
  ...overrides
});

describe('ExperimentOverview', () => {
  it('should render experiment overview with all details', () => {
    const experiment = createMockExperiment();
    render(<ExperimentOverview experiment={experiment} />);
    
    // Check status
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    
    // Check frequency
    expect(screen.getByText('Frequency')).toBeInTheDocument();
    expect(screen.getByText('Daily')).toBeInTheDocument();
    
    // Check duration
    expect(screen.getByText('Duration')).toBeInTheDocument();
    expect(screen.getByText('30 days')).toBeInTheDocument();
    
    // Check timeline
    expect(screen.getByText('Timeline')).toBeInTheDocument();
    // Use more flexible date matching since formatting can vary by timezone
    expect(screen.getByText((content, element) => {
      return content.includes('2023') && content.includes(' - ') && content.includes('1/');
    })).toBeInTheDocument();
  });

  it('should display active status with green indicator', () => {
    const experiment = createMockExperiment({ status: 'active' });
    render(<ExperimentOverview experiment={experiment} />);
    
    expect(screen.getByText('Active')).toBeInTheDocument();
    const statusDot = document.querySelector('.bg-green-500');
    expect(statusDot).toBeInTheDocument();
  });

  it('should display paused status with yellow indicator', () => {
    const experiment = createMockExperiment({ status: 'paused' });
    render(<ExperimentOverview experiment={experiment} />);
    
    expect(screen.getByText('Paused')).toBeInTheDocument();
    const statusDot = document.querySelector('.bg-yellow-500');
    expect(statusDot).toBeInTheDocument();
  });

  it('should display completed status with blue indicator', () => {
    const experiment = createMockExperiment({ status: 'completed' });
    render(<ExperimentOverview experiment={experiment} />);
    
    expect(screen.getByText('Completed')).toBeInTheDocument();
    const statusDot = document.querySelector('.bg-blue-500');
    expect(statusDot).toBeInTheDocument();
  });

  it('should display unknown status with gray indicator for invalid status', () => {
    const experiment = createMockExperiment({ status: 'invalid' as any });
    render(<ExperimentOverview experiment={experiment} />);
    
    expect(screen.getByText('Unknown')).toBeInTheDocument();
    const statusDot = document.querySelector('.bg-gray-500');
    expect(statusDot).toBeInTheDocument();
  });

  it('should format dates correctly', () => {
    const experiment = createMockExperiment({
      startDate: '2023-12-25',
      endDate: '2024-01-15'
    });
    render(<ExperimentOverview experiment={experiment} />);
    
    // Dates should be formatted as locale strings - use flexible matching
    expect(screen.getByText((content, element) => {
      return content.includes('2023') && content.includes('2024') && content.includes(' - ');
    })).toBeInTheDocument();
  });

  it('should handle different frequency values', () => {
    const experiment = createMockExperiment({ frequency: 'Weekly' });
    render(<ExperimentOverview experiment={experiment} />);
    
    expect(screen.getByText('Weekly')).toBeInTheDocument();
  });

  it('should handle different duration values', () => {
    const experiment = createMockExperiment({ duration: '8 weeks' });
    render(<ExperimentOverview experiment={experiment} />);
    
    expect(screen.getByText('8 weeks')).toBeInTheDocument();
  });

  it('should render with responsive grid layout', () => {
    const experiment = createMockExperiment();
    const { container } = render(<ExperimentOverview experiment={experiment} />);
    
    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-4', 'gap-3', 'mb-6');
  });

  it('should apply correct styling classes', () => {
    const experiment = createMockExperiment();
    const { container } = render(<ExperimentOverview experiment={experiment} />);
    
    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass('p-6', 'border-b', 'border-gray-200', 'dark:border-gray-700');
  });
});
