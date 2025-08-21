'use client';

import React from 'react';
import Link from 'next/link';

export default function MobileHeader() {
  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-gray-50 dark:bg-gray-900 border-b border-gray-200/50 dark:border-gray-800 px-4 py-3">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400 text-transparent bg-clip-text">
            revly
          </span>
        </Link>
        <div className="w-6"></div> {/* Empty div for flex spacing */}
      </div>
    </div>
  );
}
