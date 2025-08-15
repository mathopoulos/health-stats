import React from 'react';
import { ProtocolCard } from './ProtocolCard';
import type { HealthProtocol } from '@/types/healthProtocol';

interface DietProtocolCardProps {
  currentDietProtocol: HealthProtocol | null;
  loading: boolean;
}

export function DietProtocolCard({ currentDietProtocol, loading }: DietProtocolCardProps) {
  const formatProtocolName = (protocol: string | undefined | null) => {
    if (!protocol || typeof protocol !== 'string') {
      return 'Unknown';
    }
    return protocol.replace(/-/g, ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <ProtocolCard title="Diet Protocol">
      <div className="mt-1.5 md:mt-2 flex flex-col md:flex-row md:items-baseline gap-1 md:gap-2">
        <span className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
          {loading ? (
            "..."
          ) : currentDietProtocol ? (
            formatProtocolName(currentDietProtocol.protocol)
          ) : (
            "None"
          )}
        </span>
      </div>
      {currentDietProtocol && (
        <span className="mt-1 text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
          Started {new Date(currentDietProtocol.startDate).toLocaleDateString()}
        </span>
      )}
    </ProtocolCard>
  );
}
