'use client';

import React from 'react';
import { HeroConfig } from './types';
import { useSmoothScroll } from './hooks/useSmoothScroll';
import { createButtonActionHandler, extractButtonActions } from './utils/button-actions';

interface ActionButtonsProps {
  config: HeroConfig;
  className?: string;
}

export default function ActionButtons({ config, className = '' }: ActionButtonsProps) {
  const { scrollToSection } = useSmoothScroll();
  const buttonActions = extractButtonActions(config);

  const handleSecondaryAction = createButtonActionHandler(
    buttonActions.secondary,
    scrollToSection
  );

  return (
    <section 
      className={`mt-8 sm:mt-12 mb-8 sm:mb-12 ${className}`}
      role="region"
      aria-labelledby="action-buttons-section"
    >
      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 animate-fade-in-up delay-200 px-3 sm:px-0">
        <a 
          href={config.buttons.primary.href}
          className="group inline-flex items-center justify-center px-6 sm:px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25 w-full sm:w-auto"
          role="button"
          aria-label={`${config.buttons.primary.text} - Navigate to checkout`}
        >
          <span>{config.buttons.primary.text}</span>
          <span className="ml-2 transform translate-x-0 group-hover:translate-x-1 transition-transform" aria-hidden="true">
            →
          </span>
        </a>
        
        <button
          onClick={handleSecondaryAction}
          className="group inline-flex items-center justify-center px-6 sm:px-8 py-3 border border-gray-300 dark:border-gray-700 text-base font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-gray-800/25 w-full sm:w-auto"
          aria-label={`${config.buttons.secondary.text} - Navigate to features section`}
        >
          {config.buttons.secondary.text}
          <svg 
            className="ml-2 w-4 h-4 transform group-hover:rotate-180 transition-transform" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </section>
  );
}