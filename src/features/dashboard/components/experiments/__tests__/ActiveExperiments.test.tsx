import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ActiveExperiments from '../ActiveExperiments';

// Mock the custom hooks
const mockUseExperiments = {
  activeExperiments: [],
  pastExperiments: [],
  isLoading: false,
  error: null
};

const mockUseExperimentFitnessData = {
  experimentFitnessData: {},
  isLoadingFitnessData: false,
  fetchExperimentFitnessData: jest.fn()
};

const mockUseExperimentBloodMarkerData = {
  experimentBloodMarkerData: {},
  isLoadingBloodMarkerData: false,
  fetchExperimentBloodMarkerData: jest.fn()
};

jest.mock('../../../hooks/useExperimentData', () => ({
  useExperiments: jest.fn(() => mockUseExperiments),
  useExperimentFitnessData: jest.fn(() => mockUseExperimentFitnessData),
  useExperimentBloodMarkerData: jest.fn(() => mockUseExperimentBloodMarkerData)
}));

jest.mock('../ExperimentDetailsModal', () => {
  return function MockExperimentDetailsModal({ experiment, onClose }: any) {
    if (!experiment) return null;
    return (
      <div data-testid="experiment-modal">
        <h2>{experiment.name}</h2>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

jest.mock('../ExperimentCard', () => ({
  ExperimentList: ({ experiments, onExperimentClick, emptyMessage }: any) => {
    if (experiments.length === 0) {
      return <div data-testid="empty-state">{emptyMessage}</div>;
    }
    return (
      <div data-testid="experiment-list">
        {experiments.map((exp: any) => (
          <div key={exp.id} onClick={() => onExperimentClick(exp)}>
            {exp.name}
          </div>
        ))}
      </div>
    );
  }
}));

const mockActiveExperiment = {
  id: '1',
  name: 'Active Test Experiment',
  description: 'An active experiment',
  frequency: 'Daily',
  duration: '30 days',
  fitnessMarkers: ['Weight'],
  bloodMarkers: ['Glucose'],
  startDate: '2023-01-01',
  endDate: '2023-01-31',
  status: 'active' as const,
  progress: 75,
  createdAt: '2023-01-01',
  updatedAt: '2023-01-15'
};

const mockCompletedExperiment = {
  id: '2',
  name: 'Completed Test Experiment',
  description: 'A completed experiment',
  frequency: 'Weekly',
  duration: '8 weeks',
  fitnessMarkers: ['HRV'],
  bloodMarkers: ['Cholesterol'],
  startDate: '2022-01-01',
  endDate: '2022-03-01',
  status: 'completed' as const,
  progress: 100,
  createdAt: '2022-01-01',
  updatedAt: '2022-03-01'
};

describe('ActiveExperiments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock implementations
    (mockUseExperiments as any).activeExperiments = [];
    (mockUseExperiments as any).pastExperiments = [];
    (mockUseExperiments as any).isLoading = false;
    (mockUseExperiments as any).error = null;
  });

  it('should render loading state', () => {
    (mockUseExperiments as any).isLoading = true;

    render(<ActiveExperiments userId="user123" />);

    expect(screen.getByText('Loading experiments...')).toBeInTheDocument();
    // Check for spinner by its class since it doesn't have a role
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should render error state', () => {
    (mockUseExperiments as any).error = 'Failed to load experiments';

    render(<ActiveExperiments userId="user123" />);

    expect(screen.getByText('Failed to load experiments')).toBeInTheDocument();
  });

  it('should render active experiments section', () => {
    (mockUseExperiments as any).activeExperiments = [mockActiveExperiment];

    render(<ActiveExperiments userId="user123" />);

    expect(screen.getByText('Active Experiments')).toBeInTheDocument();
    expect(screen.getByText('1 active')).toBeInTheDocument();
    expect(screen.getByTestId('experiment-list')).toBeInTheDocument();
  });

  it('should render empty state for active experiments', () => {
    render(<ActiveExperiments userId="user123" />);

    expect(screen.getByText('Active Experiments')).toBeInTheDocument();
    expect(screen.getByText('0 active')).toBeInTheDocument();
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('should render past experiments when available', () => {
    (mockUseExperiments as any).activeExperiments = [mockActiveExperiment];
    (mockUseExperiments as any).pastExperiments = [mockCompletedExperiment];

    render(<ActiveExperiments userId="user123" />);

    expect(screen.getByText('Past Experiments')).toBeInTheDocument();
    expect(screen.getByText('1 completed')).toBeInTheDocument();
  });

  it('should not render past experiments section when none exist', () => {
    (mockUseExperiments as any).activeExperiments = [mockActiveExperiment];

    render(<ActiveExperiments userId="user123" />);

    expect(screen.queryByText('Past Experiments')).not.toBeInTheDocument();
  });

  it('should open modal when experiment is clicked', async () => {
    (mockUseExperiments as any).activeExperiments = [mockActiveExperiment];

    render(<ActiveExperiments userId="user123" />);

    // Click the first occurrence (in the experiment list, not the modal)
    const experimentElements = screen.getAllByText('Active Test Experiment');
    fireEvent.click(experimentElements[0]);

    await waitFor(() => {
      expect(screen.getByTestId('experiment-modal')).toBeInTheDocument();
      // Check that there are now multiple instances of the text (list + modal)
      expect(screen.getAllByText('Active Test Experiment')).toHaveLength(2);
    });

    expect(mockUseExperimentFitnessData.fetchExperimentFitnessData).toHaveBeenCalledWith(mockActiveExperiment);
    expect(mockUseExperimentBloodMarkerData.fetchExperimentBloodMarkerData).toHaveBeenCalledWith(mockActiveExperiment);
  });

  it('should not fetch fitness data when experiment has no fitness markers', async () => {
    const experimentWithoutFitnessMarkers = {
      ...mockActiveExperiment,
      fitnessMarkers: []
    };
    (mockUseExperiments as any).activeExperiments = [experimentWithoutFitnessMarkers];

    render(<ActiveExperiments userId="user123" />);

    fireEvent.click(screen.getByText('Active Test Experiment'));

    await waitFor(() => {
      expect(screen.getByTestId('experiment-modal')).toBeInTheDocument();
    });

    expect(mockUseExperimentFitnessData.fetchExperimentFitnessData).not.toHaveBeenCalled();
  });

  it('should not fetch blood marker data when experiment has no blood markers', async () => {
    const experimentWithoutBloodMarkers = {
      ...mockActiveExperiment,
      bloodMarkers: []
    };
    (mockUseExperiments as any).activeExperiments = [experimentWithoutBloodMarkers];

    render(<ActiveExperiments userId="user123" />);

    fireEvent.click(screen.getByText('Active Test Experiment'));

    await waitFor(() => {
      expect(screen.getByTestId('experiment-modal')).toBeInTheDocument();
    });

    expect(mockUseExperimentBloodMarkerData.fetchExperimentBloodMarkerData).not.toHaveBeenCalled();
  });

  it('should close modal when close is clicked', async () => {
    (mockUseExperiments as any).activeExperiments = [mockActiveExperiment];

    render(<ActiveExperiments userId="user123" />);

    // Open modal
    fireEvent.click(screen.getByText('Active Test Experiment'));

    await waitFor(() => {
      expect(screen.getByTestId('experiment-modal')).toBeInTheDocument();
    });

    // Close modal
    fireEvent.click(screen.getByText('Close'));

    await waitFor(() => {
      expect(screen.queryByTestId('experiment-modal')).not.toBeInTheDocument();
    });
  });

  it('should pass correct props to ExperimentDetailsModal', async () => {
    (mockUseExperiments as any).activeExperiments = [mockActiveExperiment];
    (mockUseExperimentFitnessData as any).experimentFitnessData = { Weight: [] };
    (mockUseExperimentBloodMarkerData as any).experimentBloodMarkerData = { Glucose: [] };
    (mockUseExperimentFitnessData as any).isLoadingFitnessData = true;
    (mockUseExperimentBloodMarkerData as any).isLoadingBloodMarkerData = false;

    render(<ActiveExperiments userId="user123" />);

    // Click the first occurrence (in the experiment list, not the modal)
    const experimentElements = screen.getAllByText('Active Test Experiment');
    fireEvent.click(experimentElements[0]);

    await waitFor(() => {
      expect(screen.getByTestId('experiment-modal')).toBeInTheDocument();
    });

    // Modal should receive the experiment and data - check for multiple instances
    expect(screen.getAllByText('Active Test Experiment')).toHaveLength(2);
  });

  it('should handle experiments with mixed active and completed status', () => {
    (mockUseExperiments as any).activeExperiments = [mockActiveExperiment];
    (mockUseExperiments as any).pastExperiments = [mockCompletedExperiment];

    render(<ActiveExperiments userId="user123" />);

    expect(screen.getByText('1 active')).toBeInTheDocument();
    expect(screen.getByText('1 completed')).toBeInTheDocument();
    expect(screen.getByText('Active Test Experiment')).toBeInTheDocument();
    expect(screen.getByText('Completed Test Experiment')).toBeInTheDocument();
  });

  it('should render without userId', () => {
    render(<ActiveExperiments />);

    expect(screen.getByText('Active Experiments')).toBeInTheDocument();
    expect(screen.getByText('0 active')).toBeInTheDocument();
  });

  it('should handle clicking on past experiments', async () => {
    (mockUseExperiments as any).pastExperiments = [mockCompletedExperiment];

    render(<ActiveExperiments userId="user123" />);

    fireEvent.click(screen.getByText('Completed Test Experiment'));

    await waitFor(() => {
      expect(screen.getByTestId('experiment-modal')).toBeInTheDocument();
    });

    expect(mockUseExperimentFitnessData.fetchExperimentFitnessData).toHaveBeenCalledWith(mockCompletedExperiment);
  });
});
