'use client';

import { useEffect, useState, useRef } from 'react';
import ThemeToggle from './components/ThemeToggle';
import { useTheme } from './context/ThemeContext';

function LifetimeOfferBanner() {
  return (
    <button
      onClick={() => window.location.href = '/auth/checkout'}
      className="relative z-50 w-full group cursor-pointer"
    >
      <div className="bg-indigo-600/5 dark:bg-indigo-600/10 border-b border-indigo-600/5 dark:border-indigo-400/5 hover:bg-indigo-600/10 dark:hover:bg-indigo-600/15 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <p className="text-indigo-600 dark:text-indigo-300 text-sm font-medium flex items-center flex-wrap gap-1.5">
              <span>🔥</span>
              <span className="font-semibold">Limited-Time Beta Pricing</span>
              <span className="text-purple-500 dark:text-purple-300 font-medium">Ending Soon!</span>
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [visibleSections, setVisibleSections] = useState<Set<number>>(new Set());
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const sectionIndex = parseInt(entry.target.getAttribute('data-section') || '0');
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set([...prev, sectionIndex]));
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: '-10% 0px -10% 0px'
      }
    );

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      sectionRefs.current.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, []);

  // Listen for theme changes from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'IFRAME_THEME_CHANGE' && event.data.theme) {
        // Only update if the theme is different to avoid infinite loops
        if (event.data.theme !== theme) {
          toggleTheme();
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [theme, toggleTheme]);

  // Sync theme with iframe when component mounts or theme changes
  useEffect(() => {
    const syncIframeTheme = () => {
      const iframe = document.getElementById('dashboard-iframe') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        try {
          iframe.contentWindow.postMessage(
            { type: 'THEME_CHANGE', theme }, 
            '*'
          );
        } catch (error) {
          // Silently handle cases where iframe might not be ready
          console.log('Theme sync with iframe failed:', error);
        }
      }
    };

    // Sync immediately - no delay needed for theme changes
    syncIframeTheme();

    // Also sync when iframe loads (for initial setup)
    const iframe = document.getElementById('dashboard-iframe') as HTMLIFrameElement;
    if (iframe) {
      const handleLoad = () => {
        syncIframeTheme();
      };
      iframe.addEventListener('load', handleLoad);
      
      return () => {
        iframe.removeEventListener('load', handleLoad);
      };
    }
  }, [theme]);

  return (
    <main className="min-h-screen bg-primary dark:bg-primary-dark-dark text-gray-900 dark:text-white overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent dark:from-indigo-500/20 dark:via-purple-500/10 pointer-events-none" />
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none" />

      {/* Content */}
      <div className="relative">
        {/* Lifetime Offer Banner */}
        <LifetimeOfferBanner />

        {/* Navigation */}
        <nav className="relative z-40">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <a href="/" className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400 text-transparent bg-clip-text bg-animate hover:scale-105 transition-all duration-300">
                revly
              </a>
              <div className="flex items-center space-x-4">
                <a
                  href="/auth/signin"
                  className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Log in
                </a>
              </div>
            </div>
          </div>
        </nav>

        {/* Theme Toggle */}
        <div className="fixed bottom-4 right-4 z-[100]">
          <ThemeToggle />
        </div>

        {/* Enhanced Main Title with Animation */}
        <div className="mt-8 sm:mt-12">
          <div className="mt-6 sm:mt-8 text-center">
            <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight max-w-7xl mx-auto">
              <div className="mb-2">It's never been</div>
              <div>easier to <span className="bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400 text-transparent bg-clip-text underline decoration-indigo-500 dark:decoration-indigo-400 decoration-4 underline-offset-4">track and improve</span> your health.</div>
            </div>
          </div>
        </div>

        {/* Enhanced Demo Section - Moved up to be above the fold */}
        <div className="mt-12 sm:mt-16 mb-8 sm:mb-12 animate-fade-in-up delay-300 px-3 sm:px-4 lg:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="group relative bg-white/50 dark:bg-gray-900/50 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-800 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10">
              {/* Dashboard Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 space-y-2 sm:space-y-0">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-300">Live Dashboard Preview</h3>
                </div>
                <a
                  href="/dashboard/userId=100492380040453908509"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                >
                  See Full Demo Dashboard →
                </a>
              </div>
              
              {/* Dashboard Preview */}
              <div className="relative w-full overflow-hidden rounded-lg 
                aspect-[4/5] sm:aspect-[16/10] md:aspect-[16/9] 
                min-h-[400px] sm:min-h-[350px] md:min-h-0">
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none z-10" />
                <iframe
                  id="dashboard-iframe"
                  src="/dashboard/userId=100492380040453908509"
                  className="w-full h-full transform hover:scale-[1.02] transition-transform duration-300"
                  style={{
                    border: 'none',
                    borderRadius: '0.5rem',
                    transform: 'scale(0.98)',
                    transformOrigin: 'top center',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced CTA Buttons - Moved below dashboard */}
        <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 animate-fade-in-up delay-200 px-3 sm:px-0">
          <a href="/auth/checkout" 
             className="group inline-flex items-center justify-center px-6 sm:px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25 w-full sm:w-auto">
            <span>Get Access (Beta)</span>
            <span className="ml-2 transform translate-x-0 group-hover:translate-x-1 transition-transform">→</span>
          </a>
          <button
            onClick={() => {
              const howItWorksSection = document.getElementById('how-it-works-section');
              if (howItWorksSection) {
                howItWorksSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="group inline-flex items-center justify-center px-6 sm:px-8 py-3 border border-gray-300 dark:border-gray-700 text-base font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-gray-800/25 w-full sm:w-auto">
            Explore
            <svg className="ml-2 w-4 h-4 transform group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>



        {/* How It Works Section */}
        <div id="how-it-works-section" className="mt-16 sm:mt-24 mb-0 px-8 sm:px-12 lg:px-20 xl:px-32 py-8 sm:py-12 animate-fade-in-up delay-450">
          <div className="max-w-4xl mx-auto">
            {/* Section Header */}
            <div 
              ref={(el) => { sectionRefs.current[3] = el; }}
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
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Let's walk through{' '}
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 text-transparent bg-clip-text">
                  how it works
                </span>
              </h2>
            </div>

            {/* Step 1 */}
            <div 
              ref={(el) => { sectionRefs.current[0] = el; }}
              data-section="0"
              className={`text-center mb-12 transition-all duration-700 ease-out ${
                visibleSections.has(0) 
                  ? 'opacity-100 translate-y-0 scale-100' 
                  : 'opacity-0 translate-y-8 scale-90'
              }`}
            >
              <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-12 transition-all duration-700 ease-out delay-200 ${
                visibleSections.has(0) 
                  ? 'opacity-100 translate-y-0 scale-100' 
                  : 'opacity-0 translate-y-4 scale-95'
              }`}>
                Connect your fitness trackers
              </h2>
              <div className={`w-full max-w-2xl mx-auto rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-700 ease-out delay-300 ${
                visibleSections.has(0) 
                  ? 'opacity-100 scale-100' 
                  : 'opacity-0 scale-85'
              }`}>
                <img 
                  src="/images/fitness-tracker.png" 
                  alt="Connect your fitness trackers"
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* Divider Line */}
            <div className="flex justify-center mb-12">
              <div className="w-0.5 h-20 bg-gray-300 dark:bg-gray-600"></div>
            </div>

            {/* Step 2 */}
            <div 
              ref={(el) => { sectionRefs.current[1] = el; }}
              data-section="1"
              className={`text-center mb-12 transition-all duration-700 ease-out ${
                visibleSections.has(1) 
                  ? 'opacity-100 translate-y-0 scale-100' 
                  : 'opacity-0 translate-y-8 scale-90'
              }`}
            >
              <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-12 transition-all duration-700 ease-out delay-200 ${
                visibleSections.has(1) 
                  ? 'opacity-100 translate-y-0 scale-100' 
                  : 'opacity-0 translate-y-4 scale-95'
              }`}>
                Upload any blood tests and health records
              </h2>
              <div className={`w-full max-w-2xl mx-auto rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-700 ease-out delay-300 ${
                visibleSections.has(1) 
                  ? 'opacity-100 scale-100' 
                  : 'opacity-0 scale-85'
              }`}>
                <img 
                  src="/images/blood-upload.png" 
                  alt="Upload blood tests and health records"
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* Divider Line */}
            <div className="flex justify-center mb-12">
              <div className="w-0.5 h-20 bg-gray-300 dark:bg-gray-600"></div>
            </div>

            {/* Step 3 */}
            <div 
              ref={(el) => { sectionRefs.current[2] = el; }}
              data-section="2"
              className={`text-center mb-12 transition-all duration-700 ease-out ${
                visibleSections.has(2) 
                  ? 'opacity-100 translate-y-0 scale-100' 
                  : 'opacity-0 translate-y-8 scale-90'
              }`}
            >
              <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-12 transition-all duration-700 ease-out delay-200 ${
                visibleSections.has(2) 
                  ? 'opacity-100 translate-y-0 scale-100' 
                  : 'opacity-0 translate-y-4 scale-95'
              }`}>
                Experiment with workouts & health protocol
              </h2>
              <div className={`w-full max-w-2xl mx-auto rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-700 ease-out delay-300 ${
                visibleSections.has(2) 
                  ? 'opacity-100 scale-100' 
                  : 'opacity-0 scale-85'
              }`}>
                <img 
                  src="/images/experiment.png" 
                  alt="Experiment with workouts & health protocol"
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* Divider Line */}
            <div className="flex justify-center mb-12">
              <div className="w-0.5 h-20 bg-gray-300 dark:bg-gray-600"></div>
            </div>

            {/* Step 4 */}
            <div 
              ref={(el) => { sectionRefs.current[4] = el; }}
              data-section="4"
              className={`text-center mb-12 transition-all duration-700 ease-out ${
                visibleSections.has(4) 
                  ? 'opacity-100 translate-y-0 scale-100' 
                  : 'opacity-0 translate-y-8 scale-90'
              }`}
            >
              <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-12 transition-all duration-700 ease-out delay-200 ${
                visibleSections.has(4) 
                  ? 'opacity-100 translate-y-0 scale-100' 
                  : 'opacity-0 translate-y-4 scale-95'
              }`}>
                Track the impact, optimise, repeat
              </h2>
              <div className={`w-full max-w-2xl mx-auto rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-700 ease-out delay-300 ${
                visibleSections.has(4) 
                  ? 'opacity-100 scale-100' 
                  : 'opacity-0 scale-85'
              }`}>
                <img 
                  src="/images/progress.png" 
                  alt="Track the impact, optimise, repeat"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="mt-0 mb-16 sm:mb-24 px-8 sm:px-12 lg:px-20 xl:px-32 py-8 sm:py-12 animate-fade-in-up delay-500">
          <div className="max-w-7xl mx-auto">
            {/* Pricing Header */}
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Everything you need to{' '}
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 text-transparent bg-clip-text">
                  optimize your health
                </span>
              </h2>
            </div>

            {/* Pricing Card and Features */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
              {/* Pricing Card */}
              <div className="group bg-white/40 dark:bg-gray-900/40 backdrop-blur-lg rounded-2xl p-12 sm:p-16 border border-gray-200/50 dark:border-gray-800/50 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:scale-[1.02]">
                {/* Logo */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400 text-transparent bg-clip-text">
                    revly
                  </h3>
                </div>

                <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 font-medium">
                  It's time you own your health.
                </p>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline mb-2">
                    <span className="text-5xl font-bold text-gray-900 dark:text-white">$29.99</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    One-time payment • Lifetime access
                  </p>
                </div>

                {/* CTA Button */}
                <a
                  href="/auth/checkout"
                  className="w-full inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25 group"
                >
                  Get Beta Access
                  <span className="ml-2 transform translate-x-0 group-hover:translate-x-1 transition-transform">→</span>
                </a>
              </div>

              {/* Features List */}
              <div className="space-y-6">
                {/* Feature 1 */}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Unified Health Dashboard
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Track weight, body fat, HRV, VO2 max, sleep, workouts, and 50+ blood biomarkers in one comprehensive dashboard with beautiful charts and trends.
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Auto-Sync iOS Health Data
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Seamlessly connect your Apple Health, wearables, and fitness apps. Our iOS app automatically syncs your health data in real-time.
                    </p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Blood Test PDF Processing
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Upload blood test PDFs and we'll automatically extract and track your biomarkers over time. No more lost lab results or manual data entry.
                    </p>
                  </div>
                </div>


              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
            <p className="text-gray-600 dark:text-gray-400">© 2025 revly. All rights reserved.</p>
            <div className="flex items-center space-x-4">
              <a href="https://x.com/lex_build" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="https://github.com/mathopoulos/health-stats" target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}