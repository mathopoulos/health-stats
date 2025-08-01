'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { TrendIndicator } from '@/components/TrendIndicator';
import BloodMarkerChart from '@/components/BloodMarkerChart';

interface BiomarkerDataPoint {
  date: string;
  value: number;
  unit: string;
}

interface BiomarkerTrend {
  marker: string;
  data: BiomarkerDataPoint[];
  baseline: number;
  target?: number;
  improvement?: 'increase' | 'decrease'; // What direction is considered improvement
}

interface FitnessDataPoint {
  date: string;
  value: number;
}

interface ExperimentFitnessData {
  [metricType: string]: FitnessDataPoint[];
}

interface BloodMarkerDataPoint {
  value: number;
  unit: string;
  date: string;
  referenceRange?: { min: number; max: number };
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
  progress?: number; // calculated field
  biomarkerTrends?: BiomarkerTrend[];
  createdAt: string;
  updatedAt: string;
}

// Helper function to calculate progress percentage
function calculateProgress(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  
  if (now >= end) return 100;
  if (now <= start) return 0;
  
  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  
  return Math.round((elapsed / total) * 100);
}

interface ActiveExperimentsProps {
  userId?: string;
}

function getStatusColor(status: string) {
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

function getProgressColor(progress: number) {
  if (progress >= 75) return 'bg-green-500';
  if (progress >= 50) return 'bg-blue-500';
  if (progress >= 25) return 'bg-yellow-500';
  return 'bg-orange-500';
}

export default function ActiveExperiments({ userId }: ActiveExperimentsProps) {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [experimentFitnessData, setExperimentFitnessData] = useState<ExperimentFitnessData>({});
  const [experimentBloodMarkerData, setExperimentBloodMarkerData] = useState<ExperimentBloodMarkerData>({});
  const [isLoadingFitnessData, setIsLoadingFitnessData] = useState(false);
  const [isLoadingBloodMarkerData, setIsLoadingBloodMarkerData] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  // Ensure portal is only used on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Filter experiments by status
  const activeExperiments = experiments.filter(exp => exp.status === 'active');
  const pastExperiments = experiments.filter(exp => exp.status === 'completed');

  // Function to fetch experiment-specific fitness data
  const fetchExperimentFitnessData = async (experiment: Experiment) => {
    if (!userId || !experiment.fitnessMarkers?.length) return;

    setIsLoadingFitnessData(true);
    try {
      const startDate = new Date(experiment.startDate);
      const endDate = experiment.status === 'active' ? new Date() : new Date(experiment.endDate);
      
      // Fetch data for each fitness marker
      const dataPromises = experiment.fitnessMarkers.map(async (marker) => {
        try {
          // Convert display name to API parameter name
          const apiParamName = getApiParameterName(marker);
          const response = await fetch(`/api/health-data?type=${apiParamName}&userId=${userId}&t=${Date.now()}`, {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });

          if (!response.ok) return { marker, data: [] };

          const result = await response.json();
          if (!result.data || !Array.isArray(result.data)) return { marker, data: [] };

          // Filter data to experiment time period and format
          const filteredData = result.data
            .filter((item: any) => {
              const itemDate = new Date(item.date);
              return itemDate >= startDate && itemDate <= endDate;
            })
            .map((item: any) => ({
              date: item.date,
              value: item.value
            }))
            .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

          // Deduplicate by date - take the average if multiple entries exist for the same day
          const deduplicatedData: { [key: string]: { date: string, values: number[] } } = {};
          
          filteredData.forEach((item: any) => {
            const dateKey = new Date(item.date).toDateString();
            if (!deduplicatedData[dateKey]) {
              deduplicatedData[dateKey] = { date: item.date, values: [] };
            }
            deduplicatedData[dateKey].values.push(item.value);
          });

          const finalData = Object.values(deduplicatedData)
            .map(({ date, values }) => ({
              date,
              value: values.reduce((sum, val) => sum + val, 0) / values.length // Average the values
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

          return { marker, data: finalData };
        } catch (error) {
          console.error(`Error fetching ${marker} data:`, error);
          return { marker, data: [] };
        }
      });

      const results = await Promise.all(dataPromises);
      const fitnessData: ExperimentFitnessData = {};
      
      results.forEach(({ marker, data }) => {
        fitnessData[marker] = data;
      });

      setExperimentFitnessData(fitnessData);
    } catch (error) {
      console.error('Error fetching experiment fitness data:', error);
    } finally {
      setIsLoadingFitnessData(false);
    }
  };

  // Function to fetch experiment-specific blood marker data
  const fetchExperimentBloodMarkerData = async (experiment: Experiment) => {
    if (!userId || !experiment.bloodMarkers?.length) return;

    setIsLoadingBloodMarkerData(true);
    try {
      const startDate = new Date(experiment.startDate);
      const endDate = experiment.status === 'active' ? new Date() : new Date(experiment.endDate);
      
      // Fetch all blood marker data for this user (we'll filter on client side for precise control)
      const response = await fetch(`/api/blood-markers?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch blood marker data');
      }
      
      const bloodMarkerEntries = await response.json();
      
      // Process the data to match our component interface
      const processedData: ExperimentBloodMarkerData = {};
      
      experiment.bloodMarkers.forEach(markerName => {
        processedData[markerName] = [];
      });
      
      // Process each blood marker entry and collect all data points
      const allMarkerData: { [markerName: string]: BloodMarkerDataPoint[] } = {};
      experiment.bloodMarkers.forEach(markerName => {
        allMarkerData[markerName] = [];
      });
      
      bloodMarkerEntries.data?.forEach((entry: any) => {
        entry.markers.forEach((marker: any) => {
          if (experiment.bloodMarkers.includes(marker.name)) {
            allMarkerData[marker.name].push({
              date: entry.date,
              value: marker.value,
              unit: marker.unit,
              referenceRange: marker.referenceRange
            });
          }
        });
      });
      
      // Sort and filter each marker's data according to experiment requirements
      Object.keys(allMarkerData).forEach(markerName => {
        const allData = allMarkerData[markerName].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const experimentData: BloodMarkerDataPoint[] = [];
        
        // 1. Find the last data point before the experiment start date
        let lastPreExperiment: BloodMarkerDataPoint | null = null;
        for (const dataPoint of allData) {
          const pointDate = new Date(dataPoint.date);
          if (pointDate < startDate) {
            lastPreExperiment = dataPoint;
          } else {
            break;
          }
        }
        
        // 2. Add the last pre-experiment point if it exists
        if (lastPreExperiment) {
          experimentData.push(lastPreExperiment);
        }
        
        // 3. Add all data points during the experiment period
        for (const dataPoint of allData) {
          const pointDate = new Date(dataPoint.date);
          if (pointDate >= startDate && pointDate <= endDate) {
            experimentData.push(dataPoint);
          }
        }
        
        // 4. Find the first data point after the experiment end date
        let firstPostExperiment: BloodMarkerDataPoint | null = null;
        for (const dataPoint of allData) {
          const pointDate = new Date(dataPoint.date);
          if (pointDate > endDate) {
            firstPostExperiment = dataPoint;
            break;
          }
        }
        
        // 5. Add the first post-experiment point if it exists
        if (firstPostExperiment) {
          experimentData.push(firstPostExperiment);
        }
        
        processedData[markerName] = experimentData;
      });
      
      setExperimentBloodMarkerData(processedData);
    } catch (error) {
      console.error('Error fetching experiment blood marker data:', error);
    } finally {
      setIsLoadingBloodMarkerData(false);
    }
  };

  // Helper function to get metric display name
  const getMetricDisplayName = (metricType: string): string => {
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
  };

  // Helper function to convert display names to API parameter names
  const getApiParameterName = (displayName: string): string => {
    const parameterMap: Record<string, string> = {
      'HRV': 'hrv',
      'VO2 Max': 'vo2max',
      'Weight': 'weight',
      'Body Fat %': 'bodyFat',
      'Heart Rate': 'heartRate'
    };
    return parameterMap[displayName] || displayName.toLowerCase();
  };

  // Helper function to get metric unit
  const getMetricUnit = (metricType: string): string => {
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
  };

  // Helper function to calculate trend indicator data (for fitness metrics)
  const calculateTrend = (data: FitnessDataPoint[], metricType: string, experiment: Experiment) => {
    if (!data || data.length < 4) return null; // Need at least 4 data points for meaningful comparison
    
    const halfLength = Math.floor(data.length / 2);
    
    // First half (earlier period)
    const firstHalf = data.slice(0, halfLength);
    const firstHalfAvg = firstHalf.reduce((sum, item) => sum + item.value, 0) / firstHalf.length;
    
    // Second half (later period) 
    const secondHalf = data.slice(halfLength);
    const secondHalfAvg = secondHalf.reduce((sum, item) => sum + item.value, 0) / secondHalf.length;
    
    if (firstHalfAvg === 0) return null;
    
    // Calculate experiment duration for time range label
    const startDate = new Date(experiment.startDate);
    const endDate = experiment.status === 'active' ? new Date() : new Date(experiment.endDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let timeRangeLabel = 'experiment period';
    if (diffDays >= 365) {
      timeRangeLabel = 'past year';
    } else if (diffDays >= 84) {
      timeRangeLabel = 'past few months';
    } else if (diffDays >= 28) {
      timeRangeLabel = 'past month';
    } else if (diffDays >= 14) {
      timeRangeLabel = 'past few weeks';
    } else {
      timeRangeLabel = 'past week';
    }
    
    return {
      current: secondHalfAvg,
      previous: firstHalfAvg,
      isBodyFat: metricType === 'Body Fat %' || metricType === 'bodyFat',
      timeRangeLabel
    };
  };

  // Helper function to calculate trend indicator data for blood markers
  const calculateBloodMarkerTrend = (data: BloodMarkerDataPoint[], experiment: Experiment) => {
    if (!data || data.length < 2) return null;
    const halfLength = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, halfLength);
    const secondHalf = data.slice(halfLength);
    const firstHalfAvg = firstHalf.reduce((sum, item) => sum + item.value, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, item) => sum + item.value, 0) / secondHalf.length;
    if (firstHalfAvg === 0) return null;
    // Determine reference range from any data point that has it
    const ref = data.find(dp => dp.referenceRange)?.referenceRange;
    const min = ref?.min ?? 0;
    const max = ref?.max ?? 100;
    return { current: secondHalfAvg, previous: firstHalfAvg, min, max };
  };

  // Helper function to get blood marker colors for trend indicators
  const getBloodMarkerColors = () => {
    return {
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-600 dark:text-orange-400',
      iconColor: 'text-orange-500'
    };
  };

  // Helper function to get metric-specific colors for trend indicators
  const getMetricColors = (metricType: string) => {
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
  };

  // Helper function to get adaptive Y-axis domain
  const getAdaptiveYAxisDomain = (data: FitnessDataPoint[], metricType: string): [number, number] => {
    if (!data || data.length === 0) return [0, 100];
    
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    
    // Add padding based on metric type
    let paddingPercent = 0.1; // 10% padding by default
    
    switch (metricType) {
      case 'weight':
      case 'Weight':
        paddingPercent = 0.05; // 5% padding for weight
        break;
      case 'bodyFat':
      case 'Body Fat %':
        paddingPercent = 0.15; // 15% padding for body fat
        break;
      case 'hrv':
      case 'HRV':
        paddingPercent = 0.2; // 20% padding for HRV
        break;
    }
    
    const padding = range * paddingPercent;
    return [Math.max(0, min - padding), max + padding];
  };

  // Helper function to format tooltip
  const renderCustomTooltip = ({ active, payload, label }: any) => {
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
  };

  // Helper function to format date for X-axis
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Fetch experiments from API
  useEffect(() => {
    const fetchExperiments = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const timestamp = Date.now();
        const response = await fetch(`/api/experiments?userId=${userId}&t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch experiments');
        }

        const data = await response.json();
        if (data.success && data.data) {
          // Process experiments and calculate progress
          const experimentsWithProgress = data.data.map((exp: any) => ({
            ...exp,
            progress: calculateProgress(exp.startDate, exp.endDate)
          }));
          setExperiments(experimentsWithProgress);
        }
      } catch (err) {
        console.error('Error fetching experiments:', err);
        setError(err instanceof Error ? err.message : 'Failed to load experiments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExperiments();
  }, [userId]);

  // Fetch fitness and blood marker data when an experiment is selected
  useEffect(() => {
    if (selectedExperiment) {
      if (selectedExperiment.fitnessMarkers?.length > 0) {
        fetchExperimentFitnessData(selectedExperiment);
      }
      if (selectedExperiment.bloodMarkers?.length > 0) {
        fetchExperimentBloodMarkerData(selectedExperiment);
      }
    }
  }, [selectedExperiment, userId]);

  const ExperimentDetailsModal = ({ experiment }: { experiment: Experiment }) => {
    if (!isMounted) return null;
    
    const modalContent = (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
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
            onClick={() => {
              setSelectedExperiment(null);
              setExperimentFitnessData({});
              setExperimentBloodMarkerData({});
            }}
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
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart 
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
                        </ResponsiveContainer>
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
                      <div className="h-64">
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
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl px-6 py-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Active Experiments
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Currently running health and fitness experiments
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading experiments...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl px-6 py-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Active Experiments
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Currently running health and fitness experiments
              </p>
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Active Experiments Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl px-3 sm:px-6 py-6 sm:py-8 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Active Experiments
          </h2>
          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {activeExperiments.length} active
          </span>
        </div>

        {/* Experiments List or Empty State */}
        {activeExperiments.length > 0 ? (
          <div className="space-y-3">
        {activeExperiments.map((experiment) => (
          <div
            key={experiment.id}
            className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600"
            onClick={() => setSelectedExperiment(experiment)}
          >
            {/* Mobile-first responsive layout */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              {/* Top/Left: Title & Details */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-2 sm:mb-1">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                    {experiment.name}
                  </h3>
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {experiment.frequency} • {experiment.duration}
                  </span>
                </div>
                
                {/* Key Markers */}
                <div className="flex flex-wrap gap-1">
                  {[...experiment.fitnessMarkers.slice(0, 2), ...experiment.bloodMarkers.slice(0, 2)].map((marker) => (
                    <span
                      key={marker}
                      className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      {marker}
                    </span>
                  ))}
                  {(experiment.fitnessMarkers.length + experiment.bloodMarkers.length) > 4 && (
                    <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                      +{(experiment.fitnessMarkers.length + experiment.bloodMarkers.length) - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom/Right: Progress - Mobile optimized */}
              <div className="flex items-center gap-3 justify-between sm:justify-end sm:ml-4">
                <div className="flex items-center gap-3 flex-1 sm:flex-initial">
                  <div className="text-left sm:text-right">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {experiment.progress}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Progress
                    </div>
                  </div>
                  <div className="w-20 sm:w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300 bg-purple-500"
                      style={{ width: `${experiment.progress}%` }}
                    />
                  </div>
                </div>
                
                {/* Click indicator */}
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-indigo-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <div className="text-gray-500 dark:text-gray-400 mb-2">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
              No active experiments
            </p>
          </div>
        )}
      </div>

      {/* Past Experiments Section */}
      {pastExperiments.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl px-3 sm:px-6 py-6 sm:py-8 shadow-sm">
          {/* Past Experiments Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              Past Experiments
            </h2>
            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {pastExperiments.length} completed
            </span>
          </div>

          {/* Past Experiments List */}
          <div className="space-y-3">
            {pastExperiments.map((experiment) => (
              <div
                key={experiment.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4"
              >
                {/* Mobile-first responsive layout */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                  {/* Top/Left: Title & Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-2 sm:mb-1">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                        {experiment.name}
                      </h3>
                      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {experiment.frequency} • {experiment.duration}
                      </span>
                    </div>
                    
                    {/* Key Markers */}
                    <div className="flex flex-wrap gap-1">
                      {[...experiment.fitnessMarkers.slice(0, 3), ...experiment.bloodMarkers.slice(0, 3)].map((marker) => (
                        <span
                          key={marker}
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                        >
                          {marker}
                        </span>
                      ))}
                      {(experiment.fitnessMarkers.length + experiment.bloodMarkers.length) > 6 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400">
                          +{(experiment.fitnessMarkers.length + experiment.bloodMarkers.length) - 6} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom/Right: Completed Badge */}
                  <div className="flex items-center justify-start sm:justify-end sm:ml-4">
                    <span className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs sm:text-sm font-medium">
                      ✓ Completed
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Render modal when experiment is selected */}
      {selectedExperiment && (
        <ExperimentDetailsModal experiment={selectedExperiment} />
      )}
    </div>
  );
} 