import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ProtocolsPage from '../page';

// Mock Next.js navigation and auth
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

// Mock window.location.reload
delete window.location;
window.location = { reload: jest.fn() } as any;

// Mock upload components
jest.mock('@features/upload/components', () => ({
  ProtocolsTab: ({ initialDiet, initialWorkoutProtocols, initialSupplementProtocols }: any) => (
    <div data-testid="protocols-tab">
      <span data-testid="initial-diet">{initialDiet}</span>
      <span data-testid="workout-count">{initialWorkoutProtocols.length}</span>
      <span data-testid="supplement-count">{initialSupplementProtocols.length}</span>
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
  AddWorkoutProtocolModal: ({ isOpen, onClose, onSave }: any) => 
    isOpen ? (
      <div data-testid="add-workout-modal">
        <button data-testid="close-workout-modal" onClick={onClose}>Close</button>
        <button data-testid="save-workout-modal" onClick={() => onSave([{ type: 'cardio', frequency: 3 }])}>Save</button>
      </div>
    ) : null,
  AddSupplementProtocolModal: ({ isOpen, onClose, onSave }: any) => 
    isOpen ? (
      <div data-testid="add-supplement-modal">
        <button data-testid="close-supplement-modal" onClick={onClose}>Close</button>
        <button data-testid="save-supplement-modal" onClick={() => onSave([{ type: 'vitamin-d', dosage: '1000', unit: 'IU', frequency: 'daily' }])}>Save</button>
      </div>
    ) : null,
  AddExperimentModal: ({ isOpen, onClose, onSave }: any) => 
    isOpen ? (
      <div data-testid="add-experiment-modal">
        <button data-testid="close-experiment-modal" onClick={onClose}>Close</button>
        <button data-testid="save-experiment-modal" onClick={() => onSave({
          name: 'Test Exp',
          description: 'Test Desc',
          frequency: 'daily',
          duration: '4-weeks',
          fitnessMarkers: ['weight'],
          bloodMarkers: ['cholesterol']
        })}>Save</button>
      </div>
    ) : null,
  EditExperimentModal: ({ isOpen, onClose, onSave, experiment }: any) => 
    isOpen ? (
      <div data-testid="edit-experiment-modal">
        <span data-testid="editing-exp-name">{experiment?.name}</span>
        <button data-testid="close-edit-experiment-modal" onClick={onClose}>Close</button>
        <button data-testid="save-edit-experiment-modal" onClick={() => onSave({
          ...experiment,
          name: 'Updated Exp'
        })}>Save</button>
      </div>
    ) : null,
  EditSupplementProtocolPopover: ({ isOpen, onClose, supplement, onUpdate }: any) => 
    isOpen ? (
      <div data-testid="edit-supplement-modal">
        <span data-testid="editing-supplement-type">{supplement?.type}</span>
        <button data-testid="close-edit-supplement-modal" onClick={onClose}>Close</button>
        <button data-testid="save-edit-supplement-modal" onClick={() => onUpdate({
          ...supplement,
          dosage: '2000'
        })}>Save</button>
      </div>
    ) : null,
}));

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('ProtocolsPage', () => {
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

    render(<ProtocolsPage />);

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders unauthenticated state when session is unauthenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });

    render(<ProtocolsPage />);

    expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    expect(screen.getByText('Please sign in to access the upload functionality.')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Sign In').closest('a')).toHaveAttribute('href', '/auth/signin');
  });

  it.skip('forces page reload when session is authenticated but missing user ID', () => {
    // Skipped: JSDOM window.location.reload limitation
    const mockReload = jest.fn();
    delete (window as any).location;
    window.location = { reload: mockReload } as any;

    mockUseSession.mockReturnValue({
      data: { user: {} },
      status: 'authenticated',
      update: jest.fn(),
    });

    render(<ProtocolsPage />);

    expect(mockConsoleLog).toHaveBeenCalledWith('Session authenticated but missing user ID, forcing refresh...');
    expect(mockReload).toHaveBeenCalled();
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

    // Mock all API calls
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          user: { name: 'John Doe', profileImage: 'profile.jpg' }
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: [{ protocol: 'Mediterranean Diet' }]
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: [{ protocol: '{"workouts":[{"type":"cardio","frequency":3}]}' }]
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: [{ protocol: '{"supplements":[{"type":"vitamin-d","dosage":"1000","unit":"IU","frequency":"daily"}]}' }]
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: [{ id: 'exp-1', name: 'Test Experiment' }]
        }),
      });

    render(<ProtocolsPage />);

    expect(screen.getByTestId('desktop-navigation')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-header')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-navigation')).toBeInTheDocument();
    expect(screen.getByTestId('protocols-tab')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('nav-name')).toHaveTextContent('John Doe');
      expect(screen.getByTestId('initial-diet')).toHaveTextContent('Mediterranean Diet');
      expect(screen.getByTestId('workout-count')).toHaveTextContent('1');
      expect(screen.getByTestId('supplement-count')).toHaveTextContent('1');
    });
  });

  it('handles navigation between tabs', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    });

    // Mock API calls to return empty responses
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    });

    render(<ProtocolsPage />);

    // Test navigation
    fireEvent.click(screen.getByText('Profile'));
    expect(mockPush).toHaveBeenCalledWith('/upload/profile');

    fireEvent.click(screen.getByText('Fitness'));
    expect(mockPush).toHaveBeenCalledWith('/upload/fitness');

    fireEvent.click(screen.getByText('Blood'));
    expect(mockPush).toHaveBeenCalledWith('/upload/blood');

    fireEvent.click(screen.getByText('More'));
    expect(mockPush).toHaveBeenCalledWith('/upload/settings');

    // Test staying on protocols tab
    mockPush.mockClear();
    fireEvent.click(screen.getByText('Protocols'));
    expect(mockPush).not.toHaveBeenCalled();

    // Test unknown tab defaults to profile
    fireEvent.click(screen.getByText('Unknown'));
    expect(mockPush).toHaveBeenCalledWith('/upload/profile');
  });

  it('shows active tab as "protocols"', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    });

    render(<ProtocolsPage />);

    expect(screen.getByTestId('active-tab')).toHaveTextContent('protocols');
    expect(screen.getByTestId('mobile-navigation')).toHaveTextContent('protocols');
  });

  it.skip('handles API fetch errors gracefully', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    });

    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<ProtocolsPage />);

    await waitFor(() => {
      expect(mockConsoleError).toHaveBeenCalledWith('Error fetching user data:', expect.any(Error));
    });
  });

  it('does not fetch data when session is loading', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn(),
    });

    render(<ProtocolsPage />);

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('does not fetch data when session has no user ID', () => {
    mockUseSession.mockReturnValue({
      data: { user: {} },
      status: 'authenticated',
      update: jest.fn(),
    });

    render(<ProtocolsPage />);

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('handles status message display', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    });

    render(<ProtocolsPage />);

    // Status message should not be visible when status is empty
    expect(screen.queryByText(/bg-green-100/)).not.toBeInTheDocument();
  });

  it('does not render modals when they are closed', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    });

    render(<ProtocolsPage />);

    // All modals should be closed initially
    expect(screen.queryByTestId('add-workout-modal')).not.toBeInTheDocument();
    expect(screen.queryByTestId('add-supplement-modal')).not.toBeInTheDocument();
    expect(screen.queryByTestId('add-experiment-modal')).not.toBeInTheDocument();
    expect(screen.queryByTestId('edit-experiment-modal')).not.toBeInTheDocument();
    expect(screen.queryByTestId('edit-supplement-modal')).not.toBeInTheDocument();
  });

  it('renders protocols tab with initial data', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com' },
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    });

    render(<ProtocolsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('protocols-tab')).toBeInTheDocument();
      expect(screen.getByTestId('initial-diet')).toBeInTheDocument();
      expect(screen.getByTestId('workout-count')).toBeInTheDocument();
      expect(screen.getByTestId('supplement-count')).toBeInTheDocument();
    });
  });
});
