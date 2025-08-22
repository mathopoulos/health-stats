'use client';

import { useState, useEffect } from 'react';
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
  const [currentDiet, setCurrentDiet] = useState(initialDiet);
  const [isSavingProtocol, setIsSavingProtocol] = useState(false);

  // Update current diet when initial value changes (for async data loading)
  useEffect(() => {
    if (initialDiet && initialDiet !== currentDiet) {
      setCurrentDiet(initialDiet);
    }
  }, [initialDiet, currentDiet]);

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
