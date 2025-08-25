import React from 'react';

// Status and progress color utilities
export function getStatusColor(status: string) {
  switch (status) {
    case 'active':
      return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    case 'paused':
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
    case 'completed':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  }
}

export function getProgressColor(progress: number) {
  if (progress >= 75) return 'bg-green-500';
  if (progress >= 50) return 'bg-blue-500';
  if (progress >= 25) return 'bg-yellow-500';
  return 'bg-orange-500';
}

// Metric display utilities
export function getMetricDisplayName(metricType: string): string {
  // Handle both API parameter names and display names
  const displayNames: Record<string, string> = {
    heartRate: 'Heart Rate',
    weight: 'Weight',
    bodyFat: 'Body Fat',
    hrv: 'HRV',
    vo2max: 'VO2 Max',
    // Handle display names directly
    'HRV': 'HRV',
    'VO2 Max': 'VO2 Max',
    'Weight': 'Weight',
    'Body Fat %': 'Body Fat',
    'Heart Rate': 'Heart Rate'
  };
  return displayNames[metricType] || metricType;
}

export function getApiParameterName(displayName: string): string {
  const parameterMap: Record<string, string> = {
    'HRV': 'hrv',
    'VO2 Max': 'vo2max',
    'Weight': 'weight',
    'Body Fat %': 'bodyFat',
    'Heart Rate': 'heartRate'
  };
  return parameterMap[displayName] || displayName.toLowerCase();
}

export function getMetricUnit(metricType: string): string {
  const units: Record<string, string> = {
    heartRate: 'bpm',
    weight: 'lbs',
    bodyFat: '%',
    hrv: 'ms',
    vo2max: 'ml/kg/min',
    // Handle display names directly
    'HRV': 'ms',
    'VO2 Max': 'ml/kg/min',
    'Weight': 'lbs',
    'Body Fat %': '%',
    'Heart Rate': 'bpm'
  };
  return units[metricType] || '';
}

// Color utilities for trend indicators
export function getBloodMarkerColors() {
  return {
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    textColor: 'text-orange-600 dark:text-orange-400',
    iconColor: 'text-orange-500'
  };
}

export function getMetricColors(metricType: string) {
  const colorMap: Record<string, any> = {
    'HRV': {
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400',
      iconColor: 'text-purple-500'
    },
    'VO2 Max': {
      bgColor: 'bg-rose-50 dark:bg-rose-900/20',
      textColor: 'text-rose-600 dark:text-rose-400',
      iconColor: 'text-rose-500'
    },
    'Weight': {
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      iconColor: 'text-emerald-500'
    },
    'Body Fat %': {
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400',
      iconColor: 'text-green-500'
    },
    'Heart Rate': {
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      textColor: 'text-red-600 dark:text-red-400',
      iconColor: 'text-red-500'
    }
  };
  
  return colorMap[metricType] || {
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-600 dark:text-blue-400',
    iconColor: 'text-blue-500'
  };
}

// Chart formatting utilities
export function renderCustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0];
    const date = new Date(label);
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{formattedDate}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {data.value.toFixed(1)} {data.payload.unit || ''}
        </p>
      </div>
    );
  }
  return null;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
