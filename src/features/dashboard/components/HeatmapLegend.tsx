import React from 'react';
import { WORKOUT_HEATMAP_CONFIG } from '../constants/heatmapConfig';

const { COLORS } = WORKOUT_HEATMAP_CONFIG;

/**
 * Legend component for the workout heatmap
 * Shows the color scale from "Less" to "More" workout intensity
 */
export function HeatmapLegend() {
  const legendItems = [
    {
      color: COLORS.LIGHT_THEME.EMPTY,
      darkColor: COLORS.DARK_THEME.EMPTY,
      title: 'No workouts',
      isEmpty: true
    },
    {
      color: COLORS.LIGHT_THEME.SCALE_4,
      darkColor: COLORS.DARK_THEME.SCALE_4,
      title: '0-30 min'
    },
    {
      color: COLORS.LIGHT_THEME.SCALE_3,
      darkColor: COLORS.DARK_THEME.SCALE_3,
      title: '30-60 min'
    },
    {
      color: COLORS.LIGHT_THEME.SCALE_2,
      darkColor: COLORS.DARK_THEME.SCALE_2,
      title: '60-90 min'
    },
    {
      color: COLORS.LIGHT_THEME.SCALE_1,
      darkColor: COLORS.DARK_THEME.SCALE_1,
      title: '90+ min'
    }
  ];

  return (
    <div className="flex justify-end px-4 sm:px-0">
      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
        <span>Less</span>
        <div className="flex gap-1">
          {legendItems.map((item, index) => (
            <LegendSquare
              key={index}
              color={item.color}
              darkColor={item.darkColor}
              title={item.title}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}

interface LegendSquareProps {
  color: string;
  darkColor: string;
  title: string;
}

/**
 * Individual square in the legend with hover tooltip
 */
function LegendSquare({ color, darkColor, title }: LegendSquareProps) {
  const squareStyle = {
    backgroundColor: color,
    // Use CSS custom properties for dark mode
    '--dark-bg-color': darkColor
  } as React.CSSProperties;

  return (
    <div
      className="w-3 h-3 rounded transition-transform hover:scale-110 cursor-help"
      style={squareStyle}
      title={title}
    />
  );
}

export default HeatmapLegend;
