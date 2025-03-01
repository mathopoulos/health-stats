'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { CalendarIcon } from '@heroicons/react/24/outline';

interface BloodMarker {
  name: string;
  value: number;
  unit: string;
  flag: 'High' | 'Low' | null;
  category: string;
}

interface DateGroup {
  testDate: string;
  markers: BloodMarker[];
}

interface BloodMarkerPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  markers: BloodMarker[];
  onSave: (markers: BloodMarker[], date: Date) => void;
  initialDate?: string | null;
  dateGroups?: DateGroup[];
}

export default function BloodMarkerPreview({ 
  isOpen, 
  onClose, 
  markers: initialMarkers, 
  onSave, 
  initialDate,
  dateGroups = []
}: BloodMarkerPreviewProps) {
  // Date label and indicator
  const [wasDateExtracted, setWasDateExtracted] = useState<boolean>(false);
  
  // Track if initial date has been processed
  const initialDateProcessedRef = useRef<boolean>(false);
  
  // Track the active markers based on selected date group
  const [activeMarkers, setActiveMarkers] = useState<BloodMarker[]>(initialMarkers);
  
  // Track selected date group tab
  const [selectedTab, setSelectedTab] = useState<number>(0);
  
  // Multiple date groups state
  const hasMultipleDates = dateGroups.length > 1;

  // Sort date groups by newest first
  const sortedDateGroups = [...dateGroups].sort((a, b) => 
    new Date(b.testDate).getTime() - new Date(a.testDate).getTime()
  );

  // Handle tab selection change
  const handleTabChange = (index: number) => {
    setSelectedTab(index);
    const selectedGroup = sortedDateGroups[index];
    
    if (selectedGroup) {
      setActiveMarkers(selectedGroup.markers);
      
      // Parse and set the selected date
      try {
        if (selectedGroup.testDate) {
          // Parse ISO format (YYYY-MM-DD)
          if (/^\d{4}-\d{2}-\d{2}$/.test(selectedGroup.testDate)) {
            const [yearStr, monthStr, dayStr] = selectedGroup.testDate.split('-');
            const year = parseInt(yearStr, 10);
            const month = parseInt(monthStr, 10) - 1; // JS months are 0-indexed
            const day = parseInt(dayStr, 10);
            
            // Set time to noon to avoid timezone issues
            const parsedDate = new Date(year, month, day, 12, 0, 0);
            
            if (!isNaN(parsedDate.getTime())) {
              setSelectedDate(parsedDate);
              setWasDateExtracted(true);
            }
          }
        }
      } catch (error) {
        console.error('Failed to parse date from date group:', error);
      }
    }
  };
  
  // Initialize dateGroups if provided
  useEffect(() => {
    if (dateGroups.length > 0) {
      handleTabChange(0); // Select the first date group by default
    }
  }, [dateGroups]);
  
  // Handle initialDate changes
  useEffect(() => {
    if (initialDate) {
      setWasDateExtracted(true);
      
      // Only process initialDate once to avoid overriding user selection
      if (!initialDateProcessedRef.current) {
        try {
          let parsedDate: Date | null = null;
          
          // Parse ISO format (YYYY-MM-DD)
          if (/^\d{4}-\d{2}-\d{2}$/.test(initialDate)) {
            const [yearStr, monthStr, dayStr] = initialDate.split('-');
            const year = parseInt(yearStr, 10);
            const month = parseInt(monthStr, 10) - 1; // JS months are 0-indexed
            const day = parseInt(dayStr, 10);
            
            // Set time to noon to avoid timezone issues
            parsedDate = new Date(year, month, day, 12, 0, 0);
          } else {
            // Fallback to standard date parsing
            const date = new Date(initialDate);
            if (!isNaN(date.getTime())) {
              parsedDate = date;
            }
          }
          
          // Update state if valid date was parsed
          if (parsedDate && !isNaN(parsedDate.getTime())) {
            setSelectedDate(parsedDate);
            initialDateProcessedRef.current = true;
          }
        } catch (error) {
          console.error('Failed to parse date:', initialDate);
        }
      }
    }
  }, [initialDate]);

  // Initialize with today's date
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  // Group markers by category
  const groupedMarkers = activeMarkers.reduce((acc, marker) => {
    if (marker.value === null || marker.value === undefined) return acc; // Skip markers with null/undefined values
    if (!acc[marker.category]) {
      acc[marker.category] = [];
    }
    acc[marker.category].push(marker);
    return acc;
  }, {} as Record<string, BloodMarker[]>);

  // Function to get all markers across all date groups
  const getAllMarkers = (): BloodMarker[] => {
    if (!hasMultipleDates) {
      return activeMarkers;
    }
    
    // Combine all markers from all date groups, adding date identifier
    const allMarkersWithMetadata = sortedDateGroups.flatMap(group => 
      group.markers.map(marker => ({
        ...marker,
        // Add metadata so we know which date group this marker belongs to
        _dateGroup: group.testDate
      }))
    );
    
    // Use a Map to deduplicate markers by name (keeping the most recent occurrence)
    const markerMap = new Map();
    for (const marker of allMarkersWithMetadata) {
      markerMap.set(marker.name, marker);
    }
    
    // Convert back to array and remove our metadata property
    return Array.from(markerMap.values()).map(({ _dateGroup, ...marker }) => marker);
  };

  const handleSave = async () => {
    try {
      // Get all markers across all date groups or just the active markers if single date
      const markersToSave = getAllMarkers();
      
      await onSave(markersToSave, selectedDate);
      onClose();
    } catch (error) {
      console.error('Error saving blood markers:', error);
      toast.error('Failed to save blood markers');
    }
  };

  // Format date for display
  const formatDate = (date: string): string => {
    try {
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString(undefined, { 
        year: 'numeric',
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return date;
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
        <Dialog.Panel className="mx-auto max-w-3xl w-full bg-white dark:bg-gray-800 rounded-2xl p-6 max-h-[90vh] flex flex-col">
          <Dialog.Title className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Review Extracted Blood Markers
          </Dialog.Title>

          {/* Date Group Tabs */}
          {hasMultipleDates && (
            <div className="mb-4">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-4 overflow-x-auto scrollbar-thin" aria-label="Tabs">
                  {sortedDateGroups.map((group, index) => (
                    <button
                      key={index}
                      onClick={() => handleTabChange(index)}
                      className={`whitespace-nowrap py-2 px-3 text-sm font-medium border-b-2 ${
                        selectedTab === index
                          ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      {formatDate(group.testDate)}
                      <span className="ml-2 rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs">
                        {group.markers.length}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                All markers will be saved when you click "Save All Markers".
              </p>
            </div>
          )}

          {/* Date Picker */}
          <div className="mb-4">
            <div className="mb-1">
              <div className="flex items-center gap-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Test Date
                </label>
              </div>
            </div>
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date | null) => {
                if (date) {
                  setSelectedDate(date);
                  // If user manually changes the date, it's no longer the extracted date
                  if (wasDateExtracted) {
                    setWasDateExtracted(false);
                  }
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400"
              placeholderText="Select test date"
              dateFormat="MM/dd/yyyy"
              maxDate={new Date()}
            />
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-1">
            {Object.entries(groupedMarkers).map(([category, categoryMarkers]) => (
              <div key={category} className="space-y-2">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {category}
                </h3>
                <div className="grid grid-cols-1 gap-2">
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

          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
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
              {hasMultipleDates ? 'Save All Markers' : 'Save Markers'}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 