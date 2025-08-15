import { render, screen } from '@testing-library/react';
import { LeaderboardTable } from '../LeaderboardTable';
import type { LeaderboardTableProps, LeaderboardEntry } from '../../types';

// Mock the child components
jest.mock('../LeaderboardEntry', () => ({
  LeaderboardEntry: jest.fn(({ entry }) => (
    <div data-testid={`leaderboard-entry-${entry.userId}`}>
      {entry.name} - Rank {entry.rank}
    </div>
  )),
}));

jest.mock('../LoadingState', () => ({
  LoadingState: jest.fn(() => <div data-testid="loading-state">Loading...</div>),
}));

jest.mock('../EmptyState', () => ({
  EmptyState: jest.fn(({ metric, onRefresh }) => (
    <div data-testid="empty-state">
      No {metric} data
      <button onClick={onRefresh}>Refresh</button>
    </div>
  )),
}));

jest.mock('../ErrorState', () => ({
  ErrorState: jest.fn(({ metric, error, onRetry }) => (
    <div data-testid="error-state">
      Error loading {metric}: {error}
      <button onClick={onRetry}>Retry</button>
    </div>
  )),
}));

describe('LeaderboardTable', () => {
  const mockEntries: LeaderboardEntry[] = [
    {
      userId: 'user1',
      name: 'John Doe',
      profileImage: 'profile1.jpg',
      value: 45.5,
      rank: 1,
      dataPoints: 10,
      latestDate: '2024-01-15T00:00:00.000Z',
    },
    {
      userId: 'user2',
      name: 'Jane Smith',
      profileImage: null,
      value: 42.3,
      rank: 2,
      dataPoints: 8,
      latestDate: '2024-01-14T00:00:00.000Z',
    },
    {
      userId: 'user3',
      name: 'Bob Wilson',
      profileImage: undefined,
      value: 48.7,
      rank: 3,
      dataPoints: 12,
      latestDate: '2024-01-13T00:00:00.000Z',
    },
  ];

  const defaultProps: LeaderboardTableProps = {
    data: mockEntries,
    loading: false,
    error: null,
    metric: 'hrv',
    onRetry: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state when loading is true', () => {
    render(
      <LeaderboardTable 
        {...defaultProps}
        loading={true}
      />
    );
    
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders error state when error is present', () => {
    const errorMessage = 'Failed to fetch data';
    render(
      <LeaderboardTable 
        {...defaultProps}
        error={errorMessage}
        loading={false}
      />
    );
    
    expect(screen.getByTestId('error-state')).toBeInTheDocument();
    expect(screen.getByText(/Error loading hrv: Failed to fetch data/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('renders empty state when data is empty array', () => {
    render(
      <LeaderboardTable 
        {...defaultProps}
        data={[]}
        loading={false}
        error={null}
      />
    );
    
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByText('No hrv data')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
  });

  it('renders empty state when data is null', () => {
    render(
      <LeaderboardTable 
        {...defaultProps}
        data={null}
        loading={false}
        error={null}
      />
    );
    
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('renders empty state when data is undefined', () => {
    render(
      <LeaderboardTable 
        {...defaultProps}
        data={undefined}
        loading={false}
        error={null}
      />
    );
    
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('renders leaderboard entries when data is available', () => {
    render(<LeaderboardTable {...defaultProps} />);
    
    expect(screen.getByTestId('leaderboard-entry-user1')).toBeInTheDocument();
    expect(screen.getByTestId('leaderboard-entry-user2')).toBeInTheDocument();
    expect(screen.getByTestId('leaderboard-entry-user3')).toBeInTheDocument();
    
    expect(screen.getByText('John Doe - Rank 1')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith - Rank 2')).toBeInTheDocument();
    expect(screen.getByText('Bob Wilson - Rank 3')).toBeInTheDocument();
  });

  it('passes correct props to LeaderboardEntry components', () => {
    const { LeaderboardEntry } = require('../LeaderboardEntry');
    render(<LeaderboardTable {...defaultProps} />);
    
    expect(LeaderboardEntry).toHaveBeenCalledTimes(3);
    
    // Check first entry props (key is not passed to component, just used by React)
    expect(LeaderboardEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        entry: mockEntries[0],
        metric: 'hrv',
        isTopThree: true,
      }),
      {}
    );

    // Check fourth place would not be top three
    const fourthPlaceEntry = { ...mockEntries[0], rank: 4, userId: 'user4' };
    render(
      <LeaderboardTable 
        {...defaultProps}
        data={[fourthPlaceEntry]}
      />
    );
    
    expect(LeaderboardEntry).toHaveBeenLastCalledWith(
      expect.objectContaining({
        entry: fourthPlaceEntry,
        metric: 'hrv',
        isTopThree: false,
      }),
      {}
    );
  });

  it('prioritizes loading state over error state', () => {
    render(
      <LeaderboardTable 
        {...defaultProps}
        loading={true}
        error="Some error"
      />
    );
    
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    expect(screen.queryByTestId('error-state')).not.toBeInTheDocument();
  });

  it('prioritizes error state over empty state', () => {
    render(
      <LeaderboardTable 
        {...defaultProps}
        loading={false}
        error="Some error"
        data={[]}
      />
    );
    
    expect(screen.getByTestId('error-state')).toBeInTheDocument();
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked in error state', () => {
    const mockOnRetry = jest.fn();
    render(
      <LeaderboardTable 
        {...defaultProps}
        loading={false}
        error="Connection failed"
        onRetry={mockOnRetry}
      />
    );
    
    const retryButton = screen.getByRole('button', { name: 'Retry' });
    retryButton.click();
    
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('calls onRetry when refresh button is clicked in empty state', () => {
    const mockOnRetry = jest.fn();
    render(
      <LeaderboardTable 
        {...defaultProps}
        loading={false}
        error={null}
        data={[]}
        onRetry={mockOnRetry}
      />
    );
    
    const refreshButton = screen.getByRole('button', { name: 'Refresh' });
    refreshButton.click();
    
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('renders with different metrics correctly', () => {
    render(
      <LeaderboardTable 
        {...defaultProps}
        metric="vo2max"
        error="Test error"
      />
    );
    
    expect(screen.getByText(/Error loading vo2max/)).toBeInTheDocument();
  });

  it('has correct container styling', () => {
    const { container } = render(<LeaderboardTable {...defaultProps} />);
    
    const tableContainer = container.firstChild;
    expect(tableContainer).toHaveClass(
      'bg-slate-800',
      'rounded-2xl',
      'shadow-sm',
      'overflow-hidden',
      'border',
      'border-slate-700/50'
    );
  });

  it('renders entries with divider styling', () => {
    const { container } = render(<LeaderboardTable {...defaultProps} />);
    
    const entriesContainer = container.querySelector('.divide-y.divide-slate-700\\/50');
    expect(entriesContainer).toBeInTheDocument();
  });

  it('handles single entry correctly', () => {
    const singleEntry = [mockEntries[0]];
    render(
      <LeaderboardTable 
        {...defaultProps}
        data={singleEntry}
      />
    );
    
    expect(screen.getByTestId('leaderboard-entry-user1')).toBeInTheDocument();
    expect(screen.queryByTestId('leaderboard-entry-user2')).not.toBeInTheDocument();
  });
});
