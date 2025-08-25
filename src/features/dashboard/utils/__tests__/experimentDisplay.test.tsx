import React from 'react';
import { render } from '@testing-library/react';
import {
  getStatusColor,
  getProgressColor,
  getMetricDisplayName,
  getApiParameterName,
  getMetricUnit,
  getBloodMarkerColors,
  getMetricColors,
  formatDate,
  renderCustomTooltip
} from '../experimentDisplay';

describe('experimentDisplay', () => {
  describe('getStatusColor', () => {
    it('should return correct colors for active status', () => {
      expect(getStatusColor('active')).toBe('bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300');
    });

    it('should return correct colors for paused status', () => {
      expect(getStatusColor('paused')).toBe('bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300');
    });

    it('should return correct colors for completed status', () => {
      expect(getStatusColor('completed')).toBe('bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300');
    });

    it('should return default colors for unknown status', () => {
      expect(getStatusColor('unknown')).toBe('bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300');
    });
  });

  describe('getProgressColor', () => {
    it('should return green for high progress (≥75%)', () => {
      expect(getProgressColor(75)).toBe('bg-green-500');
      expect(getProgressColor(100)).toBe('bg-green-500');
    });

    it('should return blue for medium-high progress (≥50%)', () => {
      expect(getProgressColor(50)).toBe('bg-blue-500');
      expect(getProgressColor(74)).toBe('bg-blue-500');
    });

    it('should return yellow for medium progress (≥25%)', () => {
      expect(getProgressColor(25)).toBe('bg-yellow-500');
      expect(getProgressColor(49)).toBe('bg-yellow-500');
    });

    it('should return orange for low progress (<25%)', () => {
      expect(getProgressColor(0)).toBe('bg-orange-500');
      expect(getProgressColor(24)).toBe('bg-orange-500');
    });
  });

  describe('getMetricDisplayName', () => {
    it('should convert API parameter names to display names', () => {
      expect(getMetricDisplayName('heartRate')).toBe('Heart Rate');
      expect(getMetricDisplayName('weight')).toBe('Weight');
      expect(getMetricDisplayName('bodyFat')).toBe('Body Fat');
      expect(getMetricDisplayName('hrv')).toBe('HRV');
      expect(getMetricDisplayName('vo2max')).toBe('VO2 Max');
    });

    it('should pass through display names unchanged', () => {
      expect(getMetricDisplayName('HRV')).toBe('HRV');
      expect(getMetricDisplayName('VO2 Max')).toBe('VO2 Max');
      expect(getMetricDisplayName('Weight')).toBe('Weight');
      expect(getMetricDisplayName('Body Fat %')).toBe('Body Fat');
      expect(getMetricDisplayName('Heart Rate')).toBe('Heart Rate');
    });

    it('should return original string for unknown metrics', () => {
      expect(getMetricDisplayName('unknownMetric')).toBe('unknownMetric');
    });
  });

  describe('getApiParameterName', () => {
    it('should convert display names to API parameter names', () => {
      expect(getApiParameterName('HRV')).toBe('hrv');
      expect(getApiParameterName('VO2 Max')).toBe('vo2max');
      expect(getApiParameterName('Weight')).toBe('weight');
      expect(getApiParameterName('Body Fat %')).toBe('bodyFat');
      expect(getApiParameterName('Heart Rate')).toBe('heartRate');
    });

    it('should return lowercase for unknown display names', () => {
      expect(getApiParameterName('CustomMetric')).toBe('custommetric');
    });
  });

  describe('getMetricUnit', () => {
    it('should return correct units for API parameter names', () => {
      expect(getMetricUnit('heartRate')).toBe('bpm');
      expect(getMetricUnit('weight')).toBe('lbs');
      expect(getMetricUnit('bodyFat')).toBe('%');
      expect(getMetricUnit('hrv')).toBe('ms');
      expect(getMetricUnit('vo2max')).toBe('ml/kg/min');
    });

    it('should return correct units for display names', () => {
      expect(getMetricUnit('HRV')).toBe('ms');
      expect(getMetricUnit('VO2 Max')).toBe('ml/kg/min');
      expect(getMetricUnit('Weight')).toBe('lbs');
      expect(getMetricUnit('Body Fat %')).toBe('%');
      expect(getMetricUnit('Heart Rate')).toBe('bpm');
    });

    it('should return empty string for unknown metrics', () => {
      expect(getMetricUnit('unknownMetric')).toBe('');
    });
  });

  describe('getBloodMarkerColors', () => {
    it('should return orange color scheme for blood markers', () => {
      const colors = getBloodMarkerColors();
      
      expect(colors).toEqual({
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        textColor: 'text-orange-600 dark:text-orange-400',
        iconColor: 'text-orange-500'
      });
    });
  });

  describe('getMetricColors', () => {
    it('should return specific colors for HRV', () => {
      const colors = getMetricColors('HRV');
      
      expect(colors.bgColor).toBe('bg-purple-50 dark:bg-purple-900/20');
      expect(colors.textColor).toBe('text-purple-600 dark:text-purple-400');
      expect(colors.iconColor).toBe('text-purple-500');
    });

    it('should return specific colors for VO2 Max', () => {
      const colors = getMetricColors('VO2 Max');
      
      expect(colors.bgColor).toBe('bg-rose-50 dark:bg-rose-900/20');
      expect(colors.textColor).toBe('text-rose-600 dark:text-rose-400');
      expect(colors.iconColor).toBe('text-rose-500');
    });

    it('should return specific colors for Weight', () => {
      const colors = getMetricColors('Weight');
      
      expect(colors.bgColor).toBe('bg-emerald-50 dark:bg-emerald-900/20');
      expect(colors.textColor).toBe('text-emerald-600 dark:text-emerald-400');
      expect(colors.iconColor).toBe('text-emerald-500');
    });

    it('should return specific colors for Body Fat %', () => {
      const colors = getMetricColors('Body Fat %');
      
      expect(colors.bgColor).toBe('bg-green-50 dark:bg-green-900/20');
      expect(colors.textColor).toBe('text-green-600 dark:text-green-400');
      expect(colors.iconColor).toBe('text-green-500');
    });

    it('should return specific colors for Heart Rate', () => {
      const colors = getMetricColors('Heart Rate');
      
      expect(colors.bgColor).toBe('bg-red-50 dark:bg-red-900/20');
      expect(colors.textColor).toBe('text-red-600 dark:text-red-400');
      expect(colors.iconColor).toBe('text-red-500');
    });

    it('should return default blue colors for unknown metrics', () => {
      const colors = getMetricColors('UnknownMetric');
      
      expect(colors.bgColor).toBe('bg-blue-50 dark:bg-blue-900/20');
      expect(colors.textColor).toBe('text-blue-600 dark:text-blue-400');
      expect(colors.iconColor).toBe('text-blue-500');
    });
  });

  describe('formatDate', () => {
    it('should format dates correctly', () => {
      // Use a date that won't have timezone issues
      const result1 = formatDate('2023-01-15T12:00:00.000Z');
      expect(result1).toMatch(/Jan 1[45]/); // Could be Jan 14 or Jan 15 depending on timezone
      
      const result2 = formatDate('2023-12-25T12:00:00.000Z');
      expect(result2).toMatch(/Dec 2[45]/); // Could be Dec 24 or Dec 25 depending on timezone
    });

    it('should handle ISO date strings', () => {
      const result = formatDate('2023-01-15T12:00:00Z');
      expect(result).toMatch(/Jan 1[45]/);
    });
  });

  describe('renderCustomTooltip', () => {
    it('should render tooltip when active with payload data', () => {
      const props = {
        active: true,
        payload: [
          {
            value: 150.5,
            payload: { unit: 'lbs' }
          }
        ],
        label: '2023-01-15'
      };

      const tooltip = renderCustomTooltip(props);
      
      expect(tooltip).toBeTruthy();
      
      // Render the tooltip to check its content
      const { container } = render(<div>{tooltip}</div>);
      expect(container.textContent).toContain('150.5 lbs');
      expect(container.textContent).toMatch(/Jan 1[45], 2023/);
    });

    it('should return null when not active', () => {
      const props = {
        active: false,
        payload: [],
        label: '2023-01-15'
      };

      const tooltip = renderCustomTooltip(props);
      expect(tooltip).toBeNull();
    });

    it('should return null when no payload', () => {
      const props = {
        active: true,
        payload: null,
        label: '2023-01-15'
      };

      const tooltip = renderCustomTooltip(props);
      expect(tooltip).toBeNull();
    });

    it('should return null when payload is empty', () => {
      const props = {
        active: true,
        payload: [],
        label: '2023-01-15'
      };

      const tooltip = renderCustomTooltip(props);
      expect(tooltip).toBeNull();
    });

    it('should handle tooltip without unit', () => {
      const props = {
        active: true,
        payload: [
          {
            value: 75,
            payload: {}
          }
        ],
        label: '2023-01-15'
      };

      const tooltip = renderCustomTooltip(props);
      
      expect(tooltip).toBeTruthy();
      
      const { container } = render(<div>{tooltip}</div>);
      expect(container.textContent).toContain('75.0');
      expect(container.textContent).not.toContain('undefined');
    });
  });
});
