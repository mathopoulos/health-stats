'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function UploadIndexPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Get the tab parameter from URL or default to profile
    const tab = searchParams?.get('tab');
    
    // Redirect to the appropriate upload sub-page
    switch (tab) {
      case 'protocols':
        router.replace('/upload/protocols');
        break;
      case 'fitness':
        router.replace('/upload/fitness');
        break;
      case 'blood':
        router.replace('/upload/blood');
        break;
      case 'more':
      case 'settings':
        router.replace('/upload/settings');
        break;
      case 'profile':
      default:
        router.replace('/upload/profile');
        break;
    }
  }, [searchParams, router]);

  // Show loading while redirecting
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirecting...</p>
                        </div>
                      </div>
    </div>
  );
} 
