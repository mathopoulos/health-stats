'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useTheme } from '@providers/ThemeProvider';
import { TrendIndicator } from '@components/TrendIndicator';
import BloodMarkerChart from '@features/blood-markers/components/BloodMarkerChart';

import {
  calculateTrend,
  calculateBloodMarkerTrend,
  getAdaptiveYAxisDomain
} from '../utils/experimentCalculations';
import {
  getMetricDisplayName,
  getMetricUnit,
  getMetricColors,
  getBloodMarkerColors,
  renderCustomTooltip,
  formatDate
} from '../utils/experimentDisplay';

interface FitnessDataPoint {
  date: string;
  value: number;
}

interface BloodMarkerDataPoint {
  value: number;
  unit: string;
  date: string;
  referenceRange?: { min: number; max: number };
}

interface ExperimentFitnessData {
  [metricType: string]: FitnessDataPoint[];
}

interface ExperimentBloodMarkerData {
  [markerName: string]: BloodMarkerDataPoint[];
}

interface Experiment {
  id: string;
  name: string;
  description: string;
  frequency: string;
  duration: string;
  fitnessMarkers: string[];
  bloodMarkers: string[];
  startDate: string;
  endDate: string;
  status: 'active' | 'paused' | 'completed';
  progress?: number;
  createdAt: string;
  updatedAt: string;
}

interface ExperimentDetailsModalProps {
  experiment: Experiment | null;
  experimentFitnessData: ExperimentFitnessData;
  experimentBloodMarkerData: ExperimentBloodMarkerData;
  isLoadingFitnessData: boolean;
  isLoadingBloodMarkerData: boolean;
  onClose: () => void;
}

export default function ExperimentDetailsModal({
  experiment,
  experimentFitnessData,
  experimentBloodMarkerData,
  isLoadingFitnessData,
  isLoadingBloodMarkerData,
  onClose
}: ExperimentDetailsModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [chartWidth, setChartWidth] = useState(800);
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  // Ensure portal is only used on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update chart width on window resize
  useEffect(() => {
    const updateChartWidth = () => {
      if (typeof window !== 'undefined') {
        // Much more conservative sizing for mobile to prevent horizontal scroll
        const isMobile = window.innerWidth < 640;
        const modalPadding = 32; // Account for modal padding (p-4 = 16px each side)
        const chartMargins = 40; // Account for chart margins
        const availableWidth = window.innerWidth - modalPadding - chartMargins;
        
        let newWidth;
        if (isMobile) {
          // On mobile, be very conservative - use 70% of available width, max 400px
          newWidth = Math.max(280, Math.min(400, availableWidth * 0.7));
        } else {
          // On desktop, can be more generous
          newWidth = Math.max(400, Math.min(800, availableWidth * 0.9));
        }
        
        setChartWidth(newWidth);
        console.log('Chart sizing:', { isMobile, windowWidth: window.innerWidth, availableWidth, newWidth });
      }
    };

    // Set initial width
    updateChartWidth();

    // Add resize listener
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateChartWidth);
      return () => window.removeEventListener('resize', updateChartWidth);
    }
  }, []);

  if (!isMounted || !experiment) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-[100] p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-[90vw] max-w-4xl min-h-0 max-h-[calc(100vh-2rem)] overflow-y-auto my-4">
      {/* Header */}
      <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            {experiment.name}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {experiment.description}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress and Overview */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                Active
              </span>
            </div>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Frequency</span>
            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
              {experiment.frequency}
            </p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration</span>
            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
              {experiment.duration}
            </p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Timeline</span>
            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
              {new Date(experiment.startDate).toLocaleDateString()} - {new Date(experiment.endDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Tracked Metrics */}
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Tracked Metrics
        </h3>
        
        {(isLoadingFitnessData || isLoadingBloodMarkerData) ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading metrics data...</span>
          </div>
        ) : (experiment.fitnessMarkers?.length > 0 || experiment.bloodMarkers?.length > 0) ? (
          <div className="space-y-8">
            {/* Fitness Metrics */}
            {experiment.fitnessMarkers?.map((metricType) => {
              // Use the original display name for key lookup since data is stored with display names
              const metricData = experimentFitnessData[metricType] || [];
              const hasData = metricData.length > 0;
              
              return (
                <div key={metricType} className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {getMetricDisplayName(metricType)}
                      </h4>
                      {hasData && (() => {
                        const trend = calculateTrend(metricData, metricType, experiment);
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
                        data={metricData.map(point => ({ ...point, unit: getMetricUnit(metricType) }))}
                        margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                        >
                          <CartesianGrid 
                            stroke={isDarkMode ? "rgba(75, 85, 99, 0.3)" : "rgba(156, 163, 175, 0.35)"}
                            strokeWidth={0.75}
                            strokeDasharray="0" 
                            vertical={false}
                          />
                          <YAxis 
                            domain={getAdaptiveYAxisDomain(metricData, metricType)}
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
                            content={renderCustomTooltip}
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
                              if (index === metricData.length - 1 && metricData.length > 0) { 
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
                    <div className="h-[200px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                      No {getMetricDisplayName(metricType).toLowerCase()} data available for this experiment period
                    </div>
                  )}
                </div>
              );
            })}

            {/* Blood Markers */}
            {experiment.bloodMarkers?.map((markerName) => {
              const markerData = experimentBloodMarkerData[markerName] || [];
              const hasData = markerData.length > 0;
              const trend = hasData ? calculateBloodMarkerTrend(markerData, experiment) : null;
              
              return (
                <div key={markerName} className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {markerName}
                      </h4>
                      {trend && (
                        <TrendIndicator
                          current={trend.current}
                          previous={trend.previous}
                          min={trend.min}
                          max={trend.max}
                          showTimeRange={false}
                          customColors={getBloodMarkerColors()}
                          className="ml-2"
                        />
                      )}
                    </div>
                    {isLoadingBloodMarkerData && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    )}
                  </div>
                  
                  {markerData.length > 0 ? (
                    <div className="h-64 w-full min-w-0">
                      <BloodMarkerChart 
                        data={markerData}
                        markerName={markerName}
                        height="h-full"
                        showReferenceBar={true}
                      />
                    </div>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                      No {markerName.toLowerCase()} data available for this experiment period
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Metrics Selected
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              This experiment is not tracking any fitness metrics or blood markers.
            </p>
          </div>
        )}
      </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
