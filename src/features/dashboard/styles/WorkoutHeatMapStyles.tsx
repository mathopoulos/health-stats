import React from 'react';
import { WORKOUT_HEATMAP_CONFIG } from '../constants/heatmapConfig';

const { COLORS, UI } = WORKOUT_HEATMAP_CONFIG;

/**
 * Global styles component for the workout heatmap
 * Handles all the CSS styling for the react-calendar-heatmap component
 */
export function WorkoutHeatMapStyles() {
  return (
    <style jsx global>{`
      .react-calendar-heatmap {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none; /* Firefox */
        -ms-overflow-style: none; /* IE and Edge */
      }
      
      .react-calendar-heatmap::-webkit-scrollbar {
        display: none; /* Chrome, Safari, Opera */
      }
      
      .react-calendar-heatmap text {
        font-size: 10px;
        fill: ${COLORS.TEXT};
      }
      
      .react-calendar-heatmap rect {
        rx: ${UI.BORDER_RADIUS};
        width: ${UI.SQUARE_SIZE.DEFAULT}px;
        height: ${UI.SQUARE_SIZE.DEFAULT}px;
      }
      
      .react-calendar-heatmap-week {
        gap: ${UI.GUTTER_SIZE}px;
      }

      /* Light theme colors */
      .react-calendar-heatmap .${WORKOUT_HEATMAP_CONFIG.COLOR_CLASSES.EMPTY} {
        fill: ${COLORS.LIGHT_THEME.EMPTY};
      }
      .react-calendar-heatmap .${WORKOUT_HEATMAP_CONFIG.COLOR_CLASSES.SCALE_1} { 
        fill: ${COLORS.LIGHT_THEME.SCALE_1}; 
      }
      .react-calendar-heatmap .${WORKOUT_HEATMAP_CONFIG.COLOR_CLASSES.SCALE_2} { 
        fill: ${COLORS.LIGHT_THEME.SCALE_2}; 
      }
      .react-calendar-heatmap .${WORKOUT_HEATMAP_CONFIG.COLOR_CLASSES.SCALE_3} { 
        fill: ${COLORS.LIGHT_THEME.SCALE_3}; 
      }
      .react-calendar-heatmap .${WORKOUT_HEATMAP_CONFIG.COLOR_CLASSES.SCALE_4} { 
        fill: ${COLORS.LIGHT_THEME.SCALE_4}; 
      }

      /* Dark theme colors */
      .dark .react-calendar-heatmap .${WORKOUT_HEATMAP_CONFIG.COLOR_CLASSES.EMPTY} {
        fill: ${COLORS.DARK_THEME.EMPTY};
      }
      .dark .react-calendar-heatmap text {
        fill: ${COLORS.TEXT};
      }
      .dark .react-calendar-heatmap .${WORKOUT_HEATMAP_CONFIG.COLOR_CLASSES.SCALE_1} { 
        fill: ${COLORS.DARK_THEME.SCALE_1}; 
      }
      .dark .react-calendar-heatmap .${WORKOUT_HEATMAP_CONFIG.COLOR_CLASSES.SCALE_2} { 
        fill: ${COLORS.DARK_THEME.SCALE_2}; 
      }
      .dark .react-calendar-heatmap .${WORKOUT_HEATMAP_CONFIG.COLOR_CLASSES.SCALE_3} { 
        fill: ${COLORS.DARK_THEME.SCALE_3}; 
      }
      .dark .react-calendar-heatmap .${WORKOUT_HEATMAP_CONFIG.COLOR_CLASSES.SCALE_4} { 
        fill: ${COLORS.DARK_THEME.SCALE_4}; 
      }

      /* Mobile responsive styles */
      @media (max-width: 640px) {
        .react-calendar-heatmap {
          min-width: ${UI.MIN_WIDTH_MOBILE}px; /* Ensure enough width for scrolling */
        }
        .react-calendar-heatmap rect {
          width: ${UI.SQUARE_SIZE.MOBILE}px; /* Slightly larger squares on mobile */
          height: ${UI.SQUARE_SIZE.MOBILE}px;
        }
      }
    `}</style>
  );
}

export default WorkoutHeatMapStyles;
