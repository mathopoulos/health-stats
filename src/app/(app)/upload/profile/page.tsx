'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { ProfileTab, DesktopNavigation, MobileNavigation, MobileHeader } from '@features/upload/components';

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
  
  // Profile state
  const [name, setName] = useState<string>('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [age, setAge] = useState<number | ''>('');
  const [ageError, setAgeError] = useState<string | null>(null);
  const [sex, setSex] = useState<'male' | 'female' | 'other' | ''>('');
  const [sexError, setSexError] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [status, setStatus] = useState<string>('');

  // Delete account state
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [confirmationPhrase, setConfirmationPhrase] = useState('');
  const requiredPhrase = 'DELETE MY ACCOUNT';

  // Fix session race condition in preview deployments
  useEffect(() => {
    // If authenticated but missing user ID, force session refresh
    if (sessionStatus === 'authenticated' && !session?.user?.id) {
      console.log('Session authenticated but missing user ID, forcing refresh...');
      window.location.reload();
      return;
    }
  }, [session, sessionStatus]);

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
        window.location.href = '/upload/protocols';
        break;
      case 'fitness':
        window.location.href = '/upload/fitness';
        break;
      case 'blood':
        window.location.href = '/upload/blood';
        break;
      case 'more':
        window.location.href = '/upload/settings';
        break;
      default:
        // Already on profile page
        break;
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
          {status && (
            <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 text-sm">
              {status}
            </div>
          )}
          
          <ProfileTab
            name={name}
            setName={setName}
            nameError={nameError}
            setNameError={setNameError}
            age={age}
            setAge={setAge}
            ageError={ageError}
            setAgeError={setAgeError}
            sex={sex}
            setSex={setSex}
            sexError={sexError}
            setSexError={setSexError}
            profileImage={profileImage}
            setProfileImage={setProfileImage}
            imageError={imageError}
            setImageError={setImageError}
            isUploadingImage={isUploadingImage}
            setIsUploadingImage={setIsUploadingImage}
            isSavingProfile={isSavingProfile}
            setIsSavingProfile={setIsSavingProfile}
            showDeleteAccountDialog={showDeleteAccountDialog}
            setShowDeleteAccountDialog={setShowDeleteAccountDialog}
            isDeletingAccount={isDeletingAccount}
            setIsDeletingAccount={setIsDeletingAccount}
            confirmationPhrase={confirmationPhrase}
            setConfirmationPhrase={setConfirmationPhrase}
            requiredPhrase={requiredPhrase}

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
