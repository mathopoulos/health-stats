import React from 'react';

interface TrendIndicatorProps {
  current: number;
  previous: number;
  isBodyFat?: boolean;
  decreaseIsGood?: boolean | null;
  min?: number;
  max?: number;
  isFitnessMetric?: boolean;
  showTimeRange?: boolean;
  timeRangeLabel?: string;
  customColors?: {
    bgColor?: string;
    textColor?: string;
    iconColor?: string;
  };
  className?: string;
}

export const TrendIndicator = ({ 
  current, 
  previous, 
  isBodyFat = false,
  decreaseIsGood = null,
  min = 0,
  max = 100,
  isFitnessMetric = false,
  showTimeRange = false,
  timeRangeLabel = '',
  customColors,
  className = ''
}: TrendIndicatorProps) => {
  const percentChange = ((current - previous) / previous) * 100;
  const isIncrease = percentChange > 0;
  const absPercentChange = Math.abs(percentChange).toFixed(1);
  const isZeroChange = absPercentChange === '0.0';

  // Handle fitness metrics differently
  if (isFitnessMetric) {
    let color = 'text-gray-500';
    if (isBodyFat) {
      // For body fat, decrease is good
      color = !isIncrease ? 'text-green-500' : 'text-red-500';
    } else {
      // For HRV, VO2 max, and weight, increase is good
      color = isIncrease ? 'text-green-500' : 'text-red-500';
    }

    // If custom colors are provided, use them instead
    if (customColors) {
      // For big chart styling
      const bgColor = isZeroChange 
        ? 'bg-gray-50 dark:bg-gray-700/20'
        : customColors.bgColor || '';
      
      const textColor = isZeroChange
        ? 'text-gray-500 dark:text-gray-400'
        : customColors.textColor || color;
      
      const iconColor = isZeroChange
        ? 'text-gray-400'
        : customColors.iconColor || color;

      return (
        <div className={`flex items-center ${bgColor} ${showTimeRange ? 'rounded-full px-3 py-1' : ''} ${className}`}>
          <svg 
            className={`w-${showTimeRange ? '3.5' : '4'} h-${showTimeRange ? '3.5' : '4'} ${iconColor} ${showTimeRange ? 'mr-1.5' : ''}`}
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor"
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2}
          >
            <path 
              d={isZeroChange
                ? "M5 12h14M12 5l7 7-7 7"
                : isIncrease 
                  ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" 
                  : "M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"
              } 
            />
          </svg>
          <span className={`${showTimeRange ? 'text-sm font-medium' : 'text-sm'} ${textColor}`}>
            {isZeroChange ? '' : isIncrease ? '+' : '-'}{absPercentChange}%
            {showTimeRange && timeRangeLabel && (
              <span className="text-sm font-normal opacity-75"> over {timeRangeLabel.toLowerCase()}</span>
            )}
          </span>
        </div>
      );
    }

    // Original compact styling for small indicators
    return (
      <span className={`text-sm flex items-center ${color} ${className}`}>
        {isIncrease ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
          </svg>
        )}
        <span className="ml-1">{absPercentChange}%</span>
      </span>
    );
  }
  
  // Blood marker logic
  const range = max - min;
  const optimalMin = min + (range * 0.25);
  const optimalMax = max - (range * 0.25);

  const isInOptimalRange = (value: number) => value >= optimalMin && value <= optimalMax;
  const isInNormalRange = (value: number) => value >= min && value <= max;
  const isMovingTowardsOptimal = () => {
    if (isInOptimalRange(current)) return true;
    if (current > optimalMax && previous > current) return true;
    if (current < optimalMin && previous < current) return true;
    return false;
  };
  const isMovingFromOptimalToNormal = () => {
    return isInOptimalRange(previous) && !isInOptimalRange(current) && isInNormalRange(current);
  };
  const isMovingTowardsAbnormal = () => {
    return (current > max && previous < current) || (current < min && previous > current);
  };

  let color = 'text-gray-500';
  if (isMovingTowardsOptimal()) {
    color = 'text-green-500';
  } else if (isMovingFromOptimalToNormal() || isMovingTowardsAbnormal()) {
    color = 'text-red-500';
  } else if (decreaseIsGood !== null) {
    color = (isIncrease !== decreaseIsGood) ? 'text-green-500' : 'text-red-500';
  }

  return (
    <span className={`text-sm flex items-center ${color} ${className}`}>
      {isIncrease ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
        </svg>
      )}
      <span className="ml-1">{absPercentChange}%</span>
    </span>
  );
};

export default TrendIndicator; 