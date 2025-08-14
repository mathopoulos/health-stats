'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@providers/ThemeProvider';
import { SessionProvider } from '@providers/SessionProvider';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/react';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </SessionProvider>
        <Toaster position="bottom-left" />
        <Analytics />
      </body>
    </html>
  );
}
