'use client';

import { Dialog } from '@headlessui/react';
import { toast } from 'react-hot-toast';

interface BloodMarker {
  name: string;
  value: number;
  unit: string;
  flag: 'High' | 'Low' | null;
  category: string;
}

interface BloodMarkerPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  markers: BloodMarker[];
  onSave: (markers: BloodMarker[]) => void;
}

export default function BloodMarkerPreview({ isOpen, onClose, markers, onSave }: BloodMarkerPreviewProps) {
  // Group markers by category
  const groupedMarkers = markers.reduce((acc, marker) => {
    if (!marker.value) return acc; // Skip markers with null values
    if (!acc[marker.category]) {
      acc[marker.category] = [];
    }
    acc[marker.category].push(marker);
    return acc;
  }, {} as Record<string, BloodMarker[]>);

  const handleSave = async () => {
    try {
      await onSave(markers);
      toast.success('Blood markers saved successfully');
      onClose();
    } catch (error) {
      console.error('Error saving blood markers:', error);
      toast.error('Failed to save blood markers');
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-3xl w-full bg-white dark:bg-gray-800 rounded-2xl p-6">
          <Dialog.Title className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Review Extracted Blood Markers
          </Dialog.Title>

          <div className="space-y-6 max-h-[60vh] overflow-y-auto">
            {Object.entries(groupedMarkers).map(([category, categoryMarkers]) => (
              <div key={category} className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {category}
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {categoryMarkers.map((marker) => (
                    <div 
                      key={marker.name}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {marker.name}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {marker.unit}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-semibold ${
                          marker.flag === 'High' ? 'text-red-500' :
                          marker.flag === 'Low' ? 'text-yellow-500' :
                          'text-gray-900 dark:text-white'
                        }`}>
                          {marker.value}
                        </span>
                        {marker.flag && (
                          <span className={`text-sm px-2 py-1 rounded ${
                            marker.flag === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                          }`}>
                            {marker.flag}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Save Markers
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 