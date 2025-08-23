'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

export interface UseDietProtocolReturn {
  // Diet protocol state
  currentDiet: string;
  setCurrentDiet: (diet: string) => void;
  isSavingProtocol: boolean;
  setIsSavingProtocol: (saving: boolean) => void;
  
  // Diet change handler
  handleDietChange: (newDiet: string) => Promise<void>;
}

export function useDietProtocol(initialDiet: string = ''): UseDietProtocolReturn {
  const { data: session, status: sessionStatus } = useSession();
  const [currentDiet, setCurrentDiet] = useState(initialDiet);
  const [isSavingProtocol, setIsSavingProtocol] = useState(false);

  // Update current diet when initial value changes (for async data loading)
  useEffect(() => {
    if (initialDiet) {
      setCurrentDiet(initialDiet);
    }
  }, [initialDiet]);

  // Fetch current diet if no initial data provided
  useEffect(() => {
    const fetchCurrentDiet = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch(`/api/health-protocols?protocolType=diet&activeOnly=true&userId=${session.user.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.length > 0) {
            setCurrentDiet(data.data[0].protocol || '');
          }
        }
      } catch (error) {
        console.error('Error fetching current diet:', error);
      }
    };

    // Only fetch if no initial diet was provided and we have a session
    if (!initialDiet && sessionStatus === 'authenticated' && session?.user?.id) {
      fetchCurrentDiet();
    }
  }, [initialDiet, session?.user?.id, sessionStatus]);

  const handleDietChange = async (newDiet: string) => {
    if (newDiet === currentDiet) return;

    setIsSavingProtocol(true);

    try {
      const response = await fetch('/api/health-protocols', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          protocolType: 'diet',
          protocol: newDiet,
          startDate: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update diet protocol');
      }

      setCurrentDiet(newDiet);
      toast.success('Diet protocol updated successfully');
    } catch (error) {
      console.error('Error updating diet protocol:', error);
      toast.error('Failed to update diet protocol');
    } finally {
      setIsSavingProtocol(false);
    }
  };

  return {
    currentDiet,
    setCurrentDiet,
    isSavingProtocol,
    setIsSavingProtocol,
    handleDietChange,
  };
}
