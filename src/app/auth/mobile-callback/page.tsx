'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function MobileCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [redirecting, setRedirecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('Initializing...');

  useEffect(() => {
    // Log session status for debugging
    console.log("Session status:", status);
    console.log("Session data:", session);
    setDebugInfo(`Session status: ${status}, Has token: ${session?.accessToken ? 'Yes' : 'No'}`);
    
    // Only proceed if session is loaded
    if (status === 'loading') return;
    
    // Get state from query params
    const state = searchParams?.get('state');
    console.log("State from URL:", state);
    
    let stateData: any = {};
    
    try {
      if (state) {
        stateData = JSON.parse(state);
        console.log("Parsed state data:", stateData);
        setDebugInfo(prev => `${prev}\nParsed state: ${JSON.stringify(stateData)}`);
      }
    } catch (e) {
      console.error('Error parsing state:', e);
      setDebugInfo(prev => `${prev}\nError parsing state: ${e}`);
    }
    
    // If we have a session and it's authenticated, redirect to the iOS app
    if (status === 'authenticated' && session) {
      const token = session.accessToken || '';
      setDebugInfo(prev => `${prev}\nAuthenticated with token: ${token ? token.substring(0, 10) + '...' : 'missing'}`);
      
      // If we have platform=ios in the state, or the session is marked as iOS
      if ((stateData.platform === 'ios' && stateData.redirect) || (session as any).isIosApp) {
        const redirectUrl = stateData.redirect || 'health.revly://auth';
        const mobileRedirectUrl = `${redirectUrl}?token=${token}`;
        
        console.log('Redirecting to mobile app:', mobileRedirectUrl);
        setDebugInfo(prev => `${prev}\nRedirecting to: ${mobileRedirectUrl}`);
        
        // Use a short timeout to ensure the session is ready
        const redirectTimer = setTimeout(() => {
          window.location.href = mobileRedirectUrl;
        }, 1000);
        
        return () => clearTimeout(redirectTimer);
      } else {
        // Not for mobile or missing redirect info
        setRedirecting(false);
        setError('Session authenticated but not marked for iOS app');
        setDebugInfo(prev => `${prev}\nNot an iOS auth session`);
      }
    } else if (status === 'unauthenticated') {
      // No authenticated session
      setRedirecting(false);
      setError('Authentication failed');
      setDebugInfo(prev => `${prev}\nSession is unauthenticated`);
    }
    
    // Redirect to upload page after a delay
    const fallbackTimer = setTimeout(() => {
      router.push('/upload');
    }, 5000);
    
    return () => clearTimeout(fallbackTimer);
  }, [router, searchParams, session, status]);

  if (!redirecting && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-lg">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Authentication Error
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {error}. Redirecting to dashboard...
          </p>
          {/* Debug information */}
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded text-left text-xs overflow-auto max-h-60">
            <pre>{debugInfo}</pre>
          </div>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center max-w-lg">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Completing Authentication
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Redirecting you back to the app...
        </p>
        {/* Debug information */}
        <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded text-left text-xs overflow-auto max-h-60">
          <pre>{debugInfo}</pre>
        </div>
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500 mx-auto"></div>
        </div>
      </div>
    </div>
  );
} 