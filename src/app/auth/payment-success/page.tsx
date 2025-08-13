'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ThemeToggle from "@components/ThemeToggle";
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id');

  useEffect(() => {
    // Get the email from session storage
    const email = sessionStorage.getItem('checkoutEmail');
    setUserEmail(email);
    
    // Set the payment flag to true for the signin page
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('justCompletedPayment', 'true');
    }
    
    // Set a countdown timer for redirect
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/auth/signin');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // If there's a session ID from Stripe, verify payment
    // This is used when coming from a programmatic checkout session
    if (sessionId) {
      const verifyPayment = async () => {
        try {
          await fetch('/api/payment/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          });
        } catch (error) {
          console.error('Error verifying payment:', error);
        }
      };
      
      verifyPayment();
    }
    
    return () => clearInterval(timer);
  }, [sessionId, router]);

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
        {/* Success Container */}
        <div className="w-full max-w-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl p-8 shadow-xl border border-gray-200 dark:border-gray-800">
          <div className="text-center py-8">
            <div className="bg-green-100 dark:bg-green-900/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Successful!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Thank you for supporting our beta program. You now have lifetime access to all features.
            </p>
            {userEmail ? (
              <div className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                <p>We've registered your email: <span className="font-medium">{userEmail}</span></p>
                <p className="mt-2">Redirecting to sign in automatically in {countdown} seconds...</p>
              </div>
            ) : (
              <div className="text-amber-600 dark:text-amber-400 text-sm mb-6">
                <p>We couldn't find your email in our system.</p>
                <p className="mt-2">You might need to manually enter it when signing in.</p>
              </div>
            )}
            <Link 
              href="/auth/signin" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Sign In Now
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
} 