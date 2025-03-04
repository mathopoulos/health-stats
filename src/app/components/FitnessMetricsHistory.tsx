'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import ConfirmDialog from './ui/ConfirmDialog';
import { formatDistanceToNow } from 'date-fns';

// Types for fitness metrics
type HealthDataType = 'heartRate' | 'weight' | 'bodyFat' | 'hrv' | 'vo2max';

interface MetricData {
  type: HealthDataType;
  displayName: string;
  lastUpdated: string | null;
  count: number;
  unit: string;
}

// Function to get human-readable display name for a metric type
function getMetricDisplayName(type: HealthDataType): string {
  const displayNames: Record<HealthDataType, string> = {
    heartRate: 'Heart Rate',
    weight: 'Weight',
    bodyFat: 'Body Fat',
    hrv: 'Heart Rate Variability',
    vo2max: 'VO2 Max'
  };
  return displayNames[type];
}

// Function to get the appropriate unit for a metric type
function getMetricUnit(type: HealthDataType): string {
  const units: Record<HealthDataType, string> = {
    heartRate: 'bpm',
    weight: 'kg',
    bodyFat: '%',
    hrv: 'ms',
    vo2max: 'ml/kg/min'
  };
  return units[type];
}

export default function FitnessMetricsHistory() {
  const { data: session } = useSession();
  const [metricsData, setMetricsData] = useState<MetricData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  
  // Confirmation dialog states
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmDialogProps, setConfirmDialogProps] = useState({
    title: '',
    message: '',
    confirmLabel: 'Delete',
    confirmVariant: 'danger' as 'danger' | 'primary',
    onConfirm: () => {},
  });

  // List of all possible fitness metric types
  const metricTypes: HealthDataType[] = ['weight', 'bodyFat', 'hrv', 'vo2max'];

  // Function to fetch data for all fitness metrics
  const fetchAllMetricsData = useCallback(async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    
    try {
      const metricDataPromises = metricTypes.map(async (type) => {
        try {
          // Check if this metric type was recently deleted
          const deletionKey = Object.keys(localStorage)
            .find(key => key.startsWith(`deleted_${type}_`) && 
                  parseInt(key.split('_')[2]) > Date.now() - 60000); // Within last minute
          
          // If recently deleted, return empty data
          if (deletionKey) {
            return {
              type,
              displayName: getMetricDisplayName(type),
              lastUpdated: null,
              count: 0,
              unit: getMetricUnit(type)
            };
          }
          
          const response = await fetch(`/api/health-data?type=${type}&userId=${session.user.id}`, {
            headers: {
              // Add cache control headers to prevent caching
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch ${type} data`);
          }
          
          const data = await response.json();
          
          // Get the most recent date if data exists
          let lastUpdated = null;
          if (data.data && data.data.length > 0) {
            // Find the most recent date by comparing all entries
            const dates = data.data.map((item: any) => new Date(item.date));
            const mostRecentDate = new Date(Math.max(...dates.map(Number)));
            lastUpdated = mostRecentDate.toISOString();
          }
          
          return {
            type,
            displayName: getMetricDisplayName(type),
            lastUpdated,
            count: data.count || 0,
            unit: getMetricUnit(type)
          };
        } catch (error) {
          // Silently handle fetch errors without logging
          return {
            type,
            displayName: getMetricDisplayName(type),
            lastUpdated: null,
            count: 0,
            unit: getMetricUnit(type)
          };
        }
      });
      
      const allMetricsData = await Promise.all(metricDataPromises);
      setMetricsData(allMetricsData);
      setError(null);
    } catch (error) {
      // Only log critical errors
      setError('Failed to fetch fitness metrics data');
      toast.error('Failed to fetch fitness metrics data');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, metricTypes]);

  // Fetch data when component mounts or refresh is triggered
  useEffect(() => {
    // Only fetch if we have a user ID and haven't already loaded data (unless refreshing)
    if (session?.user?.id && (metricsData.length === 0 || lastRefresh > 0)) {
      fetchAllMetricsData();
    }
    // This should only run when session changes or when lastRefresh is explicitly set
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, lastRefresh]);

  // Listen for fitness data change events
  useEffect(() => {
    const handleHealthDataChanged = (event: Event) => {
      // Only refresh data if we already have a session
      if (session?.user?.id) {
        // If this is our own "deleted" event, don't trigger a refresh
        const customEvent = event as CustomEvent;
        if (customEvent.type === 'healthDataDeleted') {
          return; // Skip refresh for deletion events
        }
        
        // For other health data changes, refresh the data
        setLastRefresh(prevRefresh => prevRefresh + 1);
      }
    };

    // Listen for our customized event
    window.addEventListener('healthDataDeleted', handleHealthDataChanged);
    // Still listen for generic events from other components
    window.addEventListener('healthDataChanged', handleHealthDataChanged);
    
    return () => {
      window.removeEventListener('healthDataDeleted', handleHealthDataChanged);
      window.removeEventListener('healthDataChanged', handleHealthDataChanged);
    };
  }, [session?.user?.id]); // Only recreate this effect when session changes

  // Function to handle deletion of a specific metric type
  const handleDeleteMetric = async (metricType: HealthDataType) => {
    if (!session?.user?.id) {
      toast.error('You must be logged in to delete data');
      return;
    }

    setConfirmDialogProps({
      title: `Delete ${getMetricDisplayName(metricType)} Data`,
      message: `Are you sure you want to delete all your ${getMetricDisplayName(metricType)} data? This action cannot be undone.`,
      confirmLabel: 'Delete',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          // First update UI optimistically to avoid flicker
          setMetricsData(prev => 
            prev.map(metric => 
              metric.type === metricType 
                ? { ...metric, count: 0, lastUpdated: null } 
                : metric
            )
          );

          // Then perform the actual deletion
          const response = await fetch(`/api/health-data/${metricType}?userId=${session.user.id}`, {
            method: 'DELETE',
            headers: {
              // Add cache control headers to prevent caching
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          if (!response.ok) {
            throw new Error(`Failed to delete ${metricType} data`);
          }
          
          const data = await response.json();
          if (data.success) {
            toast.success(`${getMetricDisplayName(metricType)} data deleted successfully`);
            
            // We already updated the UI, so we don't need to do it again
            
            // Dispatch event with stopPropagation to prevent other handlers from triggering
            const event = new CustomEvent('healthDataDeleted', { 
              detail: { type: metricType, action: 'deleted', timestamp: Date.now() },
              bubbles: false // Don't let this bubble up
            });
            window.dispatchEvent(event);
            
            // Set a flag to prevent subsequent refetches for this session
            localStorage.setItem(`deleted_${metricType}_${Date.now()}`, 'true');
          } else {
            // If the API call wasn't successful, revert our optimistic UI update
            await fetchAllMetricsData();
            throw new Error(data.error || `Failed to delete ${metricType} data`);
          }
        } catch (error) {
          // Only log critical errors
          toast.error(error instanceof Error ? error.message : `Failed to delete ${metricType} data`);
          // Revert optimistic update on error
          await fetchAllMetricsData();
        }
      },
    });
    setShowConfirmDialog(true);
  };

  // Format the date to a more readable format
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No data';
    
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  if (loading && metricsData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex justify-center items-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading fitness metrics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
        Fitness Metrics History
      </h3>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md mb-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      
      {metricsData.length === 0 ? (
        <div className="text-center p-8">
          <p className="text-gray-500 dark:text-gray-400">No fitness metrics data available</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Metric
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Latest Data
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Unit
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Data Points
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {metricsData.map((metric) => (
                <tr key={metric.type}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {metric.displayName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(metric.lastUpdated)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {metric.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {metric.count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <button
                      onClick={() => handleDeleteMetric(metric.type)}
                      disabled={metric.count === 0}
                      className={`text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 ${
                        metric.count === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title={confirmDialogProps.title}
        message={confirmDialogProps.message}
        confirmLabel={confirmDialogProps.confirmLabel}
        confirmVariant={confirmDialogProps.confirmVariant}
        onConfirm={() => {
          confirmDialogProps.onConfirm();
          setShowConfirmDialog(false);
        }}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </div>
  );
} 