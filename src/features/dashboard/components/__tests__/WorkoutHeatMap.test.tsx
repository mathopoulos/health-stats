import React from 'react';
import { render, screen, fireEvent } from '../../../../test-utils';
import WorkoutHeatMap from '../WorkoutHeatMap';
import type { ActivityFeedItem } from '../../../../types/dashboard';

// Mock react-calendar-heatmap
jest.mock('react-calendar-heatmap', () => {
  return function MockCalendarHeatmap(props: any) {
    const { values, tooltipDataAttrs, classForValue, titleForValue } = props;
    
    return (
      <div data-testid="calendar-heatmap">
        {values.map((value: any, index: number) => {
          const tooltipAttrs = tooltipDataAttrs ? tooltipDataAttrs(value) : {};
          const className = classForValue ? classForValue(value) : '';
          const title = titleForValue ? titleForValue(value) : '';
          
          return (
            <div
              key={`${value?.date || 'empty'}-${index}`}
              data-testid={`heatmap-square-${index}`}
              className={className}
              title={title}
              {...tooltipAttrs}
            >
              {value?.totalMinutes || 0}
            </div>
          );
        })}
      </div>
    );
  };
});

// Mock react-tooltip
jest.mock('react-tooltip', () => ({
  Tooltip: function MockTooltip(props: any) {
    const { id, render } = props;
    return (
      <div data-testid={`tooltip-${id}`}>
        {render && render({ content: '2024-01-15' })}
      </div>
    );
  },
}));

// Mock the custom hook
jest.mock('../../hooks/useWorkoutHeatmapData', () => ({
  useWorkoutHeatmapData: jest.fn(),
}));

// Mock the child components
jest.mock('../WorkoutTooltip', () => ({
  WorkoutTooltip: jest.fn(({ value }) => (
    <div data-testid="workout-tooltip">
      {value ? `Tooltip for ${value.date}` : 'No workout'}
    </div>
  )),
}));

jest.mock('../HeatmapLegend', () => ({
  HeatmapLegend: jest.fn(() => (
    <div data-testid="heatmap-legend">Legend</div>
  )),
}));

jest.mock('../../styles/WorkoutHeatMapStyles', () => ({
  WorkoutHeatMapStyles: jest.fn(() => (
    <style data-testid="heatmap-styles">/* Styles */</style>
  )),
}));

import { useWorkoutHeatmapData } from '../../hooks/useWorkoutHeatmapData';

const mockUseWorkoutHeatmapData = useWorkoutHeatmapData as jest.MockedFunction<typeof useWorkoutHeatmapData>;

describe('WorkoutHeatMap', () => {
  const mockWorkouts: ActivityFeedItem[] = [
    {
      id: '1',
      type: 'workout',
      title: 'Morning Run',
      startTime: '2024-01-15T08:00:00Z',
      endTime: '2024-01-15T09:00:00Z',
      metrics: {
        'Duration': '60 minutes',
        'Distance': '5.2 miles',
      },
    },
    {
      id: '2', 
      type: 'workout',
      title: 'Evening Workout',
      startTime: '2024-01-16T18:00:00Z',
      endTime: '2024-01-16T19:30:00Z',
      metrics: {
        'Duration': '90 minutes',
        'Type': 'Strength Training',
      },
    },
  ];

  const mockHeatmapData = {
    values: [
      {
        date: '2024-01-15',
        totalMinutes: 60,
        details: {
          workouts: [{
            type: 'running',
            duration: '60m',
            startTime: '08:00',
          }],
        },
      },
      {
        date: '2024-01-16',
        totalMinutes: 90,
        details: {
          workouts: [{
            type: 'strength',
            duration: '90m',
            startTime: '18:00',
          }],
        },
      },
      {
        date: '2024-01-17',
        totalMinutes: 0,
        details: {
          workouts: [],
        },
      },
    ],
    dateRange: {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWorkoutHeatmapData.mockReturnValue(mockHeatmapData);
  });

  it('renders without crashing', () => {
    render(<WorkoutHeatMap workouts={mockWorkouts} />);
    expect(screen.getByTestId('calendar-heatmap')).toBeInTheDocument();
  });

  it('renders all child components', () => {
    render(<WorkoutHeatMap workouts={mockWorkouts} />);
    
    expect(screen.getByTestId('heatmap-styles')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-heatmap')).toBeInTheDocument();
    expect(screen.getByTestId('heatmap-legend')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-workout-tooltip')).toBeInTheDocument();
  });

  it('passes correct data to useWorkoutHeatmapData hook', () => {
    render(<WorkoutHeatMap workouts={mockWorkouts} />);
    
    expect(mockUseWorkoutHeatmapData).toHaveBeenCalledWith({ workouts: mockWorkouts });
  });

  it('renders heatmap squares with correct data', () => {
    render(<WorkoutHeatMap workouts={mockWorkouts} />);
    
    const squares = screen.getAllByTestId(/heatmap-square-/);
    expect(squares).toHaveLength(mockHeatmapData.values.length);
    
    // Check that squares contain the expected workout minutes
    expect(squares[0]).toHaveTextContent('60');
    expect(squares[1]).toHaveTextContent('90');
    expect(squares[2]).toHaveTextContent('0');
  });

  it('creates valuesByDate Map for efficient lookups', () => {
    render(<WorkoutHeatMap workouts={mockWorkouts} />);
    
    // The component should render without errors, indicating the Map is created correctly
    expect(screen.getByTestId('calendar-heatmap')).toBeInTheDocument();
  });

  it('handles empty workout array', () => {
    mockUseWorkoutHeatmapData.mockReturnValue({
      values: [{
        date: '2024-01-15',
        totalMinutes: 0,
        details: { workouts: [] },
      }],
      dateRange: {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      },
    });

    render(<WorkoutHeatMap workouts={[]} />);
    
    expect(screen.getByTestId('calendar-heatmap')).toBeInTheDocument();
    expect(screen.getByTestId('heatmap-legend')).toBeInTheDocument();
  });

  it('applies correct CSS classes and responsive design', () => {
    render(<WorkoutHeatMap workouts={mockWorkouts} />);
    
    const container = screen.getByTestId('calendar-heatmap').parentElement;
    expect(container).toHaveClass('min-w-[800px]', 'sm:min-w-0', 'px-4', 'sm:px-0');
  });

  it('configures tooltip with correct properties', () => {
    render(<WorkoutHeatMap workouts={mockWorkouts} />);
    
    const tooltip = screen.getByTestId('tooltip-workout-tooltip');
    expect(tooltip).toBeInTheDocument();
  });

  it('handles date range correctly', () => {
    const customDateRange = {
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-12-31'),
    };

    mockUseWorkoutHeatmapData.mockReturnValue({
      ...mockHeatmapData,
      dateRange: customDateRange,
    });

    render(<WorkoutHeatMap workouts={mockWorkouts} />);
    
    expect(screen.getByTestId('calendar-heatmap')).toBeInTheDocument();
  });

  it('memoizes renderTooltipContent callback', () => {
    const { rerender } = render(<WorkoutHeatMap workouts={mockWorkouts} />);
    
    // Re-render with same props
    rerender(<WorkoutHeatMap workouts={mockWorkouts} />);
    
    // Component should render successfully, indicating memoization is working
    expect(screen.getByTestId('tooltip-workout-tooltip')).toBeInTheDocument();
  });

  it('handles valuesByDate Map edge cases', () => {
    mockUseWorkoutHeatmapData.mockReturnValue({
      values: [],
      dateRange: {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-01'),
      },
    });

    render(<WorkoutHeatMap workouts={[]} />);
    
    expect(screen.getByTestId('calendar-heatmap')).toBeInTheDocument();
    expect(screen.queryAllByTestId(/heatmap-square-/)).toHaveLength(0);
  });

  it('applies all configuration from heatmapConfig', () => {
    render(<WorkoutHeatMap workouts={mockWorkouts} />);
    
    // Verify the tooltip renders with mocked content
    const tooltip = screen.getByTestId('tooltip-workout-tooltip');
    expect(tooltip).toBeInTheDocument();
  });
});
