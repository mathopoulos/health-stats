import React from 'react';
import { render, screen } from '@/test-utils';
import { SleepStagesBar } from '../SleepStagesBar';

describe('SleepStagesBar', () => {
  const mockStageDurations = {
    deep: { percentage: 20, duration: '1h 30m' },
    core: { percentage: 55, duration: '4h 8m' },
    rem: { percentage: 25, duration: '1h 52m' }
  };

  it('should render all sleep stages', () => {
    render(<SleepStagesBar stageDurations={mockStageDurations} />);
    
    expect(screen.getByText('Deep Sleep')).toBeInTheDocument();
    expect(screen.getByText('Core Sleep')).toBeInTheDocument();
    expect(screen.getByText('REM Sleep')).toBeInTheDocument();
  });

  it('should display duration for each stage', () => {
    render(<SleepStagesBar stageDurations={mockStageDurations} />);
    
    expect(screen.getByText('1h 30m')).toBeInTheDocument(); // Deep sleep
    expect(screen.getByText('4h 8m')).toBeInTheDocument(); // Core sleep  
    expect(screen.getByText('1h 52m')).toBeInTheDocument(); // REM sleep
  });

  it('should show target information for each stage', () => {
    render(<SleepStagesBar stageDurations={mockStageDurations} />);
    
    expect(screen.getAllByText(/Target: 90min/)).toHaveLength(2); // Deep and REM sleep targets
    expect(screen.getByText(/Target: 240min/)).toBeInTheDocument(); // Core sleep target
  });

  it('should render progress bars for each stage', () => {
    const { container } = render(<SleepStagesBar stageDurations={mockStageDurations} />);
    
    // Should have progress bar containers
    const progressBars = container.querySelectorAll('.bg-gray-100');
    expect(progressBars.length).toBe(3); // One for each of the 3 stages
  });

  it('should handle missing stage durations', () => {
    const incompleteDurations = {
      deep: { percentage: 20, duration: '1h 30m' },
      // Missing other stages
    };

    render(<SleepStagesBar stageDurations={incompleteDurations} />);
    
    // All stages should still be rendered, but missing ones show 0min
    expect(screen.getByText('Deep Sleep')).toBeInTheDocument();
    expect(screen.getByText('Core Sleep')).toBeInTheDocument();
    expect(screen.getByText('REM Sleep')).toBeInTheDocument();
    
    expect(screen.getByText('1h 30m')).toBeInTheDocument(); // Deep sleep has data
    expect(screen.getAllByText('0min')).toHaveLength(2); // Other stages show 0min
  });

  it('should handle null stage durations', () => {
    render(<SleepStagesBar stageDurations={null} />);
    
    expect(screen.getByText('No sleep data available')).toBeInTheDocument();
  });
});
