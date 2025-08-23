'use client';

import { signIn } from "next-auth/react";
import ThemeToggle from "@components/ThemeToggle";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignIn() {
  const [isNewUser, setIsNewUser] = useState(false);
  const [hasValidInvite, setHasValidInvite] = useState(false);
  const [validatedEmail, setValidatedEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [comingFromPayment, setComingFromPayment] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if this is a new sign-up (coming from outside) or a returning user
    // "invite_required" query param can be set to "true" to force the invite flow
    const inviteRequiredParam = searchParams?.get('invite_required');
    const inviteCodeValidated = sessionStorage.getItem('inviteCodeValidated') === 'true';
    const validatedEmailFromSession = sessionStorage.getItem('validatedEmail');
    
    // Check for preview URL from query parameters (when redirected from preview deployment)
    const previewUrlParam = searchParams?.get('previewUrl');
    if (previewUrlParam) {
      setPreviewUrl(previewUrlParam);
      console.log("🔍 AUTH FLOW: Preview URL from query params:", previewUrlParam);
    }
    
    // Check if user is coming from iOS app - Direct flag takes precedence
    const isIosApp = searchParams?.get('platform') === 'ios';
    const isDirectIosAuth = searchParams?.get('ios_direct') === 'true';
    
    // Store iOS flags in session storage for persistence through redirects
    if (isIosApp) {
      sessionStorage.setItem('isIosApp', 'true');
    }
    
    if (isDirectIosAuth) {
      sessionStorage.setItem('isDirectIosAuth', 'true');
    }
    
    // Read from session storage in case we lost params during redirects
    const isIosAppFromSession = sessionStorage.getItem('isIosApp') === 'true';
    const isDirectIosAuthFromSession = sessionStorage.getItem('isDirectIosAuth') === 'true';
    
    const finalIsIosApp = isIosApp || isIosAppFromSession;
    const finalIsDirectIosAuth = isDirectIosAuth || isDirectIosAuthFromSession;
    
    // Check if user is coming from payment
    const paymentStatus = sessionStorage.getItem('justCompletedPayment');
    if (paymentStatus === 'pending') {
      // User is coming from payment, update the flag
      sessionStorage.setItem('justCompletedPayment', 'true');
      setComingFromPayment(true);
    }
    
    // Skip invite for iOS users
    const requireInvite = inviteRequiredParam === 'true' && !finalIsIosApp;
    
    setIsNewUser(requireInvite);
    setHasValidInvite(inviteCodeValidated);
    setValidatedEmail(validatedEmailFromSession);
    setLoading(false);

    // If this is a direct iOS auth, trigger sign-in immediately
    if (finalIsDirectIosAuth) {
      // Slight delay to ensure the component is fully mounted
      const timer = setTimeout(() => {
        console.log('Auto-triggering sign-in for direct iOS auth');
        handleSignIn(finalIsIosApp, finalIsDirectIosAuth);
        // Clear the direct auth flag after use
        sessionStorage.removeItem('isDirectIosAuth');
      }, 500);
      
      return () => clearTimeout(timer);
    }
    
    // Only redirect to invite if needed and not from iOS
    if (requireInvite && !inviteCodeValidated && !comingFromPayment && !finalIsIosApp) {
      router.push('/auth/invite');
    }
  }, [router, searchParams, comingFromPayment]);

  // Refactor handleSignIn to accept parameters for more control
  const handleSignIn = async (isIosApp?: boolean, isDirectIosAuth?: boolean) => {
    // Check if authenticating from iOS app - use passed param or check search params
    const iosParam = searchParams?.get('platform') === 'ios';
    const iosSessionFlag = sessionStorage.getItem('isIosApp') === 'true';
    const finalIsIosApp = isIosApp || iosParam || iosSessionFlag;
    
    console.log("iOS authentication:", finalIsIosApp, "Direct:", isDirectIosAuth);
    const callbackUrl = searchParams?.get('callback_url') || '/upload';
    
    // Check if we're on a Vercel preview deployment  
    const isPreview = window.location.hostname.includes('vercel.app') && 
                     !window.location.hostname.includes('www.revly.health');
    
    console.log("🔍 AUTH FLOW: Environment detected", { isPreview, finalIsIosApp });
    
    // For preview deployments, redirect to production signin with state
    if (isPreview && !finalIsIosApp) {
      const previewUrl = window.location.origin + callbackUrl;
      console.log("🔍 AUTH FLOW: Preview detected, redirecting to production signin");
      console.log("🔍 AUTH FLOW: Preview URL to preserve:", previewUrl);
      
      // Redirect to production signin page with previewUrl as query parameter
      const productionSigninUrl = `https://www.revly.health/auth/signin?callbackUrl=${encodeURIComponent('/upload')}&previewUrl=${encodeURIComponent(previewUrl)}`;
      console.log("🔍 AUTH FLOW: Redirecting to production signin:", productionSigninUrl);
      window.location.href = productionSigninUrl;
      return;
    }
    
    // State data for production/iOS flows
    const stateData: any = {};
    
    if (validatedEmail) {
      stateData.email = validatedEmail;
    }
    
    // Store preview URL in cache if present (for redirecting back after OAuth)
    if (previewUrl) {
      // Use a simple timestamp-based key
      const cacheKey = `preview_${Date.now()}`;
      console.log("🔍 AUTH FLOW: Storing preview URL in cache with key:", cacheKey);
      
      // Store preview URL synchronously before starting OAuth
      try {
        await fetch('/api/auth/store-preview-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: cacheKey, previewUrl })
        });
        console.log("🔍 AUTH FLOW: Preview URL stored successfully");
      } catch (err) {
        console.error('Failed to store preview URL:', err);
        // Continue with OAuth even if storage fails
      }
    }
    
    // Add iOS flags if needed
    if (finalIsIosApp) {
      stateData.platform = 'ios';
      stateData.redirect = 'health.revly://auth';
      
      if (isDirectIosAuth) {
        stateData.directIosAuth = true;
      }
      
      console.log("🔍 AUTH FLOW: Added iOS platform to state", stateData);
    }
    
    console.log("🔍 AUTH FLOW: Final state data:", stateData);
    
    // Regular sign in for production or iOS
    signIn('google', { 
      callbackUrl: finalIsIosApp ? '/auth/mobile-callback' : callbackUrl,
      ...(Object.keys(stateData).length > 0 && { state: JSON.stringify(stateData) })
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-primary dark:bg-primary-dark-dark flex items-center justify-center relative">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Loading...</p>
        </div>
      </main>
    );
  }

  // If this is a new user and they don't have a valid invite yet, don't show the sign-in page
  // (they will be redirected to the invite page)
  if (isNewUser && !hasValidInvite && !comingFromPayment) {
    return null;
  }

  return (
    <main className="min-h-screen bg-primary dark:bg-primary-dark-dark flex items-center justify-center relative">
      {/* Theme Toggle */}
      <div className="fixed bottom-4 right-4 z-[100]">
        <ThemeToggle />
      </div>

      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent dark:from-indigo-500/20 dark:via-purple-500/10 pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      <div className="relative z-10 w-full max-w-md p-8">
        {/* Logo/Icon */}
        <div className="flex justify-center mb-8">
          <div className="text-4xl animate-bounce hover:scale-110 transition-transform cursor-pointer">🚀</div>
        </div>

        {/* Sign In Container */}
        <div className="w-full max-w-md space-y-8">
          {/* Title Section */}
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-3 animate-fade-in text-gray-900 dark:text-white">
              {comingFromPayment ? "Payment Successful!" : "Welcome Back"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg animate-fade-in-up">
              {comingFromPayment 
                ? "Please sign in with Google to access your account" 
                : "Sign in to track and share your health journey"}
            </p>
            
            {comingFromPayment && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                <p className="text-green-700 dark:text-green-400 text-sm">
                  Thank you for your payment! You now have lifetime access to all features.
                </p>
              </div>
            )}
          </div>

          {/* Sign In Button */}
          <div className="mt-8 space-y-6 animate-fade-in-up delay-100">
            <button
              onClick={() => handleSignIn()}
              className="w-full group bg-white/50 dark:bg-gray-900/50 backdrop-blur flex items-center justify-center gap-3 px-6 py-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                  <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                  <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                  <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                </g>
              </svg>
              <span className="text-gray-700 dark:text-gray-300 font-medium group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                Continue with Google
              </span>
            </button>
          </div>

          {/* Additional Info */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-500 animate-fade-in-up delay-200">
            By signing in, you agree to our commitment to health data transparency
          </p>
        </div>
      </div>
    </main>
  );
} 

