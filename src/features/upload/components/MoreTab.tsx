'use client';

import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import ThemeToggle from '@components/ThemeToggle';

interface MoreTabProps {
  profileImage: string | null;
  name: string;
}

export default function MoreTab({
  profileImage,
  name,
}: MoreTabProps) {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      <h2 className="hidden md:block text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="p-6 space-y-6">
          {/* User Profile Section */}
          <div className="flex items-center space-x-4">
            {profileImage ? (
              <Image
                src={profileImage}
                alt="Profile"
                width={48}
                height={48}
                className="rounded-full"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-gray-500 dark:text-gray-400 text-base font-medium">
                  {name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
            )}
            <div>
              <p className="text-base font-medium text-gray-900 dark:text-white">
                {name || 'Anonymous User'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{session?.user?.email}</p>
            </div>
          </div>
          
          {/* Theme Toggle */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              <span className="text-base text-gray-800 dark:text-gray-200">Dark Mode</span>
            </div>
            <ThemeToggle />
          </div>
          
          {/* Sign Out Button */}
          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-between py-3 text-base text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
          >
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign Out</span>
            </div>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* About Section - Only visible on desktop */}
      <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">About</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Health Stats App v1.0.0<br />
            Track and monitor your health metrics in one place.
          </p>
        </div>
      </div>
    </div>
  );
}
