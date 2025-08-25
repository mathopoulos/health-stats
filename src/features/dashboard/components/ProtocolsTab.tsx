import React from 'react';
import { DietProtocolCard } from './DietProtocolCard';
import { WorkoutProtocolCard } from './WorkoutProtocolCard';
import { SupplementProtocolCard } from './SupplementProtocolCard';
import ActiveExperiments from './experiments/ActiveExperiments';

import type { HealthProtocol } from '@/types/healthProtocol';

interface ProtocolsTabProps {
  loading: boolean;
  currentDietProtocol: HealthProtocol | null;
  currentWorkoutProtocol: HealthProtocol | null;
  currentSupplementProtocol: HealthProtocol | null;
  userId?: string;
}

export function ProtocolsTab({ 
  loading,
  currentDietProtocol,
  currentWorkoutProtocol,
  currentSupplementProtocol,
  userId
}: ProtocolsTabProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {/* Diet Protocol */}
        <DietProtocolCard 
          currentDietProtocol={currentDietProtocol}
          loading={loading}
        />

        {/* Workout Protocol */}
        <WorkoutProtocolCard 
          currentWorkoutProtocol={currentWorkoutProtocol}
          loading={loading}
        />

        {/* Supplement Protocol */}
        <SupplementProtocolCard 
          currentSupplementProtocol={currentSupplementProtocol}
          loading={loading}
        />
      </div>

      {/* Active Experiments */}
      {userId && (
        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
            Active Experiments
          </h2>
          <ActiveExperiments userId={userId} />
        </div>
      )}
    </>
  );
}
