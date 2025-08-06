'use client';

import React from 'react';
import { Feature } from './types';

interface FeatureListProps {
  features: Feature[];
  className?: string;
}

function CheckmarkIcon({ className = '' }: { className?: string }) {
  return (
    <svg 
      className={`w-4 h-4 text-green-500 ${className}`} 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function FeatureList({ features, className = '' }: FeatureListProps) {
  return (
    <div className={`space-y-6 ${className}`} role="list" aria-label="Product features">
      {features.map((feature) => (
        <div key={feature.id} className="flex items-start space-x-4" role="listitem">
          <div className="flex-shrink-0 w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center mt-1">
            {feature.icon.type === 'checkmark' ? (
              <CheckmarkIcon />
            ) : (
              // Custom icon support for future expansion
              <svg 
                className="w-4 h-4 text-green-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d={feature.icon.customPath || "M5 13l4 4L19 7"} 
                />
              </svg>
            )}
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {feature.title}
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              {feature.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}