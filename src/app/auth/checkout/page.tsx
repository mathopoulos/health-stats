'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from "@/app/components/ThemeToggle";
import Link from 'next/link';

export default function CheckoutPage() {
  const [email, setEmail] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Store email in session storage for later
    const cleanEmail = email.trim().toLowerCase();
    sessionStorage.setItem('checkoutEmail', cleanEmail);
    
    // Set a flag indicating the user is going to payment
    // This will be checked when they return to the signin page
    sessionStorage.setItem('justCompletedPayment', 'pending');
    
    // Redirect directly to the Stripe payment link
    window.location.href = 'https://buy.stripe.com/test_7sI5lt9Vf4c20eceUU';
  };

  const isFormValid = () => email.trim() !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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

        {/* Checkout Container */}
        <div className="w-full max-w-md space-y-8">
          {/* Title Section */}
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-3 animate-fade-in text-gray-900 dark:text-white">
              Get Beta Access
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg animate-fade-in-up">
              Lifetime membership - one-time payment of $25
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-6 animate-fade-in-up delay-100">
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

            <button
              type="submit"
              disabled={!isFormValid()}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Payment
            </button>
            
            <div className="text-center mt-2">
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
          </form>
        </div>
      </div>
    </main>
  );
} 