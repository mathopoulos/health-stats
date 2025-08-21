'use client';

import React, { useState } from 'react';
import { useSession } from "next-auth/react";
import AddResultsModal from '@features/experiments/components/AddResultsModal';
import { BloodTab, DesktopNavigation, MobileNavigation, MobileHeader } from '@features/upload/components';

export default function BloodPage() {
  const { data: session, status: sessionStatus } = useSession();
  
  // Blood test state
  const [isAddResultsModalOpen, setIsAddResultsModalOpen] = useState(false);
  const [status, setStatus] = useState<string>('');

  const handleTabChange = (tab: string) => {
    switch (tab) {
      case 'profile':
        window.location.href = '/upload/profile';
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
        window.location.href = '/upload/profile';
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
        activeTab="blood"
        onTabChange={handleTabChange}
        session={session}
        profileImage={null}
        name=""
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
          
          <BloodTab
            isAddResultsModalOpen={isAddResultsModalOpen}
            setIsAddResultsModalOpen={setIsAddResultsModalOpen}
          />
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation
        activeTab="blood"
        onTabChange={handleTabChange}
      />

      {/* Add Results Modal */}
      {isAddResultsModalOpen && (
        <AddResultsModal
          isOpen={isAddResultsModalOpen}
          onClose={() => setIsAddResultsModalOpen(false)}
          prefilledResults={null}
        />
      )}
    </div>
  );
}
