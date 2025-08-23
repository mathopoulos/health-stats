'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BloodRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to unified upload page with blood tab
    router.replace('/upload?tab=blood');
  }, [router]);

  // Show nothing while redirecting
  return null;
}