import React from 'react';

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
  disabled?: boolean;
}

interface UploadTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export default function UploadTabs({
  tabs,
  activeTab,
  onTabChange,
  className = ''
}: UploadTabsProps) {
  return (
    <div className={`w-full ${className}`}>
      {/* Mobile tab selector */}
      <div className="sm:hidden">
        <select
          value={activeTab}
          onChange={(e) => onTabChange(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id} disabled={tab.disabled}>
              {tab.label}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop tab navigation */}
      <div className="hidden sm:block">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isDisabled = tab.disabled;

            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && onTabChange(tab.id)}
                disabled={isDisabled}
                className={`
                  group relative min-w-0 flex-1 overflow-hidden py-2 px-1 text-center text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors
                  ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : isDisabled
                      ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex flex-col items-center space-y-1">
                  {/* Icon */}
                  <div className={`
                    p-2 rounded-lg transition-colors
                    ${
                      isActive
                        ? 'bg-indigo-100 dark:bg-indigo-900/20'
                        : isDisabled
                        ? 'bg-gray-100 dark:bg-gray-800'
                        : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'
                    }
                  `}>
                    {tab.icon}
                  </div>

                  {/* Label */}
                  <span className="font-medium">{tab.label}</span>

                  {/* Description */}
                  {tab.description && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 max-w-32 truncate">
                      {tab.description}
                    </span>
                  )}
                </div>

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 dark:bg-indigo-400 rounded-t-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content area */}
      <div className="mt-6">
        {tabs.map((tab) => {
          if (tab.id !== activeTab) return null;

          return (
            <div
              key={tab.id}
              className="tab-content"
              role="tabpanel"
              aria-labelledby={`tab-${tab.id}`}
            >
              {/* Tab content will be rendered by parent component */}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Pre-configured tab configurations
export const DEFAULT_UPLOAD_TABS: Tab[] = [
  {
    id: 'blood-test',
    label: 'Blood Test',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm8 2a1 1 0 100 2 1 1 0 000-2zM6 8a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
      </svg>
    ),
    description: 'Upload PDF blood test results'
  },
  {
    id: 'health-data',
    label: 'Health Data',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
      </svg>
    ),
    description: 'Upload Apple Health XML data'
  },
  {
    id: 'experiments',
    label: 'Experiments',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
    description: 'Manage experiment protocols'
  }
];

export const MINIMAL_UPLOAD_TABS: Tab[] = [
  {
    id: 'blood-test',
    label: 'Blood Test',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm8 2a1 1 0 100 2 1 1 0 000-2zM6 8a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
      </svg>
    )
  },
  {
    id: 'health-data',
    label: 'Health Data',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
      </svg>
    )
  }
];
