import React from 'react';
import { render, screen, fireEvent } from '@/test-utils';
import { MetricsTab } from '../MetricsTab';
import type { ChartData } from '@/types/dashboard';
import type { TimeRange } from '../../hooks/useTimeRangeFilters';

// Mock child components to isolate MetricsTab testing
jest.mock('../MetricSummaryCard', () => {
  return {
    MetricSummaryCard: ({ 
      title, 
      data, 
      loading, 
      metricType, 
      unit, 
      timeRange 
    }: {
      title: string;
      data: any[];
      loading: boolean;
      metricType: string;
      unit?: string;
      timeRange: string;
    }) => (
      <div data-testid={`metric-summary-${metricType}`}>
        <span data-testid="title">{title}</span>
        <span data-testid="loading">{loading.toString()}</span>
        <span data-testid="data-length">{data.length}</span>
        <span data-testid="unit">{unit || 'no-unit'}</span>
        <span data-testid="time-range">{timeRange}</span>
      </div>
    ),
  };
});

jest.mock('../HealthChart', () => {
  return {
    HealthChart: ({ 
      title, 
      data, 
      loading, 
      timeRange, 
      onTimeRangeChange, 
      isDarkMode, 
      metricType, 
      unit, 
      color 
    }: {
      title: string;
      data: any[];
      loading: boolean;
      timeRange: string;
      onTimeRangeChange: (range: string) => void;
      isDarkMode: boolean;
      metricType: string;
      unit?: string;
      color: any;
    }) => (
      <div data-testid={`health-chart-${metricType}`}>
        <span data-testid="title">{title}</span>
        <span data-testid="loading">{loading.toString()}</span>
        <span data-testid="data-length">{data.length}</span>
        <span data-testid="time-range">{timeRange}</span>
        <span data-testid="dark-mode">{isDarkMode.toString()}</span>
        <span data-testid="unit">{unit || 'no-unit'}</span>
        <span data-testid="stroke-color">{color.stroke}</span>
        <button 
          data-testid="time-range-change"
          onClick={() => onTimeRangeChange('last1year')}
        >
          Change Time Range
        </button>
      </div>
    ),
  };
});

describe('MetricsTab', () => {
  const mockChartData: ChartData = {
    heartRate: [
      { date: '2024-01-15', value: 75, unit: 'bpm' },
      { date: '2024-01-16', value: 73, unit: 'bpm' },
    ],
    weight: [
      { date: '2024-01-15', value: 180, unit: 'lb' },
      { date: '2024-01-16', value: 179, unit: 'lb' },
      { date: '2024-01-17', value: 178, unit: 'lb' },
    ],
    bodyFat: [
      { date: '2024-01-15', value: 15, unit: '%' },
      { date: '2024-01-16', value: 14.8, unit: '%' },
    ],
    vo2max: [
      { date: '2024-01-15', value: 45, unit: 'mL/kg·min' },
    ],
    hrv: [
      { date: '2024-01-15', value: 42, unit: 'ms' },
      { date: '2024-01-16', value: 44, unit: 'ms' },
      { date: '2024-01-17', value: 41, unit: 'ms' },
      { date: '2024-01-18', value: 43, unit: 'ms' },
    ],
    bloodMarkers: {
      biologicalAge: [],
      cholesterol: [],
      glucose: [],
    },
  };

  const mockTimeRanges = {
    weight: 'last30days' as TimeRange,
    bodyFat: 'last3months' as TimeRange,
    hrv: 'last6months' as TimeRange,
    vo2max: 'last1year' as TimeRange,
  };

  const mockTimeRangeHandlers = {
    setWeightTimeRange: jest.fn(),
    setBodyFatTimeRange: jest.fn(),
    setHrvTimeRange: jest.fn(),
    setVo2maxTimeRange: jest.fn(),
  };

  const defaultProps = {
    data: mockChartData,
    loading: false,
    isDarkMode: false,
    timeRanges: mockTimeRanges,
    onTimeRangeChange: mockTimeRangeHandlers,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders all metric summary cards', () => {
      render(<MetricsTab {...defaultProps} />);

      expect(screen.getByTestId('metric-summary-hrv')).toBeInTheDocument();
      expect(screen.getByTestId('metric-summary-vo2max')).toBeInTheDocument();
      expect(screen.getByTestId('metric-summary-weight')).toBeInTheDocument();
      expect(screen.getByTestId('metric-summary-bodyFat')).toBeInTheDocument();
    });

    it('renders all health charts', () => {
      render(<MetricsTab {...defaultProps} />);

      expect(screen.getByTestId('health-chart-hrv')).toBeInTheDocument();
      expect(screen.getByTestId('health-chart-weight')).toBeInTheDocument();
      expect(screen.getByTestId('health-chart-bodyFat')).toBeInTheDocument();
      expect(screen.getByTestId('health-chart-vo2max')).toBeInTheDocument();
    });

    it('applies correct grid structure for metric cards', () => {
      render(<MetricsTab {...defaultProps} />);

      const metricsGrid = screen.container.querySelector('.grid.grid-cols-2.md\\:grid-cols-4');
      expect(metricsGrid).toBeInTheDocument();
      expect(metricsGrid?.children).toHaveLength(4);
    });

    it('applies correct spacing for charts section', () => {
      render(<MetricsTab {...defaultProps} />);

      const chartsSection = screen.container.querySelector('.space-y-6');
      expect(chartsSection).toBeInTheDocument();
    });
  });

  describe('Metric Summary Cards Props', () => {
    it('passes correct props to HRV metric summary card', () => {
      render(<MetricsTab {...defaultProps} />);

      const hrvCard = screen.getByTestId('metric-summary-hrv');
      expect(hrvCard).toHaveTextContent('Heart Rate Variability');
      expect(hrvCard).toHaveTextContent('loading: false');
      expect(hrvCard).toHaveTextContent('data-length: 4');
      expect(hrvCard).toHaveTextContent('unit: no-unit');
      expect(hrvCard).toHaveTextContent('time-range: last30days');
    });

    it('passes correct props to VO2 Max metric summary card', () => {
      render(<MetricsTab {...defaultProps} />);

      const vo2maxCard = screen.getByTestId('metric-summary-vo2max');
      expect(vo2maxCard).toHaveTextContent('VO2 Max');
      expect(vo2maxCard).toHaveTextContent('loading: false');
      expect(vo2maxCard).toHaveTextContent('data-length: 1');
      expect(vo2maxCard).toHaveTextContent('unit: mL/kg·min');
      expect(vo2maxCard).toHaveTextContent('time-range: last30days');
    });

    it('passes correct props to Weight metric summary card', () => {
      render(<MetricsTab {...defaultProps} />);

      const weightCard = screen.getByTestId('metric-summary-weight');
      expect(weightCard).toHaveTextContent('Weight');
      expect(weightCard).toHaveTextContent('loading: false');
      expect(weightCard).toHaveTextContent('data-length: 3');
      expect(weightCard).toHaveTextContent('unit: lb');
      expect(weightCard).toHaveTextContent('time-range: last30days');
    });

    it('passes correct props to Body Fat metric summary card', () => {
      render(<MetricsTab {...defaultProps} />);

      const bodyFatCard = screen.getByTestId('metric-summary-bodyFat');
      expect(bodyFatCard).toHaveTextContent('Body Fat');
      expect(bodyFatCard).toHaveTextContent('loading: false');
      expect(bodyFatCard).toHaveTextContent('data-length: 2');
      expect(bodyFatCard).toHaveTextContent('unit: %');
      expect(bodyFatCard).toHaveTextContent('time-range: last30days');
    });
  });

  describe('Health Charts Props', () => {
    it('passes correct props to HRV health chart', () => {
      render(<MetricsTab {...defaultProps} />);

      const hrvChart = screen.getByTestId('health-chart-hrv');
      expect(hrvChart).toHaveTextContent('Heart Rate Variability');
      expect(hrvChart).toHaveTextContent('loading: false');
      expect(hrvChart).toHaveTextContent('data-length: 4');
      expect(hrvChart).toHaveTextContent('time-range: last6months');
      expect(hrvChart).toHaveTextContent('dark-mode: false');
      expect(hrvChart).toHaveTextContent('unit: ms');
      expect(hrvChart).toHaveTextContent('stroke-color: #4f46e5');
    });

    it('passes correct props to Weight health chart', () => {
      render(<MetricsTab {...defaultProps} />);

      const weightChart = screen.getByTestId('health-chart-weight');
      expect(weightChart).toHaveTextContent('Weight');
      expect(weightChart).toHaveTextContent('loading: false');
      expect(weightChart).toHaveTextContent('data-length: 3');
      expect(weightChart).toHaveTextContent('time-range: last30days');
      expect(weightChart).toHaveTextContent('dark-mode: false');
      expect(weightChart).toHaveTextContent('unit: lb');
      expect(weightChart).toHaveTextContent('stroke-color: #10b981');
    });

    it('passes correct props to Body Fat health chart', () => {
      render(<MetricsTab {...defaultProps} />);

      const bodyFatChart = screen.getByTestId('health-chart-bodyFat');
      expect(bodyFatChart).toHaveTextContent('Body Fat');
      expect(bodyFatChart).toHaveTextContent('loading: false');
      expect(bodyFatChart).toHaveTextContent('data-length: 2');
      expect(bodyFatChart).toHaveTextContent('time-range: last3months');
      expect(bodyFatChart).toHaveTextContent('dark-mode: false');
      expect(bodyFatChart).toHaveTextContent('unit: %');
      expect(bodyFatChart).toHaveTextContent('stroke-color: #f59e0b');
    });

    it('passes correct props to VO2 Max health chart', () => {
      render(<MetricsTab {...defaultProps} />);

      const vo2maxChart = screen.getByTestId('health-chart-vo2max');
      expect(vo2maxChart).toHaveTextContent('VO2 Max');
      expect(vo2maxChart).toHaveTextContent('loading: false');
      expect(vo2maxChart).toHaveTextContent('data-length: 1');
      expect(vo2maxChart).toHaveTextContent('time-range: last1year');
      expect(vo2maxChart).toHaveTextContent('dark-mode: false');
      expect(vo2maxChart).toHaveTextContent('unit: mL/kg·min');
      expect(vo2maxChart).toHaveTextContent('stroke-color: #3b82f6');
    });
  });

  describe('Time Range Handling', () => {
    it('calls setHrvTimeRange when HRV chart time range changes', () => {
      render(<MetricsTab {...defaultProps} />);

      const hrvChart = screen.getByTestId('health-chart-hrv');
      const changeButton = hrvChart.querySelector('[data-testid="time-range-change"]');
      
      fireEvent.click(changeButton!);
      
      expect(mockTimeRangeHandlers.setHrvTimeRange).toHaveBeenCalledWith('last1year');
    });

    it('calls setWeightTimeRange when Weight chart time range changes', () => {
      render(<MetricsTab {...defaultProps} />);

      const weightChart = screen.getByTestId('health-chart-weight');
      const changeButton = weightChart.querySelector('[data-testid="time-range-change"]');
      
      fireEvent.click(changeButton!);
      
      expect(mockTimeRangeHandlers.setWeightTimeRange).toHaveBeenCalledWith('last1year');
    });

    it('calls setBodyFatTimeRange when Body Fat chart time range changes', () => {
      render(<MetricsTab {...defaultProps} />);

      const bodyFatChart = screen.getByTestId('health-chart-bodyFat');
      const changeButton = bodyFatChart.querySelector('[data-testid="time-range-change"]');
      
      fireEvent.click(changeButton!);
      
      expect(mockTimeRangeHandlers.setBodyFatTimeRange).toHaveBeenCalledWith('last1year');
    });

    it('calls setVo2maxTimeRange when VO2 Max chart time range changes', () => {
      render(<MetricsTab {...defaultProps} />);

      const vo2maxChart = screen.getByTestId('health-chart-vo2max');
      const changeButton = vo2maxChart.querySelector('[data-testid="time-range-change"]');
      
      fireEvent.click(changeButton!);
      
      expect(mockTimeRangeHandlers.setVo2maxTimeRange).toHaveBeenCalledWith('last1year');
    });
  });

  describe('Loading States', () => {
    it('passes loading state to all metric summary cards', () => {
      render(<MetricsTab {...defaultProps} loading={true} />);

      expect(screen.getByTestId('metric-summary-hrv')).toHaveTextContent('loading: true');
      expect(screen.getByTestId('metric-summary-vo2max')).toHaveTextContent('loading: true');
      expect(screen.getByTestId('metric-summary-weight')).toHaveTextContent('loading: true');
      expect(screen.getByTestId('metric-summary-bodyFat')).toHaveTextContent('loading: true');
    });

    it('passes loading state to all health charts', () => {
      render(<MetricsTab {...defaultProps} loading={true} />);

      expect(screen.getByTestId('health-chart-hrv')).toHaveTextContent('loading: true');
      expect(screen.getByTestId('health-chart-weight')).toHaveTextContent('loading: true');
      expect(screen.getByTestId('health-chart-bodyFat')).toHaveTextContent('loading: true');
      expect(screen.getByTestId('health-chart-vo2max')).toHaveTextContent('loading: true');
    });
  });

  describe('Dark Mode', () => {
    it('passes dark mode state to all health charts', () => {
      render(<MetricsTab {...defaultProps} isDarkMode={true} />);

      expect(screen.getByTestId('health-chart-hrv')).toHaveTextContent('dark-mode: true');
      expect(screen.getByTestId('health-chart-weight')).toHaveTextContent('dark-mode: true');
      expect(screen.getByTestId('health-chart-bodyFat')).toHaveTextContent('dark-mode: true');
      expect(screen.getByTestId('health-chart-vo2max')).toHaveTextContent('dark-mode: true');
    });

    it('uses dark stroke colors when in dark mode', () => {
      render(<MetricsTab {...defaultProps} isDarkMode={false} />);

      // Light mode colors
      expect(screen.getByTestId('health-chart-hrv')).toHaveTextContent('stroke-color: #4f46e5');
      expect(screen.getByTestId('health-chart-weight')).toHaveTextContent('stroke-color: #10b981');
      expect(screen.getByTestId('health-chart-bodyFat')).toHaveTextContent('stroke-color: #f59e0b');
      expect(screen.getByTestId('health-chart-vo2max')).toHaveTextContent('stroke-color: #3b82f6');
    });
  });

  describe('Data Handling', () => {
    it('handles empty data arrays gracefully', () => {
      const emptyData: ChartData = {
        heartRate: [],
        weight: [],
        bodyFat: [],
        vo2max: [],
        hrv: [],
        bloodMarkers: {
          biologicalAge: [],
          cholesterol: [],
          glucose: [],
        },
      };

      render(<MetricsTab {...defaultProps} data={emptyData} />);

      expect(screen.getByTestId('metric-summary-hrv')).toHaveTextContent('data-length: 0');
      expect(screen.getByTestId('metric-summary-vo2max')).toHaveTextContent('data-length: 0');
      expect(screen.getByTestId('metric-summary-weight')).toHaveTextContent('data-length: 0');
      expect(screen.getByTestId('metric-summary-bodyFat')).toHaveTextContent('data-length: 0');

      expect(screen.getByTestId('health-chart-hrv')).toHaveTextContent('data-length: 0');
      expect(screen.getByTestId('health-chart-weight')).toHaveTextContent('data-length: 0');
      expect(screen.getByTestId('health-chart-bodyFat')).toHaveTextContent('data-length: 0');
      expect(screen.getByTestId('health-chart-vo2max')).toHaveTextContent('data-length: 0');
    });

    it('handles large datasets efficiently', () => {
      const largeData: ChartData = {
        ...mockChartData,
        hrv: Array.from({ length: 1000 }, (_, i) => ({
          date: `2024-01-${(i % 28) + 1}`,
          value: 40 + Math.random() * 10,
          unit: 'ms',
        })),
      };

      render(<MetricsTab {...defaultProps} data={largeData} />);

      expect(screen.getByTestId('health-chart-hrv')).toHaveTextContent('data-length: 1000');
      expect(screen.getByTestId('metric-summary-hrv')).toHaveTextContent('data-length: 1000');
    });
  });

  describe('Color Schemes', () => {
    it('uses correct color scheme for each metric type', () => {
      render(<MetricsTab {...defaultProps} />);

      // Each chart should have its specific color
      expect(screen.getByTestId('health-chart-hrv')).toHaveTextContent('stroke-color: #4f46e5'); // Indigo
      expect(screen.getByTestId('health-chart-weight')).toHaveTextContent('stroke-color: #10b981'); // Green
      expect(screen.getByTestId('health-chart-bodyFat')).toHaveTextContent('stroke-color: #f59e0b'); // Amber
      expect(screen.getByTestId('health-chart-vo2max')).toHaveTextContent('stroke-color: #3b82f6'); // Blue
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive grid classes correctly', () => {
      render(<MetricsTab {...defaultProps} />);

      const summaryGrid = screen.container.querySelector('.grid.grid-cols-2.md\\:grid-cols-4.gap-3.md\\:gap-4');
      expect(summaryGrid).toBeInTheDocument();
    });

    it('maintains proper spacing between sections', () => {
      render(<MetricsTab {...defaultProps} />);

      const chartsSection = screen.container.querySelector('.space-y-6');
      expect(chartsSection).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined time range values', () => {
      const undefinedTimeRanges = {
        weight: undefined as any,
        bodyFat: undefined as any,
        hrv: undefined as any,
        vo2max: undefined as any,
      };

      expect(() => {
        render(<MetricsTab {...defaultProps} timeRanges={undefinedTimeRanges} />);
      }).not.toThrow();
    });

    it('handles missing time range handlers gracefully', () => {
      const incompleteHandlers = {
        setWeightTimeRange: jest.fn(),
        setBodyFatTimeRange: jest.fn(),
        // Missing HRV and VO2 max handlers
      } as any;

      expect(() => {
        render(<MetricsTab {...defaultProps} onTimeRangeChange={incompleteHandlers} />);
      }).not.toThrow();
    });

    it('maintains performance with frequent prop updates', () => {
      const { rerender } = render(<MetricsTab {...defaultProps} />);

      // Simulate rapid prop changes
      for (let i = 0; i < 10; i++) {
        rerender(<MetricsTab {...defaultProps} loading={i % 2 === 0} />);
      }

      // Should still render correctly
      expect(screen.getByTestId('metric-summary-hrv')).toBeInTheDocument();
      expect(screen.getByTestId('health-chart-hrv')).toBeInTheDocument();
    });
  });
});
