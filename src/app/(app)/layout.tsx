import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  const headersList = headers();
  
  // Get the pathname from various header sources
  const pathname = headersList.get('x-pathname') || 
                   headersList.get('x-invoke-path') || 
                   headersList.get('x-middleware-request-pathname') ||
                   '';

  // Define routes that require authentication
  const protectedRoutes = ['/admin', '/upload'];
  const requiresAuth = protectedRoutes.some(route => pathname.startsWith(route));

  // Redirect to sign-in if not authenticated and accessing protected route
  if (!session && requiresAuth) {
    redirect('/auth/signin');
  }

  return <>{children}</>;
}