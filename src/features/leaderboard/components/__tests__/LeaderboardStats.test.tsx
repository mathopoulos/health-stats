import { render, screen } from '@testing-library/react';
import { LeaderboardStats } from '../LeaderboardStats';
import type { LeaderboardEntry } from '../../types';

describe('LeaderboardStats', () => {
  const mockHrvEntries: LeaderboardEntry[] = [
    {
      userId: 'user1',
      name: 'John Doe',
      profileImage: 'profile1.jpg',
      value: 45.5,
      dataPoints: 10,
      latestDate: '2024-01-15T00:00:00.000Z',
    },
    {
      userId: 'user2', 
      name: 'Jane Smith',
      profileImage: null,
      value: 42.3,
      dataPoints: 8,
      latestDate: '2024-01-14T00:00:00.000Z',
    },
    {
      userId: 'user3',
      name: 'Bob Wilson',
      profileImage: undefined,
      value: 48.7,
      dataPoints: 12,
      latestDate: '2024-01-13T00:00:00.000Z',
    },
  ];

  const mockVo2maxEntries: LeaderboardEntry[] = [
    {
      userId: 'user1',
      name: 'Alice Johnson',
      profileImage: 'alice.jpg',
      value: 58.5,
      dataPoints: 15,
      latestDate: '2024-01-15T00:00:00.000Z',
    },
    {
      userId: 'user2',
      name: 'Charlie Brown',
      profileImage: null,
      value: 55.2,
      dataPoints: 10,
      latestDate: '2024-01-14T00:00:00.000Z',
    },
  ];

  it('renders HRV leaderboard statistics correctly', () => {
    render(
      <LeaderboardStats 
        entries={mockHrvEntries}
        metric="hrv"
        loading={false}
      />
    );

    expect(screen.getByText('HRV Leaderboard Stats')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // Participants
    expect(screen.getByText('Participants')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument(); // Total readings (10+8+12)
  });

  it('renders VO2 Max leaderboard statistics correctly', () => {
    render(
      <LeaderboardStats 
        entries={mockVo2maxEntries}
        metric="vo2max"
        loading={false}
      />
    );

    expect(screen.getByText('VO2 Max Leaderboard Stats')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Participants
    expect(screen.getByText('25')).toBeInTheDocument(); // Total readings (15+10)
  });

  it('calculates statistics correctly for HRV', () => {
    render(
      <LeaderboardStats 
        entries={mockHrvEntries}
        metric="hrv"
        loading={false}
      />
    );

    // Check for highest value (48.7)
    expect(screen.getByText('48.7')).toBeInTheDocument();
    expect(screen.getByText('Highest HRV')).toBeInTheDocument();

    // Check for average (should be around 45.5)
    expect(screen.getByText('45.5')).toBeInTheDocument();
    expect(screen.getByText('Average HRV')).toBeInTheDocument();
  });

  it('calculates statistics correctly for VO2 Max', () => {
    render(
      <LeaderboardStats 
        entries={mockVo2maxEntries}
        metric="vo2max"
        loading={false}
      />
    );

    // Check for highest value (58.5)
    expect(screen.getByText('58.5')).toBeInTheDocument();
    expect(screen.getByText('Highest VO2 Max')).toBeInTheDocument();

    // Check for average (56.9 = (58.5 + 55.2) / 2)
    expect(screen.getByText('56.9')).toBeInTheDocument();
    expect(screen.getByText('Average VO2 Max')).toBeInTheDocument();
  });

  it('displays total data points with proper formatting', () => {
    const entriesWithLargeNumbers: LeaderboardEntry[] = [
      {
        userId: 'user1',
        name: 'Test User',
        profileImage: null,
        value: 50,
        dataPoints: 1500,
        latestDate: '2024-01-15T00:00:00.000Z',
      },
      {
        userId: 'user2',
        name: 'Test User 2',
        profileImage: null,
        value: 55,
        dataPoints: 2800,
        latestDate: '2024-01-14T00:00:00.000Z',
      },
    ];

    render(
      <LeaderboardStats 
        entries={entriesWithLargeNumbers}
        metric="hrv"
        loading={false}
      />
    );

    // Should format large numbers with commas (4,300)
    expect(screen.getByText('4,300')).toBeInTheDocument();
    expect(screen.getByText('Total Readings')).toBeInTheDocument();
  });

  it('returns null when loading is true', () => {
    const { container } = render(
      <LeaderboardStats 
        entries={mockHrvEntries}
        metric="hrv"
        loading={true}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('returns null when entries array is empty', () => {
    const { container } = render(
      <LeaderboardStats 
        entries={[]}
        metric="hrv"
        loading={false}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('returns null when entries is undefined', () => {
    const { container } = render(
      <LeaderboardStats 
        entries={undefined as any}
        metric="hrv"
        loading={false}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('handles single entry correctly', () => {
    const singleEntry: LeaderboardEntry[] = [
      {
        userId: 'user1',
        name: 'Solo User',
        profileImage: null,
        value: 50.0,
        dataPoints: 5,
        latestDate: '2024-01-15T00:00:00.000Z',
      },
    ];

    render(
      <LeaderboardStats 
        entries={singleEntry}
        metric="hrv"
        loading={false}
      />
    );

    expect(screen.getByText('1')).toBeInTheDocument(); // Participants
    expect(screen.getAllByText('50')).toHaveLength(2); // Highest and Average both = 50 (2 instances)
    expect(screen.getByText('5')).toBeInTheDocument(); // Total readings
  });

  it('renders all required statistics sections', () => {
    render(
      <LeaderboardStats 
        entries={mockHrvEntries}
        metric="hrv"
        loading={false}
      />
    );

    expect(screen.getByText('Participants')).toBeInTheDocument();
    expect(screen.getByText('Highest HRV')).toBeInTheDocument();
    expect(screen.getByText('Average HRV')).toBeInTheDocument();
    expect(screen.getByText('Total Readings')).toBeInTheDocument();
  });
});
