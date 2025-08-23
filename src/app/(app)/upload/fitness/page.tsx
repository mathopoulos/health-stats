'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FitnessRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to unified upload page with fitness tab
    router.replace('/upload?tab=fitness');
  }, [router]);

  // Show nothing while redirecting
  return null;
}