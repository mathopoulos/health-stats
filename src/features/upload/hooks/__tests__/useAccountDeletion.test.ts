import { renderHook, act } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { useAccountDeletion } from '../useAccountDeletion';

// Mock dependencies
jest.mock('next-auth/react');
jest.mock('react-hot-toast');

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockToast = toast as jest.MockedFunction<typeof toast>;

// Mock console.error to avoid noise in tests
const mockConsoleError = jest.fn();
global.console.error = mockConsoleError;

// Mock fetch
global.fetch = jest.fn();

const mockSession = {
  user: {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com'
  },
  expires: '2024-12-31'
};

describe('useAccountDeletion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleError.mockClear();
    (global.fetch as jest.Mock).mockClear();
    
    // Setup default mock implementations
    mockToast.success = jest.fn();
    mockToast.error = jest.fn();
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn()
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('initialization', () => {
    it('initializes with default values', () => {
      const { result } = renderHook(() => useAccountDeletion());

      expect(result.current.showDeleteAccountDialog).toBe(false);
      expect(result.current.isDeletingAccount).toBe(false);
      expect(result.current.confirmationPhrase).toBe('');
      expect(result.current.requiredPhrase).toBe('delete my account');
    });

    it('provides all expected functions', () => {
      const { result } = renderHook(() => useAccountDeletion());

      expect(typeof result.current.setShowDeleteAccountDialog).toBe('function');
      expect(typeof result.current.setIsDeletingAccount).toBe('function');
      expect(typeof result.current.setConfirmationPhrase).toBe('function');
      expect(typeof result.current.handleDeleteAccountClick).toBe('function');
      expect(typeof result.current.handleDeleteAccount).toBe('function');
    });

    it('works with authenticated session', () => {
      const { result } = renderHook(() => useAccountDeletion());

      expect(result.current.requiredPhrase).toBe('delete my account');
      expect(mockUseSession).toHaveBeenCalled();
    });

    it('works with unauthenticated session', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn()
      });

      const { result } = renderHook(() => useAccountDeletion());

      expect(result.current.showDeleteAccountDialog).toBe(false);
      expect(result.current.isDeletingAccount).toBe(false);
      expect(result.current.confirmationPhrase).toBe('');
      expect(result.current.requiredPhrase).toBe('delete my account');
    });
  });

  describe('state setters', () => {
    it('setShowDeleteAccountDialog updates dialog state', () => {
      const { result } = renderHook(() => useAccountDeletion());

      act(() => {
        result.current.setShowDeleteAccountDialog(true);
      });

      expect(result.current.showDeleteAccountDialog).toBe(true);

      act(() => {
        result.current.setShowDeleteAccountDialog(false);
      });

      expect(result.current.showDeleteAccountDialog).toBe(false);
    });

    it('setIsDeletingAccount updates deleting state', () => {
      const { result } = renderHook(() => useAccountDeletion());

      act(() => {
        result.current.setIsDeletingAccount(true);
      });

      expect(result.current.isDeletingAccount).toBe(true);

      act(() => {
        result.current.setIsDeletingAccount(false);
      });

      expect(result.current.isDeletingAccount).toBe(false);
    });

    it('setConfirmationPhrase updates confirmation phrase', () => {
      const { result } = renderHook(() => useAccountDeletion());

      act(() => {
        result.current.setConfirmationPhrase('test phrase');
      });

      expect(result.current.confirmationPhrase).toBe('test phrase');

      act(() => {
        result.current.setConfirmationPhrase('');
      });

      expect(result.current.confirmationPhrase).toBe('');
    });
  });

  describe('handleDeleteAccountClick', () => {
    it('opens dialog and resets confirmation phrase', () => {
      const { result } = renderHook(() => useAccountDeletion());

      // Set some initial state
      act(() => {
        result.current.setConfirmationPhrase('existing phrase');
        result.current.setShowDeleteAccountDialog(false);
      });

      act(() => {
        result.current.handleDeleteAccountClick();
      });

      expect(result.current.showDeleteAccountDialog).toBe(true);
      expect(result.current.confirmationPhrase).toBe('');
    });

    it('works when dialog is already open', () => {
      const { result } = renderHook(() => useAccountDeletion());

      // Set dialog to already be open
      act(() => {
        result.current.setShowDeleteAccountDialog(true);
        result.current.setConfirmationPhrase('some phrase');
      });

      act(() => {
        result.current.handleDeleteAccountClick();
      });

      expect(result.current.showDeleteAccountDialog).toBe(true);
      expect(result.current.confirmationPhrase).toBe('');
    });

    it('can be called multiple times', () => {
      const { result } = renderHook(() => useAccountDeletion());

      act(() => {
        result.current.handleDeleteAccountClick();
        result.current.setConfirmationPhrase('test');
        result.current.handleDeleteAccountClick();
      });

      expect(result.current.showDeleteAccountDialog).toBe(true);
      expect(result.current.confirmationPhrase).toBe('');
    });
  });

  describe('handleDeleteAccount', () => {
    it('shows error when user is not logged in', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn()
      });

      const { result } = renderHook(() => useAccountDeletion());

      await act(async () => {
        await result.current.handleDeleteAccount();
      });

      expect(mockToast.error).toHaveBeenCalledWith('You must be logged in to delete your account');
      expect(result.current.isDeletingAccount).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('shows error when session has no user ID', async () => {
      mockUseSession.mockReturnValue({
        data: { ...mockSession, user: { ...mockSession.user, id: '' } },
        status: 'authenticated',
        update: jest.fn()
      });

      const { result } = renderHook(() => useAccountDeletion());

      await act(async () => {
        await result.current.handleDeleteAccount();
      });

      expect(mockToast.error).toHaveBeenCalledWith('You must be logged in to delete your account');
      expect(result.current.isDeletingAccount).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('shows error when confirmation phrase is incorrect', async () => {
      const { result } = renderHook(() => useAccountDeletion());

      act(() => {
        result.current.setConfirmationPhrase('wrong phrase');
      });

      await act(async () => {
        await result.current.handleDeleteAccount();
      });

      expect(mockToast.error).toHaveBeenCalledWith('Please type the confirmation phrase exactly as shown');
      expect(result.current.isDeletingAccount).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('shows error when confirmation phrase is empty', async () => {
      const { result } = renderHook(() => useAccountDeletion());

      act(() => {
        result.current.setConfirmationPhrase('');
      });

      await act(async () => {
        await result.current.handleDeleteAccount();
      });

      expect(mockToast.error).toHaveBeenCalledWith('Please type the confirmation phrase exactly as shown');
      expect(result.current.isDeletingAccount).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('shows error when confirmation phrase has wrong case', async () => {
      const { result } = renderHook(() => useAccountDeletion());

      act(() => {
        result.current.setConfirmationPhrase('DELETE MY ACCOUNT');
      });

      await act(async () => {
        await result.current.handleDeleteAccount();
      });

      expect(mockToast.error).toHaveBeenCalledWith('Please type the confirmation phrase exactly as shown');
      expect(result.current.isDeletingAccount).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('successfully deletes account', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const { result } = renderHook(() => useAccountDeletion());

      act(() => {
        result.current.setConfirmationPhrase('delete my account');
        result.current.setShowDeleteAccountDialog(true);
      });

      await act(async () => {
        await result.current.handleDeleteAccount();
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(mockToast.success).toHaveBeenCalledWith('Account deleted successfully');
      expect(result.current.showDeleteAccountDialog).toBe(false);
      expect(result.current.confirmationPhrase).toBe('');
      expect(result.current.isDeletingAccount).toBe(false);
    });

    it('handles API error with error message', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Custom error message' })
      });

      const { result } = renderHook(() => useAccountDeletion());

      act(() => {
        result.current.setConfirmationPhrase('delete my account');
      });

      await act(async () => {
        await result.current.handleDeleteAccount();
      });

      expect(mockToast.error).toHaveBeenCalledWith('Custom error message');
      expect(result.current.isDeletingAccount).toBe(false);
      expect(mockConsoleError).toHaveBeenCalledWith('Error deleting account:', expect.any(Error));
    });

    it('handles API error without error message', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({})
      });

      const { result } = renderHook(() => useAccountDeletion());

      act(() => {
        result.current.setConfirmationPhrase('delete my account');
      });

      await act(async () => {
        await result.current.handleDeleteAccount();
      });

      expect(mockToast.error).toHaveBeenCalledWith('Failed to delete account');
      expect(result.current.isDeletingAccount).toBe(false);
      expect(mockConsoleError).toHaveBeenCalledWith('Error deleting account:', expect.any(Error));
    });

    it('handles network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAccountDeletion());

      act(() => {
        result.current.setConfirmationPhrase('delete my account');
      });

      await act(async () => {
        await result.current.handleDeleteAccount();
      });

      expect(mockToast.error).toHaveBeenCalledWith('Network error');
      expect(result.current.isDeletingAccount).toBe(false);
      expect(mockConsoleError).toHaveBeenCalledWith('Error deleting account:', expect.any(Error));
    });

    it('handles non-Error exception', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce('String error');

      const { result } = renderHook(() => useAccountDeletion());

      act(() => {
        result.current.setConfirmationPhrase('delete my account');
      });

      await act(async () => {
        await result.current.handleDeleteAccount();
      });

      expect(mockToast.error).toHaveBeenCalledWith('Failed to delete account');
      expect(result.current.isDeletingAccount).toBe(false);
      expect(mockConsoleError).toHaveBeenCalledWith('Error deleting account:', 'String error');
    });

    it('sets loading state during deletion process', async () => {
      let resolvePromise: (value: any) => void;
      const deletePromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValueOnce(deletePromise);

      const { result } = renderHook(() => useAccountDeletion());

      act(() => {
        result.current.setConfirmationPhrase('delete my account');
      });

      // Start deletion (don't await yet)
      act(() => {
        result.current.handleDeleteAccount();
      });

      // Check that isDeletingAccount is true during the process
      expect(result.current.isDeletingAccount).toBe(true);

      // Complete the deletion
      await act(async () => {
        resolvePromise!({
          ok: true,
          json: async () => ({ success: true })
        });
        await deletePromise;
      });

      expect(result.current.isDeletingAccount).toBe(false);
    });

    it('handles JSON parsing error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => { throw new Error('Invalid JSON'); }
      });

      const { result } = renderHook(() => useAccountDeletion());

      act(() => {
        result.current.setConfirmationPhrase('delete my account');
      });

      await act(async () => {
        await result.current.handleDeleteAccount();
      });

      expect(mockToast.error).toHaveBeenCalledWith('Invalid JSON');
      expect(result.current.isDeletingAccount).toBe(false);
      expect(mockConsoleError).toHaveBeenCalledWith('Error deleting account:', expect.any(Error));
    });

    it('handles successful response with malformed data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ malformed: 'data' })
      });

      const { result } = renderHook(() => useAccountDeletion());

      act(() => {
        result.current.setConfirmationPhrase('delete my account');
        result.current.setShowDeleteAccountDialog(true);
      });

      await act(async () => {
        await result.current.handleDeleteAccount();
      });

      expect(mockToast.success).toHaveBeenCalledWith('Account deleted successfully');
      expect(result.current.showDeleteAccountDialog).toBe(false);
      expect(result.current.confirmationPhrase).toBe('');
      expect(result.current.isDeletingAccount).toBe(false);
    });
  });

  describe('edge cases and integration scenarios', () => {
    it('handles rapid state changes', () => {
      const { result } = renderHook(() => useAccountDeletion());

      act(() => {
        result.current.setShowDeleteAccountDialog(true);
        result.current.setIsDeletingAccount(true);
        result.current.setConfirmationPhrase('test phrase');
        result.current.setShowDeleteAccountDialog(false);
        result.current.setIsDeletingAccount(false);
        result.current.setConfirmationPhrase('delete my account');
      });

      expect(result.current.showDeleteAccountDialog).toBe(false);
      expect(result.current.isDeletingAccount).toBe(false);
      expect(result.current.confirmationPhrase).toBe('delete my account');
    });

    it('handles component unmount during deletion', async () => {
      let resolvePromise: (value: any) => void;
      const deletePromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValueOnce(deletePromise);

      const { result, unmount } = renderHook(() => useAccountDeletion());

      act(() => {
        result.current.setConfirmationPhrase('delete my account');
      });

      // Start deletion
      act(() => {
        result.current.handleDeleteAccount();
      });

      expect(result.current.isDeletingAccount).toBe(true);

      // Unmount component
      unmount();

      // Complete the deletion (should not cause errors)
      await act(async () => {
        resolvePromise!({
          ok: true,
          json: async () => ({ success: true })
        });
        await deletePromise;
      });

      // Should not throw any errors
    });

    it('maintains dialog state through operations', () => {
      const { result } = renderHook(() => useAccountDeletion());

      // Open dialog
      act(() => {
        result.current.handleDeleteAccountClick();
      });
      expect(result.current.showDeleteAccountDialog).toBe(true);

      // Change other states
      act(() => {
        result.current.setIsDeletingAccount(true);
        result.current.setConfirmationPhrase('some text');
      });
      expect(result.current.showDeleteAccountDialog).toBe(true);

      // Manually close dialog
      act(() => {
        result.current.setShowDeleteAccountDialog(false);
      });
      expect(result.current.showDeleteAccountDialog).toBe(false);
    });

    it('handles session changes during component lifecycle', async () => {
      const { result, rerender } = renderHook(() => useAccountDeletion());

      // Initially authenticated
      expect(result.current.requiredPhrase).toBe('delete my account');

      // Change session to unauthenticated
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn()
      });

      rerender();

      // Try to delete account while unauthenticated
      act(() => {
        result.current.setConfirmationPhrase('delete my account');
      });

      await act(async () => {
        await result.current.handleDeleteAccount();
      });

      expect(mockToast.error).toHaveBeenCalledWith('You must be logged in to delete your account');
    });

    it('handles confirmation phrase with extra whitespace', async () => {
      const { result } = renderHook(() => useAccountDeletion());

      act(() => {
        result.current.setConfirmationPhrase('  delete my account  ');
      });

      await act(async () => {
        await result.current.handleDeleteAccount();
      });

      expect(mockToast.error).toHaveBeenCalledWith('Please type the confirmation phrase exactly as shown');
      expect(result.current.isDeletingAccount).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('maintains state consistency during successful deletion', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const { result } = renderHook(() => useAccountDeletion());

      // Set up initial state
      act(() => {
        result.current.setShowDeleteAccountDialog(true);
        result.current.setConfirmationPhrase('delete my account');
      });

      expect(result.current.showDeleteAccountDialog).toBe(true);
      expect(result.current.confirmationPhrase).toBe('delete my account');

      await act(async () => {
        await result.current.handleDeleteAccount();
      });

      // State should be reset after successful deletion
      expect(result.current.showDeleteAccountDialog).toBe(false);
      expect(result.current.confirmationPhrase).toBe('');
      expect(result.current.isDeletingAccount).toBe(false);
    });

    it('preserves state after failed deletion', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Server error'));

      const { result } = renderHook(() => useAccountDeletion());

      // Set up initial state
      act(() => {
        result.current.setShowDeleteAccountDialog(true);
        result.current.setConfirmationPhrase('delete my account');
      });

      await act(async () => {
        await result.current.handleDeleteAccount();
      });

      // Dialog should remain open after failed deletion
      expect(result.current.showDeleteAccountDialog).toBe(true);
      expect(result.current.confirmationPhrase).toBe('delete my account');
      expect(result.current.isDeletingAccount).toBe(false);
    });
  });

  describe('session edge cases', () => {
    it('handles session with undefined user', async () => {
      mockUseSession.mockReturnValue({
        data: { ...mockSession, user: undefined as any },
        status: 'authenticated',
        update: jest.fn()
      });

      const { result } = renderHook(() => useAccountDeletion());

      await act(async () => {
        await result.current.handleDeleteAccount();
      });

      expect(mockToast.error).toHaveBeenCalledWith('You must be logged in to delete your account');
      expect(result.current.isDeletingAccount).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('handles session with null user ID', async () => {
      mockUseSession.mockReturnValue({
        data: { ...mockSession, user: { ...mockSession.user, id: null as any } },
        status: 'authenticated',
        update: jest.fn()
      });

      const { result } = renderHook(() => useAccountDeletion());

      await act(async () => {
        await result.current.handleDeleteAccount();
      });

      expect(mockToast.error).toHaveBeenCalledWith('You must be logged in to delete your account');
      expect(result.current.isDeletingAccount).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('handles undefined session data', async () => {
      mockUseSession.mockReturnValue({
        data: undefined as any,
        status: 'loading',
        update: jest.fn()
      });

      const { result } = renderHook(() => useAccountDeletion());

      await act(async () => {
        await result.current.handleDeleteAccount();
      });

      expect(mockToast.error).toHaveBeenCalledWith('You must be logged in to delete your account');
      expect(result.current.isDeletingAccount).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
