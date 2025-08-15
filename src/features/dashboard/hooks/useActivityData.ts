import { useState, useEffect, useCallback } from 'react';
import type { ActivityFeedItem } from '@/types/dashboard';

interface UseActivityDataReturn {
  activityFeed: ActivityFeedItem[];
  sleepData: any;
  workoutData: any;
  loading: boolean;
  error: string | null;
  refetchActivity: () => Promise<void>;
}

async function fetchActivityData(userId: string) {
  try {
    const timestamp = Date.now();
    const [sleepRes, workoutRes] = await Promise.all([
      fetch(`/api/health-data?type=sleep&userId=${userId}&t=${timestamp}`),
      fetch(`/api/health-data?type=workout&userId=${userId}&t=${timestamp}`)
    ]);
    
    return Promise.all([sleepRes.json(), workoutRes.json()]);
  } catch (err) {
    console.error('Error fetching activity data:', err);
    return [{ data: [] }, { data: [] }];
  }
}

export function useActivityData(userId: string | undefined): UseActivityDataReturn {
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [sleepData, setSleepData] = useState<any>(null);
  const [workoutData, setWorkoutData] = useState<any>(null);
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

      const [sleepResponse, workoutResponse] = await fetchActivityData(userId);
      
      setSleepData(sleepResponse);
      setWorkoutData(workoutResponse);

      // Process activity feed data using the original buildActivityFeed logic
      const activities: ActivityFeedItem[] = [];
      
      // Helper functions from original
      const fmtDur = (m: number) => `${Math.floor(m/60)}h ${Math.round(m%60)}m`;
      
      // Add sleep activities
      if (sleepResponse?.success && Array.isArray(sleepResponse.data)) {
        sleepResponse.data.forEach((entry: any) => {
          const stageDurations = entry.data?.stageDurations || {deep: 0, core: 0, rem: 0, awake: 0};
          const tot = stageDurations.deep + stageDurations.core + stageDurations.rem + stageDurations.awake;
          const pct = (d: number) => tot ? Math.round(d/tot*100) : 0;
          
          activities.push({
            id: entry.timestamp || entry._id || crypto.randomUUID(),
            type: 'sleep',
            startTime: entry.data.startDate,
            endTime: entry.data.endDate,
            title: fmtDur(stageDurations.deep + stageDurations.core + stageDurations.rem),
            subtitle: 'Time asleep',
            metrics: {
              'Deep sleep': fmtDur(stageDurations.deep),
              'Core sleep': fmtDur(stageDurations.core), 
              'REM sleep': fmtDur(stageDurations.rem),
              'Awake': fmtDur(stageDurations.awake)
            },
            sleepStages: {
              deep: {percentage: pct(stageDurations.deep), duration: fmtDur(stageDurations.deep)},
              core: {percentage: pct(stageDurations.core), duration: fmtDur(stageDurations.core)},
              rem: {percentage: pct(stageDurations.rem), duration: fmtDur(stageDurations.rem)},
              awake: {percentage: pct(stageDurations.awake), duration: fmtDur(stageDurations.awake)}
            }
          });
        });
      }

      // Add workout activities
      if (workoutResponse?.success && Array.isArray(workoutResponse.data)) {
        workoutResponse.data.forEach((entry: any) => {
          const durSec = entry.data.metrics?.duration || 0;
          const min = Math.floor(durSec/60); 
          const hrs = Math.floor(min/60); 
          const mins = min%60;
          const durStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
          const dist = entry.data.metrics?.distance ? `${(entry.data.metrics.distance*0.621371).toFixed(1)} mi` : undefined;
          const cal = entry.data.metrics?.energyBurned ? `${Math.round(entry.data.metrics.energyBurned)} cal` : undefined;
          const hr = entry.data.metrics?.avgHeartRate ? `${Math.round(entry.data.metrics.avgHeartRate)} bpm` : undefined;
          
          const metrics: Record<string,string> = {};
          if(durStr) metrics.Duration = durStr;
          if(dist) metrics.Distance = dist;
          if(cal) metrics.Calories = cal;
          if(hr) metrics['Avg Heart Rate'] = hr;
          
          const actName = entry.data.activityType.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
          
          activities.push({
            id: entry.timestamp || entry._id || crypto.randomUUID(),
            type: 'workout',
            startTime: entry.data.startDate,
            endTime: entry.data.endDate,
            title: actName,
            subtitle: durStr,
            metrics,
            activityType: entry.data.activityType
          });
        });
      }

      // Sort by start time (most recent first)
      activities.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

      setActivityFeed(activities);

    } catch (err) {
      console.error('Error processing activity data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load activity data');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    activityFeed,
    sleepData,
    workoutData,
    loading,
    error,
    refetchActivity: fetchData,
  };
}
