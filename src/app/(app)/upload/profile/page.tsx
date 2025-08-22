'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { ProfileTab, DesktopNavigation, MobileNavigation, MobileHeader } from '@features/upload/components';
import { useSessionRecovery } from '@features/upload/hooks/useSessionRecovery';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY
): Promise<T | void> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetchFn();
    } catch (error) {
      console.log(`Attempt ${i + 1} failed:`, error);
      if (i === retries - 1) {
        console.error('All retry attempts failed');
        return;
      }
      await sleep(delay * Math.pow(2, i)); // Exponential backoff
    }
  }
}

export default function ProfilePage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  
  // Profile state for navigation (only need data for navigation display)
  const [name, setName] = useState<string>('');
  const [age, setAge] = useState<number | ''>('');
  const [sex, setSex] = useState<'male' | 'female' | 'other' | ''>('');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Handle session recovery without infinite reloads
  const { isRecovering, isWaitingToRecover } = useSessionRecovery();

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (!session?.user?.id) return;

    const fetchUserData = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch(`/api/users/${session.user.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            setName(data.user.name || '');
            setProfileImage(data.user.profileImage || null);
            setAge(data.user.age || '');
            setSex(data.user.sex || '');
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    // Use retry mechanism for session-dependent data fetching
    fetchWithRetry(fetchUserData);
  }, [session?.user?.id, sessionStatus]);



  const handleTabChange = (tab: string) => {
    // Navigate to different upload pages
    switch (tab) {
      case 'profile':
        // Already on profile page
        break;
      case 'protocols':
        router.push('/upload/protocols');
        break;
      case 'fitness':
        router.push('/upload/fitness');
        break;
      case 'blood':
        router.push('/upload/blood');
        break;
      case 'more':
        router.push('/upload/settings');
        break;
      default:
        // Already on profile page
        break;
    }
  };

  // Loading state (including session recovery)
  if (sessionStatus === 'loading' || isRecovering || isWaitingToRecover) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              {isRecovering ? 'Recovering session...' : 
               isWaitingToRecover ? 'Validating session...' : 'Loading...'}
            </p>
          </div>
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
        activeTab="profile"
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
          <ProfileTab
            initialName={name}
            initialAge={age}
            initialSex={sex}
            initialProfileImage={profileImage}
          />
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation
        activeTab="profile"
        onTabChange={handleTabChange}
      />
    </div>
  );
}
