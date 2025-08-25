import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExperimentCard, ExperimentList } from '../ExperimentCard';

const mockExperiment = {
  id: '1',
  name: 'Test Experiment',
  description: 'A test experiment for weight loss',
  frequency: 'Daily',
  duration: '30 days',
  fitnessMarkers: ['Weight', 'Body Fat %'],
  bloodMarkers: ['Glucose', 'Cholesterol'],
  startDate: '2023-01-01',
  endDate: '2023-01-31',
  status: 'active' as const,
  progress: 75,
  createdAt: '2023-01-01',
  updatedAt: '2023-01-15'
};

const mockCompletedExperiment = {
  ...mockExperiment,
  id: '2',
  name: 'Completed Experiment',
  status: 'completed' as const,
  progress: 100
};

describe('ExperimentCard', () => {
  it('should render active experiment card with progress', () => {
    const mockOnClick = jest.fn();
    
    render(
      <ExperimentCard 
        experiment={mockExperiment} 
        onClick={mockOnClick}
        isActive={true}
      />
    );

    expect(screen.getByText('Test Experiment')).toBeInTheDocument();
    expect(screen.getByText('Daily • 30 days')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
    
    // Should show first 4 markers (2 fitness + 2 blood markers)
    expect(screen.getByText('Weight')).toBeInTheDocument();
    expect(screen.getByText('Body Fat %')).toBeInTheDocument();
    expect(screen.getByText('Glucose')).toBeInTheDocument();
    expect(screen.getByText('Cholesterol')).toBeInTheDocument();
  });

  it('should show "more" indicator when there are more than 4 markers', () => {
    const experimentWithManyMarkers = {
      ...mockExperiment,
      fitnessMarkers: ['Weight', 'Body Fat %', 'HRV'],
      bloodMarkers: ['Glucose', 'Cholesterol', 'Triglycerides']
    };
    
    const mockOnClick = jest.fn();
    
    render(
      <ExperimentCard 
        experiment={experimentWithManyMarkers} 
        onClick={mockOnClick}
        isActive={true}
      />
    );

    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('should render completed experiment card without progress', () => {
    const mockOnClick = jest.fn();
    
    render(
      <ExperimentCard 
        experiment={mockCompletedExperiment} 
        onClick={mockOnClick}
        isActive={false}
      />
    );

    expect(screen.getByText('Completed Experiment')).toBeInTheDocument();
    expect(screen.getByText('✓ Completed')).toBeInTheDocument();
    expect(screen.queryByText('Progress')).not.toBeInTheDocument();
  });

  it('should call onClick when card is clicked', () => {
    const mockOnClick = jest.fn();
    
    render(
      <ExperimentCard 
        experiment={mockExperiment} 
        onClick={mockOnClick}
        isActive={true}
      />
    );

    fireEvent.click(screen.getByText('Test Experiment').closest('div')!);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should apply hover styles classes', () => {
    const mockOnClick = jest.fn();
    
    render(
      <ExperimentCard 
        experiment={mockExperiment} 
        onClick={mockOnClick}
        isActive={true}
      />
    );

    // Find the outermost card div, not the inner div containing the text
    const card = screen.getByText('Test Experiment').closest('.group');
    expect(card).toHaveClass('hover:shadow-md');
    expect(card).toHaveClass('hover:border-indigo-300');
    expect(card).toHaveClass('cursor-pointer');
  });

  it('should show progress bar with correct width', () => {
    const mockOnClick = jest.fn();
    
    render(
      <ExperimentCard 
        experiment={mockExperiment} 
        onClick={mockOnClick}
        isActive={true}
      />
    );

    // Find the progress bar by its class name since it doesn't have a role
    const progressBar = document.querySelector('.h-2.rounded-full.transition-all.duration-300.bg-purple-500');
    expect(progressBar).toHaveStyle('width: 75%');
  });
});

describe('ExperimentList', () => {
  const mockExperiments = [mockExperiment, mockCompletedExperiment];
  const mockOnExperimentClick = jest.fn();

  beforeEach(() => {
    mockOnExperimentClick.mockClear();
  });

  it('should render list of experiments', () => {
    render(
      <ExperimentList
        experiments={mockExperiments}
        onExperimentClick={mockOnExperimentClick}
        title="Test Experiments"
        emptyMessage="No experiments found"
      />
    );

    expect(screen.getByText('Test Experiment')).toBeInTheDocument();
    expect(screen.getByText('Completed Experiment')).toBeInTheDocument();
  });

  it('should show empty state when no experiments', () => {
    render(
      <ExperimentList
        experiments={[]}
        onExperimentClick={mockOnExperimentClick}
        title="Test Experiments"
        emptyMessage="No experiments found"
      />
    );

    expect(screen.getByText('No experiments found')).toBeInTheDocument();
    // Check for SVG by its attributes since it doesn't have an img role
    const svg = document.querySelector('svg[viewBox="0 0 24 24"]');
    expect(svg).toBeInTheDocument();
  });

  it('should call onExperimentClick when experiment is clicked', () => {
    render(
      <ExperimentList
        experiments={mockExperiments}
        onExperimentClick={mockOnExperimentClick}
        title="Test Experiments"
        emptyMessage="No experiments found"
      />
    );

    fireEvent.click(screen.getByText('Test Experiment').closest('div')!);
    expect(mockOnExperimentClick).toHaveBeenCalledWith(mockExperiment);
  });

  it('should render cards with appropriate active/inactive states', () => {
    render(
      <ExperimentList
        experiments={mockExperiments}
        onExperimentClick={mockOnExperimentClick}
        title="Test Experiments"
        emptyMessage="No experiments found"
      />
    );

    // Active experiment should show progress
    expect(screen.getByText('75%')).toBeInTheDocument();
    
    // Completed experiment should show completed badge
    expect(screen.getByText('✓ Completed')).toBeInTheDocument();
  });

  it('should handle empty experiments array gracefully', () => {
    render(
      <ExperimentList
        experiments={[]}
        onExperimentClick={mockOnExperimentClick}
        title="Empty List"
        emptyMessage="Nothing to see here"
      />
    );

    expect(screen.getByText('Nothing to see here')).toBeInTheDocument();
    expect(screen.queryByText('Test Experiment')).not.toBeInTheDocument();
  });

  it('should render experiments with no markers', () => {
    const experimentWithoutMarkers = {
      ...mockExperiment,
      fitnessMarkers: [],
      bloodMarkers: []
    };

    render(
      <ExperimentList
        experiments={[experimentWithoutMarkers]}
        onExperimentClick={mockOnExperimentClick}
        title="Test Experiments"
        emptyMessage="No experiments found"
      />
    );

    expect(screen.getByText('Test Experiment')).toBeInTheDocument();
    expect(screen.queryByText('Weight')).not.toBeInTheDocument();
    expect(screen.queryByText('+0 more')).not.toBeInTheDocument();
  });
});
