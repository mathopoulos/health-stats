'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
import ThemeToggle from '@components/ThemeToggle';

interface DesktopNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  session: any;
  profileImage?: string | null;
  name?: string;
}

export default function DesktopNavigation({ 
  activeTab, 
  onTabChange, 
  session, 
  profileImage, 
  name 
}: DesktopNavigationProps) {
  return (
    <div className="hidden md:block w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="p-4">
        <Link href="/" className="flex items-center space-x-2 mb-8">
          <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400 text-transparent bg-clip-text">
            revly
          </span>
        </Link>
        
        <nav className="space-y-1">
          <button
            onClick={() => onTabChange('profile')}
            className={`w-full flex items-center space-x-2 px-4 py-2 text-sm rounded-lg transition-colors ${
              activeTab === 'profile'
                ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Profile</span>
          </button>

          <button
            onClick={() => onTabChange('protocols')}
            className={`w-full flex items-center space-x-2 px-4 py-2 text-sm rounded-lg transition-colors ${
              activeTab === 'protocols'
                ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Protocols & Experiments</span>
          </button>

          <button
            onClick={() => onTabChange('fitness')}
            className={`w-full flex items-center space-x-2 px-4 py-2 text-sm rounded-lg transition-colors ${
              activeTab === 'fitness'
                ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Fitness Metrics</span>
          </button>

          <button
            onClick={() => onTabChange('blood')}
            className={`w-full flex items-center space-x-2 px-4 py-2 text-sm rounded-lg transition-colors ${
              activeTab === 'blood'
                ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <span>Blood Markers</span>
          </button>
        </nav>
      </div>

      {/* User Profile Section with Sign out and Theme toggle */}
      <div className="absolute bottom-0 left-0 w-64">
        {/* Dashboard Button - Desktop Version */}
        {session?.user?.id && (
          <div className="px-4 pb-2">
            <Link
              href={`/dashboard/userId=${session.user.id}`}
              className="group flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-lg transition-all bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-800"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>View Dashboard</span>
              </div>
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            {profileImage ? (
              <Image
                src={profileImage}
                alt="Profile"
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  {name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {name || 'Anonymous User'}
              </p>
              <button
                onClick={() => signOut()}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Sign out
              </button>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
