import React from 'react';
import { render, screen } from '@testing-library/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import UploadPage from '../page';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

// Mock next-auth
jest.mock('next-auth/react');

// Mock hooks to avoid complex dependencies
jest.mock('@features/upload/hooks/useUserProfile', () => ({
  useUserProfile: () => ({
    name: 'Test User',
    profileImage: null,
    isLoading: false,
    hasLoaded: true,
    error: null,
  }),
}));

// Mock all the tab components
jest.mock('@features/upload/components/ProfileTab', () => {
  return function MockProfileTab() {
    return <div data-testid="profile-tab">Profile Tab</div>;
  };
});

jest.mock('@features/upload/components/FitnessTab', () => {
  return function MockFitnessTab() {
    return <div data-testid="fitness-tab">Fitness Tab</div>;
  };
});

jest.mock('@features/upload/components/BloodTab', () => {
  return function MockBloodTab() {
    return <div data-testid="blood-tab">Blood Tab</div>;
  };
});

jest.mock('@features/upload/components/ProtocolsTab', () => {
  return function MockProtocolsTab() {
    return <div data-testid="protocols-tab">Protocols Tab</div>;
  };
});

jest.mock('@features/upload/components/MoreTab', () => {
  return function MockMoreTab() {
    return <div data-testid="more-tab">More Tab</div>;
  };
});

// Mock modals
jest.mock('@features/upload/components/modals/AddResultsModal', () => {
  return function MockAddResultsModal() {
    return <div data-testid="add-results-modal">Add Results Modal</div>;
  };
});

// Mock navigation components
jest.mock('@features/upload/components/DesktopNavigation', () => {
  return function MockDesktopNavigation() {
    return <div data-testid="desktop-navigation">Desktop Navigation</div>;
  };
});

jest.mock('@features/upload/components/MobileNavigation', () => {
  return function MockMobileNavigation() {
    return <div data-testid="mobile-navigation">Mobile Navigation</div>;
  };
});

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

describe('UploadPage', () => {
  const mockReplace = jest.fn();
  const mockGet = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseRouter.mockReturnValue({
      replace: mockReplace,
    } as any);

    mockUseSearchParams.mockReturnValue({
      get: mockGet,
    } as any);

    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'test-user',
          name: 'Test User',
          email: 'test@example.com',
        },
      },
      status: 'authenticated',
    } as any);

    // Mock fetch globally
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });
  });

  it('renders without crashing', () => {
    mockGet.mockReturnValue('profile');
    render(<UploadPage />);
  });

  it('shows profile tab by default', () => {
    mockGet.mockReturnValue(null);
    render(<UploadPage />);
    expect(screen.getByTestId('profile-tab')).toBeInTheDocument();
  });

  it('shows correct tab based on URL parameter', () => {
    mockGet.mockReturnValue('fitness');
    render(<UploadPage />);
    expect(screen.getByTestId('fitness-tab')).toBeInTheDocument();
  });

  it('handles blood tab', () => {
    mockGet.mockReturnValue('blood');
    render(<UploadPage />);
    expect(screen.getByTestId('blood-tab')).toBeInTheDocument();
  });

  it('handles protocols tab', () => {
    mockGet.mockReturnValue('protocols');
    render(<UploadPage />);
    expect(screen.getByTestId('protocols-tab')).toBeInTheDocument();
  });

  it('handles more/settings tab', () => {
    mockGet.mockReturnValue('more');
    render(<UploadPage />);
    expect(screen.getByTestId('more-tab')).toBeInTheDocument();
  });

  it('renders navigation components', () => {
    mockGet.mockReturnValue('profile');
    render(<UploadPage />);
    expect(screen.getByTestId('desktop-navigation')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-navigation')).toBeInTheDocument();
  });
});
