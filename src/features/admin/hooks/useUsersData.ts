import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import type { UserData, UseUsersDataReturn, AdminUsersResponse } from '../types';
import { API_ENDPOINTS, ADMIN_MESSAGES, calculateAdminStats } from '../utils';

export function useUsersData(isAdmin: boolean): UseUsersDataReturn {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(API_ENDPOINTS.ADMIN_USERS);
      const data: AdminUsersResponse = await response.json();
      
      if (data.success) {
        setUsers(data.users);
      } else {
        const errorMessage = data.error || ADMIN_MESSAGES.FETCH_USERS_ERROR;
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (fetchError) {
      console.error('Error fetching users:', fetchError);
      const errorMessage = ADMIN_MESSAGES.FETCH_USERS_ERROR;
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  // Fetch users when admin status changes
  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, fetchUsers]);

  const stats = calculateAdminStats(users);

  return {
    users,
    loading,
    error,
    refetchUsers: fetchUsers,
    stats,
  };
}
