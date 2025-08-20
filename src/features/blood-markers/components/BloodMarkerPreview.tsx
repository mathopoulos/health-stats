'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Dialog } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { CalendarIcon } from '@heroicons/react/24/outline';
import { BloodMarker, DateGroup } from '../../upload/types';
import { useBloodMarkerPreview } from '../hooks/useBloodMarkerPreview';
import MarkerCategory from './MarkerCategory';

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
  // Use the custom hook for state management
  const previewState = useBloodMarkerPreview({
    markers: initialMarkers,
    initialDate,
    dateGroups
  });

  // Use the grouped markers from the hook
  const groupedMarkers = previewState.groupedMarkers;

  const getAllMarkers = useCallback((): { markers: BloodMarker[], dateGroups: {date: string, markers: BloodMarker[]}[] } => {
    // Always log the current state to debug
    console.log(`getAllMarkers called - hasMultipleDates: ${previewState.hasMultipleDates}, dateGroups: ${dateGroups.length}, activeTab: ${previewState.selectedTab}`);
    
    // Log the original date groups to analyze
    console.log('Original date groups:');
    dateGroups.forEach((group, index) => {
      console.log(`Original group ${index + 1}: date=${group.testDate}, markers=${group.markers.length}, valid date=${!isNaN(new Date(group.testDate).getTime())}`);
    });
    
    // If we have multiple date groups, always use them regardless of the hasMultipleDates flag
    if (dateGroups.length <= 1) {
      console.log('No or single date group, returning active markers:', previewState.activeMarkers.length);
      return { 
        markers: previewState.activeMarkers,
        dateGroups: [{ date: previewState.selectedDate.toISOString().split('T')[0], markers: previewState.activeMarkers }]
      };
    }
    
    console.log('Multiple date groups detected:', previewState.sortedDateGroups.length);
    
    // DIRECT APPROACH: Instead of deduplicating, just map each original date group to the format we need
    // This ensures we preserve all original groups
    const dateGroupsResult = previewState.sortedDateGroups.map(group => {
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
  }, [previewState, dateGroups]);

  const handleSave = useCallback(async () => {
    try {
      // Log the state before getting markers
      console.log(`Save initiated - activeMarkers: ${previewState.activeMarkers.length}, dateGroups: ${dateGroups.length}, hasMultipleDates: ${previewState.hasMultipleDates}`);

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
  }, [previewState, dateGroups, getAllMarkers, onSave, onClose]);

  // Format date for display - now uses the hook's function
  const formatDate = previewState.formatDate;

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
          {previewState.hasMultipleDates && (
            <div className="mb-4">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-4 overflow-x-auto scrollbar-thin" aria-label="Tabs">
                  {previewState.sortedDateGroups.map((group, index) => (
                    <button
                      key={index}
                      onClick={() => previewState.handleTabChange(index)}
                      className={`whitespace-nowrap py-2 px-3 text-sm font-medium border-b-2 ${
                        previewState.selectedTab === index
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
              selected={previewState.selectedDate}
              onChange={(date: Date | null) => {
                if (date) {
                  previewState.setSelectedDate(date);
                  // If user manually changes the date, it's no longer the extracted date
                  if (previewState.wasDateExtracted) {
                    previewState.setWasDateExtracted(false);
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
              <MarkerCategory
                key={category}
                category={category}
                markers={categoryMarkers}
              />
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
                {previewState.hasMultipleDates
                  ? `Save All Markers With Original Dates (${previewState.sortedDateGroups.reduce((sum, group) => sum + group.markers.length, 0)})`
                  : `Save Markers (${previewState.activeMarkers.length})`}
              </button>
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 