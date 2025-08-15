import type { RankConfig } from '../types';

/**
 * Generate ordinal suffix for rank numbers (1st, 2nd, 3rd, etc.)
 */
export function getRankText(rank: number): string {
  const suffix = (rank: number) => {
    // Handle special cases for 11th, 12th, 13th (including 111th, 112th, 113th, etc.)
    const lastTwoDigits = rank % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) return 'th';
    
    switch (rank % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  return `${rank}${suffix(rank)}`;
}

/**
 * Get CSS color classes for rank badges
 */
export function getRankColor(rank: number): string {
  switch (rank) {
    case 1:
      return 'text-white dark:text-white';
    case 2:
      return 'text-gray-600 dark:text-gray-400';
    case 3:
      return 'text-amber-700 dark:text-amber-500';
    default:
      return 'text-indigo-600 dark:text-indigo-400';
  }
}

/**
 * Get CSS gradient classes for rank backgrounds
 */
export function getRankGradient(rank: number): string {
  switch (rank) {
    case 1:
      return 'from-yellow-400 to-yellow-600 dark:from-yellow-300 dark:to-yellow-500';
    case 2:
      return 'from-gray-300 to-gray-500 dark:from-gray-400 dark:to-gray-600';
    case 3:
      return 'from-amber-600 to-amber-800 dark:from-amber-500 dark:to-amber-700';
    default:
      return 'from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500';
  }
}

/**
 * Get complete rank configuration including text, colors, and styling
 */
export function getRankConfig(rank: number): RankConfig {
  return {
    text: getRankText(rank),
    color: getRankColor(rank),
    gradient: getRankGradient(rank),
    icon: rank === 2 || rank === 3 ? '🏆' : undefined,
  };
}
