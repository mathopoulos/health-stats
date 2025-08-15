import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard - Health Stats',
  description: 'Administrative dashboard for managing users and system data.',
  robots: 'noindex, nofollow', // Don't index admin pages
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
