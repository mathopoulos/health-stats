'use client';

import React from 'react';

interface NavigationProps {
  className?: string;
}

export default function Navigation({ className = '' }: NavigationProps) {
  return (
    <nav className={`relative z-40 ${className}`} role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <a 
            href="/" 
            className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400 text-transparent bg-clip-text bg-animate hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md"
            aria-label="revly - Go to homepage"
          >
            revly
          </a>
          <div className="flex items-center space-x-4">
            <a
              href="/auth/signin"
              className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md"
              aria-label="Log in to your account"
            >
              Log in
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}