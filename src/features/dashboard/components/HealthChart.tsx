import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import TrendIndicator from '@components/TrendIndicator';
import type { HealthData } from '@/types/dashboard';
import type { TimeRange } from '../hooks/useTimeRangeFilters';
import { getTimeRangeData, calculateTrendComparison, getTimeRangeLabel, aggregateData, calculateTrendFromAggregatedData } from '@/lib/metric-calculations';

interface HealthChartProps {
  title: string;
  data: HealthData[];
  loading: boolean;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  isDarkMode: boolean;
  metricType: 'hrv' | 'vo2max' | 'weight' | 'bodyFat';
  unit?: string;
  color?: {
    stroke: string;
    strokeDark: string;
    bgColor?: string;
    textColor?: string;
    iconColor?: string;
  };
}

// Y-axis domain calculation
function getAdaptiveYAxisDomain(data: HealthData[], metricType: string): [number, number] {
  if (data.length === 0) return [0, 100];
  
  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  if (min === max) return [min - 1, max + 1];
  
  const range = max - min;
  const padding = range * 0.1; // 10% padding
  
  return [Math.max(0, min - padding), max + padding];
}

// Tick formatter based on time range
function getTickFormatter(timeRange: string) {
  return (tickItem: string) => {
    const date = new Date(tickItem);
    
    if (timeRange === 'last30days') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (timeRange === 'last3months') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }
  };
}

// Custom tooltip renderer
function renderCustomTooltip({ active, payload, label, timeRange }: any) {
  if (active && payload && payload.length) {
    const data = payload[0];
    const meta = data.payload.meta;
    
    let dateStr = '';
    
    // Check if we have aggregated data with date ranges
    if (meta && meta.startDate && meta.endDate) {
      const startDate = new Date(meta.startDate);
      const endDate = new Date(meta.endDate);
      
      if (meta.aggregationType === 'weekly') {
        // Weekly: Show "Jul 7 - Jul 13, 2025" (Monday - Sunday)
        dateStr = `${startDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })} - ${endDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })}`;
      } else if (meta.aggregationType === 'monthly') {
        // Monthly: Show "July 2025" (month name + year)
        dateStr = startDate.toLocaleDateString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        });
      }
    } else {
      // Fallback to original logic for non-aggregated data
      const date = new Date(label);
      if (timeRange === 'last30days' || timeRange === 'last3months') {
        dateStr = date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        });
      } else {
        dateStr = date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        });
      }
    }

    return (
      <div className="bg-white dark:bg-gray-800 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400">{dateStr}</p>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {`${data.value}${data.unit || ''}`}
        </p>
        {meta && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {meta.aggregationType === 'weekly' ? 'Weekly avg' : 'Monthly avg'} 
            ({meta.pointCount} points)
          </p>
        )}
      </div>
    );
  }
  return null;
}

export function HealthChart({
  title,
  data,
  loading,
  timeRange,
  onTimeRangeChange,
  isDarkMode,
  metricType,
  unit,
  color = {
    stroke: "#4f46e5",
    strokeDark: "#818cf8"
  }
}: HealthChartProps) {
  // Filter data based on time range
  const timeFilteredData = getTimeRangeData(data, timeRange);
  
  // Apply aggregation based on time range to create smooth charts
  let chartData = timeFilteredData;
  if (timeFilteredData.length > 0) {
    if (timeRange === 'last30days' || timeRange === 'last3months') {
      // Use weekly aggregation for shorter ranges
      chartData = aggregateData(timeFilteredData, 'weekly');
    } else if (timeRange === 'last6months' || timeRange === 'last1year' || timeRange === 'last3years') {
      // Use monthly aggregation for longer ranges
      chartData = aggregateData(timeFilteredData, 'monthly');
    }
    // For very short ranges or when there's minimal data, keep raw data
  }
  
  const filteredData = chartData;
  const hasData = filteredData.length > 0;
  
  // Calculate trend using the same aggregated data that's displayed in the chart
  const trendData = calculateTrendFromAggregatedData(filteredData);

  const strokeColor = isDarkMode ? color.strokeDark : color.stroke;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          {hasData && !loading && trendData.hasData && (
            <TrendIndicator 
              current={trendData.current} 
              previous={trendData.previous} 
              isFitnessMetric={true}
              isBodyFat={metricType === 'bodyFat'}
              showTimeRange={true}
              timeRangeLabel={getTimeRangeLabel(timeRange)}
              customColors={color.bgColor ? {
                bgColor: color.bgColor,
                textColor: color.textColor || 'text-indigo-600 dark:text-indigo-400',
                iconColor: color.iconColor || 'text-indigo-500'
              } : undefined}
              className="ml-0 sm:ml-3"
            />
          )}
        </div>
        <div className="flex items-center">
          <select
            value={timeRange}
            onChange={(e) => onTimeRangeChange(e.target.value as TimeRange)}
            className="w-full sm:w-auto text-sm font-medium border border-gray-200 rounded-md px-3 py-2 pr-9 bg-white/90 text-gray-900 dark:border-gray-700 dark:bg-gray-800/90 dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm hover:bg-white dark:hover:bg-gray-800"
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg width='16' height='16' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M4.94 5.72a.75.75 0 0 0-1.06 1.06l3.83 3.83a.75.75 0 0 0 1.06 0l3.83-3.83a.75.75 0 0 0-1.06-1.06L8 9.28 4.94 5.72z' fill='%236b7280'/%3e%3c/svg%3e")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.5rem center',
              backgroundSize: '1.5em 1.5em'
            }}
          >
            <option value="last30days">Last 30 days</option>
            <option value="last3months">Last 3 months</option>
            <option value="last6months">Last 6 months</option>
            <option value="last1year">Last year</option>
            <option value="last3years">Last 3 years</option>
          </select>
        </div>
      </div>
      
      <div className="h-[340px]">
        {loading && (
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            Loading data...
          </div>
        )}
        {!hasData && !loading && (
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            No {title.toLowerCase()} data available for the {getTimeRangeLabel(timeRange)}
          </div>
        )}
        {hasData && !loading && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={filteredData}
              margin={{ top: 30, right: 10, left: 10, bottom: 20 }}
            >
              <CartesianGrid 
                stroke={isDarkMode ? "rgba(75, 85, 99, 0.3)" : "rgba(156, 163, 175, 0.35)"}
                strokeWidth={0.75}
                strokeDasharray="0" 
                vertical={false}
              />
              <YAxis 
                domain={getAdaptiveYAxisDomain(filteredData, metricType)}
                hide={true}
              />
              <XAxis 
                dataKey="date" 
                tickFormatter={getTickFormatter(timeRange)}
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
                content={(props) => renderCustomTooltip({ ...props, timeRange })}
              />
              <Line 
                type="monotone"
                dataKey="value" 
                stroke={strokeColor} 
                activeDot={{ 
                  r: 6, 
                  stroke: strokeColor, 
                  strokeWidth: 1, 
                  fill: isDarkMode ? "#1f2937" : "#ffffff" 
                }} 
                dot={(props: any) => { 
                  const { cx, cy, index } = props;
                  const bgColor = isDarkMode ? "#1f2937" : "#ffffff";
                  if (index === filteredData.length - 1 && filteredData.length > 0) { 
                    return (
                      <g>
                        <circle cx={cx} cy={cy} r={12} fill={strokeColor} fillOpacity={0.15} stroke="none" />
                        <circle cx={cx} cy={cy} r={8} fill={strokeColor} fillOpacity={0.3} stroke="none" />
                        <circle cx={cx} cy={cy} r={4} fill={strokeColor} stroke={bgColor} strokeWidth={2} />
                      </g>
                    );
                  } 
                  return <React.Fragment key={index} />; 
                }}
                strokeWidth={2}
                unit={unit}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
