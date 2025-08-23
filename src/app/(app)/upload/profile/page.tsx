'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfileRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to unified upload page with profile tab
    router.replace('/upload?tab=profile');
  }, [router]);

  // Show nothing while redirecting
  return null;
}