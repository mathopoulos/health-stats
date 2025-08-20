'use client';

import React from 'react';

interface PricingHeaderProps {
  className?: string;
}

export default function PricingHeader({ className = '' }: PricingHeaderProps) {
  return (
    <div className={`text-center mb-12 sm:mb-16 ${className}`}>
      <h2 
        id="pricing-title"
        className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
      >
        Everything you need to{' '}
        <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 text-transparent bg-clip-text">
          optimize your health
        </span>
      </h2>
    </div>
  );
}
