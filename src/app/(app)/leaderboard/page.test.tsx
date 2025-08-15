import { render, screen } from '@testing-library/react';
import Page from './page';

// Mock the LeaderboardPage component
jest.mock('@features/leaderboard/components', () => ({
  LeaderboardPage: jest.fn(() => <div data-testid="leaderboard-page-mock">Mocked Leaderboard Page</div>),
}));

describe('Leaderboard Page', () => {
  it('renders without crashing', () => {
    render(<Page />);
  });

  it('renders the LeaderboardPage component', () => {
    render(<Page />);
    
    const leaderboardPage = screen.getByTestId('leaderboard-page-mock');
    expect(leaderboardPage).toBeInTheDocument();
    expect(leaderboardPage).toHaveTextContent('Mocked Leaderboard Page');
  });

  it('exports a default function component', () => {
    expect(typeof Page).toBe('function');
    expect(Page.name).toBe('Page');
  });
});
