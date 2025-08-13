'use client';

import React from 'react';
import { Step } from './types';
import { useScrollAnimation } from './hooks/useScrollAnimation';
import { scrollAnimationConfig } from './config';
import FeatureStep from './FeatureStep';

interface HowItWorksSectionProps {
  steps: Step[];
  className?: string;
}

export default function HowItWorksSection({ steps, className = '' }: HowItWorksSectionProps) {
  const { visibleSections, setSectionRef } = useScrollAnimation(scrollAnimationConfig);

  return (
    <section 
      id="how-it-works-section" 
      className={`mt-16 sm:mt-24 mb-0 px-8 sm:px-12 lg:px-20 xl:px-32 py-8 sm:py-12 animate-fade-in-up delay-450 ${className}`}
      role="region"
      aria-labelledby="how-it-works-title"
    >
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div 
          ref={setSectionRef(3)}
          data-section="3"
          className={`text-center mb-16 sm:mb-20 transition-all duration-700 ease-out ${
            visibleSections.has(3) 
              ? 'opacity-100 translate-y-0 scale-100' 
              : 'opacity-0 translate-y-4 scale-95'
          }`}
        >
          {/* Sub Header */}
          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 tracking-wider uppercase mb-4">
            HOW IT WORKS
          </p>
          
          {/* Main Title */}
          <h2 
            id="how-it-works-title"
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
          >
            Let's walk through{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 text-transparent bg-clip-text">
              how it works
            </span>
          </h2>
        </div>

        {/* Steps */}
        <div role="list" aria-label="How it works steps">
          {steps.map((step, index) => (
            <div key={step.id} role="listitem">
              <FeatureStep
                step={step}
                isVisible={visibleSections.has(step.id)}
                onRef={setSectionRef(step.id)}
                showDivider={index < steps.length - 1}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}