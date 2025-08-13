'use client';

import React from 'react';
import { PricingTier } from './types';
import FeatureList from './FeatureList';

interface PricingSectionProps {
  pricing: PricingTier;
  className?: string;
}

export default function PricingSection({ pricing, className = '' }: PricingSectionProps) {
  return (
    <section 
      id="pricing-section"
      className={`mt-0 mb-16 sm:mb-24 px-8 sm:px-12 lg:px-20 xl:px-32 py-8 sm:py-12 animate-fade-in-up delay-500 ${className}`}
      role="region"
      aria-labelledby="pricing-title"
    >
      <div className="max-w-7xl mx-auto">
        {/* Pricing Header */}
        <div className="text-center mb-12 sm:mb-16">
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

        {/* Pricing Card and Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Pricing Card */}
          <div 
            className="group bg-white/40 dark:bg-gray-900/40 backdrop-blur-lg rounded-2xl p-12 sm:p-16 border border-gray-200/50 dark:border-gray-800/50 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:scale-[1.02]"
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

          {/* Features List */}
          <div role="region" aria-labelledby="features-title">
            <h3 id="features-title" className="sr-only">Product Features</h3>
            <FeatureList features={pricing.features} />
          </div>
        </div>
      </div>
    </section>
  );
}