import React from 'react';
import { BloodMarker } from '../../upload/types';
import MarkerCard from './MarkerCard';

interface MarkerCategoryProps {
  category: string;
  markers: BloodMarker[];
  className?: string;
}

export default function MarkerCategory({ category, markers, className = '' }: MarkerCategoryProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
        {category}
      </h3>
      <div className="grid grid-cols-1 gap-2">
        {markers.map((marker) => (
          <MarkerCard
            key={marker.name}
            marker={marker}
          />
        ))}
      </div>
    </div>
  );
}
