'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getReferenceRanges, getBloodMarkerStatus, BLOOD_MARKER_STATUS_COLORS, type ReferenceRanges } from '@/lib/bloodMarkerRanges';

interface BloodMarker {
  value: number;
  unit: string;
  date: string;
  referenceRange?: { min: number; max: number };
}

interface BloodMarkerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  markerName: string;
  data: BloodMarker[];
  userId: string;
}

// Use centralized reference ranges and interfaces

// Helper function to calculate adaptive Y-axis domain (similar to dashboard)
const getAdaptiveYAxisDomain = (data: any[]): [number, number] => {
  if (!data || data.length <= 1) {
    return [0, 100]; // Default domain if no data
  }
  
  const values = data.map(item => item.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  
  // Calculate standard deviation to understand data variation
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  // Set min/max padding based on data variation - similar to dashboard logic
  let minPadding, maxPadding;
  
  if (range < 5) {
    minPadding = Math.max(1, stdDev * 2);
    maxPadding = Math.max(1, stdDev * 2);
  } else {
    minPadding = range * 0.1;
    maxPadding = range * 0.1;
  }
  
  const lowerBound = Math.max(0, min - minPadding);
  return [lowerBound, max + maxPadding];
};

// Custom tooltip to match dashboard style exactly
const renderCustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const formattedDate = new Date(data.fullDate).toLocaleDateString('default', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-md border border-gray-200 dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-300 mb-1">{formattedDate}</p>
        <p className="font-medium text-gray-900 dark:text-white">
          {payload[0].value} {data.unit}
        </p>
      </div>
    );
  }
  
  return null;
};

// Tick formatter to match dashboard style
const getTickFormatter = (date: string) => {
  const d = new Date(date);
  return d.toLocaleString('default', { month: 'short', day: 'numeric' });
};

// Use centralized color constants
const STATUS_COLORS = BLOOD_MARKER_STATUS_COLORS;

export default function BloodMarkerDetailModal({ 
  isOpen, 
  onClose, 
  markerName, 
  data, 
  userId 
}: BloodMarkerDetailModalProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [referenceRanges, setReferenceRanges] = useState<ReferenceRanges>();

  // Get dark mode state from document
  const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  useEffect(() => {
    if (data && data.length > 0) {
      // Sort data by date and format for chart
      const sortedData = [...data]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((item, index) => ({
          date: new Date(item.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric'
          }),
          value: item.value,
          unit: item.unit,
          fullDate: item.date
        }));

      setChartData(sortedData);
      setReferenceRanges(
        getReferenceRanges(markerName, data[0]?.referenceRange)
      );
    }
  }, [data, markerName]);

  if (!isOpen) return null;

  const currentValue = data?.[0];
  const unit = currentValue?.unit || '';

  const getStatusColor = (value: number): string => {
    if (!referenceRanges) return STATUS_COLORS.normal;
    
    const status = getBloodMarkerStatus(value, markerName);
    return STATUS_COLORS[status];
  };

  const getStatus = (value: number): string => {
    if (!referenceRanges) return 'Unknown';
    
    const status = getBloodMarkerStatus(value, markerName);
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Line color that matches dashboard styling
  const lineColor = isDarkMode ? "#818cf8" : "#4f46e5";
  const bgColor = isDarkMode ? "#1f2937" : "#ffffff";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-xs sm:max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1 pr-2">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{markerName}</h2>
            {currentValue && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {currentValue.value} {unit}
                </span>
                <span 
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium text-white w-fit`}
                  style={{ backgroundColor: getStatusColor(currentValue.value) }}
                >
                  {getStatus(currentValue.value)}
                </span>
              </div>
            )}
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Last tested: {currentValue ? new Date(currentValue.date).toLocaleDateString() : 'No data'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 flex-shrink-0"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Reference Ranges - Mobile responsive stacked layout */}
        {referenceRanges && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3 sm:gap-8">
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                <span className="text-gray-600 dark:text-gray-400">Abnormal:</span>
                <span className="text-gray-900 dark:text-white font-medium">{referenceRanges.abnormalText}</span>
              </div>
              
              {referenceRanges.normalText && (
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-600 dark:text-gray-400">Normal:</span>
                  <span className="text-gray-900 dark:text-white font-medium">{referenceRanges.normalText}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="text-gray-600 dark:text-gray-400">Optimal:</span>
                <span className="text-gray-900 dark:text-white font-medium">{referenceRanges.optimalText}</span>
              </div>
            </div>
          </div>
        )}

        {/* Chart - Responsive height and margins */}
        <div className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Historical Trend
          </h3>
          
          {chartData.length > 0 ? (
            <div className="h-[280px] sm:h-[340px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={chartData} 
                  margin={{ 
                    top: 20, 
                    right: 15, 
                    left: 10, 
                    bottom: 15,
                    ...(typeof window !== 'undefined' && window.innerWidth >= 640 && {
                      top: 30,
                      right: 50,
                      left: 50,
                      bottom: 20
                    })
                  }}
                >
                  <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      {chartData.map((point, index) => {
                        const getStatusColorForGradient = (value: number): string => {
                          if (!referenceRanges) return STATUS_COLORS.normal;
                          
                          const status = getBloodMarkerStatus(value, markerName);
                          return STATUS_COLORS[status];
                        };
                        
                        const color = getStatusColorForGradient(point.value);
                        const offset = chartData.length > 1 ? (index / (chartData.length - 1)) * 100 : 0;
                        
                        return (
                          <stop 
                            key={index} 
                            offset={`${offset}%`} 
                            stopColor={color}
                          />
                        );
                      })}
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    stroke={isDarkMode ? "rgba(75, 85, 99, 0.3)" : "rgba(156, 163, 175, 0.35)"}
                    strokeWidth={0.75}
                    strokeDasharray="0" 
                    vertical={false}
                  />
                  <YAxis 
                    domain={getAdaptiveYAxisDomain(chartData)}
                    hide={false}
                    stroke="#9CA3AF"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    width={30}
                    tickFormatter={(value) => Math.round(value).toString()}
                  />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={getTickFormatter}
                    stroke="#9CA3AF"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    dy={8}
                    interval="preserveStart"
                    minTickGap={30}
                    allowDuplicatedCategory={false}
                  />
                  
                  <Tooltip content={renderCustomTooltip} />
                  
                  <Line 
                    type="monotone"
                    dataKey="value" 
                    stroke="url(#lineGradient)"
                    activeDot={{ r: 4, stroke: STATUS_COLORS.normal, strokeWidth: 1, fill: bgColor }} 
                    dot={(props: any) => { 
                      const { cx, cy, index, payload } = props;
                      
                      // Get the color based on reference ranges
                      const getStatusColorForDot = (value: number): string => {
                        if (!referenceRanges) return STATUS_COLORS.normal;
                        
                        const status = getBloodMarkerStatus(value, markerName);
                        return STATUS_COLORS[status];
                      };
                      
                      const dotColor = getStatusColorForDot(payload.value);
                      const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
                      
                      // Special styling for the last point (matching dashboard)
                      if (index === chartData.length - 1 && chartData.length > 0) { 
                        const outerRadius = isMobile ? 8 : 12;
                        const middleRadius = isMobile ? 6 : 8;
                        const innerRadius = isMobile ? 3 : 4;
                        
                        return (
                          <g>
                            <circle cx={cx} cy={cy} r={outerRadius} fill={dotColor} fillOpacity={0.15} stroke="none" />
                            <circle cx={cx} cy={cy} r={middleRadius} fill={dotColor} fillOpacity={0.3} stroke="none" />
                            <circle cx={cx} cy={cy} r={innerRadius} fill={dotColor} stroke={bgColor} strokeWidth={2} />
                          </g>
                        );
                      } else {
                        // Regular dots for all other points - smaller on mobile
                        const radius = isMobile ? 4 : 6;
                        return (
                          <circle 
                            cx={cx} 
                            cy={cy} 
                            r={radius} 
                            fill={dotColor} 
                            stroke={bgColor} 
                            strokeWidth={2}
                          />
                        );
                      }
                    }}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>

              {/* Reference Range Bar - Hide on very small screens */}
              {referenceRanges && (
                <div className="hidden sm:block absolute right-2 top-8 bottom-5 w-1">
                  <svg width="4" height="100%" className="overflow-visible">
                    <defs>
                      <linearGradient id="rangeGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                        {/* Calculate percentages for each range */}
                        {(() => {
                          const yAxisDomain = getAdaptiveYAxisDomain(chartData);
                          const min = yAxisDomain[0];
                          const max = yAxisDomain[1];
                          const range = max - min;
                          
                          // Calculate positions as percentages from bottom
                          const optimalMinPercent = Math.max(0, Math.min(100, ((referenceRanges.optimalMin - min) / range) * 100));
                          const optimalMaxPercent = Math.max(0, Math.min(100, ((referenceRanges.optimalMax - min) / range) * 100));
                          
                          let normalMinPercent = 0;
                          let normalMaxPercent = 0;
                          if (referenceRanges.normalMin && referenceRanges.normalMax) {
                            normalMinPercent = Math.max(0, Math.min(100, ((referenceRanges.normalMin - min) / range) * 100));
                            normalMaxPercent = Math.max(0, Math.min(100, ((referenceRanges.normalMax - min) / range) * 100));
                          }
                          
                          const stops = [];
                          
                          // Bottom abnormal
                          if (optimalMinPercent > 0) {
                            stops.push(<stop key="abnormal-bottom-1" offset="0%" stopColor={STATUS_COLORS.abnormal} />);
                            stops.push(<stop key="abnormal-bottom-2" offset={`${optimalMinPercent}%`} stopColor={STATUS_COLORS.abnormal} />);
                          }
                          
                          // Normal range (if exists and below optimal)
                          if (referenceRanges.normalMin && normalMinPercent < optimalMinPercent) {
                            stops.push(<stop key="normal-bottom-1" offset={`${normalMinPercent}%`} stopColor={STATUS_COLORS.normal} />);
                            stops.push(<stop key="normal-bottom-2" offset={`${optimalMinPercent}%`} stopColor={STATUS_COLORS.normal} />);
                          }
                          
                          // Optimal range
                          stops.push(<stop key="optimal-1" offset={`${optimalMinPercent}%`} stopColor={STATUS_COLORS.optimal} />);
                          stops.push(<stop key="optimal-2" offset={`${optimalMaxPercent}%`} stopColor={STATUS_COLORS.optimal} />);
                          
                          // Normal range (if exists and above optimal)
                          if (referenceRanges.normalMax && normalMaxPercent > optimalMaxPercent) {
                            stops.push(<stop key="normal-top-1" offset={`${optimalMaxPercent}%`} stopColor={STATUS_COLORS.normal} />);
                            stops.push(<stop key="normal-top-2" offset={`${normalMaxPercent}%`} stopColor={STATUS_COLORS.normal} />);
                          }
                          
                          // Top abnormal
                          if (optimalMaxPercent < 100) {
                            const topStart = referenceRanges.normalMax && normalMaxPercent > optimalMaxPercent ? normalMaxPercent : optimalMaxPercent;
                            stops.push(<stop key="abnormal-top-1" offset={`${topStart}%`} stopColor={STATUS_COLORS.abnormal} />);
                            stops.push(<stop key="abnormal-top-2" offset="100%" stopColor={STATUS_COLORS.abnormal} />);
                          }
                          
                          return stops;
                        })()}
                      </linearGradient>
                    </defs>
                    <rect 
                      x="0" 
                      y="0" 
                      width="4" 
                      height="100%" 
                      fill="url(#rangeGradient)"
                      rx="2"
                    />
                  </svg>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[280px] sm:h-[340px] bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">No historical data available</p>
            </div>
          )}
        </div>

        {/* Recent History Table - Mobile optimized */}
        {chartData.length > 0 && (
          <div className="p-4 sm:p-6 pt-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Recent History
            </h3>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-1 text-gray-600 dark:text-gray-400 font-medium">Date</th>
                    <th className="text-left py-2 px-1 text-gray-600 dark:text-gray-400 font-medium">Value</th>
                    <th className="text-left py-2 px-1 text-gray-600 dark:text-gray-400 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.slice().reverse().slice(0, 5).map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-2 px-1 text-gray-900 dark:text-white">
                        {new Date(item.fullDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          ...(typeof window !== 'undefined' && window.innerWidth >= 640 && { year: 'numeric' })
                        })}
                      </td>
                      <td className="py-2 px-1 text-gray-900 dark:text-white font-medium">
                        {item.value} {unit}
                      </td>
                      <td className="py-2 px-1">
                        <span 
                          className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: getStatusColor(item.value) }}
                        >
                          {getStatus(item.value)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 