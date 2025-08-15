import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import type { UserData } from '@/types/dashboard';

interface DashboardHeaderProps {
  userData: UserData | null;
  userId: string | undefined;
  sessionUserId: string | undefined;
  loading: boolean;
}

export function DashboardHeader({ userData, userId, sessionUserId, loading }: DashboardHeaderProps) {
  const isOwner = userId === sessionUserId;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 sm:px-6 py-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        {isOwner ? (
          <>
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
              {userData?.profileImage ? (
                <Image
                  src={userData.profileImage}
                  alt="Profile"
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement?.classList.add('profile-image-error');
                    console.error('Failed to load profile image');
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                    />
                  </svg>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                {userData?.name || ''}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-gray-600 dark:text-gray-400 text-sm">Health Dashboard</p>
                <button
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/dashboard/${userId}`;
                    navigator.clipboard.writeText(shareUrl).then(() => {
                      toast.success('Dashboard link copied to clipboard!', {
                        duration: 2000,
                        style: {
                          background: '#333',
                          color: '#fff',
                        },
                      });
                    }).catch(() => {
                      toast.error('Failed to copy link', {
                        duration: 2000,
                        style: {
                          background: '#333',
                          color: '#fff',
                        },
                      });
                    });
                  }}
                  className="inline-flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-shrink-0">
              <Link
                href="/upload"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors duration-200"
              >
                Manage
              </Link>
            </div>
          </>
        ) : (
          <div className="flex flex-wrap items-center gap-4 w-full">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
              {userData?.profileImage ? (
                <Image
                  src={userData.profileImage}
                  alt="Profile"
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement?.classList.add('profile-image-error');
                    console.error('Failed to load profile image');
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                {userData?.name || ''}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-gray-600 dark:text-gray-400 text-sm">Health Dashboard</p>
                <button
                  onClick={() => {
                    const url = window.location.href;
                    navigator.clipboard.writeText(url).then(() => {
                      toast.success('Dashboard link copied to clipboard!', {
                        duration: 2000,
                        style: {
                          background: '#333',
                          color: '#fff',
                        },
                      });
                    }).catch(() => {
                      toast.error('Failed to copy link', {
                        duration: 2000,
                        style: {
                          background: '#333',
                          color: '#fff',
                        },
                      });
                    });
                  }}
                  className="inline-flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
