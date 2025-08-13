'use client';

interface LifetimeOfferBannerProps {
  href?: string;
  className?: string;
}

export default function LifetimeOfferBanner({ 
  href = '/auth/checkout',
  className = ''
}: LifetimeOfferBannerProps) {
  const handleClick = () => {
    window.location.href = href;
  };

  return (
    <button
      onClick={handleClick}
      className={`relative z-50 w-full group cursor-pointer ${className}`}
      aria-label="Limited-time beta pricing offer"
    >
      <div className="bg-indigo-600/5 dark:bg-indigo-600/10 border-b border-indigo-600/5 dark:border-indigo-400/5 hover:bg-indigo-600/10 dark:hover:bg-indigo-600/15 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <p className="text-indigo-600 dark:text-indigo-300 text-sm font-medium flex items-center flex-wrap gap-1.5">
              <span role="img" aria-label="Fire">🔥</span>
              <span className="font-semibold">Limited-Time Beta Pricing</span>
              <span className="text-purple-500 dark:text-purple-300 font-medium">Ending Soon!</span>
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}