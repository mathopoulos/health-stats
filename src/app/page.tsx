'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface HealthData {
  date: string;
  value: number;
}

interface ChartData {
  heartRate: HealthData[];
  weight: HealthData[];
  bodyFat: HealthData[];
  lastUpdated: string | null;
  loading: boolean;
}

export default function Home() {
  const [data, setData] = useState<ChartData>({
    heartRate: [],
    weight: [],
    bodyFat: [],
    lastUpdated: null,
    loading: true
  });

  const fetchData = async (type: 'heartRate' | 'weight' | 'bodyFat') => {
    try {
      const response = await fetch(`/api/health-data?type=${type}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error(`Error fetching ${type} data:`, error);
      return [];
    }
  };

  const loadAllData = async () => {
    setData(prev => ({ ...prev, loading: true }));
    
    const [heartRate, weight, bodyFat] = await Promise.all([
      fetchData('heartRate'),
      fetchData('weight'),
      fetchData('bodyFat')
    ]);

    setData({
      heartRate,
      weight,
      bodyFat,
      lastUpdated: new Date().toLocaleString(),
      loading: false
    });
  };

  // Initial load
  useEffect(() => {
    loadAllData();

    // Set up polling for updates every 30 seconds
    const interval = setInterval(loadAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (data.loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
          Loading health data...
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Health Data Dashboard</h1>
          {data.lastUpdated && (
            <p className="text-sm text-gray-500">Last updated: {data.lastUpdated}</p>
          )}
          <button
            onClick={loadAllData}
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Refresh Data
          </button>
        </div>

        {data.heartRate.length > 0 && (
          <div className="mb-8 h-[400px]">
            <h2 className="text-xl font-bold mb-4">Heart Rate</h2>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.heartRate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <YAxis domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleString()}
                  formatter={(value: number) => [`${value} bpm`, 'Heart Rate']}
                />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#8884d8" name="Heart Rate (bpm)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {data.weight.length > 0 && (
          <div className="mb-8 h-[400px]">
            <h2 className="text-xl font-bold mb-4">Weight</h2>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.weight}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleString()}
                  formatter={(value: number) => [`${value.toFixed(1)} kg`, 'Weight']}
                />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#82ca9d" name="Weight (kg)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {data.bodyFat.length > 0 && (
          <div className="mb-8 h-[400px]">
            <h2 className="text-xl font-bold mb-4">Body Fat Percentage</h2>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.bodyFat}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleString()}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Body Fat']}
                />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#ffc658" name="Body Fat (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </main>
  );
}
