'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

interface ReferenceRanges {
  optimalMin: number;
  optimalMax: number;
  normalMin?: number;
  normalMax?: number;
  abnormalText: string;
  normalText?: string;
  optimalText: string;
}

// Reference ranges mapping - extracted from the dashboard logic
const getReferenceRanges = (
  markerKey: string,
  fallbackRange?: { min?: number; max?: number }
): ReferenceRanges => {
  const key = markerKey.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
  
  // Default ranges for common markers
  const referenceRanges: Record<string, ReferenceRanges> = {
    totalcholesterol: {
      optimalMin: 160,
      optimalMax: 200,
      normalMin: 200,
      normalMax: 239,
      abnormalText: '<160 or >239',
      normalText: '200-239',
      optimalText: '160-200'
    },
    ldlcholesterol: {
      optimalMin: 60,
      optimalMax: 100,
      normalMin: 100,
      normalMax: 129,
      abnormalText: '<60 or >129',
      normalText: '100-129',
      optimalText: '60-100'
    },
    hdlcholesterol: {
      optimalMin: 60,
      optimalMax: 120,
      normalMin: 40,
      normalMax: 60,
      abnormalText: '<40 or >120',
      normalText: '40-60',
      optimalText: '60-120'
    },
    triglycerides: {
      optimalMin: 50,
      optimalMax: 100,
      normalMin: 100,
      normalMax: 149,
      abnormalText: '<50 or >149',
      normalText: '100-149',
      optimalText: '50-100'
    },
    glucose: {
      optimalMin: 65,
      optimalMax: 86,
      normalMin: 86,
      normalMax: 99,
      abnormalText: '<65 or >99',
      normalText: '86-99',
      optimalText: '65-86'
    },
    hba1c: {
      optimalMin: 3,
      optimalMax: 5.1,
      normalMin: 5.1,
      normalMax: 5.7,
      abnormalText: '<3 or >5.7',
      normalText: '5.1-5.7',
      optimalText: '3.0-5.1'
    },
    vitaminD: {
      optimalMin: 50,
      optimalMax: 80,
      normalMin: 30,
      normalMax: 50,
      abnormalText: '<30 or >80',
      normalText: '30-50',
      optimalText: '50-80'
    }
  };

  if (referenceRanges[key]) return referenceRanges[key];

  // Fallback: use provided referenceRange if available
  const min = fallbackRange?.min ?? 0;
  const max = fallbackRange?.max ?? 100;
  return {
    optimalMin: min,
    optimalMax: max,
    abnormalText: `<${min} or >${max}`,
    optimalText: `${min}-${max}`
  };
};

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
    if (!referenceRanges) return '#3B82F6';
    
    if (value >= referenceRanges.optimalMin && value <= referenceRanges.optimalMax) {
      return '#10B981'; // Green for optimal
    } else if (referenceRanges.normalMin && referenceRanges.normalMax && 
               value >= referenceRanges.normalMin && value <= referenceRanges.normalMax) {
      return '#F59E0B'; // Yellow for normal
    } else {
      return '#EF4444'; // Red for abnormal
    }
  };

  const getStatus = (value: number): string => {
    if (!referenceRanges) return 'Unknown';
    
    if (value >= referenceRanges.optimalMin && value <= referenceRanges.optimalMax) {
      return 'Optimal';
    } else if (referenceRanges.normalMin && referenceRanges.normalMax && 
               value >= referenceRanges.normalMin && value <= referenceRanges.normalMax) {
      return 'Normal';
    } else {
      return 'Abnormal';
    }
  };

  // Line color that matches dashboard styling
  const lineColor = isDarkMode ? "#818cf8" : "#4f46e5";
  const bgColor = isDarkMode ? "#1f2937" : "#ffffff";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{markerName}</h2>
            {currentValue && (
              <div className="flex items-center gap-3 mt-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {currentValue.value} {unit}
                </span>
                <span 
                  className={`px-3 py-1 rounded-full text-sm font-medium text-white`}
                  style={{ backgroundColor: getStatusColor(currentValue.value) }}
                >
                  {getStatus(currentValue.value)}
                </span>
              </div>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Last tested: {currentValue ? new Date(currentValue.date).toLocaleDateString() : 'No data'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ml-4 p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Reference Ranges - Clean design above chart */}
        {referenceRanges && (
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-center gap-8">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">Abnormal:</span>
                <span className="text-gray-900 dark:text-white font-medium">{referenceRanges.abnormalText}</span>
              </div>
              
              {referenceRanges.normalText && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">Normal:</span>
                  <span className="text-gray-900 dark:text-white font-medium">{referenceRanges.normalText}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">Optimal:</span>
                <span className="text-gray-900 dark:text-white font-medium">{referenceRanges.optimalText}</span>
              </div>
            </div>
          </div>
        )}

        {/* Chart - Matching dashboard style exactly */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Historical Trend
          </h3>
          
          {chartData.length > 0 ? (
            <div className="h-[340px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={chartData} 
                  margin={{ top: 30, right: 50, left: 50, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      {chartData.map((point, index) => {
                        const getStatusColorForGradient = (value: number): string => {
                          if (!referenceRanges) return lineColor;
                          
                          if (value >= referenceRanges.optimalMin && value <= referenceRanges.optimalMax) {
                            return '#10B981'; // Green for optimal
                          } else if (referenceRanges.normalMin && referenceRanges.normalMax && 
                                     value >= referenceRanges.normalMin && value <= referenceRanges.normalMax) {
                            return '#F59E0B'; // Yellow for normal
                          } else {
                            return '#EF4444'; // Red for abnormal
                          }
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
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                    tickFormatter={(value) => Math.round(value).toString()}
                  />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={getTickFormatter}
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={12}
                    interval="preserveStart"
                    minTickGap={40}
                    allowDuplicatedCategory={false}
                  />
                  
                  <Tooltip content={renderCustomTooltip} />
                  
                  <Line 
                    type="monotone"
                    dataKey="value" 
                    stroke="url(#lineGradient)"
                    activeDot={{ r: 6, stroke: lineColor, strokeWidth: 1, fill: bgColor }} 
                    dot={(props: any) => { 
                      const { cx, cy, index, payload } = props;
                      
                      // Get the color based on reference ranges
                      const getStatusColorForDot = (value: number): string => {
                        if (!referenceRanges) return lineColor;
                        
                        if (value >= referenceRanges.optimalMin && value <= referenceRanges.optimalMax) {
                          return '#10B981'; // Green for optimal
                        } else if (referenceRanges.normalMin && referenceRanges.normalMax && 
                                   value >= referenceRanges.normalMin && value <= referenceRanges.normalMax) {
                          return '#F59E0B'; // Yellow for normal
                        } else {
                          return '#EF4444'; // Red for abnormal
                        }
                      };
                      
                      const dotColor = getStatusColorForDot(payload.value);
                      
                      // Special styling for the last point (matching dashboard)
                      if (index === chartData.length - 1 && chartData.length > 0) { 
                        return (
                          <g>
                            <circle cx={cx} cy={cy} r={12} fill={dotColor} fillOpacity={0.15} stroke="none" />
                            <circle cx={cx} cy={cy} r={8} fill={dotColor} fillOpacity={0.3} stroke="none" />
                            <circle cx={cx} cy={cy} r={4} fill={dotColor} stroke={bgColor} strokeWidth={2} />
                          </g>
                        );
                      } else {
                        // Regular dots for all other points
                        return (
                          <circle 
                            cx={cx} 
                            cy={cy} 
                            r={6} 
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

              {/* Reference Range Bar */}
              {referenceRanges && (
                <div className="absolute right-2 top-8 bottom-5 w-1">
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
                            stops.push(<stop key="abnormal-bottom-1" offset="0%" stopColor="#EF4444" />);
                            stops.push(<stop key="abnormal-bottom-2" offset={`${optimalMinPercent}%`} stopColor="#EF4444" />);
                          }
                          
                          // Normal range (if exists and below optimal)
                          if (referenceRanges.normalMin && normalMinPercent < optimalMinPercent) {
                            stops.push(<stop key="normal-bottom-1" offset={`${normalMinPercent}%`} stopColor="#F59E0B" />);
                            stops.push(<stop key="normal-bottom-2" offset={`${optimalMinPercent}%`} stopColor="#F59E0B" />);
                          }
                          
                          // Optimal range
                          stops.push(<stop key="optimal-1" offset={`${optimalMinPercent}%`} stopColor="#10B981" />);
                          stops.push(<stop key="optimal-2" offset={`${optimalMaxPercent}%`} stopColor="#10B981" />);
                          
                          // Normal range (if exists and above optimal)
                          if (referenceRanges.normalMax && normalMaxPercent > optimalMaxPercent) {
                            stops.push(<stop key="normal-top-1" offset={`${optimalMaxPercent}%`} stopColor="#F59E0B" />);
                            stops.push(<stop key="normal-top-2" offset={`${normalMaxPercent}%`} stopColor="#F59E0B" />);
                          }
                          
                          // Top abnormal
                          if (optimalMaxPercent < 100) {
                            const topStart = referenceRanges.normalMax && normalMaxPercent > optimalMaxPercent ? normalMaxPercent : optimalMaxPercent;
                            stops.push(<stop key="abnormal-top-1" offset={`${topStart}%`} stopColor="#EF4444" />);
                            stops.push(<stop key="abnormal-top-2" offset="100%" stopColor="#EF4444" />);
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
            <div className="flex items-center justify-center h-[340px] bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">No historical data available</p>
            </div>
          )}
        </div>

        {/* Recent History Table */}
        {chartData.length > 0 && (
          <div className="p-6 pt-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent History
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 text-gray-600 dark:text-gray-400">Date</th>
                    <th className="text-left py-2 text-gray-600 dark:text-gray-400">Value</th>
                    <th className="text-left py-2 text-gray-600 dark:text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.slice().reverse().slice(0, 5).map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-2 text-gray-900 dark:text-white">
                        {new Date(item.fullDate).toLocaleDateString()}
                      </td>
                      <td className="py-2 text-gray-900 dark:text-white font-medium">
                        {item.value} {unit}
                      </td>
                      <td className="py-2">
                        <span 
                          className="px-2 py-1 rounded-full text-xs font-medium text-white"
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