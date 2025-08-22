import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { signOut } from 'next-auth/react';
import DesktopNavigation from '../DesktopNavigation';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
}));
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;

// Mock Next.js components
jest.mock('next/link', () => {
  return function MockLink({ href, children, className, ...props }: any) {
    return (
      <a href={href} className={className} {...props} data-testid="link">
        {children}
      </a>
    );
  };
});

jest.mock('next/image', () => {
  return function MockImage({ src, alt, width, height, className }: any) {
    return (
      <img 
        src={src} 
        alt={alt} 
        width={width} 
        height={height} 
        className={className}
        data-testid="profile-image"
      />
    );
  };
});

// Mock ThemeToggle
jest.mock('@components/ThemeToggle', () => {
  return function MockThemeToggle() {
    return <div data-testid="theme-toggle">Theme Toggle</div>;
  };
});

describe('DesktopNavigation', () => {
  const defaultProps = {
    activeTab: 'profile',
    onTabChange: jest.fn(),
    session: {
      user: { id: 'user-123', name: 'Test User' }
    },
    profileImage: null,
    name: 'Test User'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render all navigation elements', () => {
      render(<DesktopNavigation {...defaultProps} />);
      
      expect(screen.getByText('revly')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Protocols & Experiments')).toBeInTheDocument();
      expect(screen.getByText('Fitness Metrics')).toBeInTheDocument();
      expect(screen.getByText('Blood Markers')).toBeInTheDocument();
      expect(screen.getByText('View Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Sign out')).toBeInTheDocument();
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });

    it('should render with proper CSS classes for desktop visibility', () => {
      const { container } = render(<DesktopNavigation {...defaultProps} />);
      
      const navigationContainer = container.firstChild as HTMLElement;
      expect(navigationContainer).toHaveClass('hidden', 'md:block');
    });

    it('should render home link with correct href', () => {
      render(<DesktopNavigation {...defaultProps} />);
      
      const homeLink = screen.getAllByTestId('link').find(link => 
        link.getAttribute('href') === '/'
      );
      expect(homeLink).toBeInTheDocument();
    });
  });

  describe('Active Tab States', () => {
    it('should highlight profile tab when active', () => {
      render(<DesktopNavigation {...defaultProps} activeTab="profile" />);
      
      const profileButton = screen.getByText('Profile').closest('button');
      expect(profileButton).toHaveClass('bg-indigo-50', 'text-indigo-600');
    });

    it('should highlight protocols tab when active', () => {
      render(<DesktopNavigation {...defaultProps} activeTab="protocols" />);
      
      const protocolsButton = screen.getByText('Protocols & Experiments').closest('button');
      expect(protocolsButton).toHaveClass('bg-indigo-50', 'text-indigo-600');
    });

    it('should highlight fitness tab when active', () => {
      render(<DesktopNavigation {...defaultProps} activeTab="fitness" />);
      
      const fitnessButton = screen.getByText('Fitness Metrics').closest('button');
      expect(fitnessButton).toHaveClass('bg-indigo-50', 'text-indigo-600');
    });

    it('should highlight blood tab when active', () => {
      render(<DesktopNavigation {...defaultProps} activeTab="blood" />);
      
      const bloodButton = screen.getByText('Blood Markers').closest('button');
      expect(bloodButton).toHaveClass('bg-indigo-50', 'text-indigo-600');
    });

    it('should show inactive state for non-active tabs', () => {
      render(<DesktopNavigation {...defaultProps} activeTab="profile" />);
      
      const fitnessButton = screen.getByText('Fitness Metrics').closest('button');
      expect(fitnessButton).toHaveClass('text-gray-600');
      expect(fitnessButton).not.toHaveClass('bg-indigo-50');
    });
  });

  describe('Tab Navigation', () => {
    it('should call onTabChange when profile tab is clicked', () => {
      const onTabChange = jest.fn();
      render(<DesktopNavigation {...defaultProps} onTabChange={onTabChange} />);
      
      fireEvent.click(screen.getByText('Profile'));
      expect(onTabChange).toHaveBeenCalledWith('profile');
    });

    it('should call onTabChange when protocols tab is clicked', () => {
      const onTabChange = jest.fn();
      render(<DesktopNavigation {...defaultProps} onTabChange={onTabChange} />);
      
      fireEvent.click(screen.getByText('Protocols & Experiments'));
      expect(onTabChange).toHaveBeenCalledWith('protocols');
    });

    it('should call onTabChange when fitness tab is clicked', () => {
      const onTabChange = jest.fn();
      render(<DesktopNavigation {...defaultProps} onTabChange={onTabChange} />);
      
      fireEvent.click(screen.getByText('Fitness Metrics'));
      expect(onTabChange).toHaveBeenCalledWith('fitness');
    });

    it('should call onTabChange when blood tab is clicked', () => {
      const onTabChange = jest.fn();
      render(<DesktopNavigation {...defaultProps} onTabChange={onTabChange} />);
      
      fireEvent.click(screen.getByText('Blood Markers'));
      expect(onTabChange).toHaveBeenCalledWith('blood');
    });

    it('should handle multiple tab clicks correctly', () => {
      const onTabChange = jest.fn();
      render(<DesktopNavigation {...defaultProps} onTabChange={onTabChange} />);
      
      fireEvent.click(screen.getByText('Profile'));
      fireEvent.click(screen.getByText('Blood Markers'));
      
      expect(onTabChange).toHaveBeenCalledTimes(2);
      expect(onTabChange).toHaveBeenNthCalledWith(1, 'profile');
      expect(onTabChange).toHaveBeenNthCalledWith(2, 'blood');
    });
  });

  describe('User Profile Display', () => {
    it('should display user name', () => {
      render(<DesktopNavigation {...defaultProps} name="John Doe" />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should display profile image when provided', () => {
      render(
        <DesktopNavigation 
          {...defaultProps} 
          profileImage="https://example.com/avatar.jpg"
        />
      );
      
      const profileImage = screen.getByTestId('profile-image');
      expect(profileImage).toHaveAttribute('src', 'https://example.com/avatar.jpg');
      expect(profileImage).toHaveAttribute('alt', 'Profile');
    });

    it('should display user initial when no profile image is provided', () => {
      render(
        <DesktopNavigation 
          {...defaultProps} 
          name="John Doe"
          profileImage={null}
        />
      );
      
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('should display default placeholder when no name is provided', () => {
      render(
        <DesktopNavigation 
          {...defaultProps} 
          name=""
        />
      );
      
      expect(screen.getByText('Anonymous User')).toBeInTheDocument();
      expect(screen.getByText('?')).toBeInTheDocument();
    });

    it('should handle undefined name gracefully', () => {
      render(
        <DesktopNavigation 
          {...defaultProps} 
          name={undefined}
        />
      );
      
      expect(screen.getByText('Anonymous User')).toBeInTheDocument();
      expect(screen.getByText('?')).toBeInTheDocument();
    });

    it('should display first letter uppercase for name initial', () => {
      render(
        <DesktopNavigation 
          {...defaultProps} 
          name="alice smith"
          profileImage={null}
        />
      );
      
      expect(screen.getByText('A')).toBeInTheDocument();
    });
  });

  describe('Dashboard Link', () => {
    it('should render dashboard link when user has ID', () => {
      render(
        <DesktopNavigation 
          {...defaultProps} 
          session={{ user: { id: 'user-123' } }}
        />
      );
      
      const dashboardLink = screen.getAllByTestId('link').find(link =>
        link.getAttribute('href') === '/dashboard/userId=user-123'
      );
      expect(dashboardLink).toBeInTheDocument();
      expect(screen.getByText('View Dashboard')).toBeInTheDocument();
    });

    it('should not render dashboard link when user has no ID', () => {
      render(
        <DesktopNavigation 
          {...defaultProps} 
          session={{ user: {} }}
        />
      );
      
      const dashboardLinks = screen.getAllByTestId('link').filter(link =>
        link.getAttribute('href')?.includes('/dashboard')
      );
      expect(dashboardLinks).toHaveLength(0);
    });

    it('should not render dashboard link when session is null', () => {
      render(
        <DesktopNavigation 
          {...defaultProps} 
          session={null}
        />
      );
      
      const dashboardLinks = screen.getAllByTestId('link').filter(link =>
        link.getAttribute('href')?.includes('/dashboard')
      );
      expect(dashboardLinks).toHaveLength(0);
    });

    it('should not render dashboard link when session user is null', () => {
      render(
        <DesktopNavigation 
          {...defaultProps} 
          session={{ user: null }}
        />
      );
      
      const dashboardLinks = screen.getAllByTestId('link').filter(link =>
        link.getAttribute('href')?.includes('/dashboard')
      );
      expect(dashboardLinks).toHaveLength(0);
    });
  });

  describe('Sign Out Functionality', () => {
    it('should call signOut when sign out button is clicked', () => {
      render(<DesktopNavigation {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Sign out'));
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });

    it('should render sign out button with proper styling', () => {
      render(<DesktopNavigation {...defaultProps} />);
      
      const signOutButton = screen.getByText('Sign out');
      expect(signOutButton).toHaveClass('text-xs', 'text-gray-500');
    });
  });

  describe('Theme Integration', () => {
    it('should render theme toggle component', () => {
      render(<DesktopNavigation {...defaultProps} />);
      
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles for navigation', () => {
      render(<DesktopNavigation {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      // Check that main navigation buttons exist
      expect(screen.getByRole('button', { name: /profile/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /protocols/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /fitness/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /blood/i })).toBeInTheDocument();
    });

    it('should have proper alt text for profile image', () => {
      render(
        <DesktopNavigation 
          {...defaultProps} 
          profileImage="https://example.com/avatar.jpg"
        />
      );
      
      const profileImage = screen.getByTestId('profile-image');
      expect(profileImage).toHaveAttribute('alt', 'Profile');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing session gracefully', () => {
      render(
        <DesktopNavigation 
          {...defaultProps} 
          session={undefined}
        />
      );
      
      expect(screen.getByText('revly')).toBeInTheDocument();
      expect(screen.getByText('Sign out')).toBeInTheDocument();
    });

    it('should handle empty session object', () => {
      render(
        <DesktopNavigation 
          {...defaultProps} 
          session={{}}
        />
      );
      
      expect(screen.getByText('revly')).toBeInTheDocument();
      expect(screen.queryByText('View Dashboard')).not.toBeInTheDocument();
    });

    it('should handle null profileImage explicitly', () => {
      render(
        <DesktopNavigation 
          {...defaultProps} 
          profileImage={null}
          name="Test User"
        />
      );
      
      expect(screen.queryByTestId('profile-image')).not.toBeInTheDocument();
      expect(screen.getByText('T')).toBeInTheDocument();
    });

    it('should handle empty string profileImage', () => {
      render(
        <DesktopNavigation 
          {...defaultProps} 
          profileImage=""
          name="Test User"
        />
      );
      
      // Empty string is falsy, so should show initial
      expect(screen.getByText('T')).toBeInTheDocument();
    });
  });

  describe('Interactive States', () => {
    it('should apply hover styles to navigation buttons', () => {
      render(<DesktopNavigation {...defaultProps} activeTab="blood" />);
      
      const profileButton = screen.getByText('Profile').closest('button');
      expect(profileButton).toHaveClass('hover:bg-gray-50');
    });

    it('should have interactive navigation elements', () => {
      render(<DesktopNavigation {...defaultProps} />);
      
      const profileButton = screen.getByText('Profile').closest('button');
      expect(profileButton).toBeEnabled();
      expect(profileButton?.tagName).toBe('BUTTON');
    });
  });
});
