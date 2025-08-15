import { render, screen, fireEvent } from '@testing-library/react';
import { LeaderboardEntry } from '../LeaderboardEntry';
import type { LeaderboardEntryProps } from '../../types';

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, onError, ...props }: any) {
    return (
      <img 
        src={src} 
        alt={alt} 
        onError={onError}
        {...props} 
      />
    );
  };
});

describe('LeaderboardEntry', () => {
  const mockEntry = {
    userId: 'user1',
    name: 'John Doe',
    profileImage: 'https://example.com/profile.jpg',
    value: 45.5,
    rank: 1,
    dataPoints: 10,
    latestDate: '2024-01-15T10:30:00.000Z',
  };

  const defaultProps: LeaderboardEntryProps = {
    entry: mockEntry,
    metric: 'hrv',
    isTopThree: true,
  };

  it('renders user name and rank correctly', () => {
    render(<LeaderboardEntry {...defaultProps} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('1st')).toBeInTheDocument();
  });

  it('displays profile image when provided', () => {
    render(<LeaderboardEntry {...defaultProps} />);
    
    const profileImage = screen.getByAltText("John Doe's profile");
    expect(profileImage).toBeInTheDocument();
    expect(profileImage).toHaveAttribute('src', 'https://example.com/profile.jpg');
  });

  it('displays fallback avatar when no profile image', () => {
    const entryWithoutImage = { ...mockEntry, profileImage: null };
    render(
      <LeaderboardEntry 
        {...defaultProps} 
        entry={entryWithoutImage}
      />
    );
    
    expect(screen.queryByAltText("John Doe's profile")).not.toBeInTheDocument();
    // Should render SVG fallback - check for the SVG path that represents user icon
    const userIconPath = screen.getByText('John Doe').closest('.p-5')?.querySelector('svg path[d*="M16 7a4 4 0 11-8 0"]');
    expect(userIconPath).toBeInTheDocument();
  });

  it('handles image error correctly', () => {
    render(<LeaderboardEntry {...defaultProps} />);
    
    const profileImage = screen.getByAltText("John Doe's profile");
    
    // Simulate image error
    fireEvent.error(profileImage);
    
    expect(profileImage).toHaveStyle({ display: 'none' });
  });

  it('displays data points correctly', () => {
    render(<LeaderboardEntry {...defaultProps} />);
    
    expect(screen.getByText('10 readings')).toBeInTheDocument();
  });

  it('formats metric value correctly for HRV', () => {
    render(<LeaderboardEntry {...defaultProps} />);
    
    expect(screen.getByText('45.5')).toBeInTheDocument();
    expect(screen.getByText('ms')).toBeInTheDocument();
  });

  it('formats metric value correctly for VO2 Max', () => {
    const vo2maxEntry = { ...mockEntry, value: 58.5 };
    render(
      <LeaderboardEntry 
        {...defaultProps} 
        entry={vo2maxEntry}
        metric="vo2max"
      />
    );
    
    expect(screen.getByText('58.5')).toBeInTheDocument();
    expect(screen.getByText('ml/kg/min')).toBeInTheDocument();
  });

  it('formats recent dates correctly', () => {
    const today = new Date();
    const todayEntry = { 
      ...mockEntry, 
      latestDate: today.toISOString()
    };
    
    render(
      <LeaderboardEntry 
        {...defaultProps} 
        entry={todayEntry}
      />
    );
    
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('formats yesterday dates correctly', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayEntry = { 
      ...mockEntry, 
      latestDate: yesterday.toISOString()
    };
    
    render(
      <LeaderboardEntry 
        {...defaultProps} 
        entry={yesterdayEntry}
      />
    );
    
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
  });

  it('formats days ago correctly', () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const pastEntry = { 
      ...mockEntry, 
      latestDate: threeDaysAgo.toISOString()
    };
    
    render(
      <LeaderboardEntry 
        {...defaultProps} 
        entry={pastEntry}
      />
    );
    
    expect(screen.getByText('3 days ago')).toBeInTheDocument();
  });

  it('formats old dates as locale date string', () => {
    const oldDate = new Date('2023-12-01');
    const oldEntry = { 
      ...mockEntry, 
      latestDate: oldDate.toISOString()
    };
    
    render(
      <LeaderboardEntry 
        {...defaultProps} 
        entry={oldEntry}
      />
    );
    
    // Should show formatted date (exact format may vary by locale)
    const dateText = screen.getByText(/12\/1\/2023|1\/12\/2023|2023/);
    expect(dateText).toBeInTheDocument();
  });

  it('displays different ranks correctly', () => {
    const secondPlaceEntry = { ...mockEntry, rank: 2 };
    render(
      <LeaderboardEntry 
        {...defaultProps} 
        entry={secondPlaceEntry}
      />
    );
    
    expect(screen.getByText('2nd')).toBeInTheDocument();
  });

  it('displays higher ranks correctly', () => {
    const tenthPlaceEntry = { ...mockEntry, rank: 10 };
    render(
      <LeaderboardEntry 
        {...defaultProps} 
        entry={tenthPlaceEntry}
        isTopThree={false}
      />
    );
    
    expect(screen.getByText('10th')).toBeInTheDocument();
  });

  it('truncates long names properly', () => {
    const longNameEntry = { 
      ...mockEntry, 
      name: 'This Is A Very Long Name That Should Be Truncated'
    };
    
    render(
      <LeaderboardEntry 
        {...defaultProps} 
        entry={longNameEntry}
      />
    );
    
    const nameElement = screen.getByText('This Is A Very Long Name That Should Be Truncated');
    expect(nameElement).toHaveClass('truncate');
  });

  it('handles missing profile image gracefully', () => {
    const entryWithUndefinedImage = { ...mockEntry, profileImage: undefined };
    render(
      <LeaderboardEntry 
        {...defaultProps} 
        entry={entryWithUndefinedImage}
      />
    );
    
    // Should render without crashing and show fallback
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    const avatarContainer = screen.getByText('John Doe').closest('.min-w-0')?.previousElementSibling;
    expect(avatarContainer).toBeInTheDocument();
  });

  it('applies hover effects correctly', () => {
    const { container } = render(<LeaderboardEntry {...defaultProps} />);
    
    const entryContainer = container.firstChild;
    expect(entryContainer).toHaveClass('hover:bg-slate-700/30');
  });
});
