'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { ChevronDownIcon, CalendarIcon } from '@heroicons/react/24/outline';

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
  
  // Track selected date group index if multiple date groups exist
  const [selectedDateGroupIndex, setSelectedDateGroupIndex] = useState<number>(0);
  
  // Multiple date groups state
  const hasMultipleDates = dateGroups.length > 1;

  // Sort date groups by newest first
  const sortedDateGroups = [...dateGroups].sort((a, b) => 
    new Date(b.testDate).getTime() - new Date(a.testDate).getTime()
  );

  // Handle date group selection change
  const handleDateGroupChange = (index: number) => {
    setSelectedDateGroupIndex(index);
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
      handleDateGroupChange(0); // Select the first date group by default
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

  const handleSave = async () => {
    try {
      await onSave(activeMarkers, selectedDate);
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
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-3xl w-full bg-white dark:bg-gray-800 rounded-2xl p-6">
          <Dialog.Title className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Review Extracted Blood Markers
          </Dialog.Title>

          {/* Multiple Date Groups Selector */}
          {hasMultipleDates && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Test Date Group
              </label>
              <div className="relative">
                <select
                  className="w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={selectedDateGroupIndex}
                  onChange={(e) => handleDateGroupChange(parseInt(e.target.value, 10))}
                >
                  {sortedDateGroups.map((group, index) => (
                    <option key={index} value={index}>
                      {formatDate(group.testDate)} • {group.markers.length} marker{group.markers.length !== 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                  <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                This PDF contains multiple test dates. Select a date to view its markers.
              </p>
            </div>
          )}

          {/* Date Picker */}
          <div className="mb-6">
            <div className="mb-2">
              <div className="flex items-center gap-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Test Date
                </label>
                {wasDateExtracted && !hasMultipleDates && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    Extracted from PDF
                  </span>
                )}
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