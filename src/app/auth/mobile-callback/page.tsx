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
  const [retryCount, setRetryCount] = useState(0);

  // Main effect for handling session and redirection
  useEffect(() => {
    console.log("Mobile callback - Session status:", status);
    console.log("Mobile callback - Session data:", session);
    setDebugInfo(`Session status: ${status}, Has token: ${session?.accessToken ? 'Yes' : 'No'}, Retry: ${retryCount}`);
    
    // Check if this is a redirect from an error or payment page
    const isErrorRedirect = searchParams?.get('iosRedirect') === 'true';
    if (isErrorRedirect) {
      setDebugInfo(prev => `${prev}\nDetected iOS redirect from error/payment page`);
    }
    
    // Still loading and not an error redirect - wait for session
    if (status === 'loading' && !isErrorRedirect && retryCount < 5) return;
    
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
        
        // Check all possible iOS indicators
        isIosAuth = stateData.platform === 'ios' || 
                    stateData.iosBypass === true || 
                    (stateData.authId && stateData.authId.startsWith('ios-auth-'));
      }
    } catch (e) {
      console.error('Error parsing state:', e);
      setDebugInfo(prev => `${prev}\nError parsing state: ${e}`);
    }
    
    // If we couldn't determine if this is iOS auth from state, check the session
    if (!isIosAuth && session) {
      isIosAuth = (session as any).isIosApp === true || (session as any).iosBypass === true;
    }
    
    // Force iOS auth for error redirects with state
    if (!isIosAuth && isErrorRedirect && state) {
      console.log("Mobile callback - Forcing iOS auth due to redirect");
      setDebugInfo(prev => `${prev}\nForcing iOS auth flag due to redirect param`);
      isIosAuth = true;
    }
    
    if (!isIosAuth) {
      console.log("Mobile callback - Not an iOS authentication flow");
      setDebugInfo(prev => `${prev}\nNot identified as iOS auth flow`);
      setRedirecting(false);
      setError('Invalid authentication flow');
      
      // Redirect to web app after a short delay
      const fallbackTimer = setTimeout(() => {
        router.push('/upload');
      }, 3000);
      
      return () => clearTimeout(fallbackTimer);
    }
    
    // We've confirmed this is an iOS auth flow
    setDebugInfo(prev => `${prev}\nConfirmed iOS authentication flow`);
    
    // Authenticated - redirect with token
    if (status === 'authenticated' && session && !redirectAttempted) {
      const token = session.accessToken || '';
      setDebugInfo(prev => `${prev}\nToken available: ${Boolean(token)}`);
      
      // Get the redirect URL from state or use default
      const redirectUrl = stateData.redirect || 'health.revly://auth';
      const fullRedirectUrl = `${redirectUrl}?token=${token}`;
      
      console.log('Mobile callback - Redirecting to app:', fullRedirectUrl);
      setDebugInfo(prev => `${prev}\nRedirecting to iOS app: ${fullRedirectUrl}`);
      
      // Mark redirect as attempted to prevent multiple attempts
      setRedirectAttempted(true);
      
      // Actual redirect to the iOS app
      const redirectTimer = setTimeout(() => {
        window.location.href = fullRedirectUrl;
      }, 1000);
      
      return () => clearTimeout(redirectTimer);
    } 
    // No authentication yet but still loading - retry with timer
    else if (status === 'loading' && !redirectAttempted && retryCount < 10) {
      const retryTimer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 500);
      
      return () => clearTimeout(retryTimer);
    }
    // Unauthenticated or error redirect - still redirect to app with error
    else if ((status === 'unauthenticated' || isErrorRedirect || retryCount >= 10) && !redirectAttempted) {
      setRedirecting(false);
      setError('Authentication incomplete but redirecting to app anyway');
      setDebugInfo(prev => `${prev}\nFallback redirect: Auth process incomplete`);
      
      // Still redirect to app with error code
      if (stateData.redirect) {
        const errorCode = retryCount >= 10 ? 'timeout' : 'auth_incomplete';
        const errorRedirectUrl = `${stateData.redirect}?error=${errorCode}&authId=${stateData.authId || ''}`;
        setDebugInfo(prev => `${prev}\nSending to iOS app with error: ${errorRedirectUrl}`);
        
        // Mark redirect as attempted
        setRedirectAttempted(true);
        
        const errorTimer = setTimeout(() => {
          window.location.href = errorRedirectUrl;
        }, 1500);
        
        return () => clearTimeout(errorTimer);
      }
    }
  }, [router, searchParams, session, status, redirectAttempted, retryCount]);
  
  // Super fallback redirect as a last resort to avoid getting stuck
  useEffect(() => {
    const fallbackTimeout = setTimeout(() => {
      if (redirecting && !redirectAttempted) {
        setDebugInfo(prev => `${prev}\nULTIMATE FALLBACK triggered after timeout`);
        
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
          console.error('Error in ultimate fallback:', e);
        }
        
        // Last resort if we couldn't extract redirect URL
        router.push('/upload');
      }
    }, 12000);
    
    return () => clearTimeout(fallbackTimeout);
  }, [router, searchParams, redirecting, redirectAttempted]);

  // Error state UI
  if (!redirecting && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-lg">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Authentication Status
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {error}
          </p>
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

  // Default loading UI
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center max-w-lg">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Completing Authentication
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Redirecting you back to the app... {retryCount > 0 ? `(retry ${retryCount}/10)` : ''}
        </p>
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