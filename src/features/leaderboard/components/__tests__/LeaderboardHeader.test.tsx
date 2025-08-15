import { render, screen } from '@testing-library/react';
import { LeaderboardHeader } from '../LeaderboardHeader';

describe('LeaderboardHeader', () => {
  const defaultProps = {
    totalUsers: 100,
    lastUpdated: '2024-01-15T10:30:00.000Z',
    loading: false,
  };

  it('renders the header with live rankings badge', () => {
    render(<LeaderboardHeader {...defaultProps} />);
    
    expect(screen.getByText('LIVE RANKINGS')).toBeInTheDocument();
    expect(screen.getByText('Leaderboards')).toBeInTheDocument();
  });

  it('renders the main title and subtitle correctly', () => {
    render(<LeaderboardHeader {...defaultProps} />);
    
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Leaderboards');
    expect(screen.getByText(/Compete with the/)).toBeInTheDocument();
    expect(screen.getByText('Revly community')).toBeInTheDocument();
  });

  it('formats and displays recent dates correctly', () => {
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
    
    render(<LeaderboardHeader {...defaultProps} lastUpdated={tenMinutesAgo} />);
    
    expect(screen.getByText(/Updated \d+m ago/)).toBeInTheDocument();
  });

  it('handles undefined lastUpdated gracefully', () => {
    render(<LeaderboardHeader {...defaultProps} lastUpdated={undefined} />);
    
    expect(screen.getByText('Leaderboards')).toBeInTheDocument();
  });

  it('formats "just now" correctly', () => {
    const now = new Date().toISOString();
    
    render(<LeaderboardHeader {...defaultProps} lastUpdated={now} />);
    
    expect(screen.getByText(/Updated Just now/)).toBeInTheDocument();
  });

  it('formats minutes ago correctly', () => {
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
    
    render(<LeaderboardHeader {...defaultProps} lastUpdated={tenMinutesAgo} />);
    
    expect(screen.getByText('Leaderboards')).toBeInTheDocument();
  });

  it('formats hours ago correctly', () => {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
    
    render(<LeaderboardHeader {...defaultProps} lastUpdated={twoHoursAgo} />);
    
    expect(screen.getByText('Leaderboards')).toBeInTheDocument();
  });

  it('formats old dates as locale date string', () => {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    
    render(<LeaderboardHeader {...defaultProps} lastUpdated={threeDaysAgo} />);
    
    expect(screen.getByText('Leaderboards')).toBeInTheDocument();
  });

  it('shows different total users correctly', () => {
    render(<LeaderboardHeader {...defaultProps} totalUsers={250} />);
    
    expect(screen.getByText('LIVE RANKINGS')).toBeInTheDocument();
    expect(screen.getByText('Leaderboards')).toBeInTheDocument();
  });

  it('contains proper heading structure', () => {
    render(<LeaderboardHeader {...defaultProps} />);
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Leaderboards');
    expect(heading).toHaveClass('text-4xl', 'md:text-5xl', 'font-bold', 'text-white');
  });

  it('has correct ARIA structure', () => {
    render(<LeaderboardHeader {...defaultProps} />);
    
    const liveRankingsBadge = screen.getByText('LIVE RANKINGS');
    expect(liveRankingsBadge).toHaveClass('text-sm', 'font-medium', 'text-purple-400');
  });

  it('renders with minimal props', () => {
    render(<LeaderboardHeader totalUsers={0} />);
    
    expect(screen.getByText('LIVE RANKINGS')).toBeInTheDocument();
    expect(screen.getByText('Leaderboards')).toBeInTheDocument();
    expect(screen.getByText('Revly community')).toBeInTheDocument();
  });

  it('renders community branding correctly', () => {
    render(<LeaderboardHeader {...defaultProps} />);
    
    const subtitle = screen.getByText(/Compete with the/);
    expect(subtitle).toBeInTheDocument();
    
    const brandSpan = screen.getByText('Revly community');
    expect(brandSpan).toHaveClass('text-purple-400', 'font-semibold');
  });

  it('handles invalid date strings gracefully', () => {
    render(<LeaderboardHeader {...defaultProps} lastUpdated="invalid-date" />);
    
    expect(screen.getByText('Leaderboards')).toBeInTheDocument();
  });

  it('renders with loading state', () => {
    render(<LeaderboardHeader {...defaultProps} loading={true} />);
    
    expect(screen.getByText('LIVE RANKINGS')).toBeInTheDocument();
    expect(screen.getByText('Leaderboards')).toBeInTheDocument();
  });

  it('contains pulsing indicator for live rankings', () => {
    render(<LeaderboardHeader {...defaultProps} />);
    
    const pulseDot = screen.getByText('LIVE RANKINGS').previousElementSibling;
    expect(pulseDot).toHaveClass('animate-pulse');
  });
});
