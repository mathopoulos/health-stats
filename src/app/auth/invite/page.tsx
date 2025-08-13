'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from "@components/ThemeToggle";
import Link from 'next/link';

export default function InvitePage() {
  const [inviteCode, setInviteCode] = useState('');
  const [email, setEmail] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset error state
    setError(null);
    setIsValidating(true);
    
    try {
      // Validate the invite code
      const response = await fetch('/api/validate-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          inviteCode,
          email: email.trim().toLowerCase() // Send email for server-side tracking
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.valid) {
        // Store the validated status in session storage
        sessionStorage.setItem('inviteCodeValidated', 'true');
        // Also store the validated email
        sessionStorage.setItem('validatedEmail', email.trim().toLowerCase());
        // Redirect to sign in page
        router.push('/auth/signin');
      } else {
        setError(data.message || 'Invalid invite code. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Invite code validation error:', err);
    } finally {
      setIsValidating(false);
    }
  };

  const isFormValid = () => {
    return inviteCode.trim() !== '' && 
           email.trim() !== '' &&
           /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); // Basic email validation
  };

  const handleSignIn = () => {
    router.push('/auth/signin');
  };

  return (
    <main className="min-h-screen bg-primary dark:bg-primary-dark-dark flex items-center justify-center relative">
      {/* Floating Theme Toggle */}
      <div className="fixed bottom-16 right-4 z-[100]">
        <div className="bg-white/10 dark:bg-gray-900/30 backdrop-blur-lg rounded-full p-3 shadow-lg hover:shadow-xl transition-all scale-110 hover:scale-125">
          <ThemeToggle />
        </div>
      </div>

      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent dark:from-indigo-500/20 dark:via-purple-500/10 pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      <div className="relative z-10 w-full max-w-md p-8">
        {/* Logo/Icon */}
        <div className="flex justify-center mb-8">
          <div className="text-4xl animate-bounce hover:scale-110 transition-transform cursor-pointer">🚀</div>
        </div>

        {/* Invite Code Container */}
        <div className="w-full max-w-md space-y-8">
          {/* Title Section */}
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-3 animate-fade-in text-gray-900 dark:text-white">
              Join Revly
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg animate-fade-in-up">
              Enter your invite code to get started
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-4 animate-fade-in-up delay-100">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 placeholder-gray-500 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
                placeholder="Your email address"
              />
            </div>
            
            <div>
              <label htmlFor="invite-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Invite Code
              </label>
              <input
                id="invite-code"
                name="inviteCode"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 placeholder-gray-500 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
                placeholder="Enter your invite code"
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 space-y-4">
              <button
                type="submit"
                disabled={isValidating || !isFormValid()}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isValidating ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                Continue with Invite
              </button>
              
              <div className="flex items-center justify-center">
                <div className="bg-gray-300 dark:bg-gray-700 h-px flex-1"></div>
                <div className="px-3 text-xs text-gray-500 dark:text-gray-400 uppercase">Or</div>
                <div className="bg-gray-300 dark:bg-gray-700 h-px flex-1"></div>
              </div>
              
              <button
                type="button"
                onClick={handleSignIn}
                className="w-full flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-xl text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign In with Existing Account
              </button>
            </div>
          </form>

          {/* Already have an account link - keeping this for extra clarity */}
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link 
                href="/auth/signin" 
                className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
} 