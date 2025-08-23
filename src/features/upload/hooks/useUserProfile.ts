'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

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

export interface UseUserProfileReturn {
  // Basic profile data
  name: string;
  profileImage: string | null;
  
  // Extended profile data (fetched from API)
  age: number | '';
  sex: 'male' | 'female' | 'other' | '';
  
  // Loading states
  isLoading: boolean;
  hasLoaded: boolean;
  
  // Error state
  error: string | null;
}

/**
 * Shared hook for user profile data that prevents flashing by using session data as initial values
 * and then fetching extended profile data from the API
 */
export function useUserProfile(): UseUserProfileReturn {
  const { data: session, status: sessionStatus } = useSession();
  
  // Initialize with session data to prevent flash (but not Google profile image)
  const [name, setName] = useState<string>(session?.user?.name || '');
  const [profileImage, setProfileImage] = useState<string | null>(null); // Only use uploaded images, not Google's
  
  // Extended profile data (not available in session)
  const [age, setAge] = useState<number | ''>('');
  const [sex, setSex] = useState<'male' | 'female' | 'other' | ''>('');
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update initial values when session becomes available
  useEffect(() => {
    if (session?.user?.name && !hasLoaded) {
      setName(session.user.name);
    }
    // Don't use Google profile image - only use uploaded images from our S3
  }, [session?.user?.name, hasLoaded]);

  const fetchUserData = useCallback(async () => {
    if (!session?.user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/users/${session.user.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          // Update with API data, use session name as fallback but only use uploaded images
          setName(data.user.name || session.user.name || '');
          setProfileImage(data.user.profileImage || null); // Only uploaded images, no Google fallback
          setAge(data.user.age || '');
          setSex(data.user.sex || '');
        }
      } else {
        setError('Failed to fetch user data');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to fetch user data');
    } finally {
      setIsLoading(false);
      setHasLoaded(true);
    }
  }, [session?.user?.id, session?.user?.name]);

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (!session?.user?.id) return;
    if (hasLoaded) return; // Don't fetch again if already loaded

    // Use retry mechanism for session-dependent data fetching
    fetchWithRetry(fetchUserData);
  }, [session?.user?.id, sessionStatus, hasLoaded, fetchUserData]);

  return {
    name,
    profileImage,
    age,
    sex,
    isLoading,
    hasLoaded,
    error,
  };
}
