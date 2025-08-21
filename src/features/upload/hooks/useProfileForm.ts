'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

export interface UseProfileFormReturn {
  // Profile state
  name: string;
  setName: (name: string) => void;
  nameError: string | null;
  setNameError: (error: string | null) => void;
  age: number | '';
  setAge: (age: number | '') => void;
  ageError: string | null;
  setAgeError: (error: string | null) => void;
  sex: 'male' | 'female' | 'other' | '';
  setSex: (sex: 'male' | 'female' | 'other' | '') => void;
  sexError: string | null;
  setSexError: (error: string | null) => void;
  isSavingProfile: boolean;
  setIsSavingProfile: (saving: boolean) => void;
  
  // Form handler
  handleUpdateProfile: () => Promise<void>;
}

export function useProfileForm(initialValues?: {
  name?: string;
  age?: number | '';
  sex?: 'male' | 'female' | 'other' | '';
}): UseProfileFormReturn {
  const [name, setName] = useState(initialValues?.name || '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [age, setAge] = useState<number | ''>(initialValues?.age || '');
  const [ageError, setAgeError] = useState<string | null>(null);
  const [sex, setSex] = useState<'male' | 'female' | 'other' | ''>(initialValues?.sex || '');
  const [sexError, setSexError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      setNameError('Name is required');
      return;
    }

    // Validate age if provided
    if (age !== '' && (isNaN(Number(age)) || Number(age) < 0 || Number(age) > 120)) {
      setAgeError('Please enter a valid age between 0 and 120');
      return;
    }

    setIsSavingProfile(true);
    setNameError(null);
    setAgeError(null);
    setSexError(null);

    try {
      const response = await fetch('/api/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          age: age === '' ? null : Number(age),
          sex: sex || null
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      setNameError(error instanceof Error ? error.message : 'Failed to update profile');
      toast.error('Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return {
    name,
    setName,
    nameError,
    setNameError,
    age,
    setAge,
    ageError,
    setAgeError,
    sex,
    setSex,
    sexError,
    setSexError,
    isSavingProfile,
    setIsSavingProfile,
    handleUpdateProfile,
  };
}
