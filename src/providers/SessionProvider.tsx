'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

export function SessionProvider({ children, session }: { children: React.ReactNode; session?: any }) {
  return (
    <NextAuthSessionProvider
      session={session}
      refetchOnWindowFocus={true}
      refetchInterval={1}
    >
      {children}
    </NextAuthSessionProvider>
  );
}


