'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import ThemeToggle from '@components/ThemeToggle';
import { useTheme } from '@providers/ThemeProvider';
import toast, { Toaster } from 'react-hot-toast';

interface LeaderboardEntry {
  userId: string;
  name: string;
  profileImage?: string;
  avgHRV: number;
  dataPoints: number;
  latestDate: string;
}

type TabType = 'hrv' | 'vo2max';

export default function LeaderboardPage() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('hrv');
  const [hrvData, setHrvData] = useState<LeaderboardEntry[]>([]);
  const [vo2Data, setVo2Data] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<{ hrv: boolean; vo2max: boolean }>({ hrv: true, vo2max: true });
  const [error, setError] = useState<{ hrv: string | null; vo2max: string | null }>({ hrv: null, vo2max: null });

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        // HRV
        const hrvRes = await fetch('/api/leaderboard/hrv', {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        const hrvJson = await hrvRes.json();
        if (hrvJson.success) {
          setHrvData(hrvJson.data);
        } else {
          setError(prev => ({ ...prev, hrv: hrvJson.error || 'Failed to fetch HRV leaderboard' }));
        }
        // VO2 max
        const vo2Res = await fetch('/api/leaderboard/vo2max', {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        const vo2Json = await vo2Res.json();
        if (vo2Json.success) {
          setVo2Data(vo2Json.data);
        } else {
          setError(prev => ({ ...prev, vo2max: vo2Json.error || 'Failed to fetch VO2 max leaderboard' }));
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError({ hrv: 'Failed to load leaderboard', vo2max: 'Failed to load leaderboard' });
      } finally {
        setLoading({ hrv: false, vo2max: false });
      }
    };

    fetchLeaderboardData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getRankText = (rank: number) => {
    const suffix = (rank: number) => {
      if (rank >= 11 && rank <= 13) return 'th';
      switch (rank % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    return `${rank}${suffix(rank)}`;
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-400 to-yellow-600 dark:from-yellow-300 dark:to-yellow-500';
      case 2:
        return 'from-gray-300 to-gray-500 dark:from-gray-400 dark:to-gray-600';
      case 3:
        return 'from-amber-600 to-amber-800 dark:from-amber-500 dark:to-amber-700';
      default:
        return 'from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500';
    }
  };

  const currentData = activeTab === 'hrv' ? hrvData : vo2Data;
  const currentLoading = activeTab === 'hrv' ? loading.hrv : loading.vo2max;
  const currentError = activeTab === 'hrv' ? error.hrv : error.vo2max;

  return (
    <>
      <Toaster position="bottom-left" />
      <main className="min-h-screen px-4 sm:px-8 py-8 bg-gray-50 dark:bg-gray-900">
        {/* Theme Toggle */}
        <div className="fixed bottom-4 right-4 z-[100]">
          <ThemeToggle />
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Page Header */}
          <div className="text-center space-y-6">
            <div className="relative">
              {/* Decorative elements */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
              </div>
              <div className="relative">
                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full border border-indigo-200/20 dark:border-purple-300/20 backdrop-blur-sm mb-4">
                  <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">LIVE RANKINGS</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 dark:from-white dark:via-indigo-100 dark:to-purple-100 text-transparent bg-clip-text leading-tight">
                  Leaderboards
                </h1>
                <div className="flex items-center justify-center space-x-1 mt-2">
                  <div className="w-1 h-1 bg-indigo-500 rounded-full"></div>
                  <div className="w-8 h-px bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                  <div className="w-1 h-1 bg-purple-500 rounded-full"></div>
                </div>
              </div>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-medium">
              Compete with the <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Revly community</span> and track your fitness progress
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="relative">
              <div className="overflow-x-auto scrollbar-hide">
                <nav className="flex space-x-1 p-2" aria-label="Tabs">
                  {(['hrv','vo2max'] as TabType[]).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-3 px-6 text-sm font-medium rounded-xl transition-all duration-200 ${
                        activeTab === tab
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        {tab === 'hrv' ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        )}
                        <span>{tab === 'hrv' ? 'HRV' : 'VO2 Max'}</span>
                      </div>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>



          {/* Leaderboard Content */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
            {currentLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading leaderboard...</p>
                </div>
              </div>
            ) : currentError ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="text-red-500 dark:text-red-400 text-4xl mb-4">⚠️</div>
                  <p className="text-gray-600 dark:text-gray-400">{currentError}</p>
                </div>
              </div>
            ) : currentData.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="text-gray-400 dark:text-gray-500 text-4xl mb-4">📊</div>
                  <p className="text-gray-600 dark:text-gray-400">No HRV data available yet</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {currentData.map((entry, index) => {
                  const rank = index + 1;
                  const rankText = getRankText(rank);
                  const isTopThree = rank <= 3;

                  return (
                    <div
                      key={entry.userId}
                      className="relative transition-all duration-200 hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-5">
                            {/* Rank */}
                            <div className="flex-shrink-0 relative">
                              <div className="flex items-center justify-center w-16 h-12">
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                  {rankText}
                                </span>
                              </div>
                            </div>

                            {/* Profile Image */}
                            <div className={`w-14 h-14 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0 ${isTopThree ? 'ring-2 ring-indigo-200 dark:ring-indigo-700' : ''} shadow-md`}>
                              {entry.profileImage ? (
                                <Image
                                  src={entry.profileImage}
                                  alt={`${entry.name}'s profile`}
                                  width={56}
                                  height={56}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.parentElement?.classList.add('profile-image-error');
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                              )}
                            </div>

                            {/* User Info */}
                            <div className="min-w-0 flex-1">
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                                {entry.name}
                              </h3>
                              <div className="flex items-center space-x-4 mt-1">
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                  {entry.dataPoints} readings
                                </div>
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {formatDate(entry.latestDate)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Score */}
                          <div className="text-right">
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">
                              {activeTab === 'hrv' ? entry.avgHRV : (entry as any).avgValue}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                              {activeTab === 'hrv' ? 'ms' : 'ml/kg/min'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>


        </div>
      </main>
    </>
  );
} 