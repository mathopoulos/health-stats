import { render, screen, fireEvent } from '@testing-library/react';
import { LeaderboardTabs } from '../LeaderboardTabs';

describe('LeaderboardTabs', () => {
  const defaultProps = {
    activeTab: 'hrv' as const,
    onTabChange: jest.fn(),
    loading: { hrv: false, vo2max: false },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders both HRV and VO2 Max tabs', () => {
    render(<LeaderboardTabs {...defaultProps} />);
    
    expect(screen.getByRole('button', { name: /HRV/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /VO2 Max/i })).toBeInTheDocument();
  });

  it('highlights the active tab correctly', () => {
    render(<LeaderboardTabs {...defaultProps} activeTab="hrv" />);
    
    const hrvTab = screen.getByRole('button', { name: /HRV/i });
    const vo2maxTab = screen.getByRole('button', { name: /VO2 Max/i });
    
    expect(hrvTab).toHaveClass('bg-gradient-to-r', 'from-purple-500', 'to-purple-600');
    expect(vo2maxTab).toHaveClass('text-gray-400');
  });

  it('highlights VO2 Max tab when active', () => {
    render(<LeaderboardTabs {...defaultProps} activeTab="vo2max" />);
    
    const hrvTab = screen.getByRole('button', { name: /HRV/i });
    const vo2maxTab = screen.getByRole('button', { name: /VO2 Max/i });
    
    expect(hrvTab).toHaveClass('text-gray-400');
    expect(vo2maxTab).toHaveClass('bg-gradient-to-r', 'from-purple-500', 'to-purple-600');
  });

  it('calls onTabChange when HRV tab is clicked', () => {
    const mockOnTabChange = jest.fn();
    render(
      <LeaderboardTabs 
        {...defaultProps} 
        activeTab="vo2max"
        onTabChange={mockOnTabChange} 
      />
    );
    
    const hrvTab = screen.getByRole('button', { name: /HRV/i });
    fireEvent.click(hrvTab);
    
    expect(mockOnTabChange).toHaveBeenCalledWith('hrv');
    expect(mockOnTabChange).toHaveBeenCalledTimes(1);
  });

  it('calls onTabChange when VO2 Max tab is clicked', () => {
    const mockOnTabChange = jest.fn();
    render(
      <LeaderboardTabs 
        {...defaultProps} 
        activeTab="hrv"
        onTabChange={mockOnTabChange} 
      />
    );
    
    const vo2maxTab = screen.getByRole('button', { name: /VO2 Max/i });
    fireEvent.click(vo2maxTab);
    
    expect(mockOnTabChange).toHaveBeenCalledWith('vo2max');
    expect(mockOnTabChange).toHaveBeenCalledTimes(1);
  });

  it('shows loading spinner when HRV tab is loading', () => {
    render(
      <LeaderboardTabs 
        {...defaultProps}
        loading={{ hrv: true, vo2max: false }}
      />
    );
    
    const hrvTab = screen.getByRole('button', { name: /HRV/i });
    const spinner = hrvTab.querySelector('.animate-spin');
    
    expect(spinner).toBeInTheDocument();
    expect(hrvTab).toHaveClass('cursor-not-allowed', 'opacity-75');
    expect(hrvTab).toBeDisabled();
  });

  it('shows loading spinner when VO2 Max tab is loading', () => {
    render(
      <LeaderboardTabs 
        {...defaultProps}
        loading={{ hrv: false, vo2max: true }}
      />
    );
    
    const vo2maxTab = screen.getByRole('button', { name: /VO2 Max/i });
    const spinner = vo2maxTab.querySelector('.animate-spin');
    
    expect(spinner).toBeInTheDocument();
    expect(vo2maxTab).toHaveClass('cursor-not-allowed', 'opacity-75');
    expect(vo2maxTab).toBeDisabled();
  });

  it('shows loading spinner for both tabs when both are loading', () => {
    render(
      <LeaderboardTabs 
        {...defaultProps}
        loading={{ hrv: true, vo2max: true }}
      />
    );
    
    const hrvTab = screen.getByRole('button', { name: /HRV/i });
    const vo2maxTab = screen.getByRole('button', { name: /VO2 Max/i });
    
    expect(hrvTab.querySelector('.animate-spin')).toBeInTheDocument();
    expect(vo2maxTab.querySelector('.animate-spin')).toBeInTheDocument();
    
    expect(hrvTab).toBeDisabled();
    expect(vo2maxTab).toBeDisabled();
  });

  it('does not call onTabChange when disabled tab is clicked', () => {
    const mockOnTabChange = jest.fn();
    render(
      <LeaderboardTabs 
        {...defaultProps}
        onTabChange={mockOnTabChange}
        loading={{ hrv: true, vo2max: false }}
      />
    );
    
    const hrvTab = screen.getByRole('button', { name: /HRV/i });
    fireEvent.click(hrvTab);
    
    expect(mockOnTabChange).not.toHaveBeenCalled();
  });

  it('has proper accessibility attributes', () => {
    render(<LeaderboardTabs {...defaultProps} />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Leaderboard tabs');
    
    const hrvButton = screen.getByRole('button', { name: /HRV/i });
    const vo2maxButton = screen.getByRole('button', { name: /VO2 Max/i });
    
    expect(hrvButton).toHaveAttribute('type', 'button');
    expect(vo2maxButton).toHaveAttribute('type', 'button');
  });

  it('applies correct border radius classes', () => {
    render(<LeaderboardTabs {...defaultProps} />);
    
    const hrvTab = screen.getByRole('button', { name: /HRV/i });
    const vo2maxTab = screen.getByRole('button', { name: /VO2 Max/i });
    
    expect(hrvTab).toHaveClass('rounded-l-2xl');
    expect(vo2maxTab).toHaveClass('rounded-r-2xl');
  });

  it('shows icons when not loading', () => {
    render(
      <LeaderboardTabs 
        {...defaultProps}
        loading={{ hrv: false, vo2max: false }}
      />
    );
    
    const hrvTab = screen.getByRole('button', { name: /HRV/i });
    const vo2maxTab = screen.getByRole('button', { name: /VO2 Max/i });
    
    // Check that SVG icons are present (not spinners)
    expect(hrvTab.querySelector('svg')).toBeInTheDocument();
    expect(vo2maxTab.querySelector('svg')).toBeInTheDocument();
    
    // Ensure they're not loading spinners
    expect(hrvTab.querySelector('.animate-spin')).not.toBeInTheDocument();
    expect(vo2maxTab.querySelector('.animate-spin')).not.toBeInTheDocument();
  });
});
