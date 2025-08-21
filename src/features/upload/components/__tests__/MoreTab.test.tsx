import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useSession, signOut } from 'next-auth/react';
import MoreTab from '../MoreTab';

// Mock dependencies
jest.mock('next-auth/react');
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

// Mock ThemeToggle component
jest.mock('@components/ThemeToggle', () => {
  return function MockThemeToggle() {
    return <div data-testid="theme-toggle">Theme Toggle</div>;
  };
});

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;

describe('MoreTab', () => {
  const defaultProps = {
    profileImage: null,
    name: 'John Doe',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      status: 'authenticated',
      update: jest.fn(),
    });
  });

  describe('Component Structure', () => {
    it('renders the settings heading', () => {
      render(<MoreTab {...defaultProps} />);
      
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('renders all main sections', () => {
      render(<MoreTab {...defaultProps} />);
      
      // User profile section
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      
      // Theme toggle section
      expect(screen.getByText('Dark Mode')).toBeInTheDocument();
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
      
      // Sign out section
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
      
      // About section
      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.getByText(/Health Stats App v1\.0\.0/)).toBeInTheDocument();
    });

    it('has responsive heading that hides on mobile', () => {
      render(<MoreTab {...defaultProps} />);
      
      const heading = screen.getByText('Settings');
      expect(heading).toHaveClass('hidden', 'md:block');
    });

    it('has about section that only shows on desktop', () => {
      render(<MoreTab {...defaultProps} />);
      
      const aboutSection = screen.getByText('About').closest('.hidden');
      expect(aboutSection).toHaveClass('hidden', 'md:block');
    });
  });

  describe('User Profile Section', () => {
    it('displays user name and email', () => {
      render(<MoreTab {...defaultProps} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('displays anonymous user when no name provided', () => {
      render(<MoreTab {...defaultProps} name="" />);
      
      expect(screen.getByText('Anonymous User')).toBeInTheDocument();
    });

    it('shows profile image when provided', () => {
      render(<MoreTab {...defaultProps} profileImage="https://example.com/image.jpg" />);
      
      const profileImage = screen.getByAltText('Profile');
      expect(profileImage).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('shows user initials when no profile image', () => {
      render(<MoreTab {...defaultProps} />);
      
      expect(screen.getByText('J')).toBeInTheDocument(); // First letter of John
    });

    it('shows question mark when no name and no image', () => {
      render(<MoreTab {...defaultProps} name="" />);
      
      expect(screen.getByText('?')).toBeInTheDocument();
    });

    it('handles missing session email gracefully', () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'test-user-id' } },
        status: 'authenticated',
        update: jest.fn(),
      });

      render(<MoreTab {...defaultProps} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      // Should not crash when email is undefined
    });
  });

  describe('Theme Toggle Section', () => {
    it('renders dark mode label and toggle', () => {
      render(<MoreTab {...defaultProps} />);
      
      expect(screen.getByText('Dark Mode')).toBeInTheDocument();
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });

    it('has proper layout for theme toggle section', () => {
      render(<MoreTab {...defaultProps} />);
      
      // Find the parent container that has the justify-between class
      const darkModeSection = screen.getByText('Dark Mode').closest('.py-3');
      expect(darkModeSection).toHaveClass('flex', 'items-center', 'justify-between', 'py-3');
    });

    it('renders dark mode icon', () => {
      render(<MoreTab {...defaultProps} />);
      
      // Check for the moon icon (dark mode icon)
      const moonIcon = document.querySelector('svg path[d*="M20.354 15.354A9 9 0 018.646 3.646"]');
      expect(moonIcon).toBeInTheDocument();
    });
  });

  describe('Sign Out Functionality', () => {
    it('renders sign out button', () => {
      render(<MoreTab {...defaultProps} />);
      
      const signOutButton = screen.getByRole('button', { name: /Sign Out/i });
      expect(signOutButton).toBeInTheDocument();
    });

    it('calls signOut when button is clicked', () => {
      render(<MoreTab {...defaultProps} />);
      
      const signOutButton = screen.getByRole('button', { name: /Sign Out/i });
      fireEvent.click(signOutButton);
      
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });

    it('has proper styling for sign out button', () => {
      render(<MoreTab {...defaultProps} />);
      
      const signOutButton = screen.getByRole('button', { name: /Sign Out/i });
      expect(signOutButton).toHaveClass('w-full', 'flex', 'items-center', 'justify-between');
      expect(signOutButton).toHaveClass('text-red-600', 'dark:text-red-400');
    });

    it('renders sign out icon', () => {
      render(<MoreTab {...defaultProps} />);
      
      // Check for the sign out icon
      const signOutIcon = document.querySelector('svg path[d*="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"]');
      expect(signOutIcon).toBeInTheDocument();
    });

    it('renders arrow icon', () => {
      render(<MoreTab {...defaultProps} />);
      
      // Check for the arrow icon
      const arrowIcon = document.querySelector('svg path[d*="M9 5l7 7-7 7"]');
      expect(arrowIcon).toBeInTheDocument();
    });
  });

  describe('About Section', () => {
    it('displays app version and description', () => {
      render(<MoreTab {...defaultProps} />);
      
      expect(screen.getByText(/Health Stats App v1\.0\.0/)).toBeInTheDocument();
      expect(screen.getByText(/Track and monitor your health metrics in one place\./)).toBeInTheDocument();
    });

    it('has proper heading hierarchy', () => {
      render(<MoreTab {...defaultProps} />);
      
      const aboutHeading = screen.getByRole('heading', { name: 'About' });
      expect(aboutHeading.tagName).toBe('H3');
    });
  });

  describe('Layout and Styling', () => {
    it('has proper main container structure', () => {
      const { container } = render(<MoreTab {...defaultProps} />);
      
      const mainContainer = container.firstChild;
      expect(mainContainer).toHaveClass('space-y-6');
    });

    it('renders sections with proper card styling', () => {
      render(<MoreTab {...defaultProps} />);
      
      // Check that main content sections have proper card styling
      const cardSections = document.querySelectorAll('.bg-white, .dark\\:bg-gray-800');
      expect(cardSections.length).toBeGreaterThan(0);
    });

    it('has proper spacing between sections', () => {
      render(<MoreTab {...defaultProps} />);
      
      const profileSection = screen.getByText('John Doe').closest('.p-6');
      expect(profileSection).toHaveClass('space-y-6');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<MoreTab {...defaultProps} />);
      
      // Main heading should be h2
      const mainHeading = screen.getByRole('heading', { name: 'Settings' });
      expect(mainHeading.tagName).toBe('H2');
      
      // About heading should be h3
      const aboutHeading = screen.getByRole('heading', { name: 'About' });
      expect(aboutHeading.tagName).toBe('H3');
    });

    it('has properly labeled sign out button', () => {
      render(<MoreTab {...defaultProps} />);
      
      const signOutButton = screen.getByRole('button', { name: /Sign Out/i });
      expect(signOutButton).toBeInTheDocument();
    });

    it('has proper image alt text', () => {
      render(<MoreTab {...defaultProps} profileImage="https://example.com/image.jpg" />);
      
      const profileImage = screen.getByAltText('Profile');
      expect(profileImage).toBeInTheDocument();
    });

    it('maintains focus management', () => {
      render(<MoreTab {...defaultProps} />);
      
      const signOutButton = screen.getByRole('button', { name: /Sign Out/i });
      signOutButton.focus();
      expect(document.activeElement).toBe(signOutButton);
    });
  });

  describe('Component Props', () => {
    it('accepts profileImage prop correctly', () => {
      const imageUrl = 'https://example.com/test-image.jpg';
      render(<MoreTab {...defaultProps} profileImage={imageUrl} />);
      
      const profileImage = screen.getByAltText('Profile');
      expect(profileImage).toHaveAttribute('src', imageUrl);
    });

    it('accepts name prop correctly', () => {
      render(<MoreTab {...defaultProps} name="Jane Smith" />);
      
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('J')).toBeInTheDocument(); // Initial
    });

    it('handles null profileImage gracefully', () => {
      render(<MoreTab {...defaultProps} profileImage={null} />);
      
      expect(screen.queryByAltText('Profile')).not.toBeInTheDocument();
      expect(screen.getByText('J')).toBeInTheDocument(); // Shows initial instead
    });

    it('handles empty name gracefully', () => {
      render(<MoreTab {...defaultProps} name="" />);
      
      expect(screen.getByText('Anonymous User')).toBeInTheDocument();
      expect(screen.getByText('?')).toBeInTheDocument(); // Shows question mark
    });
  });

  describe('Session Integration', () => {
    it('displays session email when available', () => {
      render(<MoreTab {...defaultProps} />);
      
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('handles missing session data gracefully', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      render(<MoreTab {...defaultProps} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      // Should not crash when session is null
    });
  });
});
