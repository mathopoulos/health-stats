import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import type { 
  UserData, 
  DeleteConfirmation, 
  UseDeleteUserReturn, 
  DeleteUserResponse 
} from '../types';
import { 
  API_ENDPOINTS, 
  ADMIN_MESSAGES, 
  generateDeleteConfirmationText, 
  isValidDeleteConfirmation 
} from '../utils';

export function useDeleteUser(
  users: UserData[],
  onUserDeleted: (deletedUserId: string) => void
): UseDeleteUserReturn {
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation>({
    user: null,
    isOpen: false,
    confirmationText: ''
  });

  const handleDeleteClick = useCallback((user: UserData) => {
    setDeleteConfirmation({
      user,
      isOpen: true,
      confirmationText: ''
    });
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirmation({ 
      user: null, 
      isOpen: false, 
      confirmationText: '' 
    });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirmation.user) return;
    
    const expectedText = generateDeleteConfirmationText(deleteConfirmation.user);
    
    if (!isValidDeleteConfirmation(deleteConfirmation.confirmationText, expectedText)) {
      toast.error(ADMIN_MESSAGES.CONFIRMATION_TEXT_ERROR);
      return;
    }

    setDeletingUserId(deleteConfirmation.user.userId);
    
    try {
      const response = await fetch(API_ENDPOINTS.DELETE_USER, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: deleteConfirmation.user.userId
        }),
      });

      const data: DeleteUserResponse = await response.json();

      if (data.success) {
        toast.success(data.message || ADMIN_MESSAGES.DELETE_USER_SUCCESS);
        onUserDeleted(deleteConfirmation.user.userId);
        setDeleteConfirmation({ user: null, isOpen: false, confirmationText: '' });
      } else {
        toast.error(data.error || ADMIN_MESSAGES.DELETE_USER_ERROR);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(ADMIN_MESSAGES.DELETE_USER_ERROR);
    } finally {
      setDeletingUserId(null);
    }
  }, [deleteConfirmation, onUserDeleted]);

  const deleteUser = useCallback(async (user: UserData) => {
    handleDeleteClick(user);
  }, [handleDeleteClick]);

  const updateConfirmationText = useCallback((text: string) => {
    setDeleteConfirmation(prev => ({
      ...prev,
      confirmationText: text
    }));
  }, []);

  return {
    deleteUser,
    deletingUserId,
    deleteConfirmation,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    updateConfirmationText,
  };
}
