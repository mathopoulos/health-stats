import React from 'react';

export default function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12" data-testid="loading-state">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <span className="ml-3 text-gray-600 dark:text-gray-400">Loading metrics data...</span>
    </div>
  );
}
