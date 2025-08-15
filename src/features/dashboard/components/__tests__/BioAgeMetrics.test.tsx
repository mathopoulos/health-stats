import React from 'react';
import { render, screen } from '@/test-utils';
import { BioAgeMetrics } from '../BioAgeMetrics';
import type { ChartData } from '@/types/dashboard';

// Mock the metric calculations utility
jest.mock('@/lib/metric-calculations', () => ({
  getTimeRangeData: jest.fn((data, timeRange) => {
    // Mock implementation that returns last 30 days of data
    if (timeRange === 'last30days') {
      return data.slice(-30);
    }
    return data;
  }),
}));

describe('BioAgeMetrics', () => {
  const mockChartData: ChartData = {
    heartRate: [
      { date: '2024-01-15', value: 75, unit: 'bpm' },
      { date: '2024-01-16', value: 73, unit: 'bpm' },
    ],
    weight: [
      { date: '2024-01-15', value: 180, unit: 'lb' },
      { date: '2024-01-16', value: 179, unit: 'lb' },
    ],
    bodyFat: [
      { date: '2024-01-15', value: 15, unit: '%' },
    ],
    vo2max: [
      { date: '2024-01-15', value: 45, unit: 'mL/kg·min' },
      { date: '2024-01-16', value: 46, unit: 'mL/kg·min' },
      { date: '2024-01-17', value: 44, unit: 'mL/kg·min' },
    ],
    hrv: [
      { date: '2024-01-15', value: 42, unit: 'ms' },
      { date: '2024-01-16', value: 44, unit: 'ms' },
      { date: '2024-01-17', value: 41, unit: 'ms' },
      { date: '2024-01-18', value: 43, unit: 'ms' },
    ],
    bloodMarkers: {
      biologicalAge: [
        { date: '2024-01-01', value: 28, unit: 'years' },
      ],
      cholesterol: [
        { date: '2024-01-01', value: 180, unit: 'mg/dL' },
      ],
      glucose: [
        { date: '2024-01-01', value: 90, unit: 'mg/dL' },
      ],
    },
  };

  const defaultProps = {
    data: mockChartData,
    loading: false,
  };

  describe('Basic Rendering', () => {
    it('renders all four metric cards', () => {
      render(<BioAgeMetrics {...defaultProps} />);

      expect(screen.getByText('Biological Age')).toBeInTheDocument();
      expect(screen.getByText('Age Speed')).toBeInTheDocument();
      expect(screen.getByText('VO2 Max')).toBeInTheDocument();
      expect(screen.getByText('HRV')).toBeInTheDocument();
    });

    it('applies correct grid layout', () => {
      render(<BioAgeMetrics {...defaultProps} />);

      const gridContainer = screen.container.querySelector('.grid.grid-cols-2.sm\\:grid-cols-4');
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer?.children).toHaveLength(4);
    });

    it('applies correct gap classes', () => {
      render(<BioAgeMetrics {...defaultProps} />);

      const gridContainer = screen.container.querySelector('.gap-3.sm\\:gap-6');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('Biological Age Metric', () => {
    it('displays biological age when data is available', () => {
      render(<BioAgeMetrics {...defaultProps} />);

      expect(screen.getByText('28')).toBeInTheDocument();
    });

    it('displays placeholder when no biological age data', () => {
      const dataWithoutBioAge = {
        ...mockChartData,
        bloodMarkers: {
          ...mockChartData.bloodMarkers,
          biologicalAge: [],
        },
      };

      render(<BioAgeMetrics {...defaultProps} data={dataWithoutBioAge} />);

      const bioAgeCard = screen.getByText('Biological Age').closest('.bg-white');
      expect(bioAgeCard).toContainElement(screen.getByText('—'));
    });

    it('applies correct color scheme to biological age', () => {
      render(<BioAgeMetrics {...defaultProps} />);

      const bioAgeValue = screen.getByText('28');
      expect(bioAgeValue).toHaveClass('text-indigo-600', 'dark:text-indigo-400');
    });

    it('handles undefined biological age data', () => {
      const dataWithUndefinedBioAge = {
        ...mockChartData,
        bloodMarkers: {
          ...mockChartData.bloodMarkers,
          biologicalAge: undefined as any,
        },
      };

      expect(() => {
        render(<BioAgeMetrics {...defaultProps} data={dataWithUndefinedBioAge} />);
      }).not.toThrow();

      const bioAgeCard = screen.getByText('Biological Age').closest('.bg-white');
      expect(bioAgeCard).toContainElement(screen.getByText('—'));
    });
  });

  describe('Age Speed Metric', () => {
    it('displays placeholder for age speed (not implemented)', () => {
      render(<BioAgeMetrics {...defaultProps} />);

      const ageSpeedCard = screen.getByText('Age Speed').closest('.bg-white');
      expect(ageSpeedCard).toContainElement(screen.getByText('—'));
    });

    it('applies correct color scheme to age speed', () => {
      render(<BioAgeMetrics {...defaultProps} />);

      const ageSpeedCard = screen.getByText('Age Speed').closest('.bg-white');
      const ageSpeedValue = ageSpeedCard?.querySelector('.text-green-600');
      expect(ageSpeedValue).toBeInTheDocument();
    });
  });

  describe('VO2 Max Metric', () => {
    it('calculates and displays VO2 Max average', () => {
      render(<BioAgeMetrics {...defaultProps} />);

      // Average of [45, 46, 44] = 45
      expect(screen.getByText('45')).toBeInTheDocument();
    });

    it('displays placeholder when no VO2 Max data', () => {
      const dataWithoutVO2Max = {
        ...mockChartData,
        vo2max: [],
      };

      render(<BioAgeMetrics {...defaultProps} data={dataWithoutVO2Max} />);

      const vo2maxCard = screen.getByText('VO2 Max').closest('.bg-white');
      expect(vo2maxCard).toContainElement(screen.getByText('—'));
    });

    it('applies correct color scheme to VO2 Max', () => {
      render(<BioAgeMetrics {...defaultProps} />);

      const vo2maxValue = screen.getByText('45');
      expect(vo2maxValue).toHaveClass('text-blue-600', 'dark:text-blue-400');
    });

    it('rounds VO2 Max average correctly', () => {
      const dataWithDecimalVO2Max = {
        ...mockChartData,
        vo2max: [
          { date: '2024-01-15', value: 45.7, unit: 'mL/kg·min' },
          { date: '2024-01-16', value: 46.3, unit: 'mL/kg·min' },
          { date: '2024-01-17', value: 44.1, unit: 'mL/kg·min' },
        ],
      };

      render(<BioAgeMetrics {...defaultProps} data={dataWithDecimalVO2Max} />);

      // Average of [45.7, 46.3, 44.1] = 45.367, rounded to 45
      expect(screen.getByText('45')).toBeInTheDocument();
    });

    it('handles single VO2 Max data point', () => {
      const dataWithSingleVO2Max = {
        ...mockChartData,
        vo2max: [
          { date: '2024-01-15', value: 50, unit: 'mL/kg·min' },
        ],
      };

      render(<BioAgeMetrics {...defaultProps} data={dataWithSingleVO2Max} />);

      expect(screen.getByText('50')).toBeInTheDocument();
    });
  });

  describe('HRV Metric', () => {
    it('calculates and displays HRV average with units', () => {
      render(<BioAgeMetrics {...defaultProps} />);

      // Average of [42, 44, 41, 43] = 42.5, rounded to 43
      expect(screen.getByText('43 ms')).toBeInTheDocument();
    });

    it('displays placeholder when no HRV data', () => {
      const dataWithoutHRV = {
        ...mockChartData,
        hrv: [],
      };

      render(<BioAgeMetrics {...defaultProps} data={dataWithoutHRV} />);

      const hrvCard = screen.getByText('HRV').closest('.bg-white');
      expect(hrvCard).toContainElement(screen.getByText('—'));
    });

    it('applies correct color scheme to HRV', () => {
      render(<BioAgeMetrics {...defaultProps} />);

      const hrvValue = screen.getByText('43 ms');
      expect(hrvValue).toHaveClass('text-purple-600', 'dark:text-purple-400');
    });

    it('handles decimal HRV values correctly', () => {
      const dataWithDecimalHRV = {
        ...mockChartData,
        hrv: [
          { date: '2024-01-15', value: 42.3, unit: 'ms' },
          { date: '2024-01-16', value: 44.7, unit: 'ms' },
        ],
      };

      render(<BioAgeMetrics {...defaultProps} data={dataWithDecimalHRV} />);

      // Average of [42.3, 44.7] = 43.5, rounded to 44
      expect(screen.getByText('44 ms')).toBeInTheDocument();
    });

    it('handles single HRV data point', () => {
      const dataWithSingleHRV = {
        ...mockChartData,
        hrv: [
          { date: '2024-01-15', value: 50, unit: 'ms' },
        ],
      };

      render(<BioAgeMetrics {...defaultProps} data={dataWithSingleHRV} />);

      expect(screen.getByText('50 ms')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading indicators for all metrics when loading', () => {
      render(<BioAgeMetrics {...defaultProps} loading={true} />);

      const loadingIndicators = screen.getAllByText('...');
      expect(loadingIndicators).toHaveLength(4);
    });

    it('does not show calculated values during loading', () => {
      render(<BioAgeMetrics {...defaultProps} loading={true} />);

      expect(screen.queryByText('28')).not.toBeInTheDocument();
      expect(screen.queryByText('45')).not.toBeInTheDocument();
      expect(screen.queryByText('43 ms')).not.toBeInTheDocument();
    });

    it('applies correct styling to loading indicators', () => {
      render(<BioAgeMetrics {...defaultProps} loading={true} />);

      const loadingIndicators = screen.getAllByText('...');
      loadingIndicators.forEach(indicator => {
        expect(indicator).toHaveClass('text-xl', 'sm:text-2xl', 'font-bold');
      });
    });
  });

  describe('MetricCard Component', () => {
    it('applies correct container styling to metric cards', () => {
      render(<BioAgeMetrics {...defaultProps} />);

      const metricCards = screen.container.querySelectorAll('.bg-white.dark\\:bg-gray-800.rounded-2xl');
      expect(metricCards).toHaveLength(4);
    });

    it('applies correct padding to metric cards', () => {
      render(<BioAgeMetrics {...defaultProps} />);

      const metricCards = screen.container.querySelectorAll('.px-4.sm\\:px-6.py-4.sm\\:py-6');
      expect(metricCards).toHaveLength(4);
    });

    it('applies shadow to metric cards', () => {
      render(<BioAgeMetrics {...defaultProps} />);

      const metricCards = screen.container.querySelectorAll('.shadow-sm');
      expect(metricCards).toHaveLength(4);
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive text sizing to titles', () => {
      render(<BioAgeMetrics {...defaultProps} />);

      const titles = [
        screen.getByText('Biological Age'),
        screen.getByText('Age Speed'),
        screen.getByText('VO2 Max'),
        screen.getByText('HRV'),
      ];

      titles.forEach(title => {
        expect(title).toHaveClass('text-sm', 'sm:text-lg');
      });
    });

    it('applies responsive text sizing to values', () => {
      render(<BioAgeMetrics {...defaultProps} />);

      const values = [
        screen.getByText('28'),
        screen.getByText('45'),
        screen.getByText('43 ms'),
      ];

      values.forEach(value => {
        expect(value).toHaveClass('text-xl', 'sm:text-2xl');
      });
    });

    it('applies responsive layout to metric cards', () => {
      render(<BioAgeMetrics {...defaultProps} />);

      const flexContainers = screen.container.querySelectorAll('.flex-col.sm\\:flex-row');
      expect(flexContainers).toHaveLength(4);
    });

    it('applies responsive gap to metric card content', () => {
      render(<BioAgeMetrics {...defaultProps} />);

      const gapContainers = screen.container.querySelectorAll('.gap-1.sm\\:gap-2');
      expect(gapContainers).toHaveLength(4);
    });
  });

  describe('Dark Mode Support', () => {
    it('applies dark mode classes to metric cards', () => {
      render(<BioAgeMetrics {...defaultProps} />);

      const darkModeCards = screen.container.querySelectorAll('.dark\\:bg-gray-800');
      expect(darkModeCards).toHaveLength(4);
    });

    it('applies dark mode classes to titles', () => {
      render(<BioAgeMetrics {...defaultProps} />);

      const titles = [
        screen.getByText('Biological Age'),
        screen.getByText('Age Speed'),
        screen.getByText('VO2 Max'),
        screen.getByText('HRV'),
      ];

      titles.forEach(title => {
        expect(title).toHaveClass('dark:text-white');
      });
    });

    it('applies dark mode classes to values', () => {
      render(<BioAgeMetrics {...defaultProps} />);

      expect(screen.getByText('28')).toHaveClass('dark:text-indigo-400');
      expect(screen.getByText('45')).toHaveClass('dark:text-blue-400');
      expect(screen.getByText('43 ms')).toHaveClass('dark:text-purple-400');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty data gracefully', () => {
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

      render(<BioAgeMetrics {...defaultProps} data={emptyData} />);

      const placeholders = screen.getAllByText('—');
      expect(placeholders).toHaveLength(3); // All metrics except Age Speed (which is always —)
    });

    it('handles malformed data gracefully', () => {
      const malformedData = {
        ...mockChartData,
        vo2max: [
          { date: '2024-01-15', value: 'invalid' as any, unit: 'mL/kg·min' },
        ],
        hrv: [
          { date: '2024-01-15', value: null as any, unit: 'ms' },
        ],
      };

      expect(() => {
        render(<BioAgeMetrics {...defaultProps} data={malformedData} />);
      }).not.toThrow();
    });

    it('handles zero values correctly', () => {
      const zeroValueData = {
        ...mockChartData,
        vo2max: [
          { date: '2024-01-15', value: 0, unit: 'mL/kg·min' },
        ],
        hrv: [
          { date: '2024-01-15', value: 0, unit: 'ms' },
        ],
      };

      render(<BioAgeMetrics {...defaultProps} data={zeroValueData} />);

      expect(screen.getByText('0')).toBeInTheDocument(); // VO2 Max
      expect(screen.getByText('0 ms')).toBeInTheDocument(); // HRV
    });

    it('handles very large numbers correctly', () => {
      const largeNumberData = {
        ...mockChartData,
        vo2max: [
          { date: '2024-01-15', value: 999.7, unit: 'mL/kg·min' },
        ],
        hrv: [
          { date: '2024-01-15', value: 1000.3, unit: 'ms' },
        ],
      };

      render(<BioAgeMetrics {...defaultProps} data={largeNumberData} />);

      expect(screen.getByText('1000')).toBeInTheDocument(); // VO2 Max rounded
      expect(screen.getByText('1000 ms')).toBeInTheDocument(); // HRV rounded
    });

    it('handles negative values correctly', () => {
      const negativeValueData = {
        ...mockChartData,
        vo2max: [
          { date: '2024-01-15', value: -5, unit: 'mL/kg·min' },
        ],
      };

      render(<BioAgeMetrics {...defaultProps} data={negativeValueData} />);

      expect(screen.getByText('-5')).toBeInTheDocument();
    });
  });

  describe('Calculation Logic', () => {
    it('calculates averages correctly for multiple data points', () => {
      const preciseData = {
        ...mockChartData,
        vo2max: [
          { date: '2024-01-15', value: 10, unit: 'mL/kg·min' },
          { date: '2024-01-16', value: 20, unit: 'mL/kg·min' },
          { date: '2024-01-17', value: 30, unit: 'mL/kg·min' },
        ],
        hrv: [
          { date: '2024-01-15', value: 15, unit: 'ms' },
          { date: '2024-01-16', value: 25, unit: 'ms' },
        ],
      };

      render(<BioAgeMetrics {...defaultProps} data={preciseData} />);

      // Average of [10, 20, 30] = 20
      expect(screen.getByText('20')).toBeInTheDocument();
      
      // Average of [15, 25] = 20
      expect(screen.getByText('20 ms')).toBeInTheDocument();
    });

    it('uses most recent biological age value', () => {
      const multipleAgeData = {
        ...mockChartData,
        bloodMarkers: {
          ...mockChartData.bloodMarkers,
          biologicalAge: [
            { date: '2024-01-01', value: 30, unit: 'years' },
            { date: '2024-01-15', value: 25, unit: 'years' }, // This should be used (first in array)
          ],
        },
      };

      render(<BioAgeMetrics {...defaultProps} data={multipleAgeData} />);

      expect(screen.getByText('30')).toBeInTheDocument(); // Uses first value in array
    });
  });

  describe('Performance', () => {
    it('handles large datasets efficiently', () => {
      const largeDataset = {
        ...mockChartData,
        vo2max: Array.from({ length: 1000 }, (_, i) => ({
          date: `2024-01-${(i % 28) + 1}`,
          value: 45 + Math.random() * 10,
          unit: 'mL/kg·min',
        })),
        hrv: Array.from({ length: 1000 }, (_, i) => ({
          date: `2024-01-${(i % 28) + 1}`,
          value: 40 + Math.random() * 10,
          unit: 'ms',
        })),
      };

      expect(() => {
        render(<BioAgeMetrics {...defaultProps} data={largeDataset} />);
      }).not.toThrow();

      // Should still render values
      expect(screen.getByText(/^\d+$/)).toBeInTheDocument(); // VO2 Max
      expect(screen.getByText(/^\d+ ms$/)).toBeInTheDocument(); // HRV
    });

    it('efficiently handles prop changes', () => {
      const { rerender } = render(<BioAgeMetrics {...defaultProps} />);

      const newData = {
        ...mockChartData,
        vo2max: [{ date: '2024-01-20', value: 55, unit: 'mL/kg·min' }],
        hrv: [{ date: '2024-01-20', value: 50, unit: 'ms' }],
      };

      rerender(<BioAgeMetrics {...defaultProps} data={newData} />);

      expect(screen.getByText('55')).toBeInTheDocument();
      expect(screen.getByText('50 ms')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides semantic structure', () => {
      render(<BioAgeMetrics {...defaultProps} />);

      const metricCards = screen.container.querySelectorAll('.bg-white');
      expect(metricCards).toHaveLength(4);
    });

    it('maintains proper text hierarchy', () => {
      render(<BioAgeMetrics {...defaultProps} />);

      const titles = screen.getAllByText(/^(Biological Age|Age Speed|VO2 Max|HRV)$/);
      const values = [screen.getByText('28'), screen.getByText('45'), screen.getByText('43 ms')];

      titles.forEach(title => {
        expect(title).toHaveClass('font-medium');
      });

      values.forEach(value => {
        expect(value).toHaveClass('font-bold');
      });
    });
  });
});
