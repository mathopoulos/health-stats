'use client';

import { useSearchParams } from 'next/navigation';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <svg 
            className="w-12 h-12 text-red-500 mx-auto mb-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Error</h1>
          <p className="text-gray-600 mb-6">
            {error === 'AccessDenied' 
              ? 'You are not authorized to access this application.' 
              : 'There was a problem signing you in.'}
          </p>
          <a 
            href="/"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Return to Home
          </a>
        </div>
      </div>
    </main>
  );
} 