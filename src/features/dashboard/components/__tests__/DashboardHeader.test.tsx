import React from 'react';
import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { DashboardHeader } from '../DashboardHeader';
import toast from 'react-hot-toast';
import type { UserData } from '@/types/dashboard';

// Mock react-hot-toast
jest.mock('react-hot-toast');

// Mock Next.js components
jest.mock('next/image', () => {
  return function MockImage({ src, alt, onError, ...props }: any) {
    return (
      <img 
        src={src} 
        alt={alt} 
        onError={onError}
        data-testid="profile-image"
        {...props} 
      />
    );
  };
});

jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

// Mock window.location using jest
const mockLocation = {
  href: 'https://example.com/dashboard/test-user',
  origin: 'https://example.com',
};

delete (window as any).location;
(window as any).location = mockLocation;

describe('DashboardHeader', () => {
  const mockUserData: UserData = {
    name: 'John Doe',
    email: 'john@example.com',
    userId: 'test-user-id',
    profileImage: 'https://example.com/profile.jpg',
    age: 30,
    sex: 'male',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (navigator.clipboard.writeText as jest.Mock) = jest.fn();
  });

  describe('Owner View', () => {
    const ownerProps = {
      userData: mockUserData,
      userId: 'test-user-id',
      sessionUserId: 'test-user-id',
      loading: false,
    };

    it('renders user profile image when available', () => {
      render(<DashboardHeader {...ownerProps} />);
      
      const profileImage = screen.getByTestId('profile-image');
      expect(profileImage).toBeInTheDocument();
      expect(profileImage).toHaveAttribute('src', 'https://example.com/profile.jpg');
      expect(profileImage).toHaveAttribute('alt', 'Profile');
    });

    it('renders default avatar when no profile image', () => {
      const userWithoutImage = { ...mockUserData, profileImage: null };
      render(<DashboardHeader {...ownerProps} userData={userWithoutImage} />);
      
      expect(screen.queryByTestId('profile-image')).not.toBeInTheDocument();
      
      // Check for default avatar SVG
      const defaultAvatar = screen.container.querySelector('svg');
      expect(defaultAvatar).toBeInTheDocument();
      expect(defaultAvatar).toHaveAttribute('viewBox', '0 0 24 24');
    });

    it('renders user name', () => {
      render(<DashboardHeader {...ownerProps} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders Health Dashboard subtitle', () => {
      render(<DashboardHeader {...ownerProps} />);
      
      expect(screen.getByText('Health Dashboard')).toBeInTheDocument();
    });

    it('renders Manage button linking to upload page', () => {
      render(<DashboardHeader {...ownerProps} />);
      
      const manageButton = screen.getByText('Manage');
      expect(manageButton).toBeInTheDocument();
      expect(manageButton.closest('a')).toHaveAttribute('href', '/upload');
    });

    it('renders share button', () => {
      render(<DashboardHeader {...ownerProps} />);
      
      const shareButton = screen.container.querySelector('button svg');
      expect(shareButton).toBeInTheDocument();
    });

    it('copies dashboard link to clipboard when share button is clicked', async () => {
      (navigator.clipboard.writeText as jest.Mock).mockResolvedValue(undefined);
      
      render(<DashboardHeader {...ownerProps} />);
      
      const shareButton = screen.container.querySelector('button');
      fireEvent.click(shareButton!);
      
      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          'https://example.com/dashboard/test-user-id'
        );
      });
      
      expect(toast.success).toHaveBeenCalledWith(
        'Dashboard link copied to clipboard!',
        expect.objectContaining({
          duration: 2000,
          style: {
            background: '#333',
            color: '#fff',
          },
        })
      );
    });

    it('shows error toast when clipboard copy fails', async () => {
      (navigator.clipboard.writeText as jest.Mock).mockRejectedValue(new Error('Clipboard error'));
      
      render(<DashboardHeader {...ownerProps} />);
      
      const shareButton = screen.container.querySelector('button');
      fireEvent.click(shareButton!);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to copy link',
          expect.objectContaining({
            duration: 2000,
            style: {
              background: '#333',
              color: '#fff',
            },
          })
        );
      });
    });

    it('handles profile image error', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<DashboardHeader {...ownerProps} />);
      
      const profileImage = screen.getByTestId('profile-image');
      
      // Create a mock event with proper target structure
      const mockEvent = {
        target: {
          style: { display: '' },
          parentElement: {
            classList: {
              add: jest.fn(),
            },
          },
        },
      };
      
      fireEvent.error(profileImage, mockEvent);
      
      expect(mockEvent.target.style.display).toBe('none');
      expect(mockEvent.target.parentElement.classList.add).toHaveBeenCalledWith('profile-image-error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load profile image');
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Visitor View', () => {
    const visitorProps = {
      userData: mockUserData,
      userId: 'test-user-id',
      sessionUserId: 'different-user-id',
      loading: false,
    };

    it('renders profile image for visitor', () => {
      render(<DashboardHeader {...visitorProps} />);
      
      const profileImage = screen.getByTestId('profile-image');
      expect(profileImage).toBeInTheDocument();
      expect(profileImage).toHaveAttribute('src', 'https://example.com/profile.jpg');
    });

    it('renders user name for visitor', () => {
      render(<DashboardHeader {...visitorProps} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('does not render Manage button for visitor', () => {
      render(<DashboardHeader {...visitorProps} />);
      
      expect(screen.queryByText('Manage')).not.toBeInTheDocument();
    });

    it('renders share button for visitor', () => {
      render(<DashboardHeader {...visitorProps} />);
      
      const shareButton = screen.container.querySelector('button svg');
      expect(shareButton).toBeInTheDocument();
    });

    it('copies current URL when visitor clicks share button', async () => {
      (navigator.clipboard.writeText as jest.Mock).mockResolvedValue(undefined);
      
      render(<DashboardHeader {...visitorProps} />);
      
      const shareButton = screen.container.querySelector('button');
      fireEvent.click(shareButton!);
      
      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          'https://example.com/dashboard/test-user'
        );
      });
    });

    it('handles profile image error for visitor', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<DashboardHeader {...visitorProps} />);
      
      const profileImage = screen.getByTestId('profile-image');
      
      const mockEvent = {
        target: {
          style: { display: '' },
          parentElement: {
            classList: {
              add: jest.fn(),
            },
          },
        },
      };
      
      fireEvent.error(profileImage, mockEvent);
      
      expect(mockEvent.target.style.display).toBe('none');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load profile image');
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('handles null userData', () => {
      const props = {
        userData: null,
        userId: 'test-user-id',
        sessionUserId: 'test-user-id',
        loading: false,
      };
      
      render(<DashboardHeader {...props} />);
      
      expect(screen.getByText('Health Dashboard')).toBeInTheDocument();
      expect(screen.queryByTestId('profile-image')).not.toBeInTheDocument();
    });

    it('handles undefined userId', () => {
      const props = {
        userData: mockUserData,
        userId: undefined,
        sessionUserId: 'test-user-id',
        loading: false,
      };
      
      render(<DashboardHeader {...props} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('handles undefined sessionUserId', () => {
      const props = {
        userData: mockUserData,
        userId: 'test-user-id',
        sessionUserId: undefined,
        loading: false,
      };
      
      render(<DashboardHeader {...props} />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      // Should render as visitor view
      expect(screen.queryByText('Manage')).not.toBeInTheDocument();
    });

    it('handles empty user name', () => {
      const userWithoutName = { ...mockUserData, name: '' };
      const props = {
        userData: userWithoutName,
        userId: 'test-user-id',
        sessionUserId: 'test-user-id',
        loading: false,
      };
      
      render(<DashboardHeader {...props} />);
      
      // Should still render the container
      expect(screen.getByText('Health Dashboard')).toBeInTheDocument();
    });
  });

  describe('Styling and Classes', () => {
    it('applies correct CSS classes to main container', () => {
      const props = {
        userData: mockUserData,
        userId: 'test-user-id',
        sessionUserId: 'test-user-id',
        loading: false,
      };
      
      render(<DashboardHeader {...props} />);
      
      const container = screen.container.querySelector('.bg-white.dark\\:bg-gray-800.rounded-2xl');
      expect(container).toBeInTheDocument();
    });

    it('applies responsive padding classes', () => {
      const props = {
        userData: mockUserData,
        userId: 'test-user-id',
        sessionUserId: 'test-user-id',
        loading: false,
      };
      
      render(<DashboardHeader {...props} />);
      
      const container = screen.container.querySelector('.px-4.sm\\:px-6.py-6');
      expect(container).toBeInTheDocument();
    });

    it('applies correct classes to profile image container', () => {
      const props = {
        userData: mockUserData,
        userId: 'test-user-id',
        sessionUserId: 'test-user-id',
        loading: false,
      };
      
      render(<DashboardHeader {...props} />);
      
      const imageContainer = screen.container.querySelector('.w-20.h-20.rounded-full');
      expect(imageContainer).toBeInTheDocument();
    });

    it('applies correct classes to user name', () => {
      const props = {
        userData: mockUserData,
        userId: 'test-user-id',
        sessionUserId: 'test-user-id',
        loading: false,
      };
      
      render(<DashboardHeader {...props} />);
      
      const userName = screen.getByText('John Doe');
      expect(userName).toHaveClass('text-2xl', 'font-bold', 'dark:text-white', 'truncate');
    });

    it('applies correct classes to Manage button', () => {
      const props = {
        userData: mockUserData,
        userId: 'test-user-id',
        sessionUserId: 'test-user-id',
        loading: false,
      };
      
      render(<DashboardHeader {...props} />);
      
      const manageButton = screen.getByText('Manage');
      expect(manageButton).toHaveClass(
        'inline-flex',
        'items-center',
        'px-4',
        'py-2',
        'bg-indigo-600',
        'hover:bg-indigo-700'
      );
    });
  });

  describe('Accessibility', () => {
    it('has proper button role for share button', () => {
      const props = {
        userData: mockUserData,
        userId: 'test-user-id',
        sessionUserId: 'test-user-id',
        loading: false,
      };
      
      render(<DashboardHeader {...props} />);
      
      const shareButton = screen.container.querySelector('button');
      expect(shareButton).toHaveAttribute('type', 'button');
    });

    it('has proper alt text for profile image', () => {
      const props = {
        userData: mockUserData,
        userId: 'test-user-id',
        sessionUserId: 'test-user-id',
        loading: false,
      };
      
      render(<DashboardHeader {...props} />);
      
      const profileImage = screen.getByTestId('profile-image');
      expect(profileImage).toHaveAttribute('alt', 'Profile');
    });
  });
});
