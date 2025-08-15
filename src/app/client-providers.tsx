'use client';

import { ThemeProvider } from '@providers/ThemeProvider';
import { SessionProvider } from '@providers/SessionProvider';
import { Toaster } from 'react-hot-toast';

interface ClientProvidersProps {
  children: React.ReactNode;
  session?: any;
}

export function ClientProviders({ children, session }: ClientProvidersProps) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider>
        {children}
        <Toaster position="bottom-left" />
      </ThemeProvider>
    </SessionProvider>
  );
}
