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
  lastUpdated: string | null;
  loading: boolean;
}

export default function Home() {
  const [data, setData] = useState<ChartData>({
    heartRate: [],
    lastUpdated: null,
    loading: true
  });
  const [currentMonth, setCurrentMonth] = useState(new Date('2020-03-01'));
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  });

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/health-data?type=heartRate`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      const heartRateData = result.data || [];
      
      // Find the date range of the data
      if (heartRateData.length > 0) {
        const dates = heartRateData.map((item: HealthData) => new Date(item.date));
        const start = new Date(Math.min(...dates.map((d: Date) => d.getTime())));
        const end = new Date(Math.max(...dates.map((d: Date) => d.getTime())));
        setDateRange({ start, end });
        
        // Set initial month to earliest data if not already set
        if (currentMonth.getTime() === new Date('2020-03-01').getTime()) {
          setCurrentMonth(new Date(start.getFullYear(), start.getMonth(), 1));
        }
      }
      
      return heartRateData;
    } catch (error) {
      console.error('Error fetching heart rate data:', error);
      return [];
    }
  };

  const loadData = async () => {
    setData(prev => ({ ...prev, loading: true }));
    try {
      const heartRate = await fetchData();
      setData({
        heartRate,
        lastUpdated: new Date().toLocaleString(),
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

    console.log(`Showing data for ${currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}`);
    console.log(`Found ${filteredData.length} data points`);
    console.log(`Date range: ${monthStart.toISOString()} to ${monthEnd.toISOString()}`);
    
    return filteredData;
  };

  const currentHeartRateData = getMonthData(data.heartRate);
  const hasData = currentHeartRateData.length > 0;

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
            {!hasData && !data.loading && (
              <div className="h-full flex items-center justify-center text-gray-500">
                No heart rate data available for this month
              </div>
            )}
            {hasData && (
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

        {data.loading && (
          <div className="text-center text-gray-600 mt-4">Loading data...</div>
        )}

        {data.lastUpdated && (
          <div className="text-sm text-gray-500 text-center mt-4">
            Last updated: {data.lastUpdated}
          </div>
        )}
      </div>
    </main>
  );
}
