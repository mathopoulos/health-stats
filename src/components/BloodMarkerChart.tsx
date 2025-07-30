'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getReferenceRanges, getBloodMarkerStatus, BLOOD_MARKER_STATUS_COLORS, type ReferenceRanges } from '@/lib/bloodMarkerRanges';

interface BloodMarkerDataPoint {
  value: number;
  unit: string;
  date: string;
  referenceRange?: { min: number; max: number };
}

interface BloodMarkerChartProps {
  data: BloodMarkerDataPoint[];
  markerName: string;
  height?: string;
  showReferenceBar?: boolean;
  className?: string;
}

// Helper function to calculate adaptive Y-axis domain
const getAdaptiveYAxisDomain = (data: any[], refRanges?: ReferenceRanges): [number, number] => {
  if (!data || data.length === 0) {
    return [0, 100]; // Default domain if no data at all
  }
  
  const values = data.map(item => item.value);
  // Always include reference range bounds so the entire normal/optimal range is visible on the axis
  if (refRanges) {
    values.push(refRanges.optimalMin, refRanges.optimalMax);
    if (refRanges.normalMin !== undefined && refRanges.normalMax !== undefined) {
      values.push(refRanges.normalMin, refRanges.normalMax);
    }
  }
  
  // Handle case where we only have reference ranges (no actual data)
  if (values.length === 0) {
    return [0, 100];
  }
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  
  // For single data point or very small range, ensure we have some padding
  if (data.length === 1 || range < 5) {
    const padding = Math.max(10, Math.abs(max * 0.2)); // 20% padding or minimum 10 units
    const lowerBound = Math.max(0, min - padding);
    return [lowerBound, max + padding];
  }
  
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

// Custom tooltip
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

// Tick formatter
const getTickFormatter = (date: string) => {
  const d = new Date(date);
  return d.toLocaleString('default', { month: 'short', day: 'numeric' });
};

// Use centralized color constants
const STATUS_COLORS = BLOOD_MARKER_STATUS_COLORS;

export default function BloodMarkerChart({ 
  data, 
  markerName, 
  height = "h-[280px] sm:h-[340px]",
  showReferenceBar = true,
  className = "" 
}: BloodMarkerChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${height} ${className}`}>
        <p className="text-sm text-gray-500 dark:text-gray-400">No historical data available</p>
      </div>
    );
  }

  // Sort data by date and format for chart
  const chartData = [...data]
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

  const referenceRanges = getReferenceRanges(markerName, data[0]?.referenceRange);

  // Get dark mode state from document
  const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const bgColor = isDarkMode ? "#1f2937" : "#ffffff";

  return (
    <div className={`${height} relative ${className}`}>
      <ResponsiveContainer width="100%" height="100%" style={{ backgroundColor: 'transparent' }}>
        <LineChart 
          data={chartData} 
          margin={{ 
            top: 20, 
            right: showReferenceBar ? 15 : 30, 
            left: 10, 
            bottom: 15,
            ...(typeof window !== 'undefined' && window.innerWidth >= 640 && {
              top: 30,
              right: showReferenceBar ? 50 : 30,
              left: 10,
              bottom: 20
            })
          }}
        >
          <defs>
            <linearGradient id={`lineGradient-${markerName.replace(/\s+/g, '')}`} x1="0%" y1="0%" x2="100%" y2="0%">
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
            domain={getAdaptiveYAxisDomain(chartData, referenceRanges)}
            hide={true}
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
            stroke={`url(#lineGradient-${markerName.replace(/\s+/g, '')})`}
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

      {/* Reference Range Bar */}
      {showReferenceBar && referenceRanges && (
        <div className="hidden sm:block absolute right-2 top-[20px] bottom-[15px] sm:top-[30px] sm:bottom-[20px] w-1">
          <svg width="4" height="100%" className="overflow-visible">
            <defs>
              <linearGradient id={`rangeGradient-${markerName.replace(/\s+/g, '')}`} x1="0%" y1="100%" x2="0%" y2="0%">
                {/* Calculate percentages for each range */}
                {(() => {
                  const yAxisDomain = getAdaptiveYAxisDomain(chartData, referenceRanges);
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
                  
                  // Build ordered stops for sharp color boundaries
                  // The key is to have two stops at boundary points with different colors
                  
                  // Always start with abnormal at 0%
                  stops.push(<stop key="start" offset="0%" stopColor={STATUS_COLORS.abnormal} />);
                  
                  // Normal range boundaries (if normal exists)
                  if (referenceRanges.normalMin !== undefined && referenceRanges.normalMax !== undefined) {
                    // Hard transition to normal at normalMinPercent
                    stops.push(<stop key="pre-normal" offset={`${normalMinPercent}%`} stopColor={STATUS_COLORS.abnormal} />);
                    stops.push(<stop key="normal-start" offset={`${normalMinPercent}%`} stopColor={STATUS_COLORS.normal} />);
                    stops.push(<stop key="normal-end" offset={`${normalMaxPercent}%`} stopColor={STATUS_COLORS.normal} />);
                  }
                  
                  // Optimal range boundaries
                  // Hard transition to optimal at optimalMinPercent
                  stops.push(<stop key="pre-optimal" offset={`${optimalMinPercent}%`} stopColor={referenceRanges.normalMax !== undefined ? STATUS_COLORS.normal : STATUS_COLORS.abnormal} />);
                  stops.push(<stop key="optimal-start" offset={`${optimalMinPercent}%`} stopColor={STATUS_COLORS.optimal} />);
                  stops.push(<stop key="optimal-end" offset={`${optimalMaxPercent}%`} stopColor={STATUS_COLORS.optimal} />);
                  
                  // Hard transition back to abnormal after optimal
                  stops.push(<stop key="post-optimal" offset={`${optimalMaxPercent}%`} stopColor={STATUS_COLORS.abnormal} />);
                  stops.push(<stop key="end" offset="100%" stopColor={STATUS_COLORS.abnormal} />);
                  
                  return stops;
                })()}
              </linearGradient>
            </defs>
            <rect 
              x="0" 
              y="0" 
              width="4" 
              height="100%" 
              fill={`url(#rangeGradient-${markerName.replace(/\s+/g, '')})`}
              rx="2"
            />
          </svg>
        </div>
      )}
    </div>
  );
}