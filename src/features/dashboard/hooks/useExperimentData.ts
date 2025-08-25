import { useState, useEffect, useCallback } from 'react';
import { calculateProgress } from '../utils/experimentCalculations';
import { getApiParameterName } from '../utils/experimentDisplay';

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

export function useExperiments(userId?: string) {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const activeExperiments = experiments.filter(exp => exp.status === 'active');
  const pastExperiments = experiments.filter(exp => exp.status === 'completed');

  return {
    experiments,
    activeExperiments,
    pastExperiments,
    isLoading,
    error
  };
}

export function useExperimentFitnessData(userId?: string) {
  const [experimentFitnessData, setExperimentFitnessData] = useState<ExperimentFitnessData>({});
  const [isLoadingFitnessData, setIsLoadingFitnessData] = useState(false);

  const fetchExperimentFitnessData = useCallback(async (experiment: Experiment) => {
    if (!userId || !experiment.fitnessMarkers?.length) return;

    setIsLoadingFitnessData(true);
    try {
      const startDate = new Date(experiment.startDate);
      // Fix: Create endDate once to prevent constant recreation causing re-renders
      const currentTime = new Date();
      const endDate = experiment.status === 'active' ? currentTime : new Date(experiment.endDate);
      
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
  }, [userId]);

  return {
    experimentFitnessData,
    isLoadingFitnessData,
    fetchExperimentFitnessData
  };
}

export function useExperimentBloodMarkerData(userId?: string) {
  const [experimentBloodMarkerData, setExperimentBloodMarkerData] = useState<ExperimentBloodMarkerData>({});
  const [isLoadingBloodMarkerData, setIsLoadingBloodMarkerData] = useState(false);

  const fetchExperimentBloodMarkerData = useCallback(async (experiment: Experiment) => {
    if (!userId || !experiment.bloodMarkers?.length) return;

    setIsLoadingBloodMarkerData(true);
    try {
      const startDate = new Date(experiment.startDate);
      // Fix: Create endDate once to prevent constant recreation causing re-renders
      const currentTime = new Date();
      const endDate = experiment.status === 'active' ? currentTime : new Date(experiment.endDate);
      
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
  }, [userId]);

  return {
    experimentBloodMarkerData,
    isLoadingBloodMarkerData,
    fetchExperimentBloodMarkerData
  };
}
