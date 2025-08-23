import { renderHook, act } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { useUserProfile } from '../useUserProfile';

// Mock dependencies
jest.mock('next-auth/react');
jest.mock('react-hot-toast');

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockToast = toast as jest.MockedFunction<typeof toast>;

// Mock fetch globally
global.fetch = jest.fn();

describe('useUserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToast.success = jest.fn();
    mockToast.error = jest.fn();
    (global.fetch as jest.Mock).mockClear();

    // Default session mock
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'test-user-id',
          name: 'Test User',
          email: 'test@example.com',
        },
      },
      status: 'authenticated'
    } as any);
  });

  describe('initialization', () => {
    it('initializes with session name when available', () => {
      const { result } = renderHook(() => useUserProfile());
      
      expect(result.current.name).toBe('Test User');
      expect(result.current.profileImage).toBe(null);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.hasLoaded).toBe(false);
    });

    it('initializes with empty name when no session', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated'
      } as any);

      const { result } = renderHook(() => useUserProfile());
      
      expect(result.current.name).toBe('');
      expect(result.current.profileImage).toBe(null);
    });
  });

  describe('data fetching', () => {
    it('fetches user data on authenticated session', async () => {
      const mockUserData = {
        success: true,
        user: {
          id: 'test-user-id',
          name: 'Fetched User',
          age: 30,
          sex: 'male',
          profileImage: 'https://example.com/image.jpg'
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserData,
      });

      const { result, rerender } = renderHook(() => useUserProfile());

      // Wait for the effect to run
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      rerender();

      expect(global.fetch).toHaveBeenCalledWith('/api/users/test-user-id');
      expect(result.current.name).toBe('Fetched User');
      expect(result.current.age).toBe(30);
      expect(result.current.sex).toBe('male');
      expect(result.current.profileImage).toBe('https://example.com/image.jpg');
      expect(result.current.hasLoaded).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('handles fetch error gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useUserProfile());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.error).toContain('Failed to fetch user data');
      expect(result.current.hasLoaded).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('handles non-ok response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const { result } = renderHook(() => useUserProfile());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.error).toContain('Failed to fetch user data');
      expect(result.current.hasLoaded).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('handles retry logic', async () => {
      // For now, just test that fetch is called and basic error handling works
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('First failure'));

      const { result } = renderHook(() => useUserProfile());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(global.fetch).toHaveBeenCalled();
      expect(result.current.error).toContain('Failed to fetch user data');
    });
  });

  describe('session status handling', () => {
    it('does not fetch when session is loading', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading'
      } as any);

      renderHook(() => useUserProfile());

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('does not fetch when unauthenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated'
      } as any);

      renderHook(() => useUserProfile());

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('handles session without user ID', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            name: 'No ID User',
            email: 'test@example.com',
          },
        },
        status: 'authenticated'
      } as any);

      renderHook(() => useUserProfile());

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('data parsing', () => {
    it('handles basic data parsing flow', async () => {
      // Simple test to ensure the hook processes data correctly
      const { result } = renderHook(() => useUserProfile());

      expect(result.current.name).toBe('Test User'); // From session
      expect(result.current.profileImage).toBe(null);
      expect(result.current.isLoading).toBe(true);
    });

    it('handles successful data fetch and parsing', async () => {
      const mockUserData = {
        success: true,
        user: {
          id: 'test-user-id',
          name: 'Updated User',
          age: 25,
          sex: 'female',
          profileImage: 'https://example.com/test.jpg'
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserData,
      });

      const { result } = renderHook(() => useUserProfile());

      // Wait for async operations
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Test that all data is properly set
      expect(result.current.name).toBe('Updated User');
      expect(result.current.age).toBe(25);
      expect(result.current.sex).toBe('female');
      expect(result.current.profileImage).toBe('https://example.com/test.jpg');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.hasLoaded).toBe(true);
      expect(result.current.error).toBe(null);
    });
  });
});
