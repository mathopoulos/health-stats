import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendIndicator } from '@components/TrendIndicator';
import { aggregateData } from '@/lib/metric-calculations';
import type { HealthData } from '@/types/dashboard';

import { Experiment, FitnessDataPoint } from '../../../types/experiment';
import {
  calculateTrend,
  getAdaptiveYAxisDomain
} from '../../../utils/experimentCalculations';
import {
  getMetricDisplayName,
  getMetricUnit,
  getMetricColors,
  formatDate
} from '../../../utils/experimentDisplay';

// Custom tooltip for aggregated data
function renderWeeklyTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0];
    const meta = data.payload.meta;
    
    let dateStr = '';
    
    // Check if we have aggregated data with date ranges
    if (meta && meta.startDate && meta.endDate) {
      const startDate = new Date(meta.startDate);
      const endDate = new Date(meta.endDate);
      
      // Weekly: Show "Jul 7 - Jul 13, 2025" (Monday - Sunday)
      dateStr = `${startDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })} - ${endDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })}`;
    } else {
      // Fallback to single date
      const date = new Date(label);
      dateStr = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    }

    return (
      <div className="bg-white dark:bg-gray-800 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400">{dateStr}</p>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {`${data.value.toFixed(1)}${data.payload.unit || ''}`}
        </p>
        {meta && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Weekly avg ({meta.pointCount} points)
          </p>
        )}
      </div>
    );
  }
  return null;
}

interface FitnessMetricCardProps {
  metricType: string;
  metricData: FitnessDataPoint[];
  experiment: Experiment;
  chartWidth: number;
  isDarkMode: boolean;
}

export default function FitnessMetricCard({ 
  metricType, 
  metricData, 
  experiment, 
  chartWidth, 
  isDarkMode 
}: FitnessMetricCardProps) {
  // Apply weekly aggregation to the data
  // Convert FitnessDataPoint[] to HealthData[] for compatibility with aggregateData
  const healthData: HealthData[] = metricData.map(point => ({ 
    date: point.date, 
    value: point.value 
  }));
  const aggregatedData = healthData.length > 0 ? aggregateData(healthData, 'weekly') : [];
  const hasData = aggregatedData.length > 0;

  return (
    <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            {getMetricDisplayName(metricType)}
          </h4>
          {hasData && (() => {
            const trend = calculateTrend(aggregatedData, metricType, experiment);
            if (trend) {
              const colors = getMetricColors(metricType);
              return (
                <TrendIndicator 
                  current={trend.current} 
                  previous={trend.previous} 
                  isFitnessMetric={true}
                  isBodyFat={trend.isBodyFat}
                  showTimeRange={false}
                  customColors={colors}
                  className="ml-2"
                />
              );
            }
            return null;
          })()}
        </div>
      </div>
      
      {hasData ? (
        <div className="h-[300px] w-full min-w-0">
          <LineChart 
            width={chartWidth}
            height={280}
            data={aggregatedData.map(point => ({ ...point, unit: getMetricUnit(metricType) }))}
            margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
          >
            <CartesianGrid 
              stroke={isDarkMode ? "rgba(75, 85, 99, 0.3)" : "rgba(156, 163, 175, 0.35)"}
              strokeWidth={0.75}
              strokeDasharray="0" 
              vertical={false}
            />
            <YAxis 
              domain={getAdaptiveYAxisDomain(aggregatedData, metricType)}
              hide={true}
            />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              dy={12}
              interval="preserveStart"
              minTickGap={40}
              allowDuplicatedCategory={false}
            />
            <Tooltip 
              content={renderWeeklyTooltip}
            />
            <Line 
              type="monotone"
              dataKey="value" 
              stroke={isDarkMode ? "#818cf8" : "#4f46e5"} 
              activeDot={{ 
                r: 6, 
                stroke: isDarkMode ? "#818cf8" : "#4f46e5", 
                strokeWidth: 1, 
                fill: isDarkMode ? "#1f2937" : "#ffffff" 
              }} 
              dot={(props: any) => { 
                const { cx, cy, index } = props; 
                const lineColor = isDarkMode ? "#818cf8" : "#4f46e5";
                const bgColor = isDarkMode ? "#1f2937" : "#ffffff";
                if (index === aggregatedData.length - 1 && aggregatedData.length > 0) { 
                  return (
                    <g>
                      <circle cx={cx} cy={cy} r={12} fill={lineColor} fillOpacity={0.15} stroke="none" />
                      <circle cx={cx} cy={cy} r={8} fill={lineColor} fillOpacity={0.3} stroke="none" />
                      <circle cx={cx} cy={cy} r={4} fill={lineColor} stroke={bgColor} strokeWidth={2} />
                    </g>
                  );
                } 
                return <React.Fragment key={index} />; 
              }}
              strokeWidth={2}
            />
          </LineChart>
        </div>
      ) : (
        <div className="h-[200px] flex items-center justify-center text-gray-500 dark:text-gray-400" data-testid="no-data-message">
          No {getMetricDisplayName(metricType).toLowerCase()} data available for this experiment period
        </div>
      )}
    </div>
  );
}
