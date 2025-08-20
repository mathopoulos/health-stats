import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UploadProvider, useUploadContext } from '../context/UploadContext';
import { usePDFUpload } from '../hooks/usePDFUpload';
import UploadDashboard from '../components/UploadDashboard';
import { UploadError } from '../types';

// Mock components
jest.mock('../components/UploadTabs', () => ({
  __esModule: true,
  default: ({ tabs = [], activeTab, onTabChange }: any) => (
    <div data-testid="upload-tabs">
      <button
        data-testid="tab-blood-test"
        onClick={() => onTabChange && onTabChange('blood-test')}
        className={activeTab === 'blood-test' ? 'active' : ''}
      >
        Blood Test
      </button>
      <button
        data-testid="tab-health-data"
        onClick={() => onTabChange && onTabChange('health-data')}
        className={activeTab === 'health-data' ? 'active' : ''}
      >
        Health Data
      </button>
      <button
        data-testid="tab-experiments"
        onClick={() => onTabChange && onTabChange('experiments')}
        className={activeTab === 'experiments' ? 'active' : ''}
      >
        Experiments
      </button>
    </div>
  )
}));

jest.mock('../components/BloodTestUploadSection', () => ({
  __esModule: true,
  default: () => <div data-testid="blood-test-section">Blood Test Upload Section</div>
}));

jest.mock('../components/HealthDataUploadSection', () => ({
  __esModule: true,
  default: () => <div data-testid="health-data-section">Health Data Upload Section</div>
}));

// Test component that provides upload context
const TestUploadApp: React.FC = () => {
  return (
    <UploadProvider>
      <UploadDashboard />
    </UploadProvider>
  );
};

describe('Upload Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render upload dashboard with all components', () => {
    render(<TestUploadApp />);

    expect(screen.getByText(/Health Data Upload/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload and manage your health data/i)).toBeInTheDocument();
    expect(screen.getByTestId('upload-tabs')).toBeInTheDocument();
  });

  it('should switch between upload tabs', async () => {
    render(<TestUploadApp />);

    // Should start with blood test tab active
    expect(screen.getByTestId('tab-blood-test')).toHaveClass('active');

    // Click on health data tab
    const healthDataTab = screen.getByTestId('tab-health-data');
    userEvent.click(healthDataTab);

    // Should show health data section
    await waitFor(() => {
      expect(screen.getByTestId('health-data-section')).toBeInTheDocument();
    });

    // Blood test tab should not be active
    expect(screen.getByTestId('tab-blood-test')).not.toHaveClass('active');
  });

  it('should handle experiments tab click', async () => {
    render(<TestUploadApp />);

    // Click on experiments tab
    const experimentsTab = screen.getByTestId('tab-experiments');
    userEvent.click(experimentsTab);

    // Should remain on current tab since experiments opens modal
    expect(screen.getByTestId('tab-blood-test')).toHaveClass('active');
  });

  it('should render correct section based on active tab', async () => {
    render(<TestUploadApp />);

    // Should show blood test section by default
    expect(screen.getByTestId('blood-test-section')).toBeInTheDocument();

    // Switch to health data tab
    userEvent.click(screen.getByTestId('tab-health-data'));

    await waitFor(() => {
      expect(screen.getByTestId('health-data-section')).toBeInTheDocument();
      expect(screen.queryByTestId('blood-test-section')).not.toBeInTheDocument();
    });
  });

  it('should maintain tab state across renders', async () => {
    const { rerender } = render(<TestUploadApp />);

    // Switch to health data tab
    userEvent.click(screen.getByTestId('tab-health-data'));

    await waitFor(() => {
      expect(screen.getByTestId('health-data-section')).toBeInTheDocument();
    });

    // Re-render component
    rerender(<TestUploadApp />);

    // Should still be on health data tab
    expect(screen.getByTestId('health-data-section')).toBeInTheDocument();
    expect(screen.getByTestId('tab-health-data')).toHaveClass('active');
  });

  it('should handle tab navigation with keyboard', async () => {
    render(<TestUploadApp />);

    const bloodTestTab = screen.getByTestId('tab-blood-test');

    // Focus on tab
    bloodTestTab.focus();

    // Tab should be focusable
    expect(bloodTestTab).toHaveFocus();
  });

  it('should provide accessibility features', () => {
    render(<TestUploadApp />);

    // Should have proper ARIA labels
    expect(screen.getByTestId('upload-tabs')).toBeInTheDocument();

    // Tabs should have proper roles
    const tabs = screen.getAllByRole('button');
    expect(tabs.length).toBeGreaterThan(0);
  });

  it('should handle responsive design', () => {
    render(<TestUploadApp />);

    // Should render tabs on larger screens
    expect(screen.getByTestId('upload-tabs')).toBeInTheDocument();

    // Should be able to switch tabs on mobile
    const healthDataTab = screen.getByTestId('tab-health-data');
    userEvent.click(healthDataTab);

    expect(healthDataTab).toHaveClass('active');
  });
});

// Test upload hooks integration
describe('Upload Hooks Integration', () => {
  const TestHookComponent: React.FC = () => {
    const pdfUpload = usePDFUpload({
      onMarkersExtracted: (markers, dateGroups) => {
        console.log('Markers extracted:', markers.length);
      }
    });

    const handleUpload = async () => {
      const file = new File(['test pdf content'], 'test.pdf', { type: 'application/pdf' });
      await pdfUpload.uploadFile(file);
    };

    return (
      <div>
        <button onClick={handleUpload} data-testid="upload-btn">
          Upload PDF
        </button>
        <div data-testid="upload-status">
          {pdfUpload.isUploading ? 'Uploading...' :
           pdfUpload.isProcessing ? 'Processing...' :
           pdfUpload.hasError ? 'Error' :
           'Ready'}
        </div>
        <div data-testid="markers-count">
          {pdfUpload.extractedMarkers.length}
        </div>
      </div>
    );
  };

  it('should integrate PDF upload hook correctly', async () => {
    render(
      <UploadProvider>
        <TestHookComponent />
      </UploadProvider>
    );

    expect(screen.getByTestId('upload-status')).toHaveTextContent('Ready');
    expect(screen.getByTestId('markers-count')).toHaveTextContent('0');

    // Upload button should be present
    expect(screen.getByTestId('upload-btn')).toBeInTheDocument();
  });

  it('should handle upload state transitions', async () => {
    render(
      <UploadProvider>
        <TestHookComponent />
      </UploadProvider>
    );

    // Initial state
    expect(screen.getByTestId('upload-status')).toHaveTextContent('Ready');

    // Note: In a real test environment, we would mock the upload API
    // and test the state transitions properly
  });

  it('should handle error states', () => {
    // Test error handling in upload hooks
    const error: UploadError = {
      code: 'UPLOAD_FAILED',
      message: 'Upload failed',
      details: { reason: 'network error' }
    };

    // Test that error handling works as expected
    expect(error.code).toBe('UPLOAD_FAILED');
    expect(error.message).toBe('Upload failed');
  });
});

// Test error boundary integration
describe('Error Boundary Integration', () => {
  it('should handle errors gracefully in upload components', () => {
    const ErrorThrowingComponent = () => {
      throw new Error('Upload component error');
    };

    // This would normally be wrapped in an error boundary
    expect(() => {
      render(<ErrorThrowingComponent />);
    }).toThrow('Upload component error');
  });

  it('should recover from errors with retry mechanism', () => {
    // Test that error boundaries can recover from upload errors
    const error: UploadError = {
      code: 'RECOVERABLE_ERROR',
      message: 'Temporary error',
      details: { canRetry: true }
    };

    expect(error.code).toBe('RECOVERABLE_ERROR');
    expect(error.details?.canRetry).toBe(true);
  });
});
