import { useState, useEffect, useCallback } from 'react';
import type { ChartData, HealthData, BloodMarker, BloodMarkersCollection } from '@/types/dashboard';
import { createEmptyBloodMarkers, processBloodMarkersData } from '@/lib/blood-marker-processing';

// Types for the hook
interface HomeDataResponse {
  heartRate: HealthData[];
  weight: HealthData[];
  bodyFat: HealthData[];
  hrv: HealthData[];
  vo2max: HealthData[];
  bloodMarkers: ChartData['bloodMarkers'];
  loading: boolean;
  _sleep?: any;
  _workout?: any;
}

interface UseDashboardDataReturn {
  data: ChartData;
  loading: boolean;
  error: string | null;
  refetchData: () => Promise<void>;
  updateBloodMarkers: (bloodMarkers: ChartData['bloodMarkers']) => void;
}

// Blood marker processing is now handled by shared utilities

// Extracted data fetching functions
async function fetchHomeData(userId: string): Promise<HomeDataResponse> {
  try {
    const timestamp = Date.now();
    const [heartRateRes, weightRes, bodyFatRes, hrvRes, vo2maxRes, bloodMarkersRes, sleepRes, workoutRes] = await Promise.all([
      fetch(`/api/health-data?type=heartRate&userId=${userId}&t=${timestamp}`),
      fetch(`/api/health-data?type=weight&userId=${userId}&t=${timestamp}`),
      fetch(`/api/health-data?type=bodyFat&userId=${userId}&t=${timestamp}`),
      fetch(`/api/health-data?type=hrv&userId=${userId}&t=${timestamp}`),
      fetch(`/api/health-data?type=vo2max&userId=${userId}&t=${timestamp}`),
      fetch(`/api/health-data?type=bloodMarkers&userId=${userId}&t=${timestamp}`),
      fetch(`/api/health-data?type=sleep&userId=${userId}&t=${timestamp}`),
      fetch(`/api/health-data?type=workout&userId=${userId}&t=${timestamp}`),
    ]);

    const responses = await Promise.all([
      heartRateRes.json(),
      weightRes.json(),
      bodyFatRes.json(),
      hrvRes.json(),
      vo2maxRes.json(),
      bloodMarkersRes.json(),
      sleepRes.json(),
      workoutRes.json(),
    ]);

    const [heartRateData, weightData, bodyFatData, hrvData, vo2maxData, bloodMarkersData, sleepData, workoutData] = responses;

    // Process blood markers data using shared utility
    const processedBloodMarkers = processBloodMarkersData(bloodMarkersData);

    return {
      heartRate: heartRateData.data || [],
      weight: weightData.data || [],
      bodyFat: bodyFatData.data || [],
      hrv: hrvData.data || [],
      vo2max: vo2maxData.data || [],
      bloodMarkers: processedBloodMarkers,
      loading: false,
      _sleep: sleepData,
      _workout: workoutData,
    };
  } catch (err) {
    console.error('Error fetching home data', err);
    return {
      heartRate: [],
      weight: [],
      bodyFat: [],
      hrv: [],
      vo2max: [],
      bloodMarkers: createEmptyBloodMarkers(),
      loading: false,
    };
  }
}

async function fetchBloodMarkersData(userId: string): Promise<ChartData['bloodMarkers']> {
  try {
    const timestamp = Date.now();
    const response = await fetch(`/api/health-data?type=bloodMarkers&userId=${userId}&t=${timestamp}`);
    const bloodMarkersData = await response.json();

    return processBloodMarkersData(bloodMarkersData);
  } catch (err) {
    console.error('Error fetching blood markers', err);
    return createEmptyBloodMarkers();
  }
}

export function useDashboardData(userId: string | undefined): UseDashboardDataReturn {
  const [data, setData] = useState<ChartData>({
    heartRate: [],
    weight: [],
    bodyFat: [],
    hrv: [],
    vo2max: [],
    bloodMarkers: createEmptyBloodMarkers(),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch home data (includes blood markers)
      const homeData = await fetchHomeData(userId);
      
      setData(prevData => ({
        ...prevData,
        ...homeData,
      }));

    } catch (err) {
      console.error('Error in dashboard data fetch:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updateBloodMarkers = useCallback((bloodMarkers: ChartData['bloodMarkers']) => {
    setData(prevData => ({
      ...prevData,
      bloodMarkers,
    }));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetchData: fetchData,
    updateBloodMarkers,
  };
}
