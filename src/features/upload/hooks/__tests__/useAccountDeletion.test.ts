import { renderHook } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { useAccountDeletion } from '../useAccountDeletion';

// Mock dependencies
jest.mock('next-auth/react');
jest.mock('react-hot-toast');

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockToast = toast as jest.MockedFunction<typeof toast>;

describe('useAccountDeletion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToast.success = jest.fn();
    mockToast.error = jest.fn();
    mockUseSession.mockReturnValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      status: 'authenticated',
      update: jest.fn(),
    });
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useAccountDeletion());

    expect(result.current.showDeleteAccountDialog).toBe(false);
    expect(result.current.isDeletingAccount).toBe(false);
    expect(result.current.confirmationPhrase).toBe('');
    expect(result.current.requiredPhrase).toBe('delete my account');
  });

  it('has all required functions', () => {
    const { result } = renderHook(() => useAccountDeletion());

    expect(typeof result.current.setShowDeleteAccountDialog).toBe('function');
    expect(typeof result.current.setIsDeletingAccount).toBe('function');
    expect(typeof result.current.setConfirmationPhrase).toBe('function');
    expect(typeof result.current.handleDeleteAccountClick).toBe('function');
    expect(typeof result.current.handleDeleteAccount).toBe('function');
  });
});
