'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Image from 'next/image';

interface HealthData {
  date: string;
  value: number;
}

interface ChartData {
  heartRate: HealthData[];
  weight: HealthData[];
  bodyFat: HealthData[];
  loading: boolean;
}

async function triggerProcessing() {
  try {
    const response = await fetch('/api/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to process data');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error triggering processing:', error);
    throw error;
  }
}

export default function Home() {
  const [data, setData] = useState<ChartData>({
    heartRate: [],
    weight: [],
    bodyFat: [],
    loading: true
  });
  const [currentMonth, setCurrentMonth] = useState(new Date('2020-03-01'));
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');

  const fetchData = async () => {
    try {
      const [heartRateRes, weightRes, bodyFatRes] = await Promise.all([
        fetch('/api/health-data?type=heartRate'),
        fetch('/api/health-data?type=weight'),
        fetch('/api/health-data?type=bodyFat')
      ]);

      if (!heartRateRes.ok || !weightRes.ok || !bodyFatRes.ok) 
        throw new Error('Failed to fetch data');

      const [heartRateData, weightData, bodyFatData] = await Promise.all([
        heartRateRes.json(),
        weightRes.json(),
        bodyFatRes.json()
      ]);

      const allDates = [
        ...(heartRateData.data || []),
        ...(weightData.data || []),
        ...(bodyFatData.data || [])
      ].map(item => new Date(item.date));

      if (allDates.length > 0) {
        const start = new Date(Math.min(...allDates.map(d => d.getTime())));
        const end = new Date(Math.max(...allDates.map(d => d.getTime())));
        setDateRange({ start, end });
        
        if (currentMonth.getTime() === new Date('2020-03-01').getTime()) {
          setCurrentMonth(new Date(start.getFullYear(), start.getMonth(), 1));
        }
      }

      return {
        heartRate: heartRateData.data || [],
        weight: weightData.data || [],
        bodyFat: bodyFatData.data || []
      };
    } catch (error) {
      console.error('Error fetching health data:', error);
      return { heartRate: [], weight: [], bodyFat: [] };
    }
  };

  const loadData = async () => {
    setData(prev => ({ ...prev, loading: true }));
    try {
      const newData = await fetchData();
      setData({
        ...newData,
        loading: false
      });
    } catch (error) {
      console.error('Error loading data:', error);
      setData(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const getMonthData = (data: HealthData[]) => {
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const filteredData = data.filter(item => {
      const date = new Date(item.date);
      return date >= monthStart && date <= monthEnd;
    });

    const dailyData = filteredData.reduce((acc: { [key: string]: { sum: number; count: number } }, item) => {
      const date = new Date(item.date);
      const dayKey = date.toISOString().split('T')[0];
      
      if (!acc[dayKey]) {
        acc[dayKey] = { sum: 0, count: 0 };
      }
      
      acc[dayKey].sum += item.value;
      acc[dayKey].count += 1;
      
      return acc;
    }, {});

    const aggregatedData = Object.entries(dailyData).map(([date, { sum, count }]) => ({
      date: `${date}T12:00:00.000Z`,
      value: Math.round(sum / count)
    }));

    aggregatedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return aggregatedData;
  };

  const currentHeartRateData = getMonthData(data.heartRate);
  const currentWeightData = getMonthData(data.weight);
  const currentBodyFatData = getMonthData(data.bodyFat);
  
  const hasHeartRateData = currentHeartRateData.length > 0;
  const hasWeightData = currentWeightData.length > 0;
  const hasBodyFatData = currentBodyFatData.length > 0;

  const handleProcess = async () => {
    setIsProcessing(true);
    setProcessingStatus('Starting processing...');
    try {
      const result = await triggerProcessing();
      if (result.success) {
        const { recordsProcessed, batchesSaved, status } = result.status;
        setProcessingStatus(
          `Processing complete: ${recordsProcessed} records processed in ${batchesSaved} batches. Status: ${status}`
        );
        // Refresh the data
        await loadData();
      } else {
        setProcessingStatus(`Error: ${result.error}`);
      }
    } catch (error) {
      setProcessingStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <Image
              src="/images/profile.jpg"
              alt="Profile"
              width={80}
              height={80}
              className="rounded-full"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lex Mathopoulos</h1>
              <p className="text-gray-600">Health Dashboard</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end mb-4">
          <button
            onClick={handleProcess}
            disabled={isProcessing}
            className={`px-4 py-2 rounded-md text-white ${
              isProcessing ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isProcessing ? 'Processing...' : 'Process Data'}
          </button>
        </div>
        {processingStatus && (
          <div className="mb-4 text-sm text-gray-600">
            {processingStatus}
          </div>
        )}

        {/* Heart Rate Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Heart Rate</h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={goToPreviousMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                disabled={!!(dateRange.start && currentMonth <= dateRange.start)}
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm text-gray-600">
                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
              <button 
                onClick={goToNextMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                disabled={!!(dateRange.end && currentMonth >= dateRange.end)}
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          <div className="h-[300px]">
            {data.loading && (
              <div className="h-full flex items-center justify-center text-gray-500">
                Loading data...
              </div>
            )}
            {!hasHeartRateData && !data.loading && (
              <div className="h-full flex items-center justify-center text-gray-500">
                No heart rate data available for this month
              </div>
            )}
            {hasHeartRateData && !data.loading && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={currentHeartRateData}>
                  <CartesianGrid stroke="#E5E7EB" strokeDasharray="1 4" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickCount={8}
                    domain={['dataMin - 2', 'dataMax + 2']}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      fontSize: '12px',
                      padding: '8px'
                    }}
                    labelStyle={{ color: '#6B7280', marginBottom: '4px' }}
                    labelFormatter={(value) => formatDate(value)}
                    formatter={(value: number) => [`${value} bpm`]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#818CF8"
                    strokeWidth={1.5}
                    dot={{ r: 2, fill: '#818CF8' }}
                    activeDot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Weight Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Weight</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
          <div className="h-[300px]">
            {data.loading && (
              <div className="h-full flex items-center justify-center text-gray-500">
                Loading data...
              </div>
            )}
            {!hasWeightData && !data.loading && (
              <div className="h-full flex items-center justify-center text-gray-500">
                No weight data available for this month
              </div>
            )}
            {hasWeightData && !data.loading && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={currentWeightData}>
                  <CartesianGrid stroke="#E5E7EB" strokeDasharray="1 4" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickCount={8}
                    domain={['dataMin - 2', 'dataMax + 2']}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      fontSize: '12px',
                      padding: '8px'
                    }}
                    labelStyle={{ color: '#6B7280', marginBottom: '4px' }}
                    labelFormatter={(value) => formatDate(value)}
                    formatter={(value: number) => [`${value} kg`]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#10B981"
                    strokeWidth={1.5}
                    dot={{ r: 2, fill: '#10B981' }}
                    activeDot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Body Fat Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Body Fat</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
          <div className="h-[300px]">
            {data.loading && (
              <div className="h-full flex items-center justify-center text-gray-500">
                Loading data...
              </div>
            )}
            {!hasBodyFatData && !data.loading && (
              <div className="h-full flex items-center justify-center text-gray-500">
                No body fat data available for this month
              </div>
            )}
            {hasBodyFatData && !data.loading && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={currentBodyFatData}>
                  <CartesianGrid stroke="#E5E7EB" strokeDasharray="1 4" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickCount={8}
                    domain={['dataMin - 2', 'dataMax + 2']}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      fontSize: '12px',
                      padding: '8px'
                    }}
                    labelStyle={{ color: '#6B7280', marginBottom: '4px' }}
                    labelFormatter={(value) => formatDate(value)}
                    formatter={(value: number) => [`${value}%`]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#F59E0B"
                    strokeWidth={1.5}
                    dot={{ r: 2, fill: '#F59E0B' }}
                    activeDot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
