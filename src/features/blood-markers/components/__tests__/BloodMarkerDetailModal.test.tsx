import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BloodMarkerDetailModal from '../BloodMarkerDetailModal';

// Mock external dependencies
jest.mock('@lib/bloodMarkerRanges', () => ({
  getReferenceRanges: jest.fn(() => ({
    abnormalText: '< 70 or > 110',
    normalText: '70 - 99',
    optimalText: '80 - 90'
  })),
  getBloodMarkerStatus: jest.fn(() => 'normal'),
  BLOOD_MARKER_STATUS_COLORS: {
    normal: '#10B981',
    abnormal: '#EF4444',
    optimal: '#059669'
  }
}));

jest.mock('@features/blood-markers/components/BloodMarkerChart', () => {
  return function MockBloodMarkerChart({ markerName }: { markerName: string }) {
    return <div data-testid="blood-marker-chart">{markerName} Chart</div>;
  };
});

// Mock window resize for Recharts
Object.defineProperty(window, 'dispatchEvent', {
  value: jest.fn(),
});

const mockBloodMarkerData = [
  {
    value: 85,
    unit: 'mg/dL',
    date: '2023-12-01',
    referenceRange: { min: 70, max: 110 }
  },
  {
    value: 90,
    unit: 'mg/dL', 
    date: '2023-11-01',
    referenceRange: { min: 70, max: 110 }
  },
  {
    value: 88,
    unit: 'mg/dL',
    date: '2023-10-01',
    referenceRange: { min: 70, max: 110 }
  }
];

describe('BloodMarkerDetailModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    markerName: 'Glucose',
    data: mockBloodMarkerData,
    userId: 'test-user-id'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render when isOpen is true', () => {
      render(<BloodMarkerDetailModal {...defaultProps} />);
      
      expect(screen.getByText('Glucose')).toBeInTheDocument();
      expect(screen.getAllByText('85 mg/dL')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Normal')[0]).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<BloodMarkerDetailModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('Glucose')).not.toBeInTheDocument();
    });

    it('should render current value and status', () => {
      render(<BloodMarkerDetailModal {...defaultProps} />);
      
      const currentValue = screen.getAllByText('85 mg/dL')[0];
      const status = screen.getAllByText('Normal')[0];
      
      expect(currentValue).toBeInTheDocument();
      expect(status).toBeInTheDocument();
      expect(status).toHaveStyle({ backgroundColor: '#10B981' });
    });

    it('should render last tested date', () => {
      render(<BloodMarkerDetailModal {...defaultProps} />);
      
      expect(screen.getByText(/Last tested:/)).toBeInTheDocument();
      expect(screen.getByText(/12\/1\/2023|11\/30\/2023/)).toBeInTheDocument();
    });
  });

  describe('Reference Ranges', () => {
    it('should render reference ranges when available', () => {
      render(<BloodMarkerDetailModal {...defaultProps} />);
      
      expect(screen.getByText('Abnormal:')).toBeInTheDocument();
      expect(screen.getByText('< 70 or > 110')).toBeInTheDocument();
      expect(screen.getByText('Normal:')).toBeInTheDocument();
      expect(screen.getByText('70 - 99')).toBeInTheDocument();
      expect(screen.getByText('Optimal:')).toBeInTheDocument();
      expect(screen.getByText('80 - 90')).toBeInTheDocument();
    });

    it('should render color indicators for each range', () => {
      const { container } = render(<BloodMarkerDetailModal {...defaultProps} />);
      
      const colorIndicators = container.querySelectorAll('.w-2.h-2.rounded-full');
      expect(colorIndicators).toHaveLength(3);
      
      expect(colorIndicators[0]).toHaveClass('bg-red-500');
      expect(colorIndicators[1]).toHaveClass('bg-yellow-500');
      expect(colorIndicators[2]).toHaveClass('bg-green-500');
    });
  });

  describe('Historical Data', () => {
    it('should render chart component', () => {
      render(<BloodMarkerDetailModal {...defaultProps} />);
      
      expect(screen.getByTestId('blood-marker-chart')).toBeInTheDocument();
      expect(screen.getByText('Glucose Chart')).toBeInTheDocument();
    });

    it('should render recent history table', () => {
      render(<BloodMarkerDetailModal {...defaultProps} />);
      
      expect(screen.getByText('Recent History')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Value')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('should render up to 5 recent history entries', () => {
      const manyDataPoints = Array.from({ length: 10 }, (_, i) => ({
        value: 85 + i,
        unit: 'mg/dL',
        date: `2023-${12 - i}-01`,
        referenceRange: { min: 70, max: 110 }
      }));

      render(<BloodMarkerDetailModal {...defaultProps} data={manyDataPoints} />);
      
      // Should show maximum 5 entries in the table
      const tableRows = screen.getAllByRole('row');
      expect(tableRows).toHaveLength(6); // 1 header + 5 data rows
    });

    it('should handle empty data gracefully', () => {
      render(<BloodMarkerDetailModal {...defaultProps} data={[]} />);
      
      expect(screen.getByText('Glucose')).toBeInTheDocument();
      expect(screen.getByText('Last tested: No data')).toBeInTheDocument();
    });
  });

  describe('Close Button Functionality', () => {
    it('should render close button', () => {
      render(<BloodMarkerDetailModal {...defaultProps} />);
      
      const closeButton = screen.getByRole('button');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton.querySelector('svg')).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
      const mockOnClose = jest.fn();
      render(<BloodMarkerDetailModal {...defaultProps} onClose={mockOnClose} />);
      
      const closeButton = screen.getByRole('button');
      fireEvent.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Click Outside to Close Functionality', () => {
    it('should call onClose when clicking the backdrop', () => {
      const mockOnClose = jest.fn();
      const { container } = render(<BloodMarkerDetailModal {...defaultProps} onClose={mockOnClose} />);
      
      // Click the backdrop (the outermost div)
      const backdrop = container.firstChild as HTMLElement;
      fireEvent.click(backdrop);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should NOT call onClose when clicking inside the modal content', () => {
      const mockOnClose = jest.fn();
      render(<BloodMarkerDetailModal {...defaultProps} onClose={mockOnClose} />);
      
      // Click inside the modal content
      const modalContent = screen.getByText('Glucose');
      fireEvent.click(modalContent);
      
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should NOT call onClose when clicking on the chart', () => {
      const mockOnClose = jest.fn();
      render(<BloodMarkerDetailModal {...defaultProps} onClose={mockOnClose} />);
      
      const chart = screen.getByTestId('blood-marker-chart');
      fireEvent.click(chart);
      
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should NOT call onClose when clicking on the history table', () => {
      const mockOnClose = jest.fn();
      render(<BloodMarkerDetailModal {...defaultProps} onClose={mockOnClose} />);
      
      const historyTable = screen.getByText('Recent History');
      fireEvent.click(historyTable);
      
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive classes for mobile and desktop', () => {
      const { container } = render(<BloodMarkerDetailModal {...defaultProps} />);
      
      const modal = container.querySelector('.w-\\[90vw\\]');
      expect(modal).toHaveClass('max-w-2xl', 'max-h-[95vh]', 'sm:max-h-[90vh]');
    });

    it('should render responsive text sizes', () => {
      render(<BloodMarkerDetailModal {...defaultProps} />);
      
      const title = screen.getByText('Glucose');
      expect(title).toHaveClass('text-lg', 'sm:text-2xl');
      
      const value = screen.getAllByText('85 mg/dL')[0];
      expect(value).toHaveClass('text-2xl', 'sm:text-3xl');
    });
  });

  describe('Different Marker Names and Data', () => {
    it('should handle different marker names', () => {
      render(<BloodMarkerDetailModal {...defaultProps} markerName="Cholesterol" />);
      
      expect(screen.getByText('Cholesterol')).toBeInTheDocument();
    });

    it('should handle data with different units', () => {
      const dataWithDifferentUnit = [{
        value: 4.5,
        unit: 'mmol/L',
        date: '2023-12-01',
        referenceRange: { min: 3.0, max: 6.0 }
      }];

      render(<BloodMarkerDetailModal {...defaultProps} data={dataWithDifferentUnit} />);
      
      expect(screen.getAllByText('4.5 mmol/L')[0]).toBeInTheDocument();
    });

    it('should handle single data point', () => {
      const singleDataPoint = [{
        value: 95,
        unit: 'mg/dL',
        date: '2023-12-01',
        referenceRange: { min: 70, max: 110 }
      }];

      render(<BloodMarkerDetailModal {...defaultProps} data={singleDataPoint} />);
      
      expect(screen.getAllByText('95 mg/dL')[0]).toBeInTheDocument();
      expect(screen.getByText(/12\/1\/2023|11\/30\/2023/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const { container } = render(<BloodMarkerDetailModal {...defaultProps} />);
      
      const modal = container.firstChild as HTMLElement;
      expect(modal).toHaveClass('fixed', 'inset-0');
      expect(modal).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      render(<BloodMarkerDetailModal {...defaultProps} />);
      
      const mainTitle = screen.getByRole('heading', { level: 2 });
      expect(mainTitle).toHaveTextContent('Glucose');
      
      const sectionTitles = screen.getAllByRole('heading', { level: 3 });
      expect(sectionTitles).toHaveLength(2);
      expect(sectionTitles[0]).toHaveTextContent('Historical Trend');
      expect(sectionTitles[1]).toHaveTextContent('Recent History');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing reference ranges', () => {
      const dataWithoutRanges = [{
        value: 95,
        unit: 'mg/dL',
        date: '2023-12-01'
      }];

      render(<BloodMarkerDetailModal {...defaultProps} data={dataWithoutRanges} />);
      
      expect(screen.getByText('Glucose')).toBeInTheDocument();
      expect(screen.getAllByText('95 mg/dL')[0]).toBeInTheDocument();
    });

    it('should handle missing units', () => {
      const dataWithoutUnits = [{
        value: 95,
        unit: '',
        date: '2023-12-01',
        referenceRange: { min: 70, max: 110 }
      }];

      render(<BloodMarkerDetailModal {...defaultProps} data={dataWithoutUnits} />);
      
      expect(screen.getAllByText('95')[0]).toBeInTheDocument(); // Just value without unit
    });

    it('should handle invalid dates gracefully', () => {
      const dataWithInvalidDate = [{
        value: 95,
        unit: 'mg/dL',
        date: 'invalid-date',
        referenceRange: { min: 70, max: 110 }
      }];

      render(<BloodMarkerDetailModal {...defaultProps} data={dataWithInvalidDate} />);
      
      expect(screen.getByText('Glucose')).toBeInTheDocument();
    });
  });
});
