'use client';

import React from 'react';
import BloodTestUpload from '@features/blood-markers/components/BloodTestUpload';
import BloodMarkerHistory from '@features/blood-markers/components/BloodMarkerHistory';

interface BloodTabProps {
  isAddResultsModalOpen: boolean;
  setIsAddResultsModalOpen: (open: boolean) => void;
}

export default function BloodTab({
  isAddResultsModalOpen,
  setIsAddResultsModalOpen,
}: BloodTabProps) {
  return (
    <div className="space-y-6">
      <h2 className="hidden md:block text-2xl font-bold text-gray-900 dark:text-white">Blood Markers</h2>
      
      {/* PDF Upload Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Upload Blood Test PDF</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Upload your blood test PDF and we'll automatically extract the results.
        </p>
        <BloodTestUpload />
      </div>

      {/* Manual Entry Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Manually Add</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Manually add and track your blood test results here.
        </p>
        <button
          onClick={() => setIsAddResultsModalOpen(true)}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add Blood Test Results
        </button>
      </div>
      
      {/* Blood Marker History Section - Added as requested */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mt-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Blood Marker History</h3>
        <BloodMarkerHistory />
      </div>
    </div>
  );
}
