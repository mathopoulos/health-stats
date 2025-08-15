import { render, screen } from '@testing-library/react';
import { LeaderboardHeader } from '../LeaderboardHeader';

describe('LeaderboardHeader', () => {
  it('renders the header with live rankings badge', () => {
    render(<LeaderboardHeader />);
    
    expect(screen.getByText('LIVE RANKINGS')).toBeInTheDocument();
    expect(screen.getByText('Leaderboards')).toBeInTheDocument();
  });

  it('renders the main title and subtitle correctly', () => {
    render(<LeaderboardHeader />);
    
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Leaderboards');
    expect(screen.getByText(/Compete with the/)).toBeInTheDocument();
    expect(screen.getByText('Revly community')).toBeInTheDocument();
  });

  it('contains proper heading structure', () => {
    render(<LeaderboardHeader />);
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Leaderboards');
    expect(heading).toHaveClass('text-4xl', 'md:text-5xl', 'font-bold', 'text-white');
  });

  it('has correct ARIA structure', () => {
    render(<LeaderboardHeader />);
    
    const liveRankingsBadge = screen.getByText('LIVE RANKINGS');
    expect(liveRankingsBadge).toHaveClass('text-sm', 'font-medium', 'text-purple-400');
  });

  it('renders community branding correctly', () => {
    render(<LeaderboardHeader />);
    
    const subtitle = screen.getByText(/Compete with the/);
    expect(subtitle).toBeInTheDocument();
    
    const brandSpan = screen.getByText('Revly community');
    expect(brandSpan).toHaveClass('text-purple-400', 'font-semibold');
  });

  it('contains pulsing indicator for live rankings', () => {
    render(<LeaderboardHeader />);
    
    const pulseDot = screen.getByText('LIVE RANKINGS').previousElementSibling;
    expect(pulseDot).toHaveClass('animate-pulse');
  });
});
