'use client';

import React, { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface ProfileTabProps {
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
  profileImage: string | null;
  setProfileImage: (image: string | null) => void;
  imageError: string | null;
  setImageError: (error: string | null) => void;
  isUploadingImage: boolean;
  setIsUploadingImage: (uploading: boolean) => void;
  isSavingProfile: boolean;
  setIsSavingProfile: (saving: boolean) => void;
  // Delete account state
  showDeleteAccountDialog: boolean;
  setShowDeleteAccountDialog: (show: boolean) => void;
  isDeletingAccount: boolean;
  setIsDeletingAccount: (deleting: boolean) => void;
  confirmationPhrase: string;
  setConfirmationPhrase: (phrase: string) => void;
  requiredPhrase: string;
}

export default function ProfileTab({
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
  profileImage,
  setProfileImage,
  imageError,
  setImageError,
  isUploadingImage,
  setIsUploadingImage,
  isSavingProfile,
  setIsSavingProfile,
  showDeleteAccountDialog,
  setShowDeleteAccountDialog,
  isDeletingAccount,
  setIsDeletingAccount,
  confirmationPhrase,
  setConfirmationPhrase,
  requiredPhrase,
}: ProfileTabProps) {
  const { data: session } = useSession();
  const profileImageRef = useRef<HTMLInputElement>(null);

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

  const handleProfileImageUpload = async (file: File) => {
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setImageError('Please select an image file');
      return;
    }

    setIsUploadingImage(true);
    setImageError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'profile-image');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      setProfileImage(data.url);
      
      // Update user profile with new image URL
      await fetch('/api/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileImage: data.url }),
      });

      toast.success('Profile image updated successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      setImageError('Failed to upload image');
      toast.error('Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteAccountClick = () => {
    setShowDeleteAccountDialog(true);
    setConfirmationPhrase('');
  };

  const handleDeleteAccount = async () => {
    if (!session?.user?.id) {
      toast.error('You must be logged in to delete your account');
      return;
    }

    if (confirmationPhrase !== requiredPhrase) {
      toast.error('Please type the confirmation phrase exactly as shown');
      return;
    }

    setIsDeletingAccount(true);

    try {
      const response = await fetch('/api/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      toast.success('Account deleted successfully');
      setShowDeleteAccountDialog(false);
      setConfirmationPhrase('');
      
      // Sign out will be handled by the parent component or API response
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete account');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* View Dashboard Button - Moved to top for mobile */}
        {session?.user?.id && (
          <div className="block md:hidden">
            <Link
              href={`/dashboard/userId=${session.user.id}`}
              className="group flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-lg transition-all bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-800"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>View Dashboard</span>
              </div>
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
        
        <h2 className="hidden md:block text-2xl font-bold text-gray-900 dark:text-white">Profile</h2>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm divide-y divide-gray-200 dark:divide-gray-700">
          {/* Profile Photo & Name Section */}
          <div className="pt-10 px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-start gap-8">
              {/* Profile Image Upload */}
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 mb-3 ring-4 ring-white dark:ring-gray-800 shadow-lg">
                    {profileImage ? (
                      <div className="w-full h-full">
                        <Image
                          src={profileImage}
                          alt="Profile"
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                          onError={() => {
                            setProfileImage(null);
                            setImageError('Failed to load profile image');
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    <button
                      onClick={() => profileImageRef.current?.click()}
                      disabled={isUploadingImage}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                    >
                      {isUploadingImage ? (
                        <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <div className="flex flex-col items-center">
                          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-sm">Change Photo</span>
                        </div>
                      )}
                    </button>
                  </div>
                  <input
                    type="file"
                    ref={profileImageRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleProfileImageUpload(file);
                    }}
                  />
                </div>
                {imageError && (
                  <p className="mt-2 text-sm text-red-500 dark:text-red-400">{imageError}</p>
                )}
              </div>

              {/* Name Input Section */}
              <div className="flex-1 space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Display Name
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        name="name"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-[38px] px-3 text-gray-900"
                        placeholder="Enter your name"
                      />
                      {nameError && (
                        <p className="mt-1 text-sm text-red-500 dark:text-red-400">{nameError}</p>
                      )}
                    </div>
                    <button
                      onClick={handleUpdateProfile}
                      disabled={isSavingProfile}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 h-[38px]"
                    >
                      {isSavingProfile ? (
                        <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : ''}
                      Update
                    </button>
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                  Your name and profile picture will be visible publicly on your dashboard and shared reports.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Health Goals Section - Now with Age and Sex */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mt-6">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Personal Information</h3>
            
            <div className="space-y-6">
              {/* Age and Sex Inputs Side by Side with Update Button */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Age Input */}
                <div className="md:col-span-5">
                  <label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    id="age"
                    value={age}
                    onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                    min="0"
                    max="120"
                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-12 px-4 text-gray-900"
                    placeholder="Enter your age"
                  />
                  {ageError && (
                    <p className="mt-2 text-sm text-red-500 dark:text-red-400">{ageError}</p>
                  )}
                </div>
                
                {/* Biological Sex Input */}
                <div className="md:col-span-5">
                  <label htmlFor="sex" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Biological Sex
                  </label>
                  <select
                    name="sex"
                    id="sex"
                    value={sex}
                    onChange={(e) => setSex(e.target.value as 'male' | 'female' | 'other' | '')}
                    className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-12 px-4 text-gray-900 appearance-none bg-no-repeat"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: `right 0.5rem center`,
                      backgroundSize: `1.5em 1.5em`
                    }}
                  >
                    <option value="">Select sex</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {sexError && (
                    <p className="mt-2 text-sm text-red-500 dark:text-red-400">{sexError}</p>
                  )}
                </div>

                {/* Update Button */}
                <div className="md:col-span-2 flex items-end">
                  <button
                    onClick={handleUpdateProfile}
                    disabled={isSavingProfile}
                    className="w-full h-12 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                  >
                    {isSavingProfile ? (
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      'Update'
                    )}
                  </button>
                </div>
              </div>

              {/* Information Notice */}
              <div className="mt-6 flex items-start space-x-3 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>
                  Your age and sex information is used only to provide more accurate health insights and will not be shared publicly.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Account Section - Subtle */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mt-6">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Account Management</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Manage your account settings and data
                </p>
              </div>
              <button
                onClick={handleDeleteAccountClick}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      {showDeleteAccountDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4 text-center">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" 
              onClick={() => {
                setShowDeleteAccountDialog(false);
                setConfirmationPhrase('');
              }}
              aria-hidden="true"
            />

            {/* Dialog */}
            <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:max-w-lg sm:w-full">
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                      Confirm Account Deletion
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        This action will permanently delete your account and all associated data. This cannot be undone.
                      </p>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          To confirm, type <span className="font-mono font-semibold text-red-600 dark:text-red-400">{requiredPhrase}</span> in the box below:
                        </label>
                        <input
                          type="text"
                          value={confirmationPhrase}
                          onChange={(e) => setConfirmationPhrase(e.target.value)}
                          className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm px-3 py-2"
                          placeholder={requiredPhrase}
                          disabled={isDeletingAccount}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  disabled={confirmationPhrase !== requiredPhrase || isDeletingAccount}
                  className="inline-flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDeleteAccount}
                >
                  {isDeletingAccount ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    'Delete My Account'
                  )}
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={() => {
                    setShowDeleteAccountDialog(false);
                    setConfirmationPhrase('');
                  }}
                  disabled={isDeletingAccount}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
