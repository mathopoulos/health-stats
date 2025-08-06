'use client';

import React from 'react';
import { HeroConfig } from './types';
interface HeroSectionProps {
  config: HeroConfig;
  className?: string;
}

export default function HeroSection({ config, className = '' }: HeroSectionProps) {

  return (
    <section 
      id="hero-section" 
      className={`mt-8 sm:mt-12 ${className}`}
      role="banner"
      aria-labelledby="hero-title"
    >
      {/* Main Title */}
      <div className="mt-6 sm:mt-8 text-center">
        <h1 
          id="hero-title"
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight max-w-7xl mx-auto"
        >
          <div className="mb-2">{config.title.line1}</div>
          <div>
            {config.title.line2}{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400 text-transparent bg-clip-text underline decoration-indigo-500 dark:decoration-indigo-400 decoration-4 underline-offset-4">
              {config.title.highlightedWord}
            </span>
            {' '}your health.
          </div>
        </h1>
      </div>

    </section>
  );
}