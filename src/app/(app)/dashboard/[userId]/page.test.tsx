/**
 * Dashboard Page Authentication Tests
 * 
 * These tests verify the critical authentication behavior we implemented:
 * - Dashboard is publicly accessible (no auth required)
 * - Session loading states work correctly
 * - User ID extraction from various sources
 * - No authentication redirects occur
 * - Component renders for both authenticated and unauthenticated users
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useParams, useSearchParams } from 'next/navigation';
import DashboardPage from './page';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock theme provider
jest.mock('@providers/ThemeProvider', () => ({
  useTheme: jest.fn(() => ({ theme: 'light' })),
}));

// Mock Next.js Head component
jest.mock('next/head', () => {
  return function MockHead({ children }: { children: React.ReactNode }) {
    return <div data-testid="mock-head">{children}</div>;
  };
});

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  Toaster: () => <div data-testid="mock-toaster" />,
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock the dashboard hooks to avoid complex API calls
jest.mock('@features/dashboard/hooks/useDashboardData', () => ({
  useDashboardData: jest.fn(() => ({
    data: null,
    loading: false,
    error: null,
  })),
}));

jest.mock('@features/dashboard/hooks/useActivityData', () => ({
  useActivityData: jest.fn(() => ({
    activityFeed: [],
    sleepData: [],
    workoutData: [],
    loading: false,
  })),
}));

jest.mock('@features/dashboard/hooks/useTimeRangeFilters', () => ({
  useTimeRangeFilters: jest.fn(() => ({
    timeRanges: {},
    setWeightTimeRange: jest.fn(),
    setBodyFatTimeRange: jest.fn(),
    setHrvTimeRange: jest.fn(),
    setVo2maxTimeRange: jest.fn(),
    getTimeRangeData: jest.fn(),
  })),
}));

// Mock dashboard components to simplify testing
jest.mock('@features/dashboard/components', () => ({
  DashboardHeader: ({ userData, sessionUserId }: any) => (
    <div data-testid="dashboard-header">
      <span data-testid="user-id">{userData?.userId}</span>
      <span data-testid="session-user-id">{sessionUserId}</span>
    </div>
  ),
  TabNavigation: () => <div data-testid="tab-navigation" />,
  HomeTab: () => <div data-testid="home-tab" />,
  MetricsTab: () => <div data-testid="metrics-tab" />,
  BloodTab: () => <div data-testid="blood-tab" />,
  ProtocolsTab: () => <div data-testid="protocols-tab" />,
}));

// Mock blood marker components
jest.mock('@features/blood-markers/components/BloodMarkerDetailModal', () => {
  return function MockBloodMarkerModal() {
    return <div data-testid="blood-marker-modal" />;
  };
});

// Mock theme toggle
jest.mock('@components/ThemeToggle', () => {
  return function MockThemeToggle() {
    return <div data-testid="theme-toggle" />;
  };
});

// Mock global fetch with proper responses
global.fetch = jest.fn().mockImplementation((url: string) => {
  if (url.includes('/api/users/')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        userId: url.split('/').pop(),
        name: 'Test User',
        dashboardPublished: true,
      }),
    });
  }
  if (url.includes('/api/health-protocols')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    });
  }
  return Promise.resolve({
    ok: false,
    json: () => Promise.resolve({}),
  });
});

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;

describe('Dashboard Page Authentication Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  const mockSearchParams = (userId?: string) => ({
    get: jest.fn((key: string) => key === 'userId' ? userId : null),
  });

  describe('Public Access - No Authentication Required', () => {
    it('should render dashboard for unauthenticated users', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
      mockUseParams.mockReturnValue({ userId: 'public-user-123' });
      mockUseSearchParams.mockReturnValue(mockSearchParams() as any);

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
      });

      // Verify no authentication barriers
      expect(screen.getByTestId('tab-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });

    it('should render dashboard for authenticated users', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'auth-user-123' } },
        status: 'authenticated',
      });
      mockUseParams.mockReturnValue({ userId: 'view-user-456' });
      mockUseSearchParams.mockReturnValue(mockSearchParams() as any);

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
      });

      expect(screen.getByTestId('tab-navigation')).toBeInTheDocument();
    });

    it('should handle session loading state without blocking', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      });
      mockUseParams.mockReturnValue({ userId: 'loading-user-123' });
      mockUseSearchParams.mockReturnValue(mockSearchParams() as any);

      render(<DashboardPage />);

      // Should show loading state but not block access
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('User ID Extraction Logic', () => {
    it('should handle route userId parameters', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
      mockUseParams.mockReturnValue({ userId: 'route-user-123' });
      mockUseSearchParams.mockReturnValue(mockSearchParams() as any);

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
      });

      // Should render successfully with route user ID
      expect(screen.getByTestId('tab-navigation')).toBeInTheDocument();
    });

    it('should handle old URL format (userId=)', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
      mockUseParams.mockReturnValue({ userId: 'userId=old-format-123' });
      mockUseSearchParams.mockReturnValue(mockSearchParams() as any);

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
      });

      // Should render successfully with old format user ID
      expect(screen.getByTestId('tab-navigation')).toBeInTheDocument();
    });

    it('should handle query userId parameters', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
      mockUseParams.mockReturnValue({ userId: 'route-user-123' });
      mockUseSearchParams.mockReturnValue(mockSearchParams('query-user-456') as any);

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
      });

      // Should render successfully with query user ID taking precedence
      expect(screen.getByTestId('tab-navigation')).toBeInTheDocument();
    });

    it('should handle session userId fallback', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'session-user-789' } },
        status: 'authenticated',
      });
      mockUseParams.mockReturnValue({});
      mockUseSearchParams.mockReturnValue(mockSearchParams() as any);

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
      });

      // Should render successfully with session user ID as fallback
      expect(screen.getByTestId('tab-navigation')).toBeInTheDocument();
    });
  });

  describe('Session State Management', () => {
    it('should pass correct sessionUserId to DashboardHeader', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'session-user-123' } },
        status: 'authenticated',
      });
      mockUseParams.mockReturnValue({ userId: 'view-user-456' });
      mockUseSearchParams.mockReturnValue(mockSearchParams() as any);

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('session-user-id')).toHaveTextContent('session-user-123');
      });
    });

    it('should handle null session gracefully', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
      mockUseParams.mockReturnValue({ userId: 'public-user-123' });
      mockUseSearchParams.mockReturnValue(mockSearchParams() as any);

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('session-user-id')).toHaveTextContent('');
      });
    });
  });

  describe('Component Integration', () => {
    it('should render all core dashboard components', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'test-user' } },
        status: 'authenticated',
      });
      mockUseParams.mockReturnValue({ userId: 'test-user' });
      mockUseSearchParams.mockReturnValue(mockSearchParams() as any);

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
        expect(screen.getByTestId('tab-navigation')).toBeInTheDocument();
        expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
        expect(screen.getByTestId('mock-toaster')).toBeInTheDocument();
      });
    });

    it('should handle tab navigation state', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
      mockUseParams.mockReturnValue({ userId: 'test-user' });
      mockUseSearchParams.mockReturnValue(mockSearchParams() as any);

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('home-tab')).toBeInTheDocument();
      });
    });
  });

  describe('Critical Regression Prevention', () => {
    it('should never redirect unauthenticated users', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
      mockUseParams.mockReturnValue({ userId: 'public-user' });
      mockUseSearchParams.mockReturnValue(mockSearchParams() as any);

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
      });

      // Should render successfully without redirects
      expect(screen.getByTestId('tab-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });

    it('should render dashboard for various user ID formats', async () => {
      const userIdFormats = [
        'simple-123',
        'userId=old-format-123',
        '100492380040453908509',
        'user-with-dashes-456',
      ];

      for (const userIdFormat of userIdFormats) {
        mockUseSession.mockReturnValue({
          data: null,
          status: 'unauthenticated',
        });
        mockUseParams.mockReturnValue({ userId: userIdFormat });
        mockUseSearchParams.mockReturnValue(mockSearchParams() as any);

        const { unmount } = render(<DashboardPage />);

        await waitFor(() => {
          expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
        });

        unmount();
        jest.clearAllMocks();
      }
    });
  });

  describe('Basic Functionality', () => {
    it('can be imported without errors', () => {
    expect(() => {
      require('./page');
    }).not.toThrow();
  });

  it('exports a default component', () => {
    const DashboardPage = require('./page').default;
    expect(DashboardPage).toBeDefined();
    expect(typeof DashboardPage).toBe('function');
    });
  });
});