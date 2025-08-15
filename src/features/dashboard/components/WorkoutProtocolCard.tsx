import React from 'react';
import { ProtocolCard } from './ProtocolCard';
import type { HealthProtocol } from '@/types/healthProtocol';

interface WorkoutProtocolCardProps {
  currentWorkoutProtocol: HealthProtocol | null;
  loading: boolean;
}

export function WorkoutProtocolCard({ currentWorkoutProtocol, loading }: WorkoutProtocolCardProps) {
  if (loading) {
    return (
      <ProtocolCard title="Workout Protocol">
        <div className="mt-3">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          </div>
        </div>
      </ProtocolCard>
    );
  }

  if (!currentWorkoutProtocol) {
    return (
      <ProtocolCard title="Workout Protocol">
        <div className="mt-3 flex-1 flex flex-col justify-center">
          <span className="text-lg text-gray-400 dark:text-gray-500">
            None
          </span>
          <span className="mt-1 block text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
            No workout protocol set
          </span>
        </div>
      </ProtocolCard>
    );
  }

  let protocolData;
  try {
    if (!currentWorkoutProtocol.protocol) {
      throw new Error('Protocol field is empty');
    }
    protocolData = JSON.parse(currentWorkoutProtocol.protocol);
  } catch (error) {
    return (
      <ProtocolCard title="Workout Protocol">
        <div className="mt-3 flex-1 flex flex-col justify-center">
          <span className="text-lg text-red-500">Invalid protocol data</span>
        </div>
      </ProtocolCard>
    );
  }

  const workouts = protocolData.workouts || [];

  const formatWorkoutName = (type: string | undefined | null) => {
    if (!type || typeof type !== 'string') {
      return 'Unknown Workout';
    }
    return type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getWorkoutStyle = (type: string) => {
    const lowerType = type?.toLowerCase() || '';
    
    // Common purple styling for all workout types
    const commonStyle = {
      bg: 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20',
      text: 'text-indigo-700 dark:text-indigo-300',
      freqBg: 'bg-indigo-100 dark:bg-indigo-800/30',
      freqText: 'text-indigo-800 dark:text-indigo-200',
      border: 'border-indigo-200 dark:border-indigo-800'
    };
    
    if (lowerType.includes('strength') || lowerType.includes('weight') || lowerType.includes('lifting') || lowerType.includes('resistance')) {
      return {
        icon: (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29l-1.43-1.43z"/>
          </svg>
        ),
        ...commonStyle
      };
    } else if (lowerType.includes('run') || lowerType.includes('cardio') || lowerType.includes('endurance')) {
      return {
        icon: (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z"/>
          </svg>
        ),
        ...commonStyle
      };
    } else {
      return {
        icon: (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        ),
        ...commonStyle
      };
    }
  };

  return (
    <ProtocolCard title="Workout Protocol">
      <div className="mt-3 flex-1 flex flex-col">
        {/* Individual Workouts */}
        <div className="flex flex-wrap gap-3 mb-4">
          {workouts.map((workout: any, index: number) => {
            const style = getWorkoutStyle(workout.type);
            
            return (
              <div
                key={index}
                className={`group relative inline-flex items-center gap-3 px-4 py-3 ${style.bg} ${style.text} rounded-xl border ${style.border} shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]`}
              >
                {/* Workout Icon */}
                <div className="flex-shrink-0">
                  {style.icon}
                </div>
                
                {/* Workout Name */}
                <span className="font-medium text-sm">
                  {formatWorkoutName(workout.type)}
                </span>
                
                {/* Frequency Badge */}
                <div className={`flex-shrink-0 inline-flex items-center justify-center w-8 h-6 ${style.freqBg} ${style.freqText} text-xs font-bold rounded-full`}>
                  {workout.frequency || 0}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Start Date with enhanced styling */}
        <div className="flex items-center gap-2 mt-auto">
          <svg className="w-3 h-3 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
          </svg>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Started {new Date(currentWorkoutProtocol.startDate).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </span>
        </div>
      </div>
    </ProtocolCard>
  );
}