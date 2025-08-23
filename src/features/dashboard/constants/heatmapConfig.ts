// Workout heatmap configuration constants

export const WORKOUT_HEATMAP_CONFIG = {
  // Duration thresholds in minutes for color scaling
  DURATION_THRESHOLDS: {
    LOW: 30,      // 0-30 minutes
    MEDIUM: 60,   // 30-60 minutes  
    HIGH: 90,     // 60-90 minutes
    // 90+ minutes gets the highest color
  },

  // Color scale classes for different workout intensities
  COLOR_CLASSES: {
    EMPTY: 'color-empty',
    SCALE_1: 'color-scale-1', // Highest intensity (90+ min)
    SCALE_2: 'color-scale-2', // High intensity (60-90 min)
    SCALE_3: 'color-scale-3', // Medium intensity (30-60 min)
    SCALE_4: 'color-scale-4', // Low intensity (0-30 min)
  },

  // Color values for the legend and styles
  COLORS: {
    LIGHT_THEME: {
      EMPTY: '#ebedf0',
      SCALE_1: '#39D353',
      SCALE_2: '#26A641', 
      SCALE_3: '#006D32',
      SCALE_4: '#0E4429',
    },
    DARK_THEME: {
      EMPTY: '#2D333B',
      SCALE_1: '#39D353',
      SCALE_2: '#26A641',
      SCALE_3: '#006D32', 
      SCALE_4: '#0E4429',
    },
    TEXT: '#7D8590',
  },

  // Date range settings
  DATE_RANGE: {
    YEARS_BACK: 1, // Show 1 year of data
    WEEK_START_DAY: 1, // Monday = 1, Sunday = 0
  },

  // UI configuration
  UI: {
    SQUARE_SIZE: {
      DEFAULT: 10, // pixels
      MOBILE: 12,  // pixels  
    },
    BORDER_RADIUS: 2, // pixels
    GUTTER_SIZE: 4,   // pixels
    MIN_WIDTH_MOBILE: 800, // pixels
    WEEKDAY_LABELS: ['', 'Mon', '', 'Wed', '', 'Fri', ''],
    MONTH_LABELS: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  },

  // Tooltip configuration
  TOOLTIP: {
    ID: 'workout-tooltip',
    PLACE: 'top' as const,
    OFFSET: 8,
    DELAY_SHOW: 100,    // Small delay before showing (smoother UX)
    DELAY_HIDE: 50,     // Faster hide for snappier feel
    MIN_WIDTH: 200,     // pixels
    MAX_WIDTH: 300,     // pixels
  },
} as const;

// Type for workout intensity levels
export type WorkoutIntensity = 'empty' | 'low' | 'medium' | 'high' | 'max';

// Helper function to get workout intensity level based on minutes
export function getWorkoutIntensity(minutes: number): WorkoutIntensity {
  if (!minutes) return 'empty';
  if (minutes <= WORKOUT_HEATMAP_CONFIG.DURATION_THRESHOLDS.LOW) return 'low';
  if (minutes <= WORKOUT_HEATMAP_CONFIG.DURATION_THRESHOLDS.MEDIUM) return 'medium';
  if (minutes <= WORKOUT_HEATMAP_CONFIG.DURATION_THRESHOLDS.HIGH) return 'high';
  return 'max';
}

// Helper function to get color class based on intensity
export function getColorClass(intensity: WorkoutIntensity): string {
  const { COLOR_CLASSES } = WORKOUT_HEATMAP_CONFIG;
  
  switch (intensity) {
    case 'empty': return COLOR_CLASSES.EMPTY;
    case 'low': return COLOR_CLASSES.SCALE_4;
    case 'medium': return COLOR_CLASSES.SCALE_3;
    case 'high': return COLOR_CLASSES.SCALE_2;
    case 'max': return COLOR_CLASSES.SCALE_1;
    default: return COLOR_CLASSES.EMPTY;
  }
}
