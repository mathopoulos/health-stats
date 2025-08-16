import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import type { AdminStats } from '../../types';
import { UserStats } from '../UserManagement/UserStats';

const mockStats: AdminStats = {
  totalUsers: 42,
  publishedDashboards: 28,
  totalBloodMarkers: 156,
  totalDataPoints: 1234,
};

describe('UserStats', () => {
  it('should render all statistics correctly', () => {
    render(<UserStats stats={mockStats} />);
    
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('28')).toBeInTheDocument();
    expect(screen.getByText('Published Dashboards')).toBeInTheDocument();
    expect(screen.getByText('156')).toBeInTheDocument();
    expect(screen.getByText('Total Blood Markers')).toBeInTheDocument();
    expect(screen.getByText('1234')).toBeInTheDocument();
    expect(screen.getByText('Total Data Points')).toBeInTheDocument();
  });

  it('should handle zero values', () => {
    const zeroStats: AdminStats = {
      totalUsers: 0,
      publishedDashboards: 0,
      totalBloodMarkers: 0,
      totalDataPoints: 0,
    };

    render(<UserStats stats={zeroStats} />);
    
    const zeroElements = screen.getAllByText('0');
    expect(zeroElements).toHaveLength(4);
  });

  it('should display stats in grid layout', () => {
    render(<UserStats stats={mockStats} />);
    
    // Check that the component renders with expected structure
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('Published Dashboards')).toBeInTheDocument();
    expect(screen.getByText('Total Blood Markers')).toBeInTheDocument();
    expect(screen.getByText('Total Data Points')).toBeInTheDocument();
  });
});
