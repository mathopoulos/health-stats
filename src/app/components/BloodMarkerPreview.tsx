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
  onSave: (markers: BloodMarker[], date: Date) => Promise<boolean | void>;
  initialDate?: string | null;
  dateGroups?: DateGroup[];
  pdfUrl?: string | null;
  isProcessing?: boolean;
  processingProgress?: string;
}

export default function BloodMarkerPreview({ 
  isOpen, 
  onClose, 
  markers: initialMarkers, 
  onSave, 
  initialDate,
  dateGroups = [],
  pdfUrl = null,
  isProcessing = false,
  processingProgress = ''
}: BloodMarkerPreviewProps) {
  // Date label and indicator
  const [wasDateExtracted, setWasDateExtracted] = useState<boolean>(false);
  
  // Track if initial date has been processed
  const initialDateProcessedRef = useRef<boolean>(false);
  
  // Track the active markers based on selected date group
  const [activeMarkers, setActiveMarkers] = useState<BloodMarker[]>(initialMarkers);
  
  // Track selected date group tab
  const [selectedTab, setSelectedTab] = useState<number>(0);
  
  // Multiple date groups state - store this in state to ensure it's reactive
  const [hasMultipleDates, setHasMultipleDates] = useState<boolean>(dateGroups.length > 1);

  // Update hasMultipleDates whenever dateGroups changes
  useEffect(() => {
    console.log(`dateGroups changed: ${dateGroups.length} groups`);
    setHasMultipleDates(dateGroups.length > 1);
  }, [dateGroups]);

  // Sort date groups by newest first
  const sortedDateGroups = [...dateGroups].sort((a, b) => 
    new Date(b.testDate).getTime() - new Date(a.testDate).getTime()
  );
  
  useEffect(() => {
    console.log(`BloodMarkerPreview mounted with ${dateGroups.length} date groups, hasMultipleDates: ${hasMultipleDates}`);
    // Log the dateGroups array for debugging
    if (dateGroups.length > 0) {
      console.log('Date groups content:', JSON.stringify(dateGroups));
    }
  }, [dateGroups, hasMultipleDates]);

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

  // Function to ensure a date is in valid ISO format
  const ensureValidISODate = (dateStr: string | null | undefined): string => {
    if (!dateStr) {
      // Handle null or undefined dates by using today
      const today = new Date().toISOString().split('T')[0];
      console.warn(`Received null or undefined date, using today's date (${today}) as fallback`);
      return today;
    }
    
    console.log(`Validating date: ${dateStr}`);
    
    // Check if it's already a valid ISO date (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !isNaN(new Date(dateStr).getTime())) {
      console.log(`Date ${dateStr} is already a valid ISO date`);
      return dateStr;
    }
    
    // Try to parse it as a date and convert to ISO
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const isoDate = date.toISOString().split('T')[0];
        console.log(`Converted date ${dateStr} to ISO format: ${isoDate}`);
        return isoDate;
      }
    } catch (error) {
      console.warn(`Failed to convert date ${dateStr} to ISO format:`, error);
    }
    
    // If we got here, we need to try more aggressive parsing approaches
    
    // Try to extract YYYY-MM-DD pattern if it exists somewhere in the string
    const isoPattern = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoPattern) {
      const extracted = isoPattern[0];
      const date = new Date(extracted);
      if (!isNaN(date.getTime())) {
        console.log(`Extracted ISO date from string: ${extracted}`);
        return extracted;
      }
    }
    
    // Try to extract MM/DD/YYYY pattern
    const usPattern = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (usPattern) {
      const month = parseInt(usPattern[1], 10);
      const day = parseInt(usPattern[2], 10);
      const year = parseInt(usPattern[3], 10);
      
      // Create ISO date (YYYY-MM-DD)
      const paddedMonth = month.toString().padStart(2, '0');
      const paddedDay = day.toString().padStart(2, '0');
      const isoDate = `${year}-${paddedMonth}-${paddedDay}`;
      
      // Validate the result
      const date = new Date(isoDate);
      if (!isNaN(date.getTime())) {
        console.log(`Converted US date format to ISO: ${dateStr} -> ${isoDate}`);
        return isoDate;
      }
    }
    
    // If all attempts fail, return today's date as fallback and log a warning
    const today = new Date().toISOString().split('T')[0];
    console.warn(`Could not parse date ${dateStr}, using today's date (${today}) as fallback`);
    return today;
  };

  const getAllMarkers = (): { markers: BloodMarker[], dateGroups: {date: string, markers: BloodMarker[]}[] } => {
    // Always log the current state to debug
    console.log(`getAllMarkers called - hasMultipleDates: ${hasMultipleDates}, dateGroups: ${dateGroups.length}, activeTab: ${selectedTab}`);
    
    // Log the original date groups to analyze
    console.log('Original date groups:');
    dateGroups.forEach((group, index) => {
      console.log(`Original group ${index + 1}: date=${group.testDate}, markers=${group.markers.length}, valid date=${!isNaN(new Date(group.testDate).getTime())}`);
    });
    
    // If we have multiple date groups, always use them regardless of the hasMultipleDates flag
    if (dateGroups.length <= 1) {
      console.log('No or single date group, returning active markers:', activeMarkers.length);
      return { 
        markers: activeMarkers, 
        dateGroups: [{ date: selectedDate.toISOString().split('T')[0], markers: activeMarkers }] 
      };
    }
    
    console.log('Multiple date groups detected:', sortedDateGroups.length);
    
    // DIRECT APPROACH: Instead of deduplicating, just map each original date group to the format we need
    // This ensures we preserve all original groups
    const dateGroupsResult = sortedDateGroups.map(group => {
      // Ensure the date is in a valid format, but preserve the original day
      const originalDate = group.testDate;
      console.log(`Processing original group date: ${originalDate}`);
      
      // Create a standardized version of the date that preserves the original day
      let standardizedDate = originalDate;
      try {
        // Try to ensure it's a valid ISO format if not already
        if (!/^\d{4}-\d{2}-\d{2}$/.test(originalDate)) {
          const date = new Date(originalDate);
          if (!isNaN(date.getTime())) {
            standardizedDate = date.toISOString().split('T')[0];
            console.log(`Standardized date ${originalDate} to ${standardizedDate}`);
          }
        }
      } catch (error) {
        console.warn(`Error standardizing date ${originalDate}:`, error);
      }
      
      return {
        date: standardizedDate,
        markers: group.markers
      };
    });
    
    console.log(`Processed ${dateGroupsResult.length} date groups with exact dates`);
    dateGroupsResult.forEach((group, index) => {
      console.log(`- Processed group ${index + 1}: date=${group.date}, markers=${group.markers.length}, valid date=${!isNaN(new Date(group.date).getTime())}`);
    });
    
    // Combine all markers for the total markers array
    const allMarkers = dateGroupsResult.flatMap(group => group.markers);
    console.log('Total markers:', allMarkers.length);
    
    return {
      markers: allMarkers,
      dateGroups: dateGroupsResult
    };
  };

  const handleSave = async () => {
    try {
      // Log the state before getting markers
      console.log(`Save initiated - activeMarkers: ${activeMarkers.length}, dateGroups: ${dateGroups.length}, hasMultipleDates: ${hasMultipleDates}`);
      
      // Get all markers across all date groups with their original dates
      const { markers: markersToSave, dateGroups: groupedMarkers } = getAllMarkers();
      
      console.log('Saving all markers from all date groups:', markersToSave.length);
      console.log('Grouped into', groupedMarkers.length, 'date groups for saving');
      
      // Enhanced debugging - log all date groups before processing
      console.log('All date groups to process:');
      groupedMarkers.forEach((group, index) => {
        console.log(`Group ${index + 1}: date=${group.date}, markers=${group.markers.length}, valid date=${!isNaN(new Date(group.date).getTime())}`);
        
        // Log some sample marker names
        if (group.markers.length > 0) {
          console.log(`  Sample markers: ${group.markers.slice(0, 3).map(m => m.name).join(', ')}${group.markers.length > 3 ? '...' : ''}`);
        }
      });
      
      // Save each date group separately
      let totalSavedMarkers = 0;
      let savedGroups = 0;
      let failedGroups = 0;
      let skippedGroups = 0;
      
      // Multiple groups need separate API calls
      if (groupedMarkers.length > 1) {
        for (const [index, group] of groupedMarkers.entries()) {
          console.log(`Processing group ${index + 1}/${groupedMarkers.length} for date ${group.date} with ${group.markers.length} markers`);
          
          // Parse the date string into a Date object for the API call
          const groupDate = new Date(group.date);
          
          // Skip invalid dates
          if (isNaN(groupDate.getTime())) {
            console.warn(`Skipping group ${index + 1} with invalid date: ${group.date}`);
            skippedGroups++;
            continue;
          }
          
          console.log(`Attempting to save group ${index + 1} (date: ${groupDate.toISOString().split('T')[0]})`);
          
          try {
            // Call onSave for this specific group
            const result = await onSave(group.markers, groupDate);
            // Check if result is explicitly false (for functions that return boolean)
            if (result !== false) {
              totalSavedMarkers += group.markers.length;
              savedGroups++;
              console.log(`✅ Successfully saved group ${index + 1}`);
            } else {
              failedGroups++;
              console.error(`❌ Failed to save group ${index + 1}`);
            }
          } catch (error) {
            failedGroups++;
            console.error(`❌ Error saving group ${index + 1}:`, error);
          }
        }
        
        // Show a summary toast after all saves are complete
        if (savedGroups > 0) {
          toast.success(`Successfully saved ${totalSavedMarkers} markers across ${savedGroups} date groups`);
          
          // Dispatch event to refresh data
          if (typeof window !== 'undefined') {
            console.log('Dispatching bloodMarkerAdded event after saving all marker groups');
            window.dispatchEvent(new Event('bloodMarkerAdded'));
          }
        }
        
        if (failedGroups > 0) {
          toast.error(`Failed to save ${failedGroups} date groups. See console for details.`);
        }
        
        if (skippedGroups > 0) {
          toast.error(`Skipped ${skippedGroups} date groups due to invalid dates.`);
        }
        
        // Log final summary
        console.log(`Save summary: ${savedGroups} groups saved, ${failedGroups} groups failed, ${skippedGroups} groups skipped`);
        
      } else if (groupedMarkers.length === 1) {
        // Single group is handled by the onSave function itself
        const group = groupedMarkers[0];
        const groupDate = new Date(group.date);
        await onSave(group.markers, groupDate);
      }
      
      console.log(`Save complete: ${savedGroups} groups saved, ${failedGroups} groups failed, ${skippedGroups} groups skipped`);
      
      // Close the dialog
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
        <Dialog.Panel className="mx-auto w-full max-w-5xl bg-white dark:bg-gray-800 rounded-2xl p-6 h-[90vh] flex flex-col">
          <Dialog.Title className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Review Extracted Blood Markers
          </Dialog.Title>

          <div className="flex flex-col md:flex-row gap-6 flex-1 overflow-hidden">
            {/* PDF Preview */}
            {pdfUrl && (
              <div className="hidden md:block md:w-1/2 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <object data={`${pdfUrl}#toolbar=0`} type="application/pdf" className="w-full h-full">
                  <p className="p-4 text-center text-gray-500 dark:text-gray-400">
                    Unable to display PDF. <a href={pdfUrl} target="_blank" rel="noopener" className="text-indigo-600 underline">Download</a>
                  </p>
                </object>
              </div>
            )}

            {/* Right Side Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {isProcessing ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <div className="text-center">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Processing Blood Test
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        This may take a few minutes.
                      </p>
                      {processingProgress && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          {processingProgress}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Date Group Tabs */}
          {dateGroups.length > 1 && (
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
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center">
                  <svg className="w-4 h-4 mr-1.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    <strong>All markers</strong> from all dates ({sortedDateGroups.reduce((sum, group) => sum + group.markers.length, 0)} total) will be saved with their <strong>original test dates</strong>.
                  </span>
                </p>
              </div>
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
                  {/* end right side content */}
                </>
              )}
            </div>{/* end flex row container */}
            </div>{/* end outer flex wrapper */}

{!isProcessing && (
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
                {dateGroups.length > 1 
                  ? `Save All Markers With Original Dates (${sortedDateGroups.reduce((sum, group) => sum + group.markers.length, 0)})` 
                  : `Save Markers (${activeMarkers.length})`}
              </button>
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 