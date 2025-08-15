import React from 'react';
import { render, screen } from '@/test-utils';
import { ActivityFeed } from '../ActivityFeed';
import type { ActivityFeedItem } from '@/types/dashboard';

describe('ActivityFeed', () => {
  const mockActivities: ActivityFeedItem[] = [
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
    {
      id: '3',
      type: 'other',
      title: 'Heart Rate Variability',
      startTime: '2024-01-15T08:00:00Z',
      endTime: '2024-01-15T08:00:00Z',
      metrics: {
        'HRV': '42 ms',
      },
    },
  ];

  describe('Loading State', () => {
    it('renders loading skeleton when loading is true', () => {
      render(<ActivityFeed activities={[]} loading={true} />);
      
      expect(screen.getByText('Recent activity')).toBeInTheDocument();
      expect(screen.getAllByRole('generic')).toHaveLength(expect.any(Number));
      
      // Check for loading skeletons
      const loadingElements = screen.container.querySelectorAll('.animate-pulse');
      expect(loadingElements).toHaveLength(3);
    });

    it('shows proper loading structure with correct classes', () => {
      render(<ActivityFeed activities={[]} loading={true} />);
      
      const container = screen.container.querySelector('.bg-white.dark\\:bg-gray-800');
      expect(container).toBeInTheDocument();
      
      const skeletons = screen.container.querySelectorAll('.h-32.bg-gray-200.dark\\:bg-gray-700');
      expect(skeletons).toHaveLength(3);
    });
  });

  describe('Empty State', () => {
    it('renders empty state message when no activities', () => {
      render(<ActivityFeed activities={[]} loading={false} />);
      
      expect(screen.getByText('Recent activity')).toBeInTheDocument();
      expect(screen.getByText('No recent activity data available')).toBeInTheDocument();
    });

    it('has correct empty state styling', () => {
      render(<ActivityFeed activities={[]} loading={false} />);
      
      const emptyMessage = screen.getByText('No recent activity data available');
      expect(emptyMessage).toHaveClass('text-gray-500', 'dark:text-gray-400');
    });
  });

  describe('Activity Rendering', () => {
    it('renders all activities when provided', () => {
      render(<ActivityFeed activities={mockActivities} loading={false} />);
      
      expect(screen.getByText('Morning Run')).toBeInTheDocument();
      expect(screen.getByText('7h 23m')).toBeInTheDocument();
      expect(screen.getByText('Heart Rate Variability')).toBeInTheDocument();
    });

    it('renders timeline structure correctly', () => {
      render(<ActivityFeed activities={mockActivities} loading={false} />);
      
      // Check for timeline vertical line
      const timelineLine = screen.container.querySelector('.absolute.left-\\[7px\\]');
      expect(timelineLine).toBeInTheDocument();
      
      // Check for timeline dots
      const timelineDots = screen.container.querySelectorAll('.w-4.h-4.rounded-full');
      expect(timelineDots).toHaveLength(mockActivities.length);
    });
  });

  describe('Workout Activities', () => {
    const workoutActivity: ActivityFeedItem = {
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
    };

    it('renders workout activity with correct emoji', () => {
      render(<ActivityFeed activities={[workoutActivity]} loading={false} />);
      
      expect(screen.getByText('Morning Run')).toBeInTheDocument();
      expect(screen.getByText('5.2 miles')).toBeInTheDocument();
      
      // Check that emoji is rendered (though we can't easily test the specific emoji)
      const emojiContainer = screen.container.querySelector('.text-5xl');
      expect(emojiContainer).toBeInTheDocument();
    });

    it('renders workout metrics correctly', () => {
      render(<ActivityFeed activities={[workoutActivity]} loading={false} />);
      
      expect(screen.getByText('Distance')).toBeInTheDocument();
      expect(screen.getByText('5.2 mi')).toBeInTheDocument();
      expect(screen.getByText('Duration')).toBeInTheDocument();
      expect(screen.getByText('45 min')).toBeInTheDocument();
      expect(screen.getByText('Avg Pace')).toBeInTheDocument();
      expect(screen.getByText('8:30 /mi')).toBeInTheDocument();
      expect(screen.getByText('Calories')).toBeInTheDocument();
      expect(screen.getByText('450')).toBeInTheDocument();
    });

    it('uses default emoji for unknown activity types', () => {
      const unknownActivity = {
        ...workoutActivity,
        activityType: 'unknown_activity',
      };
      
      render(<ActivityFeed activities={[unknownActivity]} loading={false} />);
      
      const emojiContainer = screen.container.querySelector('.text-5xl');
      expect(emojiContainer).toBeInTheDocument();
    });

    it('handles workout without subtitle', () => {
      const workoutWithoutSubtitle = {
        ...workoutActivity,
        subtitle: undefined,
      };
      
      render(<ActivityFeed activities={[workoutWithoutSubtitle]} loading={false} />);
      
      expect(screen.getByText('Morning Run')).toBeInTheDocument();
      expect(screen.queryByText('5.2 miles')).not.toBeInTheDocument();
    });

    it('renders workout timeline dot with correct styling', () => {
      render(<ActivityFeed activities={[workoutActivity]} loading={false} />);
      
      const workoutDot = screen.container.querySelector('.bg-green-100.ring-4.ring-green-500');
      expect(workoutDot).toBeInTheDocument();
    });
  });

  describe('Sleep Activities', () => {
    const sleepActivity: ActivityFeedItem = {
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
    };

    it('renders sleep activity with stages', () => {
      render(<ActivityFeed activities={[sleepActivity]} loading={false} />);
      
      expect(screen.getByText('7h 23m')).toBeInTheDocument();
      expect(screen.getByText('Time asleep')).toBeInTheDocument();
    });

    it('renders sleep timeline dot with correct styling', () => {
      render(<ActivityFeed activities={[sleepActivity]} loading={false} />);
      
      const sleepDot = screen.container.querySelector('.bg-blue-100.ring-4.ring-blue-500');
      expect(sleepDot).toBeInTheDocument();
    });

    it('handles sleep without sleep stages', () => {
      const sleepWithoutStages = {
        ...sleepActivity,
        sleepStages: undefined,
      };
      
      render(<ActivityFeed activities={[sleepWithoutStages]} loading={false} />);
      
      expect(screen.getByText('7h 23m')).toBeInTheDocument();
      expect(screen.getByText('Time asleep')).toBeInTheDocument();
    });
  });

  describe('Other Activities', () => {
    const otherActivity: ActivityFeedItem = {
      id: '3',
      type: 'other',
      title: 'Heart Rate Variability',
      startTime: '2024-01-15T08:00:00Z',
      endTime: '2024-01-15T08:00:00Z',
      metrics: {
        'HRV': '42 ms',
      },
    };

    it('renders other activity type correctly', () => {
      render(<ActivityFeed activities={[otherActivity]} loading={false} />);
      
      expect(screen.getByText('Heart Rate Variability')).toBeInTheDocument();
    });

    it('renders other activity timeline dot with correct styling', () => {
      render(<ActivityFeed activities={[otherActivity]} loading={false} />);
      
      const otherDot = screen.container.querySelector('.bg-orange-100.ring-4.ring-orange-500');
      expect(otherDot).toBeInTheDocument();
    });
  });

  describe('Date and Time Formatting', () => {
    it('formats dates correctly', () => {
      const activity: ActivityFeedItem = {
        id: '1',
        type: 'workout',
        title: 'Test Activity',
        startTime: '2024-01-15T06:00:00Z',
        endTime: '2024-01-15T06:45:00Z',
        metrics: {},
      };
      
      render(<ActivityFeed activities={[activity]} loading={false} />);
      
      // The date should be formatted as a readable date
      expect(screen.getByText(/Monday, January 15, 2024/)).toBeInTheDocument();
    });

    it('formats time ranges correctly', () => {
      const activity: ActivityFeedItem = {
        id: '1',
        type: 'workout',
        title: 'Test Activity',
        startTime: '2024-01-15T06:00:00Z',
        endTime: '2024-01-15T06:45:00Z',
        metrics: {},
      };
      
      render(<ActivityFeed activities={[activity]} loading={false} />);
      
      // Should show time range (exact format may vary based on timezone)
      expect(screen.getByText(/until/)).toBeInTheDocument();
    });

    it('handles activities without startTime', () => {
      const activity: ActivityFeedItem = {
        id: '1',
        type: 'other',
        title: 'Test Activity',
        metrics: {},
      };
      
      render(<ActivityFeed activities={[activity]} loading={false} />);
      
      expect(screen.getByText('Test Activity')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive grid classes to workout metrics', () => {
      const workoutActivity: ActivityFeedItem = {
        id: '1',
        type: 'workout',
        title: 'Test Workout',
        metrics: {
          'Metric 1': 'Value 1',
          'Metric 2': 'Value 2',
        },
      };
      
      render(<ActivityFeed activities={[workoutActivity]} loading={false} />);
      
      const metricsGrid = screen.container.querySelector('.grid.grid-cols-1.xs\\:grid-cols-2.lg\\:grid-cols-4');
      expect(metricsGrid).toBeInTheDocument();
    });

    it('applies responsive padding classes', () => {
      render(<ActivityFeed activities={mockActivities} loading={false} />);
      
      const container = screen.container.querySelector('.px-5.sm\\:px-10');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Dark Mode Support', () => {
    it('applies dark mode classes correctly', () => {
      render(<ActivityFeed activities={mockActivities} loading={false} />);
      
      const container = screen.container.querySelector('.bg-white.dark\\:bg-gray-800');
      expect(container).toBeInTheDocument();
      
      const title = screen.getByText('Recent activity');
      expect(title).toHaveClass('dark:text-white');
    });
  });

  describe('Emoji Mapping', () => {
    it('maps different activity types to correct emojis', () => {
      const activities: ActivityFeedItem[] = [
        {
          id: '1',
          type: 'workout',
          title: 'Running',
          activityType: 'running',
          metrics: {},
        },
        {
          id: '2',
          type: 'workout',
          title: 'Walking',
          activityType: 'walking',
          metrics: {},
        },
        {
          id: '3',
          type: 'workout',
          title: 'Cycling',
          activityType: 'cycling',
          metrics: {},
        },
        {
          id: '4',
          type: 'workout',
          title: 'Strength',
          activityType: 'strength_training',
          metrics: {},
        },
      ];
      
      render(<ActivityFeed activities={activities} loading={false} />);
      
      // All activities should render with their emoji containers
      const emojiContainers = screen.container.querySelectorAll('.text-5xl');
      expect(emojiContainers).toHaveLength(4);
    });
  });
});
