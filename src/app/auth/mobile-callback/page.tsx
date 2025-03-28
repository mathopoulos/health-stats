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
  const [redirectAttempted, setRedirectAttempted] = useState(false);

  useEffect(() => {
    // Log session status for debugging
    console.log("Mobile callback - Session status:", status);
    console.log("Mobile callback - Session data:", session);
    setDebugInfo(`Session status: ${status}, Has token: ${session?.accessToken ? 'Yes' : 'No'}`);
    
    // Only proceed if we have a valid session or authentication error
    if (status === 'loading') return;
    
    // Extract state from URL if present
    const state = searchParams?.get('state');
    console.log("Mobile callback - State from URL:", state);
    
    let stateData: any = {};
    let isIosAuth = false;
    
    try {
      if (state) {
        stateData = JSON.parse(state);
        console.log("Mobile callback - Parsed state data:", stateData);
        setDebugInfo(prev => `${prev}\nParsed state: ${JSON.stringify(stateData)}`);
        isIosAuth = stateData.platform === 'ios';
      }
    } catch (e) {
      console.error('Error parsing state:', e);
      setDebugInfo(prev => `${prev}\nError parsing state: ${e}`);
    }
    
    // If we couldn't determine if this is iOS auth from state, check the session
    if (!isIosAuth && session) {
      isIosAuth = (session as any).isIosApp === true;
    }
    
    if (!isIosAuth) {
      console.log("Mobile callback - Not an iOS authentication");
      setDebugInfo(prev => `${prev}\nNot an iOS authentication flow`);
      setRedirecting(false);
      setError('Invalid authentication flow');
      
      // Redirect to main app after a short delay
      const fallbackTimer = setTimeout(() => {
        router.push('/upload');
      }, 3000);
      
      return () => clearTimeout(fallbackTimer);
    }
    
    // We've confirmed this is an iOS auth flow
    setDebugInfo(prev => `${prev}\nConfirmed iOS authentication flow`);
    
    // Handle successful authentication
    if (status === 'authenticated' && session && !redirectAttempted) {
      // Get the token from the session
      const token = session.accessToken || '';
      setDebugInfo(prev => `${prev}\nAuthenticated with token: ${token ? token.substring(0, 10) + '...' : 'missing'}`);
      
      // Get the redirect URL from state or use default
      const redirectUrl = stateData.redirect || 'health.revly://auth';
      const fullRedirectUrl = `${redirectUrl}?token=${token}`;
      
      console.log('Mobile callback - Redirecting to app:', fullRedirectUrl);
      setDebugInfo(prev => `${prev}\nRedirecting to: ${fullRedirectUrl}`);
      
      // Prevent multiple redirect attempts
      setRedirectAttempted(true);
      
      // Redirect to the iOS app with token
      const redirectTimer = setTimeout(() => {
        window.location.href = fullRedirectUrl;
      }, 1000);
      
      return () => clearTimeout(redirectTimer);
    } else if (status === 'unauthenticated') {
      // Authentication failed
      setRedirecting(false);
      setError('Google authentication failed');
      setDebugInfo(prev => `${prev}\nGoogle authentication failed`);
      
      // Redirect to error URL if available
      if (stateData.redirect) {
        const errorRedirectUrl = `${stateData.redirect}?error=auth_failed`;
        
        const errorTimer = setTimeout(() => {
          window.location.href = errorRedirectUrl;
        }, 2000);
        
        return () => clearTimeout(errorTimer);
      }
    }
    
  }, [router, searchParams, session, status, redirectAttempted]);
  
  // Add fallback redirect in case something goes wrong
  useEffect(() => {
    const fallbackTimeout = setTimeout(() => {
      if (redirecting && !redirectAttempted) {
        setDebugInfo(prev => `${prev}\nFallback redirect triggered after timeout`);
        
        // Try to extract redirect URL from state
        try {
          const state = searchParams?.get('state');
          if (state) {
            const stateData = JSON.parse(state);
            if (stateData.redirect) {
              window.location.href = `${stateData.redirect}?error=timeout`;
              setRedirectAttempted(true);
              return;
            }
          }
        } catch (e) {
          console.error('Error in fallback redirect:', e);
        }
        
        // Default fallback if we couldn't extract redirect URL
        router.push('/upload');
      }
    }, 10000); // 10 second timeout
    
    return () => clearTimeout(fallbackTimeout);
  }, [router, searchParams, redirecting, redirectAttempted]);

  if (!redirecting && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-lg">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Authentication Error
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {error}. Redirecting...
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