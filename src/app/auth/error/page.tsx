'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@components/ThemeToggle';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams ? searchParams.get('error') : null;

  // Map error codes to user-friendly messages
  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'AccessDenied':
        return 'You don\'t have permission to sign in.';
      case 'Verification':
        return 'The sign in link is no longer valid.';
      case 'OAuthCallback':
        return 'There was a problem with the sign in link.';
      case 'OAuthAccountNotLinked':
        return 'To confirm your identity, sign in with the same account you used originally.';
      case 'EmailCreateAccount':
        return 'The sign in link is for a different email address.';
      case 'Configuration':
        return 'There is a problem with the server configuration.';
      case 'InvalidInvite':
        return 'You need a valid invitation to sign up.';
      default:
        return 'There was a problem signing you in.';
    }
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
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-8 rounded-xl shadow-xl">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Authentication Error
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {getErrorMessage(error)}
            </p>
            
            <div className="flex justify-center space-x-4">
              <Link 
                href="/auth/invite"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Return to Invite Page
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 