import React from 'react';
import { render, screen } from '@/test-utils';
import { WorkoutMetrics } from '../WorkoutMetrics';

describe('WorkoutMetrics', () => {
  const mockMetrics = {
    Duration: '45:30',
    Distance: '5.2 mi',
    'Avg Heart Rate': '142 bpm',
    Calories: '350 cal'
  };

  it('should render workout type with correct formatting', () => {
    render(
      <WorkoutMetrics 
        metrics={mockMetrics} 
        activityType="strength_training" 
      />
    );
    
    expect(screen.getByText('strength training')).toBeInTheDocument();
  });

  it('should display all provided metrics', () => {
    render(
      <WorkoutMetrics 
        metrics={mockMetrics} 
        activityType="running" 
      />
    );
    
    expect(screen.getByText('Duration')).toBeInTheDocument();
    expect(screen.getByText('45:30')).toBeInTheDocument();
    expect(screen.getByText('Distance')).toBeInTheDocument();
    expect(screen.getByText('5.2 mi')).toBeInTheDocument();
    expect(screen.getByText('Avg Heart Rate')).toBeInTheDocument();
    expect(screen.getByText('142 bpm')).toBeInTheDocument();
  });

  it('should order metrics correctly with Duration first', () => {
    render(
      <WorkoutMetrics 
        metrics={mockMetrics} 
        activityType="running" 
      />
    );
    
    const metricElements = screen.getAllByText(/Duration|Distance|Avg Heart Rate|Calories/);
    const labels = metricElements.map(el => el.textContent);
    
    // Duration should be first in the ordered metrics
    expect(labels[0]).toBe('Duration');
    // Distance should appear in the list
    expect(labels).toContain('Distance');
  });

  it('should handle empty metrics gracefully', () => {
    render(
      <WorkoutMetrics 
        metrics={{}} 
        activityType="walking" 
      />
    );
    
    expect(screen.getByText('walking')).toBeInTheDocument();
    // Should not crash with empty metrics
  });

  it('should show default icon for unknown activity types', () => {
    const { container } = render(
      <WorkoutMetrics 
        metrics={mockMetrics} 
        activityType="unknown_activity" 
      />
    );
    
    expect(screen.getByText('unknown activity')).toBeInTheDocument();
    // Should render without error even with unknown activity type
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
