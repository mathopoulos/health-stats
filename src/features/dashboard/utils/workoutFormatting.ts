import { format, parseISO } from 'date-fns';
import { getWorkoutIntensity, getColorClass } from '../constants/heatmapConfig';

/**
 * Formats a duration in minutes to a human-readable string
 * @param minutes - Duration in minutes
 * @returns Formatted string like "1h 30m" or "45m"
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

/**
 * Formats a workout duration from seconds to minutes and then to readable format
 * @param durationInSeconds - Duration in seconds
 * @returns Formatted duration string
 */
export function formatWorkoutDuration(durationInSeconds: number): string {
  const minutes = Math.round(durationInSeconds / 60);
  return formatDuration(minutes);
}

/**
 * Gets the appropriate CSS class for a workout based on its total minutes
 * @param totalMinutes - Total workout minutes for the day
 * @returns CSS class name for the heatmap square
 */
export function getDurationColorClass(totalMinutes: number): string {
  const intensity = getWorkoutIntensity(totalMinutes);
  return getColorClass(intensity);
}

/**
 * Formats an activity type by replacing underscores with spaces and capitalizing
 * @param activityType - Raw activity type (e.g., "strength_training")
 * @returns Formatted activity type (e.g., "strength training")
 */
export function formatActivityType(activityType: string): string {
  return activityType.replace(/_/g, ' ');
}

/**
 * Formats a date string to a human-readable format for tooltips
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @returns Formatted date string (e.g., "Aug 23, 2025")
 */
export function formatTooltipDate(dateString: string): string {
  return format(parseISO(dateString), 'MMM d, yyyy');
}

/**
 * Extracts date from a datetime string (removes time component)
 * @param startDate - ISO datetime string
 * @returns Date string in YYYY-MM-DD format
 */
export function extractDateFromDateTime(startDate: string): string {
  return startDate.split('T')[0];
}

/**
 * Calculates total workout minutes and validates the result
 * @param durationInSeconds - Duration in seconds
 * @returns Duration in minutes (rounded and validated)
 */
export function calculateWorkoutMinutes(durationInSeconds: number): number {
  const minutes = Math.round(durationInSeconds / 60);
  return Math.max(0, minutes); // Ensure non-negative
}

/**
 * Creates a workout summary for tooltip display
 * @param totalMinutes - Total workout minutes
 * @returns Formatted summary string
 */
export function createWorkoutSummary(totalMinutes: number): string {
  if (totalMinutes === 0) return 'No workouts';
  return `${totalMinutes} minutes of exercise`;
}
