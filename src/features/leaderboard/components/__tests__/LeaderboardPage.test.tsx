import { render, screen } from '../../../../test-utils';
import { LeaderboardPage } from '../LeaderboardPage';

// Mock the child components and hooks
jest.mock('../LeaderboardHeader', () => ({
  LeaderboardHeader: jest.fn(({ totalUsers, loading }) => (
    <div data-testid="leaderboard-header">
      Header - Users: {totalUsers}, Loading: {loading ? 'yes' : 'no'}
    </div>
  )),
}));

jest.mock('../LeaderboardTabs', () => ({
  LeaderboardTabs: jest.fn(({ activeTab, onTabChange, loading }) => (
    <div data-testid="leaderboard-tabs">
      Tabs - Active: {activeTab}
      <button onClick={() => onTabChange('hrv')}>HRV Tab</button>
      <button onClick={() => onTabChange('vo2max')}>VO2 Tab</button>
      Loading: {JSON.stringify(loading)}
    </div>
  )),
}));



jest.mock('../LeaderboardTable', () => ({
  LeaderboardTable: jest.fn(({ data, loading, error, metric, onRetry }) => (
    <div data-testid="leaderboard-table">
      Table - Metric: {metric}, Data: {data?.length || 0}, Loading: {loading ? 'yes' : 'no'}, Error: {error || 'none'}
      {onRetry && <button onClick={onRetry}>Retry</button>}
    </div>
  )),
}));

jest.mock('../../../../components/ThemeToggle', () => 
  jest.fn(() => <div data-testid="theme-toggle">Theme Toggle</div>)
);

jest.mock('react-hot-toast', () => ({
  Toaster: jest.fn(() => <div data-testid="toaster">Toaster</div>),
}));

// Mock the hooks
const mockUseLeaderboardData = {
  state: {
    hrv: {
      entries: [{ userId: '1', name: 'Test User', value: 45, rank: 1, dataPoints: 10, latestDate: '2024-01-01' }],
      totalUsers: 100,
      lastUpdated: '2024-01-01T12:00:00Z',
      metric: 'hrv',
    },
    vo2max: null,
    loading: { hrv: false, vo2max: false },
    error: { hrv: null, vo2max: null },
  },
  refreshData: jest.fn(),
  clearError: jest.fn(),
};

const mockUseLeaderboardFilters = {
  filters: { metric: 'hrv', timeRange: '30d', minDataPoints: 1 },
  setMetric: jest.fn(),
  setTimeRange: jest.fn(),
  setMinDataPoints: jest.fn(),
  resetFilters: jest.fn(),
};

jest.mock('../../hooks', () => ({
  useLeaderboardData: jest.fn(() => mockUseLeaderboardData),
  useLeaderboardFilters: jest.fn(() => mockUseLeaderboardFilters),
}));

describe('LeaderboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all main components', () => {
    render(<LeaderboardPage />);
    
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('leaderboard-header')).toBeInTheDocument();
    expect(screen.getByTestId('leaderboard-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('leaderboard-table')).toBeInTheDocument();
  });

  it('passes correct props to LeaderboardHeader', () => {
    render(<LeaderboardPage />);
    
    const header = screen.getByTestId('leaderboard-header');
    expect(header).toHaveTextContent('Users: 100');
    expect(header).toHaveTextContent('Loading: no');
  });

  it('passes correct props to LeaderboardTabs', () => {
    render(<LeaderboardPage />);
    
    expect(screen.getByText(/Active: hrv/)).toBeInTheDocument();
    expect(screen.getByText(/Loading: {"hrv":false,"vo2max":false}/)).toBeInTheDocument();
  });



  it('passes correct props to LeaderboardTable', () => {
    render(<LeaderboardPage />);
    
    expect(screen.getByText(/Table - Metric: hrv/)).toBeInTheDocument();
    expect(screen.getByText(/Data: 1/)).toBeInTheDocument();
    expect(screen.getByText(/Error: none/)).toBeInTheDocument();
  });

  it('handles tab change correctly', () => {
    render(<LeaderboardPage />);
    
    const vo2TabButton = screen.getByText('VO2 Tab');
    vo2TabButton.click();
    
    expect(mockUseLeaderboardFilters.setMetric).toHaveBeenCalledWith('vo2max');
  });

  it('renders with loading state', () => {
    const mockLoadingState = {
      ...mockUseLeaderboardData,
      state: {
        ...mockUseLeaderboardData.state,
        loading: { hrv: true, vo2max: false },
      },
    };
    
    const { useLeaderboardData } = require('../../hooks');
    useLeaderboardData.mockReturnValue(mockLoadingState);
    
    render(<LeaderboardPage />);
    
    const header = screen.getByTestId('leaderboard-header');
    expect(header).toHaveTextContent('Loading: yes');
  });

  it('renders with error state', () => {
    const mockErrorState = {
      ...mockUseLeaderboardData,
      state: {
        ...mockUseLeaderboardData.state,
        error: { hrv: 'Connection failed', vo2max: null },
      },
    };
    
    const { useLeaderboardData } = require('../../hooks');
    useLeaderboardData.mockReturnValue(mockErrorState);
    
    render(<LeaderboardPage />);
    
    expect(screen.getByText(/Error: Connection failed/)).toBeInTheDocument();
  });

  it('renders with empty data state', () => {
    const mockEmptyState = {
      ...mockUseLeaderboardData,
      state: {
        ...mockUseLeaderboardData.state,
        hrv: {
          entries: [],
          totalUsers: 0,
          lastUpdated: '2024-01-01T12:00:00Z',
          metric: 'hrv',
        },
      },
    };
    
    const { useLeaderboardData } = require('../../hooks');
    useLeaderboardData.mockReturnValue(mockEmptyState);
    
    render(<LeaderboardPage />);
    
    expect(screen.getByText(/Data: 0/)).toBeInTheDocument();
    expect(screen.getByText(/Users: 0/)).toBeInTheDocument();
  });

  it('renders with vo2max active tab', () => {
    const mockVo2maxFilters = {
      ...mockUseLeaderboardFilters,
      filters: { metric: 'vo2max', timeRange: '30d', minDataPoints: 1 },
    };

    const mockVo2maxState = {
      ...mockUseLeaderboardData,
      state: {
        hrv: null,
        vo2max: {
          entries: [{ userId: '2', name: 'VO2 User', value: 55, rank: 1, dataPoints: 15, latestDate: '2024-01-01' }],
          totalUsers: 50,
          lastUpdated: '2024-01-01T12:00:00Z',
          metric: 'vo2max',
        },
        loading: { hrv: false, vo2max: false },
        error: { hrv: null, vo2max: null },
      },
    };
    
    const { useLeaderboardFilters, useLeaderboardData } = require('../../hooks');
    useLeaderboardFilters.mockReturnValue(mockVo2maxFilters);
    useLeaderboardData.mockReturnValue(mockVo2maxState);
    
    render(<LeaderboardPage />);
    
    expect(screen.getByText(/Active: vo2max/)).toBeInTheDocument();
    expect(screen.getByText(/Users: 50/)).toBeInTheDocument();
  });

  it('handles retry functionality', () => {
    const mockWithRetry = {
      ...mockUseLeaderboardData,
      state: {
        hrv: {
          entries: [],
          totalUsers: 0,
          lastUpdated: '2024-01-01T12:00:00Z',
          metric: 'hrv',
        },
        vo2max: null,
        loading: { hrv: false, vo2max: false },
        error: { hrv: 'Network error', vo2max: null },
      },
    };
    
    const mockWithRetryFilters = {
      ...mockUseLeaderboardFilters,
      filters: { metric: 'hrv', timeRange: '30d', minDataPoints: 1 },
    };
    
    const { useLeaderboardData, useLeaderboardFilters } = require('../../hooks');
    useLeaderboardData.mockReturnValue(mockWithRetry);
    useLeaderboardFilters.mockReturnValue(mockWithRetryFilters);
    
    render(<LeaderboardPage />);
    
    const retryButton = screen.getByText('Retry');
    retryButton.click();
    
    expect(mockUseLeaderboardData.refreshData).toHaveBeenCalledWith('hrv');
  });
});
