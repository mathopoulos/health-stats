'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to unified upload page with more tab
    router.replace('/upload?tab=more');
  }, [router]);

  // Show nothing while redirecting
  return null;
}