'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

export function SessionProvider({ children, session }: { children: React.ReactNode; session?: any }) {
  return (
    <NextAuthSessionProvider 
      session={session}
      // Configure session refresh behavior to fix preview deployment issues
      refetchInterval={0} // Disable automatic session refetching
      refetchOnWindowFocus={true} // Keep window focus refetch to help with race conditions
      refetchWhenOffline={false} // Don't refetch when offline
    >
      {children}
    </NextAuthSessionProvider>
  );
}


