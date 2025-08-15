'use client';

import dynamic from 'next/dynamic';

const ThemeToggle = dynamic(() => import('./ThemeToggle'), {
  ssr: false,
  loading: () => (
    <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 w-9 h-9 animate-pulse" />
  ),
});

export default ThemeToggle;
