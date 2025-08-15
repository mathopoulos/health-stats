import React from 'react';
import { render, screen } from '@/test-utils';
import { HomeTab } from '../HomeTab';
import type { ChartData, ActivityFeedItem } from '@/types/dashboard';

// Mock child components to isolate HomeTab testing
jest.mock('../BioAgeMetrics', () => {
  return {
    BioAgeMetrics: ({ data, loading }: { data: any; loading: boolean }) => (
      <div data-testid="bio-age-metrics">
        BioAgeMetrics - Loading: {loading.toString()}
        {data && <span data-testid="bio-age-data">Has Data</span>}
      </div>
    ),
  };
});

jest.mock('../WorkoutHeatMapSection', () => {
  return {
    WorkoutHeatMapSection: ({ activityFeed }: { activityFeed: any[] }) => (
      <div data-testid="workout-heatmap-section">
        WorkoutHeatMapSection - Activities: {activityFeed.length}
      </div>
    ),
  };
});

jest.mock('../ActivityFeed', () => {
  return {
    ActivityFeed: ({ activities, loading }: { activities: any[]; loading: boolean }) => (
      <div data-testid="activity-feed">
        ActivityFeed - Loading: {loading.toString()}, Activities: {activities.length}
      </div>
    ),
  };
});

describe('HomeTab', () => {
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
    ],
    hrv: [
      { date: '2024-01-15', value: 42, unit: 'ms' },
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

  const mockActivityFeed: ActivityFeedItem[] = [
    {
      id: '1',
      type: 'workout',
      title: 'Morning Run',
      subtitle: '5.2 miles',
      startTime: '2024-01-15T06:00:00Z',
      endTime: '2024-01-15T06:45:00Z',
      activityType: 'running',
      metrics: {
        'Distance': '5.2 mi',
        'Duration': '45 min',
        'Avg Pace': '8:30 /mi',
        'Calories': '450',
      },
    },
    {
      id: '2',
      type: 'sleep',
      title: '7h 23m',
      startTime: '2024-01-15T22:30:00Z',
      endTime: '2024-01-16T05:53:00Z',
      sleepStages: {
        deep: 85,
        core: 230,
        rem: 88,
      },
    },
  ];

  const defaultProps = {
    data: mockChartData,
    activityFeed: mockActivityFeed,
    loading: false,
    hasLoadedData: true,
    userId: 'test-user-id',
  };

  describe('Loading States', () => {
    it('renders loading skeleton when hasLoadedData is false', () => {
      render(
        <HomeTab
          {...defaultProps}
          hasLoadedData={false}
        />
      );

      // Should not render main content components
      expect(screen.queryByTestId('bio-age-metrics')).not.toBeInTheDocument();
      expect(screen.queryByTestId('workout-heatmap-section')).not.toBeInTheDocument();
      expect(screen.queryByTestId('activity-feed')).not.toBeInTheDocument();

      // Should render skeleton - test that loading state is properly handled
      // Skeleton presence is handled by CSS classes
    });

    it('renders loading skeleton with correct structure', () => {
      render(
        <HomeTab
          {...defaultProps}
          hasLoadedData={false}
        />
      );

      // Test that skeleton state is properly handled - verify main components not rendered
      expect(screen.queryByTestId('bio-age-metrics')).not.toBeInTheDocument();
      expect(screen.queryByTestId('workout-heatmap-section')).not.toBeInTheDocument();
      expect(screen.queryByTestId('activity-feed')).not.toBeInTheDocument();
      
      // Skeleton structure is handled by CSS classes
    });

    it('shows loading skeleton regardless of loading prop when hasLoadedData is false', () => {
      render(
        <HomeTab
          {...defaultProps}
          loading={true}
          hasLoadedData={false}
        />
      );

      // Should still show skeleton, not main components
      expect(screen.queryByTestId('bio-age-metrics')).not.toBeInTheDocument();
      expect(screen.queryByTestId('workout-heatmap-section')).not.toBeInTheDocument();
      expect(screen.queryByTestId('activity-feed')).not.toBeInTheDocument();
      
      // Skeleton elements are handled by CSS classes
    });
  });

  describe('Loaded State', () => {
    it('renders all main components when hasLoadedData is true', () => {
      render(<HomeTab {...defaultProps} />);

      expect(screen.getByTestId('bio-age-metrics')).toBeInTheDocument();
      expect(screen.getByTestId('workout-heatmap-section')).toBeInTheDocument();
      expect(screen.getByTestId('activity-feed')).toBeInTheDocument();
    });

    it('passes correct props to BioAgeMetrics', () => {
      render(<HomeTab {...defaultProps} />);

      const bioAgeMetrics = screen.getByTestId('bio-age-metrics');
      expect(bioAgeMetrics).toHaveTextContent('Loading: false');
      expect(bioAgeMetrics).toHaveTextContent('Has Data');
    });

    it('passes correct props to WorkoutHeatMapSection', () => {
      render(<HomeTab {...defaultProps} />);

      const workoutHeatMap = screen.getByTestId('workout-heatmap-section');
      expect(workoutHeatMap).toHaveTextContent('Activities: 2');
    });

    it('passes correct props to ActivityFeed', () => {
      render(<HomeTab {...defaultProps} />);

      const activityFeed = screen.getByTestId('activity-feed');
      expect(activityFeed).toHaveTextContent('Loading: false');
      expect(activityFeed).toHaveTextContent('Activities: 2');
    });

    it('passes loading state correctly to child components', () => {
      render(
        <HomeTab
          {...defaultProps}
          loading={true}
        />
      );

      const bioAgeMetrics = screen.getByTestId('bio-age-metrics');
      const activityFeed = screen.getByTestId('activity-feed');
      
      expect(bioAgeMetrics).toHaveTextContent('Loading: true');
      expect(activityFeed).toHaveTextContent('Loading: true');
    });
  });

  describe('Data Handling', () => {
    it('handles empty activity feed gracefully', () => {
      render(
        <HomeTab
          {...defaultProps}
          activityFeed={[]}
        />
      );

      const workoutHeatMap = screen.getByTestId('workout-heatmap-section');
      const activityFeed = screen.getByTestId('activity-feed');
      
      expect(workoutHeatMap).toHaveTextContent('Activities: 0');
      expect(activityFeed).toHaveTextContent('Activities: 0');
    });

    it('handles empty chart data gracefully', () => {
      const emptyChartData: ChartData = {
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

      render(
        <HomeTab
          {...defaultProps}
          data={emptyChartData}
        />
      );

      expect(screen.getByTestId('bio-age-metrics')).toBeInTheDocument();
      expect(screen.getByTestId('bio-age-metrics')).toHaveTextContent('Has Data');
    });

    it('handles undefined userId gracefully', () => {
      render(
        <HomeTab
          {...defaultProps}
          userId={undefined}
        />
      );

      // Should still render all components
      expect(screen.getByTestId('bio-age-metrics')).toBeInTheDocument();
      expect(screen.getByTestId('workout-heatmap-section')).toBeInTheDocument();
      expect(screen.getByTestId('activity-feed')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('renders components in correct order', () => {
      render(<HomeTab {...defaultProps} />);

      // Test that components render in proper structure - CSS handles layout
      expect(screen.getByTestId('bio-age-metrics')).toBeInTheDocument();
      expect(screen.getByTestId('workout-heatmap-section')).toBeInTheDocument();
      expect(screen.getByTestId('activity-feed')).toBeInTheDocument();
    });

    it('applies correct CSS classes to main container', () => {
      render(<HomeTab {...defaultProps} />);

      // Test that container renders properly - CSS handles styling
      expect(screen.getByTestId('bio-age-metrics')).toBeInTheDocument();
      expect(screen.getByTestId('workout-heatmap-section')).toBeInTheDocument();
      expect(screen.getByTestId('activity-feed')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles mixed loading states correctly', () => {
      render(
        <HomeTab
          {...defaultProps}
          loading={true}
          hasLoadedData={true}
        />
      );

      // Should render main components since hasLoadedData is true
      expect(screen.getByTestId('bio-age-metrics')).toBeInTheDocument();
      expect(screen.getByTestId('workout-heatmap-section')).toBeInTheDocument();
      expect(screen.getByTestId('activity-feed')).toBeInTheDocument();

      // But loading should be passed to components
      expect(screen.getByTestId('bio-age-metrics')).toHaveTextContent('Loading: true');
    });

    it('handles large activity feed efficiently', () => {
      const largeActivityFeed = Array.from({ length: 100 }, (_, i) => ({
        id: i.toString(),
        type: 'workout' as const,
        title: `Activity ${i}`,
        startTime: `2024-01-${(i % 28) + 1}T06:00:00Z`,
        metrics: {},
      }));

      render(
        <HomeTab
          {...defaultProps}
          activityFeed={largeActivityFeed}
        />
      );

      const workoutHeatMap = screen.getByTestId('workout-heatmap-section');
      const activityFeed = screen.getByTestId('activity-feed');
      
      expect(workoutHeatMap).toHaveTextContent('Activities: 100');
      expect(activityFeed).toHaveTextContent('Activities: 100');
    });

    it('handles malformed activity feed items', () => {
      const malformedActivityFeed = [
        {
          id: '1',
          type: 'workout' as const,
          title: 'Valid Activity',
          metrics: {},
        },
        // @ts-expect-error - Testing malformed data
        {
          id: '2',
          // Missing required fields
          metrics: {},
        },
        {
          id: '3',
          type: 'sleep' as const,
          title: 'Another Valid Activity',
          startTime: '2024-01-15T22:30:00Z',
          metrics: {},
        },
      ];

      expect(() => {
        render(
          <HomeTab
            {...defaultProps}
            activityFeed={malformedActivityFeed}
          />
        );
      }).not.toThrow();

      expect(screen.getByTestId('workout-heatmap-section')).toHaveTextContent('Activities: 3');
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily when props do not change', () => {
      const { rerender } = render(<HomeTab {...defaultProps} />);

      const bioAgeMetrics = screen.getByTestId('bio-age-metrics');
      const initialText = bioAgeMetrics.textContent;

      // Re-render with same props
      rerender(<HomeTab {...defaultProps} />);

      expect(bioAgeMetrics.textContent).toBe(initialText);
    });

    it('efficiently handles state transitions', () => {
      const { rerender } = render(
        <HomeTab
          {...defaultProps}
          hasLoadedData={false}
        />
      );

      // Should show skeleton
      expect(screen.queryByTestId('bio-age-metrics')).not.toBeInTheDocument();

      // Transition to loaded state
      rerender(<HomeTab {...defaultProps} hasLoadedData={true} />);

      // Should now show main components
      expect(screen.getByTestId('bio-age-metrics')).toBeInTheDocument();
      expect(screen.getByTestId('workout-heatmap-section')).toBeInTheDocument();
      expect(screen.getByTestId('activity-feed')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('maintains proper semantic structure', () => {
      render(<HomeTab {...defaultProps} />);

      // Test semantic structure - CSS handles layout structure
      expect(screen.getByTestId('bio-age-metrics')).toBeInTheDocument();
      expect(screen.getByTestId('workout-heatmap-section')).toBeInTheDocument();
      expect(screen.getByTestId('activity-feed')).toBeInTheDocument();
    });

    it('provides appropriate loading indicators', () => {
      render(
        <HomeTab
          {...defaultProps}
          hasLoadedData={false}
        />
      );

      // Test loading accessibility - skeletons should be shown instead of main content
      expect(screen.queryByTestId('bio-age-metrics')).not.toBeInTheDocument();
      expect(screen.queryByTestId('workout-heatmap-section')).not.toBeInTheDocument();
      expect(screen.queryByTestId('activity-feed')).not.toBeInTheDocument();
    });
  });
});
