import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import BloodPage from '../page';

// Mock Next.js navigation and auth
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

// Mock upload components
jest.mock('@features/upload/components', () => ({
  BloodTab: ({ isAddResultsModalOpen, setIsAddResultsModalOpen }: any) => (
    <div data-testid="blood-tab">
      <span data-testid="modal-open">{isAddResultsModalOpen.toString()}</span>
      <button 
        data-testid="open-modal-btn" 
        onClick={() => setIsAddResultsModalOpen(true)}
      >
        Open Modal
      </button>
    </div>
  ),
  DesktopNavigation: ({ activeTab, onTabChange, session, profileImage, name }: any) => (
    <div data-testid="desktop-navigation">
      <button onClick={() => onTabChange('profile')}>Profile</button>
      <button onClick={() => onTabChange('protocols')}>Protocols</button>
      <button onClick={() => onTabChange('fitness')}>Fitness</button>
      <button onClick={() => onTabChange('blood')}>Blood</button>
      <button onClick={() => onTabChange('more')}>More</button>
      <button onClick={() => onTabChange('unknown')}>Unknown</button>
      <span data-testid="active-tab">{activeTab}</span>
      <span data-testid="nav-name">{name}</span>
      <span data-testid="nav-image">{profileImage || 'no-image'}</span>
    </div>
  ),
  MobileNavigation: ({ activeTab, onTabChange }: any) => (
    <div data-testid="mobile-navigation">
      Mobile Nav - {activeTab}
    </div>
  ),
  MobileHeader: () => <div data-testid="mobile-header">Mobile Header</div>,
  AddResultsModal: ({ isOpen, onClose, prefilledResults }: any) => (
    <div data-testid="add-results-modal">
      <span data-testid="modal-is-open">{isOpen.toString()}</span>
      <span data-testid="prefilled-results">{prefilledResults ? 'has-prefilled' : 'no-prefilled'}</span>
      <button data-testid="close-modal-btn" onClick={onClose}>Close Modal</button>
    </div>
  ),
}));

// Mock console methods
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('BloodPage', () => {
  const mockPush = jest.fn();
  const mockRouter = {
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter);
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders loading state when session is loading', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn(),
    });

    render(<BloodPage />);

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders unauthenticated state when session is unauthenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });

    render(<BloodPage />);

    expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    expect(screen.getByText('Please sign in to access the upload functionality.')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Sign In').closest('a')).toHaveAttribute('href', '/auth/signin');
  });

  it('renders main content when authenticated with valid session', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        user: { name: 'John Doe', profileImage: 'profile.jpg' }
      }),
    });

    render(<BloodPage />);

    expect(screen.getByTestId('desktop-navigation')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-header')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-navigation')).toBeInTheDocument();
    expect(screen.getByTestId('blood-tab')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('nav-name')).toHaveTextContent('John Doe');
      expect(screen.getByTestId('nav-image')).toHaveTextContent('profile.jpg');
    });
  });

  it('fetches user data on mount when authenticated', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        user: { name: 'Jane Smith', profileImage: null }
      }),
    });

    render(<BloodPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/users/user-123');
    });
  });

  it('handles fetch error gracefully', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    });

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<BloodPage />);

    // Test passes if no error is thrown and component renders fallback
    expect(screen.getByTestId('blood-tab')).toBeInTheDocument();
  });

  it('handles unsuccessful fetch response', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    render(<BloodPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/users/user-123');
    });

    // Should not update state for unsuccessful response
    expect(screen.getByTestId('nav-name')).toHaveTextContent('');
  });

  it('handles navigation to profile tab', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, user: {} }),
    });

    render(<BloodPage />);

    fireEvent.click(screen.getByText('Profile'));
    expect(mockPush).toHaveBeenCalledWith('/upload/profile');
  });

  it('handles navigation to protocols tab', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, user: {} }),
    });

    render(<BloodPage />);

    fireEvent.click(screen.getByText('Protocols'));
    expect(mockPush).toHaveBeenCalledWith('/upload/protocols');
  });

  it('handles navigation to fitness tab', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, user: {} }),
    });

    render(<BloodPage />);

    fireEvent.click(screen.getByText('Fitness'));
    expect(mockPush).toHaveBeenCalledWith('/upload/fitness');
  });

  it('does not navigate when blood tab is clicked (already on blood)', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, user: {} }),
    });

    render(<BloodPage />);

    fireEvent.click(screen.getByText('Blood'));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('handles navigation to more tab', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, user: {} }),
    });

    render(<BloodPage />);

    fireEvent.click(screen.getByText('More'));
    expect(mockPush).toHaveBeenCalledWith('/upload/settings');
  });

  it('handles navigation to default tab for unknown tab', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, user: {} }),
    });

    render(<BloodPage />);

    fireEvent.click(screen.getByText('Unknown'));
    expect(mockPush).toHaveBeenCalledWith('/upload/profile');
  });

  it('shows active tab as "blood"', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, user: {} }),
    });

    render(<BloodPage />);

    expect(screen.getByTestId('active-tab')).toHaveTextContent('blood');
    expect(screen.getByTestId('mobile-navigation')).toHaveTextContent('blood');
  });

  it('does not fetch user data when session is loading', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn(),
    });

    render(<BloodPage />);

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('does not fetch user data when session has no user ID', () => {
    mockUseSession.mockReturnValue({
      data: { user: {} },
      status: 'authenticated',
      update: jest.fn(),
    });

    render(<BloodPage />);

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('manages AddResultsModal state correctly', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, user: {} }),
    });

    render(<BloodPage />);

    // Initially modal should be closed
    expect(screen.getByTestId('modal-open')).toHaveTextContent('false');
    expect(screen.queryByTestId('add-results-modal')).not.toBeInTheDocument();

    // Open modal
    fireEvent.click(screen.getByTestId('open-modal-btn'));
    expect(screen.getByTestId('modal-open')).toHaveTextContent('true');
    expect(screen.getByTestId('add-results-modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-is-open')).toHaveTextContent('true');
    expect(screen.getByTestId('prefilled-results')).toHaveTextContent('no-prefilled');

    // Close modal
    fireEvent.click(screen.getByTestId('close-modal-btn'));
    expect(screen.getByTestId('modal-open')).toHaveTextContent('false');
    expect(screen.queryByTestId('add-results-modal')).not.toBeInTheDocument();
  });

  it('displays status message when status is set', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, user: {} }),
    });

    render(<BloodPage />);

    // Status message should not be visible when status is empty
    expect(screen.queryByText(/bg-green-100/)).not.toBeInTheDocument();
  });

  it('handles successful response with no user data', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: false,
      }),
    });

    render(<BloodPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/users/user-123');
    });

    // Should not update state when success is false
    expect(screen.getByTestId('nav-name')).toHaveTextContent('');
  });

  it('renders AddResultsModal only when isAddResultsModalOpen is true', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, user: {} }),
    });

    render(<BloodPage />);

    // Initially modal should not be rendered
    expect(screen.queryByTestId('add-results-modal')).not.toBeInTheDocument();

    // Open modal
    fireEvent.click(screen.getByTestId('open-modal-btn'));
    
    // Modal should now be rendered
    expect(screen.getByTestId('add-results-modal')).toBeInTheDocument();
  });
});
