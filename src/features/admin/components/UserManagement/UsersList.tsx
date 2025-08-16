import type { UserData, AdminStats } from '../../types';
import { UserStats } from './UserStats';
import { UsersTable } from './UsersTable';
import { ADMIN_MESSAGES } from '../../utils';

interface UsersListProps {
  users: UserData[];
  stats: AdminStats;
  loading: boolean;
  onDeleteClick: (user: UserData) => void;
  deletingUserId: string | null;
}

export function UsersList({ 
  users, 
  stats, 
  loading, 
  onDeleteClick, 
  deletingUserId 
}: UsersListProps) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">{ADMIN_MESSAGES.LOADING}</p>
      </div>
    );
  }

  return (
    <>
      <UserStats stats={stats} />
      <UsersTable 
        users={users} 
        onDeleteClick={onDeleteClick}
        deletingUserId={deletingUserId}
      />
    </>
  );
}
