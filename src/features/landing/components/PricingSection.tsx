'use client';

import React from 'react';
import { PricingTier } from './types';
import PricingHeader from './PricingHeader';
import PricingCard from './PricingCard';
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
        <PricingHeader />

        {/* Pricing Card and Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Pricing Card */}
          <PricingCard pricing={pricing} />

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