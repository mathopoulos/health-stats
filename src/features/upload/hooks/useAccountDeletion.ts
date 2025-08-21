'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

export interface UseAccountDeletionReturn {
  // Delete account state
  showDeleteAccountDialog: boolean;
  setShowDeleteAccountDialog: (show: boolean) => void;
  isDeletingAccount: boolean;
  setIsDeletingAccount: (deleting: boolean) => void;
  confirmationPhrase: string;
  setConfirmationPhrase: (phrase: string) => void;
  requiredPhrase: string;
  
  // Handlers
  handleDeleteAccountClick: () => void;
  handleDeleteAccount: () => Promise<void>;
}

export function useAccountDeletion(): UseAccountDeletionReturn {
  const { data: session } = useSession();
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [confirmationPhrase, setConfirmationPhrase] = useState('');
  const requiredPhrase = 'delete my account';

  const handleDeleteAccountClick = () => {
    setShowDeleteAccountDialog(true);
    setConfirmationPhrase('');
  };

  const handleDeleteAccount = async () => {
    if (!session?.user?.id) {
      toast.error('You must be logged in to delete your account');
      return;
    }

    if (confirmationPhrase !== requiredPhrase) {
      toast.error('Please type the confirmation phrase exactly as shown');
      return;
    }

    setIsDeletingAccount(true);

    try {
      const response = await fetch('/api/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      toast.success('Account deleted successfully');
      setShowDeleteAccountDialog(false);
      setConfirmationPhrase('');
      
      // Sign out will be handled by the parent component or API response
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete account');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return {
    showDeleteAccountDialog,
    setShowDeleteAccountDialog,
    isDeletingAccount,
    setIsDeletingAccount,
    confirmationPhrase,
    setConfirmationPhrase,
    requiredPhrase,
    handleDeleteAccountClick,
    handleDeleteAccount,
  };
}
