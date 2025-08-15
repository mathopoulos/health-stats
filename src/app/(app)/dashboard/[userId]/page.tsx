'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useSearchParams } from 'next/navigation';
import { useTheme } from '@providers/ThemeProvider';
import Head from 'next/head';
import { Toaster } from 'react-hot-toast';
import BloodMarkerDetailModal from '@features/blood-markers/components/BloodMarkerDetailModal';
import ThemeToggle from '@components/ThemeToggle';

// Import our new components
import {
  DashboardHeader,
  TabNavigation,
  HomeTab,
  MetricsTab,
  BloodTab,
  ProtocolsTab,
  type DashboardTab,
} from '@features/dashboard/components';

// Import our new hooks
import { useDashboardData } from '@features/dashboard/hooks/useDashboardData';
import { useActivityData } from '@features/dashboard/hooks/useActivityData';
import { useTimeRangeFilters } from '@features/dashboard/hooks/useTimeRangeFilters';

// Import types
import type { UserData, BloodMarker } from '@/types/dashboard';
import type { HealthProtocol } from '@/types/healthProtocol';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ userId: string }>();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  
  // Get userId from path parameter or search parameter or session
  const routeUserId = params?.userId;
  const queryUserId = searchParams?.get('userId');
  
  // Check if routeUserId starts with "userId=" and extract the actual ID if needed
  const extractedUserId = routeUserId?.startsWith('userId=') 
    ? routeUserId.substring(7) 
    : routeUserId;
  
  // Use the first available ID source
  const userId = queryUserId || extractedUserId || session?.user?.id;
  
  // Tab state
  const [activeTab, setActiveTab] = useState<DashboardTab>('home');

  // Modal state
  const [showMarkerDetailModal, setShowMarkerDetailModal] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<{name: string, data: BloodMarker[]} | null>(null);

  // User data state
  const [userData, setUserData] = useState<UserData | null>(null);

  // Protocol states (these would typically come from a separate hook)
  const [currentDietProtocol, setCurrentDietProtocol] = useState<HealthProtocol | null>(null);
  const [currentWorkoutProtocol, setCurrentWorkoutProtocol] = useState<HealthProtocol | null>(null);
  const [currentSupplementProtocol, setCurrentSupplementProtocol] = useState<HealthProtocol | null>(null);

  // Custom hooks
  const { data, loading, error } = useDashboardData(userId);
  const { activityFeed, sleepData, workoutData, loading: activityLoading } = useActivityData(userId);
  const { 
    timeRanges,
    setWeightTimeRange,
    setBodyFatTimeRange, 
    setHrvTimeRange,
    setVo2maxTimeRange,
    getTimeRangeData
  } = useTimeRangeFilters();

  // Authentication check
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      window.location.href = '/auth/signin';
      return;
    }
  }, [session, status]);

  // Fetch user data
  useEffect(() => {
    if (!userId) return;
    
    const fetchUserData = async () => {
        try {
          const response = await fetch(`/api/users/${userId}`);
        if (response.ok) {
          const data = await response.json();
          
          if (data.success) {
            // Validate profileImage URL before setting in state
            if (data.user.profileImage) {
              try {
                // Test if the URL is valid
                new URL(data.user.profileImage);
              } catch (error) {
                // If URL is invalid, remove it
                console.error('Invalid profile image URL:', data.user.profileImage);
                data.user.profileImage = null;
              }
            }
            
            setUserData(data.user);
          } else {
            console.error('Failed to fetch user data:', data.error);
          }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [userId]);

  // Fetch protocols
  useEffect(() => {
    if (!userId) return;

    const fetchProtocols = async () => {
      try {
        const timestamp = Date.now();
        
        // Fetch each protocol type separately with activeOnly=true (like original)
        const [dietRes, workoutRes, supplementRes] = await Promise.all([
          fetch(`/api/health-protocols?protocolType=diet&activeOnly=true&userId=${userId}&t=${timestamp}`),
          fetch(`/api/health-protocols?protocolType=exercise&activeOnly=true&userId=${userId}&t=${timestamp}`),
          fetch(`/api/health-protocols?protocolType=supplement&activeOnly=true&userId=${userId}&t=${timestamp}`)
        ]);

        const [dietData, workoutData, supplementData] = await Promise.all([
          dietRes.json(),
          workoutRes.json(), 
          supplementRes.json()
        ]);

        // Set the protocols (API returns array, take the first one like original implementation)
        setCurrentDietProtocol(dietData.success && dietData.data && dietData.data.length > 0 ? dietData.data[0] : null);
        setCurrentWorkoutProtocol(workoutData.success && workoutData.data && workoutData.data.length > 0 ? workoutData.data[0] : null);
        setCurrentSupplementProtocol(supplementData.success && supplementData.data && supplementData.data.length > 0 ? supplementData.data[0] : null);
        
      } catch (error) {
        console.error('Error fetching protocols:', error);
      }
    };

    fetchProtocols();
  }, [userId]);

  // Set page title
  useEffect(() => {
    if (userData?.name) {
      document.title = `${userData.name}'s Health Stats`;
      } else {
      document.title = 'Health Stats';
    }
  }, [userData?.name]);

  // Handle marker click for blood markers modal
  const handleMarkerClick = (label: string, data: BloodMarker[]) => {
    if (data.length > 0) {
      setSelectedMarker({ name: label, data });
      setShowMarkerDetailModal(true);
    }
  };

  // Show loading state
  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  // Show authentication required
  if (!session) {
    return <div>Please sign in to access your dashboard.</div>;
  }


  const isDarkMode = theme === 'dark';
  const hasLoadedData = !loading && !activityLoading;

  return (
    <>
      <Head>
        <title>{userData?.name ? `${userData.name}'s Health Stats` : 'Health Stats'}</title>
      </Head>
      <Toaster position="bottom-left" />
      
      <main className="min-h-screen px-4 sm:px-8 py-8 bg-gray-50 dark:bg-gray-900">
        {/* Theme Toggle */}
        <div className="fixed bottom-4 right-4 z-[100]">
          <ThemeToggle />
        </div>
        
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Dashboard Header */}
          <DashboardHeader 
            userData={userData} 
            userId={userId}
            sessionUserId={session?.user?.id}
            loading={loading} 
          />

          {/* Tab Navigation */}
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Tab Content */}
          {activeTab === 'home' && (
            <HomeTab 
              data={data}
              activityFeed={activityFeed}
              loading={loading}
              hasLoadedData={hasLoadedData}
              userId={userId}
            />
          )}

          {activeTab === 'metrics' && (
            <MetricsTab
              data={data}
              loading={loading}
              isDarkMode={isDarkMode}
              timeRanges={timeRanges}
              onTimeRangeChange={{
                setWeightTimeRange,
                setBodyFatTimeRange,
                setHrvTimeRange,
                setVo2maxTimeRange,
              }}
            />
          )}

          {activeTab === 'blood' && (
            <BloodTab
              data={data}
              userData={userData}
              onMarkerClick={handleMarkerClick}
            />
          )}

          {activeTab === 'protocols' && (
            <ProtocolsTab
              loading={loading}
              currentDietProtocol={currentDietProtocol}
              currentWorkoutProtocol={currentWorkoutProtocol}
              currentSupplementProtocol={currentSupplementProtocol}
              userId={userId}
            />
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-700 dark:text-red-400">Error: {error}</p>
          </div>
        )}
      </div>

      {/* Blood Marker Detail Modal */}
      {showMarkerDetailModal && selectedMarker && (
        <BloodMarkerDetailModal
          isOpen={showMarkerDetailModal}
          onClose={() => setShowMarkerDetailModal(false)}
          markerName={selectedMarker.name}
          data={selectedMarker.data}
          userId={userId || ''}
        />
      )}

        {/* Revly Attribution */}
        <div className="fixed bottom-4 left-4 bg-indigo-500/15 backdrop-blur py-2.5 rounded-full shadow-lg text-sm font-medium tracking-wide text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 transition-all duration-500 ease-out flex items-center gap-1 px-3 hover:bg-indigo-500/25 hover:shadow-md hover:gap-2 hover:px-4">
          <svg className="w-4 h-4 flex-shrink-0 transition-transform duration-500 ease-out" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <a 
            href="https://www.revly.health"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center overflow-hidden whitespace-nowrap font-semibold transition-all duration-500 ease-out w-auto opacity-100 transform translate-x-0"
          >
            <span className="transition-all duration-500 ease-out">Powered by Revly</span>
            <svg className="w-3.5 h-3.5 ml-1.5 flex-shrink-0 transition-all duration-500 ease-out" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M7 17L17 7M17 7H7M17 7V17" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
      </div>
    </main>
    </>
  );
}
