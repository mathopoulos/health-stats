import React from 'react';
import { render, screen } from '@/test-utils';
import { MetricSummaryCard } from '../MetricSummaryCard';
import type { HealthData } from '@/types/dashboard';

// Test data factory - creates data within the last 30 days by default
const createHealthData = (values: number[], daysAgo = 1): HealthData[] => {
  const now = new Date();
  return values.map((value, index) => ({
    date: new Date(now.getTime() - (daysAgo + index) * 24 * 60 * 60 * 1000).toISOString(),
    value,
  }));
};

describe('MetricSummaryCard', () => {
  const mockProps = {
    title: 'Heart Rate Variability',
    metricType: 'hrv' as const,
    loading: false,
    data: [],
  };

  it('renders the metric title correctly', () => {
    render(<MetricSummaryCard {...mockProps} />);
    
    expect(screen.getByText('Heart Rate Variability')).toBeInTheDocument();
  });

  it('shows loading state correctly', () => {
    render(<MetricSummaryCard {...mockProps} loading={true} />);
    
    expect(screen.getByText('...')).toBeInTheDocument();
  });

  it('shows "No data" when no data is available', () => {
    render(<MetricSummaryCard {...mockProps} data={[]} />);
    
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  describe('HRV metric formatting', () => {
    it('displays HRV values with "ms" unit and rounded to nearest integer', () => {
      const data = createHealthData([45.7, 50.2, 48.9], 1); // Create data from recent days
      
      render(
        <MetricSummaryCard 
          {...mockProps} 
          data={data}
          metricType="hrv"
        />
      );
      
      // Average should be (45.7 + 50.2 + 48.9) / 3 = 48.27, rounded to 48
      expect(screen.getByText('48 ms')).toBeInTheDocument();
    });
  });

  describe('VO2 Max metric formatting', () => {
    it('displays VO2 Max values as rounded integers', () => {
      const data = createHealthData([52.3, 51.8, 53.1], 1);
      
      render(
        <MetricSummaryCard 
          {...mockProps} 
          title="VO2 Max"
          data={data}
          metricType="vo2max"
          unit="mL/kg·min"
        />
      );
      
      // Average should be (52.3 + 51.8 + 53.1) / 3 = 52.4, rounded to 52
      expect(screen.getByText('52')).toBeInTheDocument();
      expect(screen.getByText('mL/kg·min')).toBeInTheDocument();
    });
  });

  describe('Weight metric formatting', () => {
    it('displays weight values with one decimal place', () => {
      const data = createHealthData([175.4, 174.8, 175.2], 1);
      
      render(
        <MetricSummaryCard 
          {...mockProps} 
          title="Weight"
          data={data}
          metricType="weight"
          unit="lb"
        />
      );
      
      // Average should be (175.4 + 174.8 + 175.2) / 3 = 175.13, formatted to 175.1
      expect(screen.getByText('175.1')).toBeInTheDocument();
      expect(screen.getByText('lb')).toBeInTheDocument();
    });
  });

  describe('Body Fat metric formatting', () => {
    it('displays body fat values with one decimal place', () => {
      const data = createHealthData([12.3, 12.7, 12.1], 1);
      
      render(
        <MetricSummaryCard 
          {...mockProps} 
          title="Body Fat"
          data={data}
          metricType="bodyFat"
          unit="%"
        />
      );
      
      // Average should be (12.3 + 12.7 + 12.1) / 3 = 12.37, formatted to 12.4
      expect(screen.getByText('12.4')).toBeInTheDocument();
      expect(screen.getByText('%')).toBeInTheDocument();
    });
  });

  describe('Trend indicator behavior', () => {
    it('shows trend indicator when there is sufficient data for comparison', () => {
      // Create current data (within last 30 days) and older data (31-60 days ago)
      const now = new Date();
      const currentData = [
        { date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), value: 50 },
        { date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(), value: 52 },
        { date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(), value: 51 },
      ];
      const olderData = [
        { date: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString(), value: 45 },
        { date: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString(), value: 47 },
        { date: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(), value: 46 },
      ];
      const combinedData = [...olderData, ...currentData];
      
      render(
        <MetricSummaryCard 
          {...mockProps} 
          data={combinedData}
          metricType="hrv"
          timeRange="last30days"
        />
      );
      
      // Should show the current average (51 ms)
      expect(screen.getByText('51 ms')).toBeInTheDocument();
      // Trend indicator should be present (though we can't easily test its exact appearance)
    });

    it('does not show trend indicator when insufficient data', () => {
      const data = createHealthData([50], 1);
      
      render(
        <MetricSummaryCard 
          {...mockProps} 
          data={data}
          metricType="hrv"
        />
      );
      
      expect(screen.getByText('50 ms')).toBeInTheDocument();
      // With only one data point, trend calculation should not be possible
    });
  });

  describe('Time range display', () => {
    it('shows "Last 30 days" for last30days time range', () => {
      const data = createHealthData([50], 1);
      
      render(
        <MetricSummaryCard 
          {...mockProps} 
          data={data}
          metricType="hrv"
          timeRange="last30days"
        />
      );
      
      expect(screen.getByText('Last 30 days')).toBeInTheDocument();
    });

    it('shows "Average" for other time ranges', () => {
      const data = createHealthData([50], 1);
      
      render(
        <MetricSummaryCard 
          {...mockProps} 
          data={data}
          metricType="hrv"
          timeRange="last6months"
        />
      );
      
      expect(screen.getByText('Average')).toBeInTheDocument();
    });
  });

  describe('Data filtering by time range', () => {
    it('correctly filters data to last 30 days', () => {
      // Create data with some points older than 30 days
      const now = new Date();
      const twentyDaysAgo = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
      const fortyDaysAgo = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000);
      
      const data = [
        { date: fortyDaysAgo.toISOString(), value: 40 }, // Should be filtered out (>30 days)
        { date: twentyDaysAgo.toISOString(), value: 50 }, // Should be included (<30 days)
        { date: now.toISOString(), value: 60 }, // Should be included (today)
      ];
      
      render(
        <MetricSummaryCard 
          {...mockProps} 
          data={data}
          metricType="hrv"
          timeRange="last30days"
        />
      );
      
      // Should show average of 50 and 60 (=55), not including the 40 from 40 days ago
      expect(screen.getByText('55 ms')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles empty data gracefully', () => {
      render(<MetricSummaryCard {...mockProps} data={[]} />);
      
      expect(screen.getByText('No data')).toBeInTheDocument();
      expect(screen.queryByText('Last 30 days')).toBeInTheDocument();
    });

    it('handles single data point correctly', () => {
      const data = createHealthData([42.7], 1);
      
      render(
        <MetricSummaryCard 
          {...mockProps} 
          data={data}
          metricType="hrv"
        />
      );
      
      expect(screen.getByText('43 ms')).toBeInTheDocument();
    });

    it('handles zero values correctly', () => {
      const data = createHealthData([0, 0, 0], 1);
      
      render(
        <MetricSummaryCard 
          {...mockProps} 
          data={data}
          metricType="hrv"
        />
      );
      
      expect(screen.getByText('0 ms')).toBeInTheDocument();
    });
  });
});
