// Sleep-related constants

export interface SleepStageTarget {
  target: number;
  color: string;
  label: string;
}

export const SLEEP_STAGE_TARGETS: Record<string, SleepStageTarget> = {
  deep: { 
    target: 90, 
    color: 'bg-indigo-500 dark:bg-indigo-400', 
    label: 'Deep Sleep'
  },
  core: { 
    target: 240, 
    color: 'bg-blue-500 dark:bg-blue-400', 
    label: 'Core Sleep'
  },
  rem: { 
    target: 90, 
    color: 'bg-purple-500 dark:bg-purple-400', 
    label: 'REM Sleep'
  }
} as const;
