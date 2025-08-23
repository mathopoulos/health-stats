'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import { 
  ProfileTab, 
  FitnessTab, 
  BloodTab, 
  ProtocolsTab, 
  MoreTab,
  DesktopNavigation, 
  MobileNavigation, 
  MobileHeader,
  AddResultsModal 
} from '@features/upload/components';
import { useSessionRecovery, useUserProfile } from '@features/upload/hooks';

type TabType = 'profile' | 'protocols' | 'fitness' | 'blood' | 'more';

export default function UploadPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  
  // Get tab from URL or default to profile
  const urlTab = searchParams?.get('tab') as TabType;
  const [activeTab, setActiveTab] = useState<TabType>(urlTab || 'profile');
  
  // Shared user profile data - single source of truth
  const userProfile = useUserProfile();
  
  // Handle session recovery
  const { isRecovering, isWaitingToRecover } = useSessionRecovery();

  // Preload protocol data for smooth tab switching
  const [protocolData, setProtocolData] = useState<{
    currentDiet: string;
    workoutProtocols: Array<{ type: string; frequency: number }>;
    supplementProtocols: Array<{ type: string; frequency: string; dosage: string; unit: string }>;
  }>({
    currentDiet: '',
    workoutProtocols: [],
    supplementProtocols: []
  });
  
  // Blood test modal state (only used for blood tab)
  const [isAddResultsModalOpen, setIsAddResultsModalOpen] = useState(false);

  // Update URL when tab changes (for bookmarking)
  const handleTabChange = (tab: string) => {
    const tabType = tab as TabType;
    setActiveTab(tabType);
    // Update URL without page reload
    const newUrl = `/upload?tab=${tabType}`;
    router.replace(newUrl, { scroll: false });
  };

  // Sync tab state with URL on load
  useEffect(() => {
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab, activeTab]);

  // Preload protocol data for smooth tab switching
  useEffect(() => {
    const preloadProtocolData = async () => {
      if (!session?.user?.id) return;

      try {
        // Fetch all protocol data in parallel
        const [dietResponse, workoutResponse, supplementResponse] = await Promise.all([
          fetch(`/api/health-protocols?protocolType=diet&activeOnly=true&userId=${session.user.id}`),
          fetch(`/api/health-protocols?protocolType=exercise&activeOnly=true&userId=${session.user.id}`),
          fetch(`/api/health-protocols?protocolType=supplement&activeOnly=true&userId=${session.user.id}`)
        ]);

        const results = {
          currentDiet: '',
          workoutProtocols: [] as Array<{ type: string; frequency: number }>,
          supplementProtocols: [] as Array<{ type: string; frequency: string; dosage: string; unit: string }>
        };

        // Process diet data
        if (dietResponse.ok) {
          const dietData = await dietResponse.json();
          if (dietData.success && dietData.data && dietData.data.length > 0) {
            results.currentDiet = dietData.data[0].protocol || '';
          }
        }

        // Process workout data
        if (workoutResponse.ok) {
          const workoutData = await workoutResponse.json();
          if (workoutData.success && workoutData.data && workoutData.data.length > 0) {
            const protocolData = JSON.parse(workoutData.data[0].protocol);
            results.workoutProtocols = protocolData.workouts || [];
          }
        }

        // Process supplement data
        if (supplementResponse.ok) {
          const supplementData = await supplementResponse.json();
          if (supplementData.success && supplementData.data && supplementData.data.length > 0) {
            const protocolData = JSON.parse(supplementData.data[0].protocol);
            results.supplementProtocols = protocolData.supplements || [];
          }
        }

        setProtocolData(results);
      } catch (error) {
        console.error('Error preloading protocol data:', error);
      }
    };

    // Only preload if we have a session and haven't already loaded
    if (sessionStatus === 'authenticated' && session?.user?.id) {
      preloadProtocolData();
    }
  }, [session?.user?.id, sessionStatus]);

  // Loading state
  if (sessionStatus === 'loading' || isRecovering || isWaitingToRecover || userProfile.isLoading) {
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
        activeTab={activeTab}
        onTabChange={handleTabChange}
        session={session}
        profileImage={userProfile.profileImage}
        name={userProfile.name}
      />

      {/* Mobile Header */}
      <MobileHeader />

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8 md:p-8 pt-16 md:pt-8 pb-24 md:pb-8">
          {/* Render active tab content */}
          {activeTab === 'profile' && (
            <ProfileTab
              initialName={userProfile.name}
              initialAge={userProfile.age}
              initialSex={userProfile.sex}
              initialProfileImage={userProfile.profileImage}
            />
          )}
          
          {activeTab === 'protocols' && (
            <ProtocolsTab 
              initialDiet={protocolData.currentDiet}
              initialWorkoutProtocols={protocolData.workoutProtocols}
              initialSupplementProtocols={protocolData.supplementProtocols}
            />
          )}
          
          {activeTab === 'fitness' && (
            <FitnessTab />
          )}
          
          {activeTab === 'blood' && (
            <BloodTab
              isAddResultsModalOpen={isAddResultsModalOpen}
              setIsAddResultsModalOpen={setIsAddResultsModalOpen}
            />
          )}
          
          {activeTab === 'more' && (
            <MoreTab
              profileImage={userProfile.profileImage}
              name={userProfile.name}
            />
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Blood Test Modal - only render when needed */}
      {activeTab === 'blood' && (
        <AddResultsModal
          isOpen={isAddResultsModalOpen}
          onClose={() => setIsAddResultsModalOpen(false)}
          prefilledResults={null}
        />
      )}
    </div>
  );
}