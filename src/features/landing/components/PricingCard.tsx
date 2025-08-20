'use client';

import React from 'react';
import { PricingTier } from './types';

interface PricingCardProps {
  pricing: PricingTier;
  className?: string;
}

export default function PricingCard({ pricing, className = '' }: PricingCardProps) {
  return (
    <div 
      className={`group bg-white/40 dark:bg-gray-900/40 backdrop-blur-lg rounded-2xl p-12 sm:p-16 border border-gray-200/50 dark:border-gray-800/50 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:scale-[1.02] ${className}`}
      role="region"
      aria-labelledby="pricing-card-title"
    >
      {/* Logo */}
      <div className="mb-6">
        <h3 
          id="pricing-card-title"
          className="text-2xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400 text-transparent bg-clip-text"
        >
          {pricing.name}
        </h3>
      </div>

      <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 font-medium">
        {pricing.tagline}
      </p>

      {/* Price */}
      <div className="mb-8">
        <div className="flex items-baseline mb-2">
          <span 
            className="text-5xl font-bold text-gray-900 dark:text-white"
            aria-label={`Price: ${pricing.price.amount}`}
          >
            {pricing.price.amount}
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {pricing.price.billing}
        </p>
      </div>

      {/* CTA Button */}
      <a
        href={pricing.cta.href}
        className="w-full inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25 group focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        role="button"
        aria-label={`${pricing.cta.text} - Navigate to checkout`}
      >
        {pricing.cta.text}
        <span 
          className="ml-2 transform translate-x-0 group-hover:translate-x-1 transition-transform"
          aria-hidden="true"
        >
          →
        </span>
      </a>
    </div>
  );
}
