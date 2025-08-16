import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { UseAdminAuthReturn } from '../types';
import { ADMIN_EMAIL } from '../utils';

export function useAdminAuth(): UseAdminAuthReturn {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isAdmin = Boolean(session?.user?.email === ADMIN_EMAIL);
  const isLoading = status === 'loading';

  // Check admin access and redirect if not authorized
  useEffect(() => {
    if (isLoading) return;
    
    if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
      router.push('/');
      return;
    }
  }, [session, isLoading, router]);

  return {
    isAdmin,
    isLoading,
    session,
  };
}
