import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { BloodMarker, DateGroup } from '../../upload/types';

interface UseBloodMarkerPreviewProps {
  markers: BloodMarker[];
  initialDate?: string | null;
  dateGroups: DateGroup[];
}

interface UseBloodMarkerPreviewReturn {
  // Date management
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  wasDateExtracted: boolean;
  setWasDateExtracted: (extracted: boolean) => void;

  // Date groups management
  activeMarkers: BloodMarker[];
  selectedTab: number;
  setSelectedTab: (tab: number) => void;
  sortedDateGroups: DateGroup[];
  hasMultipleDates: boolean;
  groupedMarkers: Record<string, BloodMarker[]>;

  // Actions
  handleTabChange: (index: number) => void;
  formatDate: (date: string) => string;
  ensureValidISODate: (dateStr: string | null | undefined) => string;
}

export function useBloodMarkerPreview({
  markers: initialMarkers,
  initialDate,
  dateGroups
}: UseBloodMarkerPreviewProps): UseBloodMarkerPreviewReturn {
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

  // Initialize with today's date
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  // Update hasMultipleDates whenever dateGroups changes
  useEffect(() => {
    console.log(`dateGroups changed: ${dateGroups.length} groups`);
    setHasMultipleDates(dateGroups.length > 1);
  }, [dateGroups]);

  // Sort date groups by newest first
  const sortedDateGroups = useMemo(() => {
    return [...dateGroups].sort((a, b) =>
      new Date(b.testDate).getTime() - new Date(a.testDate).getTime()
    );
  }, [dateGroups]);

  useEffect(() => {
    console.log(`BloodMarkerPreview mounted with ${dateGroups.length} date groups, hasMultipleDates: ${hasMultipleDates}`);
    // Log the dateGroups array for debugging
    if (dateGroups.length > 0) {
      console.log('Date groups content:', JSON.stringify(dateGroups));
    }
  }, [dateGroups, hasMultipleDates]);

  // Handle tab selection change
  const handleTabChange = useCallback((index: number) => {
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
  }, [sortedDateGroups]);

  // Initialize dateGroups if provided
  useEffect(() => {
    if (dateGroups.length > 0) {
      handleTabChange(0); // Select the first date group by default
    }
  }, [dateGroups, handleTabChange]);

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

  // Group markers by category
  const groupedMarkers = useMemo(() => {
    return activeMarkers.reduce((acc, marker) => {
      if (marker.value === null || marker.value === undefined) return acc; // Skip markers with null/undefined values
      if (!acc[marker.category]) {
        acc[marker.category] = [];
      }
      acc[marker.category].push(marker);
      return acc;
    }, {} as Record<string, BloodMarker[]>);
  }, [activeMarkers]);

  // Function to ensure a date is in valid ISO format
  const ensureValidISODate = useCallback((dateStr: string | null | undefined): string => {
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
  }, []);

  // Format date for display
  const formatDate = useCallback((date: string): string => {
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
  }, []);

  return {
    selectedDate,
    setSelectedDate,
    wasDateExtracted,
    setWasDateExtracted,
    activeMarkers,
    selectedTab,
    setSelectedTab,
    sortedDateGroups,
    hasMultipleDates,
    groupedMarkers,
    handleTabChange,
    formatDate,
    ensureValidISODate
  };
}
