'use client';

import React from 'react';
import { DashboardPreviewConfig } from './types';
import { useIframeThemeSync } from './hooks/useIframeThemeSync';

interface DashboardPreviewProps {
  config: DashboardPreviewConfig;
  className?: string;
}

export default function DashboardPreview({ config, className = '' }: DashboardPreviewProps) {
  // Initialize theme sync with the iframe
  useIframeThemeSync({ iframeId: config.iframeId });

  return (
    <section 
      id="dashboard-section"
      className={`mt-12 sm:mt-16 mb-8 sm:mb-12 animate-fade-in-up delay-300 px-3 sm:px-4 lg:px-6 ${className}`}
      role="region"
      aria-labelledby="dashboard-preview-title"
    >
      <div className="max-w-5xl mx-auto">
        <div className="group relative bg-white/50 dark:bg-gray-900/50 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-800 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10">
          {/* Dashboard Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 space-y-2 sm:space-y-0">
            <div>
              <h2 
                id="dashboard-preview-title"
                className="text-lg font-medium text-gray-900 dark:text-gray-300"
              >
                {config.title}
              </h2>
            </div>
            <a
              href={config.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md px-1 py-1"
              aria-label="Open full demo dashboard in new tab"
            >
              {config.linkText}
            </a>
          </div>
          
          {/* Dashboard Preview */}
          <div 
            className="relative w-full overflow-hidden rounded-lg aspect-[4/5] sm:aspect-[16/10] md:aspect-[16/9] min-h-[400px] sm:min-h-[350px] md:min-h-0"
            role="img"
            aria-label="Interactive dashboard preview showing health metrics and charts"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none z-10" />
            <iframe
              id={config.iframeId}
              src={config.demoUrl}
              className="w-full h-full transform hover:scale-[1.02] transition-transform duration-300"
              style={{
                border: 'none',
                borderRadius: '0.5rem',
                transform: 'scale(0.98)',
                transformOrigin: 'top center',
              }}
              title="Health Dashboard Demo"
              loading="lazy"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      </div>
    </section>
  );
}