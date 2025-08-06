'use client';

import React from 'react';
import { Step } from './types';

interface FeatureStepProps {
  step: Step;
  isVisible: boolean;
  onRef: (el: HTMLDivElement | null) => void;
  showDivider?: boolean;
}

export default function FeatureStep({ step, isVisible, onRef, showDivider = true }: FeatureStepProps) {
  return (
    <>
      <div 
        ref={onRef}
        data-section={step.id}
        className={`text-center mb-12 transition-all duration-700 ease-out ${
          isVisible 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 translate-y-8 scale-90'
        }`}
      >
        <h3 
          className={`text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-12 transition-all duration-700 ease-out delay-200 ${
            isVisible 
              ? 'opacity-100 translate-y-0 scale-100' 
              : 'opacity-0 translate-y-4 scale-95'
          }`}
        >
          {step.title}
        </h3>
        <div 
          className={`w-full max-w-2xl mx-auto rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-700 ease-out delay-300 ${
            isVisible 
              ? 'opacity-100 scale-100' 
              : 'opacity-0 scale-85'
          }`}
        >
          <img 
            src={step.image.src}
            alt={step.image.alt}
            className="w-full h-auto"
            loading="lazy"
          />
        </div>
      </div>

      {/* Divider Line */}
      {showDivider && (
        <div className="flex justify-center mb-12" role="presentation">
          <div className="w-0.5 h-20 bg-gray-300 dark:bg-gray-600"></div>
        </div>
      )}
    </>
  );
}