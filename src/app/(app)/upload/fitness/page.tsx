'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { 
  FitnessTab, 
  DesktopNavigation, 
  MobileNavigation, 
  MobileHeader
} from '@features/upload/components';

export default function FitnessPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  
  // User profile state for navigation
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [name, setName] = useState<string>('');

  // Fix session race condition in preview deployments
  useEffect(() => {
    if (sessionStatus === 'authenticated' && !session?.user?.id) {
      console.log('Session authenticated but missing user ID, forcing refresh...');
      window.location.reload();
      return;
    }
  }, [session, sessionStatus]);

  // Fetch user data and uploaded files for navigation display
  useEffect(() => {
    if (session?.user?.id) {
      const fetchUserData = async () => {
        try {
          const response = await fetch(`/api/users/${session.user.id}`);
          if (response.ok) {
            const userData = await response.json();
            if (userData.success && userData.user) {
              setName(userData.user.name || '');
              setProfileImage(userData.user.profileImage || null);
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      };

      const fetchUploadedFiles = async () => {
        try {
          const response = await fetch('/api/uploads');
          if (response.ok) {
            const data = await response.json();
            // Files are now managed by FitnessTab hooks, this is just for compatibility
          }
        } catch (error) {
          console.error('Error fetching uploaded files:', error);
        }
      };

      fetchUserData();
      fetchUploadedFiles();
    }
  }, [session?.user?.id]);

  // Navigation handler
  const handleTabChange = (tab: string) => {
    switch (tab) {
      case 'profile':
        router.push('/upload/profile');
        break;
      case 'protocols':
        router.push('/upload/protocols');
        break;
      case 'fitness':
        // Already on fitness page
        break;
      case 'blood':
        router.push('/upload/blood');
        break;
      case 'more':
        router.push('/upload/settings');
        break;
      default:
        router.push('/upload/profile');
    }
  };

  // Loading state
  if (sessionStatus === 'loading') {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  // Unauthenticated state
  if (sessionStatus === 'unauthenticated') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Authentication Required</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Please sign in to access the upload functionality.</p>
          <a
            href="/auth/signin"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Sign In
          </a>
        </div>
      </main>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Navigation */}
      <DesktopNavigation
        activeTab="fitness"
        onTabChange={handleTabChange}
        session={session}
        profileImage={profileImage}
        name={name}
      />

      {/* Mobile Header */}
      <MobileHeader />

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8 md:p-8 pt-16 md:pt-8 pb-24 md:pb-8">
          <FitnessTab />
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation
        activeTab="fitness"
        onTabChange={handleTabChange}
      />
    </div>
  );
}