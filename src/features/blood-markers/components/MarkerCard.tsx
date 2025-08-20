import React from 'react';
import { BloodMarker } from '../../upload/types';

interface MarkerCardProps {
  marker: BloodMarker;
  className?: string;
}

export default function MarkerCard({ marker, className = '' }: MarkerCardProps) {
  // Get flag color and styling
  const getFlagStyles = () => {
    switch (marker.flag) {
      case 'High':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      case 'Low':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <div className={`flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg ${className}`}>
      <div className="flex flex-col">
        <span className="font-medium text-gray-900 dark:text-white">
          {marker.name}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {marker.unit}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-lg font-semibold ${
          marker.flag === 'High' ? 'text-red-500' :
          marker.flag === 'Low' ? 'text-yellow-500' :
          'text-gray-900 dark:text-white'
        }`}>
          {marker.value}
        </span>
        {marker.flag && (
          <span className={`text-sm px-2 py-1 rounded ${getFlagStyles()}`}>
            {marker.flag}
          </span>
        )}
      </div>
    </div>
  );
}
