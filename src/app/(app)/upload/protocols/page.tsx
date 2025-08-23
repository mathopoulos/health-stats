'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProtocolsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to unified upload page with protocols tab
    router.replace('/upload?tab=protocols');
  }, [router]);

  // Show nothing while redirecting
  return null;
}
