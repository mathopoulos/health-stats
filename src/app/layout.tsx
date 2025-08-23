import { Inter } from 'next/font/google';
import './globals.css';
import { ClientProviders } from './client-providers';
import { Analytics } from '@vercel/analytics/react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Health Stats - Track Your Health Metrics',
  description: 'Track and monitor your health metrics in one place. Upload health data, monitor biomarkers, and optimize your wellness journey.',
  keywords: 'health tracking, biomarkers, fitness metrics, wellness, health data',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ClientProviders session={session}>
          {children}
        </ClientProviders>
        <Analytics />
      </body>
    </html>
  );
}
