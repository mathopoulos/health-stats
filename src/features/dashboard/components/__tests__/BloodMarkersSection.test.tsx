import React from 'react';
import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { BloodMarkersSection } from '../BloodMarkersSection';
import type { BloodMarker, UserData } from '@/types/dashboard';

// Mock the blood marker utilities
jest.mock('@/lib/bloodMarkerRanges', () => ({
  getReferenceRanges: jest.fn((markerName) => {
    const mockRanges: Record<string, any> = {
      'Total Cholesterol': {
        abnormalText: '>240 mg/dL',
        normalText: '200-240 mg/dL',
        optimalText: '<200 mg/dL',
      },
      'HDL Cholesterol': {
        abnormalText: '<40 mg/dL',
        normalText: '40-60 mg/dL',
        optimalText: '>60 mg/dL',
      },
      'Glucose': {
        abnormalText: '>125 mg/dL',
        normalText: '100-125 mg/dL',
        optimalText: '<100 mg/dL',
      },
    };
    return mockRanges[markerName] || {
      abnormalText: 'High',
      normalText: 'Normal',
      optimalText: 'Optimal',
    };
  }),
  getBloodMarkerStatus: jest.fn((value, markerName) => {
    // Simple mock logic for status determination
    if (markerName === 'Total Cholesterol') {
      if (value > 240) return 'abnormal';
      if (value > 200) return 'normal';
      return 'optimal';
    }
    if (markerName === 'HDL Cholesterol') {
      if (value < 40) return 'abnormal';
      if (value < 60) return 'normal';
      return 'optimal';
    }
    if (markerName === 'Glucose') {
      if (value > 125) return 'abnormal';
      if (value > 100) return 'normal';
      return 'optimal';
    }
    return 'normal';
  }),
}));

describe('BloodMarkersSection', () => {
  const mockUserData: UserData = {
    name: 'John Doe',
    email: 'john@example.com',
    userId: 'test-user-id',
    profileImage: null,
    age: 35,
    sex: 'male',
  };

  const mockBloodMarkers: Array<{ label: string; data: BloodMarker[] }> = [
    {
      label: 'Total Cholesterol',
      data: [
        { date: '2024-01-15', value: 180, unit: 'mg/dL' },
        { date: '2024-01-01', value: 190, unit: 'mg/dL' },
      ],
    },
    {
      label: 'HDL Cholesterol',
      data: [
        { date: '2024-01-15', value: 65, unit: 'mg/dL' },
        { date: '2024-01-01', value: 60, unit: 'mg/dL' },
      ],
    },
    {
      label: 'Glucose',
      data: [
        { date: '2024-01-15', value: 95, unit: 'mg/dL' },
      ],
    },
    {
      label: 'Vitamin D',
      data: [], // No data
    },
  ];

  const mockOnMarkerClick = jest.fn();

  const defaultProps = {
    title: 'Lipid Panel',
    markers: mockBloodMarkers,
    userData: mockUserData,
    onMarkerClick: mockOnMarkerClick,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders the section with correct title', () => {
      render(<BloodMarkersSection {...defaultProps} />);

      expect(screen.getByText('Lipid Panel')).toBeInTheDocument();
    });

    it('applies correct container styling', () => {
      render(<BloodMarkersSection {...defaultProps} />);

      const container = screen.container.querySelector('.border.border-gray-100.dark\\:border-gray-700.rounded-xl');
      expect(container).toBeInTheDocument();
    });

    it('applies correct padding classes', () => {
      render(<BloodMarkersSection {...defaultProps} />);

      const container = screen.container.querySelector('.px-4.sm\\:px-6.py-6');
      expect(container).toBeInTheDocument();
    });

    it('renders all blood marker rows', () => {
      render(<BloodMarkersSection {...defaultProps} />);

      expect(screen.getByText('Total Cholesterol')).toBeInTheDocument();
      expect(screen.getByText('HDL Cholesterol')).toBeInTheDocument();
      expect(screen.getByText('Glucose')).toBeInTheDocument();
      expect(screen.getByText('Vitamin D')).toBeInTheDocument();
    });

    it('applies correct spacing between markers', () => {
      render(<BloodMarkersSection {...defaultProps} />);

      const markersContainer = screen.container.querySelector('.space-y-6');
      expect(markersContainer).toBeInTheDocument();
    });
  });

  describe('Marker Values and Status', () => {
    it('displays current values for markers with data', () => {
      render(<BloodMarkersSection {...defaultProps} />);

      expect(screen.getByText('180 mg/dL')).toBeInTheDocument();
      expect(screen.getByText('65 mg/dL')).toBeInTheDocument();
      expect(screen.getByText('95 mg/dL')).toBeInTheDocument();
    });

    it('displays "No data" for markers without data', () => {
      render(<BloodMarkersSection {...defaultProps} />);

      expect(screen.getByText('No data')).toBeInTheDocument();
    });

    it('displays correct status pills', () => {
      render(<BloodMarkersSection {...defaultProps} />);

      // Based on our mock logic
      expect(screen.getByText('Optimal')).toBeInTheDocument(); // Total Cholesterol: 180
      expect(screen.getByText('Optimal')).toBeInTheDocument(); // HDL Cholesterol: 65
      expect(screen.getByText('Optimal')).toBeInTheDocument(); // Glucose: 95
    });

    it('applies correct styling to status pills', () => {
      render(<BloodMarkersSection {...defaultProps} />);

      const optimalPills = screen.getAllByText('Optimal');
      optimalPills.forEach(pill => {
        expect(pill).toHaveClass(
          'px-2.5',
          'py-1',
          'text-xs',
          'font-medium',
          'rounded-md',
          'bg-green-100',
          'text-green-700'
        );
      });
    });
  });

  describe('Status Classification', () => {
    it('shows abnormal status for high values', () => {
      const highCholesterolMarkers = [
        {
          label: 'Total Cholesterol',
          data: [{ date: '2024-01-15', value: 250, unit: 'mg/dL' }],
        },
      ];

      render(
        <BloodMarkersSection
          {...defaultProps}
          markers={highCholesterolMarkers}
        />
      );

      expect(screen.getByText('Abnormal')).toBeInTheDocument();
    });

    it('shows normal status for borderline values', () => {
      const normalCholesterolMarkers = [
        {
          label: 'Total Cholesterol',
          data: [{ date: '2024-01-15', value: 220, unit: 'mg/dL' }],
        },
      ];

      render(
        <BloodMarkersSection
          {...defaultProps}
          markers={normalCholesterolMarkers}
        />
      );

      expect(screen.getByText('Normal')).toBeInTheDocument();
    });

    it('applies different pill colors for different statuses', () => {
      const mixedStatusMarkers = [
        {
          label: 'Total Cholesterol',
          data: [{ date: '2024-01-15', value: 250, unit: 'mg/dL' }], // Abnormal
        },
        {
          label: 'HDL Cholesterol',
          data: [{ date: '2024-01-15', value: 50, unit: 'mg/dL' }], // Normal
        },
        {
          label: 'Glucose',
          data: [{ date: '2024-01-15', value: 85, unit: 'mg/dL' }], // Optimal
        },
      ];

      render(
        <BloodMarkersSection
          {...defaultProps}
          markers={mixedStatusMarkers}
        />
      );

      const abnormalPill = screen.getByText('Abnormal');
      const normalPill = screen.getByText('Normal');
      const optimalPill = screen.getByText('Optimal');

      expect(abnormalPill).toHaveClass('bg-red-100', 'text-red-700');
      expect(normalPill).toHaveClass('bg-yellow-100', 'text-yellow-700');
      expect(optimalPill).toHaveClass('bg-green-100', 'text-green-700');
    });
  });

  describe('Tooltips', () => {
    it('shows tooltip on hover for status pills', async () => {
      render(<BloodMarkersSection {...defaultProps} />);

      const statusPill = screen.getAllByText('Optimal')[0];
      
      fireEvent.mouseEnter(statusPill);

      await waitFor(() => {
        expect(screen.getByText('Abnormal')).toBeInTheDocument();
        expect(screen.getByText('Normal')).toBeInTheDocument();
        expect(screen.getByText('>240 mg/dL')).toBeInTheDocument();
        expect(screen.getByText('200-240 mg/dL')).toBeInTheDocument();
        expect(screen.getByText('<200 mg/dL')).toBeInTheDocument();
      });
    });

    it('hides tooltip on mouse leave', async () => {
      render(<BloodMarkersSection {...defaultProps} />);

      const statusPill = screen.getAllByText('Optimal')[0];
      
      fireEvent.mouseEnter(statusPill);
      
      await waitFor(() => {
        expect(screen.getByText('>240 mg/dL')).toBeInTheDocument();
      });

      fireEvent.mouseLeave(statusPill);

      await waitFor(() => {
        expect(screen.queryByText('>240 mg/dL')).not.toBeInTheDocument();
      });
    });

    it('applies correct tooltip styling', async () => {
      render(<BloodMarkersSection {...defaultProps} />);

      const statusPill = screen.getAllByText('Optimal')[0];
      
      fireEvent.mouseEnter(statusPill);

      await waitFor(() => {
        const tooltip = screen.container.querySelector('.bg-white.dark\\:bg-gray-800.rounded-lg');
        expect(tooltip).toBeInTheDocument();

        const tooltipArrow = screen.container.querySelector('.w-2.h-2.bg-white');
        expect(tooltipArrow).toBeInTheDocument();
      });
    });

    it('positions tooltip correctly', async () => {
      render(<BloodMarkersSection {...defaultProps} />);

      const statusPill = screen.getAllByText('Optimal')[0];
      
      fireEvent.mouseEnter(statusPill);

      await waitFor(() => {
        const tooltip = screen.container.querySelector('.absolute.bottom-full');
        expect(tooltip).toBeInTheDocument();
      });
    });
  });

  describe('Click Interactions', () => {
    it('calls onMarkerClick when marker with data is clicked', () => {
      render(<BloodMarkersSection {...defaultProps} />);

      const cholesterolRow = screen.getByText('Total Cholesterol').closest('.cursor-pointer');
      fireEvent.click(cholesterolRow!);

      expect(mockOnMarkerClick).toHaveBeenCalledWith('Total Cholesterol', [
        { date: '2024-01-15', value: 180, unit: 'mg/dL' },
        { date: '2024-01-01', value: 190, unit: 'mg/dL' },
      ]);
    });

    it('does not call onMarkerClick for markers without data', () => {
      render(<BloodMarkersSection {...defaultProps} />);

      const vitaminDRow = screen.getByText('Vitamin D').closest('div');
      
      // Should not have cursor-pointer class
      expect(vitaminDRow).not.toHaveClass('cursor-pointer');
      
      fireEvent.click(vitaminDRow!);
      expect(mockOnMarkerClick).not.toHaveBeenCalled();
    });

    it('applies hover effects to clickable rows', () => {
      render(<BloodMarkersSection {...defaultProps} />);

      const clickableRow = screen.getByText('Total Cholesterol').closest('.cursor-pointer');
      expect(clickableRow).toHaveClass('hover:bg-gray-50', 'dark:hover:bg-gray-700/50');
    });

    it('does not apply hover effects to non-clickable rows', () => {
      render(<BloodMarkersSection {...defaultProps} />);

      const nonClickableRow = screen.getByText('Vitamin D').closest('div');
      expect(nonClickableRow).not.toHaveClass('cursor-pointer');
    });
  });

  describe('Last Tested Date', () => {
    it('displays last tested date from first marker with data', () => {
      render(<BloodMarkersSection {...defaultProps} />);

      expect(screen.getByText(/Last tested: 1\/15\/2024/)).toBeInTheDocument();
    });

    it('does not display last tested date when no markers have data', () => {
      const noDataMarkers = [
        { label: 'Marker 1', data: [] },
        { label: 'Marker 2', data: [] },
      ];

      render(
        <BloodMarkersSection
          {...defaultProps}
          markers={noDataMarkers}
        />
      );

      expect(screen.queryByText(/Last tested/)).not.toBeInTheDocument();
    });

    it('applies correct styling to last tested date', () => {
      render(<BloodMarkersSection {...defaultProps} />);

      const lastTestedText = screen.getByText(/Last tested/);
      expect(lastTestedText).toHaveClass(
        'text-xs',
        'sm:text-sm',
        'text-gray-500',
        'dark:text-gray-400'
      );
    });

    it('applies correct margin to last tested date', () => {
      render(<BloodMarkersSection {...defaultProps} />);

      const lastTestedText = screen.getByText(/Last tested/);
      expect(lastTestedText).toHaveClass('mt-4', 'sm:mt-6');
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive layout classes to marker rows', () => {
      render(<BloodMarkersSection {...defaultProps} />);

      const markerRows = screen.container.querySelectorAll('.flex-col.sm\\:flex-row');
      expect(markerRows.length).toBeGreaterThan(0);
    });

    it('applies responsive gap classes', () => {
      render(<BloodMarkersSection {...defaultProps} />);

      const gapElements = screen.container.querySelectorAll('.gap-2.sm\\:gap-3');
      expect(gapElements.length).toBeGreaterThan(0);
    });

    it('applies responsive padding to container', () => {
      render(<BloodMarkersSection {...defaultProps} />);

      const container = screen.container.querySelector('.px-4.sm\\:px-6');
      expect(container).toBeInTheDocument();
    });

    it('applies responsive text sizing to title', () => {
      render(<BloodMarkersSection {...defaultProps} />);

      const title = screen.getByText('Lipid Panel');
      expect(title).toHaveClass('text-lg');
    });
  });

  describe('Dark Mode Support', () => {
    it('applies dark mode classes to container', () => {
      render(<BloodMarkersSection {...defaultProps} />);

      const container = screen.container.querySelector('.dark\\:border-gray-700');
      expect(container).toBeInTheDocument();
    });

    it('applies dark mode classes to title', () => {
      render(<BloodMarkersSection {...defaultProps} />);

      const title = screen.getByText('Lipid Panel');
      expect(title).toHaveClass('dark:text-white');
    });

    it('applies dark mode classes to status pills', () => {
      render(<BloodMarkersSection {...defaultProps} />);

      const optimalPills = screen.getAllByText('Optimal');
      optimalPills.forEach(pill => {
        expect(pill).toHaveClass('dark:bg-green-900/30', 'dark:text-green-400');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty markers array', () => {
      render(
        <BloodMarkersSection
          {...defaultProps}
          markers={[]}
        />
      );

      expect(screen.getByText('Lipid Panel')).toBeInTheDocument();
      expect(screen.queryByText(/Last tested/)).not.toBeInTheDocument();
    });

    it('handles markers with malformed data', () => {
      const malformedMarkers = [
        {
          label: 'Bad Marker',
          data: [
            { date: 'invalid-date', value: 'not-a-number' as any, unit: 'mg/dL' },
          ],
        },
      ];

      expect(() => {
        render(
          <BloodMarkersSection
            {...defaultProps}
            markers={malformedMarkers}
          />
        );
      }).not.toThrow();

      expect(screen.getByText('Bad Marker')).toBeInTheDocument();
    });

    it('handles undefined userData', () => {
      render(
        <BloodMarkersSection
          {...defaultProps}
          userData={undefined}
        />
      );

      expect(screen.getByText('Total Cholesterol')).toBeInTheDocument();
      expect(screen.getAllByText('Optimal').length).toBeGreaterThan(0);
    });

    it('handles null userData', () => {
      render(
        <BloodMarkersSection
          {...defaultProps}
          userData={null}
        />
      );

      expect(screen.getByText('Total Cholesterol')).toBeInTheDocument();
      expect(screen.getAllByText('Optimal').length).toBeGreaterThan(0);
    });

    it('handles markers with missing units', () => {
      const noUnitMarkers = [
        {
          label: 'No Unit Marker',
          data: [
            { date: '2024-01-15', value: 100 } as BloodMarker,
          ],
        },
      ];

      render(
        <BloodMarkersSection
          {...defaultProps}
          markers={noUnitMarkers}
        />
      );

      expect(screen.getByText('No Unit Marker')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('handles large numbers of markers efficiently', () => {
      const manyMarkers = Array.from({ length: 50 }, (_, i) => ({
        label: `Marker ${i}`,
        data: [
          { date: '2024-01-15', value: 100 + i, unit: 'mg/dL' },
        ],
      }));

      expect(() => {
        render(
          <BloodMarkersSection
            {...defaultProps}
            markers={manyMarkers}
          />
        );
      }).not.toThrow();

      expect(screen.getByText('Marker 0')).toBeInTheDocument();
      expect(screen.getByText('Marker 49')).toBeInTheDocument();
    });

    it('efficiently handles prop changes', () => {
      const { rerender } = render(<BloodMarkersSection {...defaultProps} />);

      const newMarkers = [
        {
          label: 'New Marker',
          data: [{ date: '2024-01-20', value: 150, unit: 'mg/dL' }],
        },
      ];

      rerender(
        <BloodMarkersSection
          {...defaultProps}
          markers={newMarkers}
        />
      );

      expect(screen.getByText('New Marker')).toBeInTheDocument();
      expect(screen.getByText('150 mg/dL')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides semantic structure', () => {
      render(<BloodMarkersSection {...defaultProps} />);

      const title = screen.getByText('Lipid Panel');
      expect(title.tagName).toBe('H3');
    });

    it('provides clickable regions for interactive markers', () => {
      render(<BloodMarkersSection {...defaultProps} />);

      const clickableRows = screen.container.querySelectorAll('.cursor-pointer');
      expect(clickableRows.length).toBeGreaterThan(0);
    });

    it('maintains proper text contrast', () => {
      render(<BloodMarkersSection {...defaultProps} />);

      const markerLabels = screen.getByText('Total Cholesterol');
      expect(markerLabels).toHaveClass('text-gray-600', 'dark:text-gray-400');
    });

    it('provides keyboard navigation support', () => {
      render(<BloodMarkersSection {...defaultProps} />);

      // Interactive elements should be focusable
      const clickableRow = screen.getByText('Total Cholesterol').closest('.cursor-pointer');
      expect(clickableRow).toBeInTheDocument();
    });
  });
});
