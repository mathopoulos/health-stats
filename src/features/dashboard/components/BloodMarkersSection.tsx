import React from 'react';
import { getReferenceRanges, getBloodMarkerStatus } from '@/lib/bloodMarkerRanges';
import type { BloodMarker, UserData } from '@/types/dashboard';

interface MarkerRowProps {
  label: string;
  data: BloodMarker[];
  userData?: UserData | null;
  onClick?: () => void;
}

interface LastTestedDateProps {
  data: BloodMarker[];
}

interface BloodMarkersSectionProps {
  title: string;
  markers: Array<{
    label: string;
    data: BloodMarker[];
  }>;
  userData?: UserData | null;
  onMarkerClick: (label: string, data: BloodMarker[]) => void;
}

const LastTestedDate = ({ data }: LastTestedDateProps) => (
  data && data.length > 0 && (
    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-4 sm:mt-6">
      Last tested: {new Date(data[0].date).toLocaleDateString()}
    </p>
  )
);

// Full MarkerRow implementation extracted from original dashboard
const MarkerRow = ({ label, data, userData, onClick }: MarkerRowProps) => {
  const getStatusInfo = (value: number) => {
    const status = getBloodMarkerStatus(value, label, userData || undefined);
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getStatusPillClasses = (status: string) => {
    switch (status) {
      case 'Abnormal': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'Normal': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Optimal': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Get reference ranges from centralized source
  const referenceRanges = getReferenceRanges(label, undefined, userData || undefined);
  const { abnormalText, normalText, optimalText } = referenceRanges;

  return (
    <div 
      className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3 border-b border-gray-100 dark:border-gray-700 pb-4 ${
        data && data.length > 0 && onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-none px-2 -mx-2 py-2 transition-colors' : ''
      }`}
      onClick={data && data.length > 0 && onClick ? onClick : undefined}
    >
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">{label}</span>
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {data && data.length > 0 && (
          <>
            <div className="group relative">
              {/* Status Pill */}
              <div 
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-transform duration-200 group-hover:scale-105 ${
                  getStatusPillClasses(getStatusInfo(data[0].value))
                }`}
              >
                {getStatusInfo(data[0].value)}
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg py-3 px-4 shadow-sm border border-gray-100 dark:border-gray-700 w-[200px] sm:w-[250px]">
                  <div className="flex flex-col gap-3">
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-red-500 font-medium">Abnormal</span>
                        <span className="text-gray-600 dark:text-gray-400">{abnormalText}</span>
                      </div>
                      {normalText && (
                        <div className="flex items-center justify-between">
                          <span className="text-yellow-500 font-medium">Normal</span>
                          <span className="text-gray-600 dark:text-gray-400">{normalText}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-green-500 font-medium">Optimal</span>
                        <span className="text-gray-600 dark:text-gray-400">{optimalText}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-2 h-2 bg-white dark:bg-gray-800 border-r border-b border-gray-100 dark:border-gray-700 absolute -bottom-1 left-1/2 -translate-x-1/2 transform rotate-45"></div>
              </div>
            </div>
          </>
        )}
        <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white whitespace-nowrap">
          {data && data.length > 0 ? `${data[0].value} ${data[0].unit}` : "No data"}
        </span>
      </div>
    </div>
  );
};

export function BloodMarkersSection({ 
  title, 
  markers, 
  userData, 
  onMarkerClick 
}: BloodMarkersSectionProps) {
  // Find the first marker with data to use for last tested date
  const firstMarkerWithData = markers.find(marker => marker.data && marker.data.length > 0);

  return (
    <div className="border border-gray-100 dark:border-gray-700 rounded-xl px-4 sm:px-6 py-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
        {title}
      </h3>
      <div className="space-y-6">
        {markers.map((marker) => (
          <MarkerRow 
            key={marker.label}
            label={marker.label}
            data={marker.data}
            userData={userData}
            onClick={() => onMarkerClick(marker.label, marker.data)}
          />
        ))}
      </div>
      {firstMarkerWithData && (
        <LastTestedDate data={firstMarkerWithData.data} />
      )}
    </div>
  );
}
