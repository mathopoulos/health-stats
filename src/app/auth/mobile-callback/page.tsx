'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function MobileCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [redirecting, setRedirecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get state from query params
    const state = searchParams?.get('state');
    let stateData: any = {};
    
    try {
      if (state) {
        stateData = JSON.parse(state);
      }
    } catch (e) {
      console.error('Error parsing state:', e);
    }
    
    // Check if this is for the iOS app
    if (stateData.platform === 'ios' && stateData.redirect) {
      const mobileRedirectUrl = `${stateData.redirect}?token=${session?.accessToken || ''}`;
      console.log('Redirecting to mobile app:', mobileRedirectUrl);
      
      // Use a short timeout to ensure the session is ready
      const redirectTimer = setTimeout(() => {
        window.location.href = mobileRedirectUrl;
      }, 1000);
      
      return () => clearTimeout(redirectTimer);
    } else {
      // Not for mobile or missing redirect info
      setRedirecting(false);
      setError('Invalid redirect parameters');
      
      // Redirect to upload page after a delay
      const fallbackTimer = setTimeout(() => {
        router.push('/upload');
      }, 3000);
      
      return () => clearTimeout(fallbackTimer);
    }
  }, [router, searchParams, session]);

  if (!redirecting && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Authentication Error
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {error}. Redirecting to dashboard...
          </p>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Completing Authentication
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Redirecting you back to the app...
        </p>
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500 mx-auto"></div>
        </div>
      </div>
    </div>
  );
} 