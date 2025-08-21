'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export interface SupplementProtocol {
  type: string;
  frequency: string;
  dosage: string;
  unit: string;
}

export interface UseSupplementProtocolsReturn {
  // Supplement protocols state
  supplementProtocols: SupplementProtocol[];
  setSupplementProtocols: (protocols: SupplementProtocol[]) => void;
  isSavingSupplementProtocol: boolean;
  setIsSavingSupplementProtocol: (saving: boolean) => void;
  
  // Handlers
  addSupplementProtocol: (type: string, frequency: string, dosage: string, unit: string) => void;
  updateSupplementProtocol: (type: string, field: string, newValue: string) => Promise<void>;
  handleSaveSupplementProtocols: (newProtocols: SupplementProtocol[]) => Promise<void>;
}

export function useSupplementProtocols(initialProtocols: SupplementProtocol[] = []): UseSupplementProtocolsReturn {
  const [supplementProtocols, setSupplementProtocols] = useState<SupplementProtocol[]>(initialProtocols);
  const [isSavingSupplementProtocol, setIsSavingSupplementProtocol] = useState(false);

  // Update supplement protocols when initial values change (for async data loading)
  useEffect(() => {
    if (initialProtocols.length > 0 && JSON.stringify(initialProtocols) !== JSON.stringify(supplementProtocols)) {
      setSupplementProtocols(initialProtocols);
    }
  }, [initialProtocols, supplementProtocols]);

  const addSupplementProtocol = (type: string, frequency: string, dosage: string, unit: string) => {
    if (supplementProtocols.some(p => p.type === type)) {
      toast.error('This supplement is already added');
      return;
    }

    const newProtocol: SupplementProtocol = {
      type,
      frequency,
      dosage,
      unit,
    };

    setSupplementProtocols(prev => [...prev, newProtocol]);
  };

  const updateSupplementProtocol = async (type: string, field: string, newValue: string) => {
    setIsSavingSupplementProtocol(true);

    try {
      const updatedProtocols = supplementProtocols.map(p =>
        p.type === type ? { ...p, [field]: newValue } : p
      );

      const response = await fetch('/api/health-protocols', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          protocolType: 'supplement',
          protocol: JSON.stringify({ supplements: updatedProtocols }),
          startDate: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update supplement protocol');
      }

      setSupplementProtocols(updatedProtocols);
    } catch (error) {
      console.error('Error updating supplement protocol:', error);
      toast.error('Failed to update supplement protocol');
    } finally {
      setIsSavingSupplementProtocol(false);
    }
  };

  const handleSaveSupplementProtocols = async (newProtocols: SupplementProtocol[]) => {
    setIsSavingSupplementProtocol(true);

    try {
      const response = await fetch('/api/health-protocols', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          protocolType: 'supplement',
          protocol: JSON.stringify({ supplements: newProtocols }),
          startDate: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save supplement protocols');
      }

      setSupplementProtocols(newProtocols);
      toast.success('Supplement protocols saved successfully');
    } catch (error) {
      console.error('Error saving supplement protocols:', error);
      toast.error('Failed to save supplement protocols');
    } finally {
      setIsSavingSupplementProtocol(false);
    }
  };

  return {
    supplementProtocols,
    setSupplementProtocols,
    isSavingSupplementProtocol,
    setIsSavingSupplementProtocol,
    addSupplementProtocol,
    updateSupplementProtocol,
    handleSaveSupplementProtocols,
  };
}
