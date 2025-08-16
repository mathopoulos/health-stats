import { useCallback } from 'react';
import { AdminHeader } from './AdminHeader';
import { UsersList } from './UserManagement/UsersList';
import { DeleteUserModal } from './UserManagement/DeleteUserModal';
import { useAdminAuth, useUsersData, useDeleteUser } from '../hooks';
import { ADMIN_MESSAGES } from '../utils';

export function AdminLayout() {
  const { isAdmin, isLoading, session } = useAdminAuth();
  const { users, loading, stats, refetchUsers } = useUsersData(isAdmin);
  
  const handleUserDeleted = useCallback((deletedUserId: string) => {
    refetchUsers();
  }, [refetchUsers]);

  const {
    deletingUserId,
    deleteConfirmation,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    updateConfirmationText,
  } = useDeleteUser(users, handleUserDeleted);

  // Show loading or unauthorized access
  if (isLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{ADMIN_MESSAGES.LOADING}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminHeader userEmail={session?.user?.email || ''} />
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UsersList
          users={users}
          stats={stats}
          loading={loading}
          onDeleteClick={handleDeleteClick}
          deletingUserId={deletingUserId}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteUserModal
        deleteConfirmation={deleteConfirmation}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        onConfirmationTextChange={updateConfirmationText}
        isDeleting={!!deletingUserId}
      />
    </div>
  );
}
