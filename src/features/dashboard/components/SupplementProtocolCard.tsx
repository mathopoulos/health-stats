import React from 'react';
import { ProtocolCard } from './ProtocolCard';
import type { HealthProtocol } from '@/types/healthProtocol';

interface SupplementProtocolCardProps {
  currentSupplementProtocol: HealthProtocol | null;
  loading: boolean;
}

export function SupplementProtocolCard({ currentSupplementProtocol, loading }: SupplementProtocolCardProps) {
  if (loading) {
    return (
      <ProtocolCard title="Supplement Protocol" className="max-h-[400px]">
        <div className="mt-3">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          </div>
        </div>
      </ProtocolCard>
    );
  }

  if (!currentSupplementProtocol) {
    return (
      <ProtocolCard title="Supplement Protocol" className="max-h-[400px]">
        <div className="mt-3 flex-1 flex flex-col justify-center">
          <span className="text-lg text-gray-400 dark:text-gray-500">
            None
          </span>
          <span className="mt-1 block text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
            No supplement protocol set
          </span>
        </div>
      </ProtocolCard>
    );
  }

  let protocolData;
  try {
    if (!currentSupplementProtocol.protocol) {
      throw new Error('Protocol field is empty');
    }
    protocolData = JSON.parse(currentSupplementProtocol.protocol);
  } catch (error) {
    return (
      <ProtocolCard title="Supplement Protocol" className="max-h-[400px]">
        <div className="mt-3 flex-1 flex flex-col justify-center">
          <span className="text-lg text-red-500">Invalid protocol data</span>
        </div>
      </ProtocolCard>
    );
  }

  const supplements = protocolData.supplements || [];

  const formatSupplementName = (name: string | undefined | null) => {
    if (!name || typeof name !== 'string') {
      return 'Unknown Supplement';
    }
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getSupplementStyle = () => {
    // Common green styling and pill icon for all supplement types
    return {
      icon: (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4.22 11.29l6.36-6.36c1.77-1.77 4.64-1.77 6.41 0l.71.71c1.77 1.77 1.77 4.64 0 6.41l-6.36 6.36c-1.77 1.77-4.64 1.77-6.41 0l-.71-.71c-1.77-1.77-1.77-4.64 0-6.41zm.71 5.7l.71.71c1.17 1.17 3.07 1.17 4.24 0l6.36-6.36c1.17-1.17 1.17-3.07 0-4.24l-.71-.71c-1.17-1.17-3.07-1.17-4.24 0l-6.36 6.36c-1.17 1.17-1.17 3.07 0 4.24z"/>
        </svg>
      ),
      bg: 'bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20',
      text: 'text-emerald-700 dark:text-emerald-300',
      freqBg: 'bg-emerald-100 dark:bg-emerald-800/30',
      freqText: 'text-emerald-800 dark:text-emerald-200',
      border: 'border-emerald-200 dark:border-emerald-800'
    };
  };

  return (
    <ProtocolCard title="Supplement Protocol" className="max-h-[400px]">
      <div className="flex items-center justify-between mb-3">
        <span></span> {/* Empty span to maintain spacing */}
        {supplements.length > 0 && (
          <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full font-medium">
            {supplements.length} supplement{supplements.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Scrollable Supplements Container */}
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar" style={{ scrollbarWidth: 'thin' }}>
          <div className="space-y-2">
            {supplements.map((supplement: any, index: number) => {
              const style = getSupplementStyle();
              
              return (
                <div
                  key={index}
                  className={`group relative flex items-center gap-3 px-3 py-2.5 ${style.bg} ${style.text} rounded-lg border ${style.border} shadow-sm hover:shadow-lg transition-all duration-200 hover:bg-gradient-to-r hover:from-emerald-100 hover:to-green-100 dark:hover:from-emerald-800/40 dark:hover:to-green-800/40`}
                >
                  {/* Supplement Icon */}
                  <div className="flex-shrink-0">
                    {style.icon}
                  </div>
                  
                  {/* Supplement Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs truncate">
                      {formatSupplementName(supplement.type || supplement.name)}
                    </div>
                    <div className="text-xs opacity-75 truncate">
                      {supplement.dosage} {supplement.unit} • {supplement.frequency?.replace('-', ' ') || 'daily'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Start Date with enhanced styling - Fixed at bottom */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <svg className="w-3 h-3 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
          </svg>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Started {new Date(currentSupplementProtocol.startDate).toLocaleDateString('en-US', { 
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