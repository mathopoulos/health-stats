import React from 'react';

export type DashboardTab = 'home' | 'metrics' | 'blood' | 'protocols';

interface TabNavigationProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function TabButton({ isActive, onClick, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm whitespace-nowrap ${
        isActive
          ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
      }`}
    >
      {children}
    </button>
  );
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
      <div className="relative overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          {/* Tab Navigation */}
          <div className="px-4 sm:px-6">
            <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 min-w-max" aria-label="Tabs">
              <TabButton
                isActive={activeTab === 'home'}
                onClick={() => onTabChange('home')}
              >
                Home
              </TabButton>
              
              <TabButton
                isActive={activeTab === 'metrics'}
                onClick={() => onTabChange('metrics')}
              >
                Fitness Metrics
              </TabButton>
              
              <TabButton
                isActive={activeTab === 'blood'}
                onClick={() => onTabChange('blood')}
              >
                Blood Markers
              </TabButton>
              
              <TabButton
                isActive={activeTab === 'protocols'}
                onClick={() => onTabChange('protocols')}
              >
                Protocols & Experiments
              </TabButton>
            </nav>
          </div>
          
          {/* Fade effect on the right */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-gray-800 to-transparent pointer-events-none rounded-r-2xl"></div>
        </div>
      </div>
    </div>
  );
}
