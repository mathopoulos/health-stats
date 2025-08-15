import React from 'react';
import { SleepStagesBar } from './SleepStagesBar';
import type { ActivityFeedItem } from '@/types/dashboard';

interface ActivityFeedProps {
  activities: ActivityFeedItem[];
  loading: boolean;
}

export function ActivityFeed({ activities, loading }: ActivityFeedProps) {
  // Emoji map for workout activities
  const emojiMap: Record<string, string> = {
    'running': '🏃',
    'walking': '🚶',
    'cycling': '🚴',
    'strength_training': '🏋️',
    'swimming': '🏊',
    'hiit': '🔥',
    'yoga': '🧘',
    'pilates': '🤸',
    'dance': '💃',
    'elliptical': '⚙️',
    'rowing': '🚣',
    'stair_climbing': '🧗',
    'hiking': '🥾',
    'basketball': '🏀',
    'soccer': '⚽',
    'tennis': '🎾',
    'golf': '🏌️',
    'default': '💪'
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl px-5 sm:px-10 py-8 shadow-sm">
        <div className="flex items-center gap-3 mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Recent activity</h2>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl px-5 sm:px-10 py-8 shadow-sm">
        <div className="flex items-center gap-3 mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Recent activity</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No recent activity data available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl px-5 sm:px-10 py-8 shadow-sm">
      <div className="flex items-center gap-3 mb-10">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Recent activity</h2>
      </div>
      
      {/* Timeline container */}
      <div className="space-y-12 relative px-2">
        {/* Timeline vertical line */}
        <div className="absolute left-[7px] inset-y-0 w-[2px] bg-gray-200 dark:bg-gray-700" />
        
        {activities.map((item, index) => (
          <div key={item.id} className="flex">
            {/* Timeline dot container */}
            <div className="relative flex-shrink-0 w-4 mr-6">
              <div className={`absolute -left-[5px] w-4 h-4 rounded-full z-10 ${
                item.type === 'sleep' ? 'bg-blue-100 ring-4 ring-blue-500' :
                item.type === 'workout' ? 'bg-green-100 ring-4 ring-green-500' :
                'bg-orange-100 ring-4 ring-orange-500'
              }`} />
            </div>
            
            {/* Activity content */}
            <div className="flex-grow mb-8">
              {/* Date and Time range */}
              <div className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                {item.startTime && (
                  <>
                    <div className="font-medium mb-1">
                      {new Date(item.startTime).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <div>
                      {new Date(item.startTime).toLocaleString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        })} until {new Date(item.endTime || item.startTime).toLocaleString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        })}
                    </div>
                  </>
                )}
              </div>

              {/* Activity card */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-8">
                {item.type === 'sleep' && (
                  <>
                    {/* Time asleep */}
                    <div className="mb-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-3xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                            {item.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Time asleep
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sleep stages */}
                    {item.sleepStages && (
                      <div className="space-y-6">
                        <SleepStagesBar stageDurations={item.sleepStages} />
                      </div>
                    )}
                  </>
                )}

                {item.type === 'workout' && (
                  <div>
                    <div className="mb-5">
                      <div className="flex items-center gap-3">
                        <span className="text-5xl mr-2">
                          {emojiMap[item.activityType || 'default'] || emojiMap.default}
                        </span>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                            {item.title}
                          </h3>
                          {item.subtitle && (
                            <div className="text-base font-medium text-gray-700 dark:text-gray-300 mt-1">
                              {item.subtitle}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Workout details */}
                    <div className="mt-4">
                      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Object.entries(item.metrics).map(([key, value]) => (
                          <div key={key} className="bg-white dark:bg-gray-700 rounded-lg p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-600">
                            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1 truncate">{key}</div>
                            <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
