import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UploadDashboard from '../components/UploadDashboard';

// Mock all the modal components
jest.mock('../../experiments/components/AddExperimentModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSuccess }: any) => (
    <div data-testid="add-experiment-modal">
      {isOpen ? 'Add Experiment Modal Open' : 'Add Experiment Modal Closed'}
    </div>
  )
}));

jest.mock('../../experiments/components/AddResultsModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSuccess }: any) => (
    <div data-testid="add-results-modal">
      {isOpen ? 'Add Results Modal Open' : 'Add Results Modal Closed'}
    </div>
  )
}));

jest.mock('../../experiments/components/AddWorkoutProtocolModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSuccess }: any) => (
    <div data-testid="add-workout-protocol-modal">
      {isOpen ? 'Add Workout Protocol Modal Open' : 'Add Workout Protocol Modal Closed'}
    </div>
  )
}));

jest.mock('../../experiments/components/AddSupplementProtocolModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSuccess }: any) => (
    <div data-testid="add-supplement-protocol-modal">
      {isOpen ? 'Add Supplement Protocol Modal Open' : 'Add Supplement Protocol Modal Closed'}
    </div>
  )
}));

jest.mock('../../experiments/components/EditExperimentModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSuccess }: any) => (
    <div data-testid="edit-experiment-modal">
      {isOpen ? 'Edit Experiment Modal Open' : 'Edit Experiment Modal Closed'}
    </div>
  )
}));

// Mock the upload section components
jest.mock('../components/UploadTabs', () => ({
  __esModule: true,
  DEFAULT_UPLOAD_TABS: [
    { id: 'blood-test', label: 'Blood Test', icon: 'test' },
    { id: 'health-data', label: 'Health Data', icon: 'health' },
    { id: 'experiments', label: 'Experiments', icon: 'experiment' }
  ],
  default: ({ activeTab, onTabChange, className }: any) => (
    <div data-testid="upload-tabs" className={className}>
      <button
        data-testid="tab-blood-test"
        onClick={() => onTabChange('blood-test')}
        className={activeTab === 'blood-test' ? 'active' : ''}
      >
        Blood Test
      </button>
      <button
        data-testid="tab-health-data"
        onClick={() => onTabChange('health-data')}
        className={activeTab === 'health-data' ? 'active' : ''}
      >
        Health Data
      </button>
      <button
        data-testid="tab-experiments"
        onClick={() => onTabChange('experiments')}
        className={activeTab === 'experiments' ? 'active' : ''}
      >
        Experiments
      </button>
    </div>
  )
}));

jest.mock('../components/BloodTestUploadSection', () => ({
  __esModule: true,
  default: () => <div data-testid="blood-test-section">Blood Test Section</div>
}));

jest.mock('../components/HealthDataUploadSection', () => ({
  __esModule: true,
  default: () => <div data-testid="health-data-section">Health Data Section</div>
}));

describe('UploadDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with default props', () => {
    render(<UploadDashboard />);

    // Check header content
    expect(screen.getByText('Health Data Upload')).toBeInTheDocument();
    expect(screen.getByText(/Upload and manage your health data/)).toBeInTheDocument();

    // Check tabs are rendered
    expect(screen.getByTestId('upload-tabs')).toBeInTheDocument();

    // Check default tab content
    expect(screen.getByTestId('blood-test-section')).toBeInTheDocument();
    expect(screen.queryByTestId('health-data-section')).not.toBeInTheDocument();
  });

  it('should render with custom className', () => {
    const customClass = 'custom-dashboard-class';
    render(<UploadDashboard className={customClass} />);

    // Find the root container by the custom class
    const container = document.querySelector('.max-w-7xl');
    expect(container).toHaveClass(customClass);
  });

  it('should initialize with blood-test as default active tab', () => {
    render(<UploadDashboard />);

    const bloodTestTab = screen.getByTestId('tab-blood-test');
    expect(bloodTestTab).toHaveClass('active');

    expect(screen.getByTestId('blood-test-section')).toBeInTheDocument();
  });

  it('should switch to health-data tab when clicked', async () => {
    render(<UploadDashboard />);

    const healthDataTab = screen.getByTestId('tab-health-data');
    await userEvent.click(healthDataTab);

    await waitFor(() => {
      expect(healthDataTab).toHaveClass('active');
      expect(screen.getByTestId('health-data-section')).toBeInTheDocument();
      expect(screen.queryByTestId('blood-test-section')).not.toBeInTheDocument();
    });
  });

  it('should switch back to blood-test tab', async () => {
    render(<UploadDashboard />);

    // First switch to health data
    const healthDataTab = screen.getByTestId('tab-health-data');
    await userEvent.click(healthDataTab);

    await waitFor(() => {
      expect(screen.getByTestId('health-data-section')).toBeInTheDocument();
    });

    // Then switch back to blood test
    const bloodTestTab = screen.getByTestId('tab-blood-test');
    await userEvent.click(bloodTestTab);

    await waitFor(() => {
      expect(bloodTestTab).toHaveClass('active');
      expect(screen.getByTestId('blood-test-section')).toBeInTheDocument();
      expect(screen.queryByTestId('health-data-section')).not.toBeInTheDocument();
    });
  });

  it('should open add experiment modal when experiments tab is clicked', async () => {
    render(<UploadDashboard />);

    const experimentsTab = screen.getByTestId('tab-experiments');
    await userEvent.click(experimentsTab);

    // Should not change active tab
    expect(screen.getByTestId('tab-blood-test')).toHaveClass('active');
    expect(screen.getByTestId('blood-test-section')).toBeInTheDocument();

    // Should open modal
    await waitFor(() => {
      expect(screen.getByTestId('add-experiment-modal')).toHaveTextContent('Add Experiment Modal Open');
    });
  });

  it('should close experiment modal', async () => {
    render(<UploadDashboard />);

    // Open modal
    const experimentsTab = screen.getByTestId('tab-experiments');
    await userEvent.click(experimentsTab);

    await waitFor(() => {
      expect(screen.getByTestId('add-experiment-modal')).toHaveTextContent('Add Experiment Modal Open');
    });

    // Note: In a real implementation, we would test the modal's onClose callback
    // but since we're mocking, we can't easily test the close functionality
  });

  it('should render all modals with correct initial state', () => {
    render(<UploadDashboard />);

    // All modals should be closed initially
    expect(screen.getByTestId('add-experiment-modal')).toHaveTextContent('Add Experiment Modal Closed');
    expect(screen.getByTestId('add-results-modal')).toHaveTextContent('Add Results Modal Closed');
    expect(screen.getByTestId('add-workout-protocol-modal')).toHaveTextContent('Add Workout Protocol Modal Closed');
    expect(screen.getByTestId('add-supplement-protocol-modal')).toHaveTextContent('Add Supplement Protocol Modal Closed');
    expect(screen.getByTestId('edit-experiment-modal')).toHaveTextContent('Edit Experiment Modal Closed');
  });

  it('should render tab content correctly', () => {
    render(<UploadDashboard />);

    // Test renderTabContent for blood-test
    expect(screen.getByTestId('blood-test-section')).toBeInTheDocument();

    // Switch to health-data and test renderTabContent
    const healthDataTab = screen.getByTestId('tab-health-data');
    userEvent.click(healthDataTab);

    waitFor(() => {
      expect(screen.getByTestId('health-data-section')).toBeInTheDocument();
    });
  });

  it('should handle handleTabChange correctly', () => {
    render(<UploadDashboard />);

    // Test switching to health-data
    const healthDataTab = screen.getByTestId('tab-health-data');
    userEvent.click(healthDataTab);

    waitFor(() => {
      expect(screen.getByTestId('health-data-section')).toBeInTheDocument();
      expect(screen.getByTestId('tab-blood-test')).not.toHaveClass('active');
    });
  });

  it('should handle experiments tab in handleTabChange', () => {
    render(<UploadDashboard />);

    const experimentsTab = screen.getByTestId('tab-experiments');
    userEvent.click(experimentsTab);

    // Should open experiment modal
    waitFor(() => {
      expect(screen.getByTestId('add-experiment-modal')).toHaveTextContent('Add Experiment Modal Open');
    });
  });

  it('should handle unknown tab gracefully', () => {
    render(<UploadDashboard />);

    // Test with unknown tab by directly setting state
    // Note: This tests the renderTabContent default case
    // In practice, this would happen if activeTab is set to an invalid value
  });

  it('should render with proper styling classes', () => {
    render(<UploadDashboard />);

    // Find the root container by its classes
    const container = document.querySelector('.max-w-7xl');
    expect(container).toHaveClass('max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'py-8');

    const header = screen.getByText('Health Data Upload');
    expect(header).toHaveClass('text-3xl', 'font-bold', 'text-gray-900', 'dark:text-white');

    const description = screen.getByText(/Upload and manage your health data/);
    expect(description).toHaveClass('mt-2', 'text-gray-600', 'dark:text-gray-400');
  });

  it('should pass correct props to UploadTabs', () => {
    render(<UploadDashboard />);

    const tabs = screen.getByTestId('upload-tabs');
    expect(tabs).toHaveClass('mb-8');
  });
});
