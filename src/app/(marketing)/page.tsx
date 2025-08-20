import React from 'react';
import ThemeToggle from '@components/ThemeToggleClient';
import {
  LifetimeOfferBanner,
  Navigation,
  HeroSection,
  DashboardPreview,
  ActionButtons,
  HowItWorksSection,
  PricingSection,
  Footer,
  heroConfig,
  stepsConfig,
  pricingConfig,
  dashboardPreviewConfig
} from '@features/landing';

/**
 * Landing Page Component - Refactored for better maintainability
 * 
 * This component has been refactored from a monolithic 512-line component
 * into smaller, reusable components with proper separation of concerns.
 * 
 * Key improvements:
 * - Component extraction for better reusability
 * - Custom hooks for complex logic
 * - Configuration-driven content
 * - Better accessibility
 * - Improved TypeScript typing
 * - Enhanced performance with proper memoization
 */
export default function Home() {
  return (
    <main 
      className="min-h-screen bg-primary dark:bg-primary-dark-dark text-gray-900 dark:text-white overflow-hidden"
      role="main"
      aria-label="Health Stats landing page"
    >
      {/* Background Effects */}
      <div 
        className="fixed inset-0 bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent dark:from-indigo-500/20 dark:via-purple-500/10 pointer-events-none" 
        aria-hidden="true"
      />
      <div 
        className="fixed inset-0 bg-[url('/patterns/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none" 
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative">
        {/* Lifetime Offer Banner */}
        <LifetimeOfferBanner />

        {/* Navigation */}
        <Navigation />

        {/* Theme Toggle */}
        <div className="fixed bottom-4 right-4 z-[100]">
          <ThemeToggle />
        </div>

        {/* Hero Section */}
        <HeroSection config={heroConfig} />

        {/* Dashboard Preview */}
        <DashboardPreview config={dashboardPreviewConfig} />

        {/* Action Buttons */}
        <ActionButtons config={heroConfig} />

        {/* How It Works Section */}
        <HowItWorksSection steps={stepsConfig} />

        {/* Pricing Section */}
        <PricingSection pricing={pricingConfig} />
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
}