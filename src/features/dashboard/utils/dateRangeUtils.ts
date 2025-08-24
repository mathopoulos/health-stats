import { 
  subYears, 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval 
} from 'date-fns';
import { WORKOUT_HEATMAP_CONFIG } from '../constants/heatmapConfig';

/**
 * Creates the date range for the heatmap (default: 1 year back from today)
 * @param referenceDate - The reference date (usually today)
 * @returns Object with start and end dates
 */
export function createHeatmapDateRange(referenceDate: Date = new Date()) {
  const startDate = subYears(referenceDate, WORKOUT_HEATMAP_CONFIG.DATE_RANGE.YEARS_BACK);
  const endDate = new Date(referenceDate);
  
  return { startDate, endDate };
}

/**
 * Generates an array of all date strings in the given range
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Array of date strings in YYYY-MM-DD format
 */
export function generateDateRange(startDate: Date, endDate: Date): string[] {
  const dateStrings: string[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dateStrings.push(format(currentDate, 'yyyy-MM-dd'));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dateStrings;
}

/**
 * Gets the current week's date range
 * @param referenceDate - The reference date (usually today)
 * @returns Object with start and end dates for the current week
 */
export function getCurrentWeekRange(referenceDate: Date = new Date()) {
  const weekStartsOn = WORKOUT_HEATMAP_CONFIG.DATE_RANGE.WEEK_START_DAY as 0 | 1;
  
  const currentWeekStart = startOfWeek(referenceDate, { weekStartsOn });
  const currentWeekEnd = endOfWeek(referenceDate, { weekStartsOn });
  
  return { currentWeekStart, currentWeekEnd };
}

/**
 * Gets all dates in the current week as an array
 * @param referenceDate - The reference date (usually today)
 * @returns Array of dates in the current week
 */
export function getCurrentWeekDates(referenceDate: Date = new Date()): Date[] {
  const { currentWeekStart, currentWeekEnd } = getCurrentWeekRange(referenceDate);
  return eachDayOfInterval({ start: currentWeekStart, end: currentWeekEnd });
}

/**
 * Counts workout days in the current week based on workout data
 * @param workoutsByDate - Object with dates as keys and workout data as values
 * @param referenceDate - The reference date (usually today)
 * @returns Number of days with workouts in the current week
 */
export function countWorkoutDaysThisWeek(
  workoutsByDate: Record<string, any>, 
  referenceDate: Date = new Date()
): number {
  const currentWeekDates = getCurrentWeekDates(referenceDate);
  
  return currentWeekDates.filter(date => {
    const dateString = format(date, 'yyyy-MM-dd');
    return workoutsByDate[dateString] !== undefined;
  }).length;
}

/**
 * Validates if a date string is in the correct format (YYYY-MM-DD)
 * @param dateString - Date string to validate
 * @returns Boolean indicating if the format is valid
 */
export function isValidDateString(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  return dateRegex.test(dateString);
}

/**
 * Formats a date to the standard YYYY-MM-DD format used throughout the app
 * @param date - Date object
 * @returns Formatted date string
 */
export function formatDateForHeatmap(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}
