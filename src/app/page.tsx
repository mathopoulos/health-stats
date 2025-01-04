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
  hrv: HealthData[];
  loading: boolean;
}

export default function Home() {
  const [data, setData] = useState<ChartData>({
    heartRate: [],
    weight: [],
    bodyFat: [],
    hrv: [],
    loading: true
  });
  const [weightMonth, setWeightMonth] = useState<Date | null>(null);
  const [bodyFatMonth, setBodyFatMonth] = useState<Date | null>(null);
  const [hrvMonth, setHrvMonth] = useState<Date | null>(null);
  const [hrvYear, setHrvYear] = useState<Date | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  });

  const fetchData = async () => {
    try {
      const [heartRateRes, weightRes, bodyFatRes, hrvRes] = await Promise.all([
        fetch('/api/health-data?type=heartRate'),
        fetch('/api/health-data?type=weight'),
        fetch('/api/health-data?type=bodyFat'),
        fetch('/api/health-data?type=hrv')
      ]);

      if (!heartRateRes.ok || !weightRes.ok || !bodyFatRes.ok || !hrvRes.ok) 
        throw new Error('Failed to fetch data');

      const [heartRateData, weightData, bodyFatData, hrvData] = await Promise.all([
        heartRateRes.json(),
        weightRes.json(),
        bodyFatRes.json(),
        hrvRes.json()
      ]);

      const allDates = [
        ...(heartRateData.data || []),
        ...(weightData.data || []),
        ...(bodyFatData.data || []),
        ...(hrvData.data || [])
      ].map(item => new Date(item.date));

      if (allDates.length > 0) {
        const start = new Date(Math.min(...allDates.map(d => d.getTime())));
        const end = new Date(Math.max(...allDates.map(d => d.getTime())));
        setDateRange({ start, end });
        
        const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
        const endYear = new Date(end.getFullYear(), 0, 1);
        
        if (!weightMonth) {
          setWeightMonth(endMonth);
        }
        if (!bodyFatMonth) {
          setBodyFatMonth(endMonth);
        }
        if (!hrvYear) {
          setHrvYear(endYear);
        }
      }

      return {
        heartRate: heartRateData.data || [],
        weight: weightData.data || [],
        bodyFat: bodyFatData.data || [],
        hrv: hrvData.data || []
      };
    } catch (error) {
      console.error('Error fetching health data:', error);
      return { heartRate: [], weight: [], bodyFat: [], hrv: [] };
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

  const goToPreviousMonth = (setter: React.Dispatch<React.SetStateAction<Date | null>>) => {
    setter((prev: Date | null) => {
      if (!prev) return null;
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = (setter: React.Dispatch<React.SetStateAction<Date | null>>) => {
    setter((prev: Date | null) => {
      if (!prev) return null;
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const isNextMonthDisabled = (currentDate: Date | null) => {
    if (!dateRange.end) return true;
    if (!currentDate) return true;
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(currentDate.getMonth() + 1);
    return nextMonth > dateRange.end;
  };

  const isPrevMonthDisabled = (currentDate: Date | null) => {
    if (!dateRange.start) return true;
    if (!currentDate) return true;
    const prevMonth = new Date(currentDate);
    prevMonth.setMonth(currentDate.getMonth() - 1);
    return prevMonth < dateRange.start;
  };

  const goToPreviousYear = (setter: React.Dispatch<React.SetStateAction<Date | null>>) => {
    setter((prev: Date | null) => {
      if (!prev) return null;
      const newDate = new Date(prev);
      newDate.setFullYear(prev.getFullYear() - 1);
      return newDate;
    });
  };

  const goToNextYear = (setter: React.Dispatch<React.SetStateAction<Date | null>>) => {
    setter((prev: Date | null) => {
      if (!prev) return null;
      const newDate = new Date(prev);
      newDate.setFullYear(prev.getFullYear() + 1);
      return newDate;
    });
  };

  const isNextYearDisabled = (currentDate: Date | null) => {
    if (!dateRange.end) return true;
    if (!currentDate) return true;
    const nextYear = new Date(currentDate);
    nextYear.setFullYear(currentDate.getFullYear() + 1);
    return nextYear > dateRange.end;
  };

  const isPrevYearDisabled = (currentDate: Date | null) => {
    if (!dateRange.start) return true;
    if (!currentDate) return true;
    const prevYear = new Date(currentDate);
    prevYear.setFullYear(currentDate.getFullYear() - 1);
    return prevYear < dateRange.start;
  };

  const getMonthData = (data: HealthData[], month: Date | null) => {
    if (!month) return [];
    
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999);
    
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

  const getYearlyHRVData = (data: HealthData[], year: Date | null) => {
    if (!year) return [];
    
    const yearStart = new Date(year.getFullYear(), 0, 1);
    const yearEnd = new Date(year.getFullYear(), 11, 31, 23, 59, 59, 999);
    
    const filteredData = data.filter(item => {
      const date = new Date(item.date);
      return date >= yearStart && date <= yearEnd;
    });

    // Group by month and calculate averages
    const monthlyData = filteredData.reduce((acc: { [key: string]: { sum: number; count: number } }, item) => {
      const date = new Date(item.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = { sum: 0, count: 0 };
      }
      
      acc[monthKey].sum += item.value;
      acc[monthKey].count += 1;
      
      return acc;
    }, {});

    const aggregatedData = Object.entries(monthlyData).map(([monthKey, { sum, count }]) => {
      const [year, month] = monthKey.split('-');
      return {
        date: `${year}-${month}-15T12:00:00.000Z`, // Use middle of month for consistent display
        value: Math.round(sum / count)
      };
    });

    aggregatedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return aggregatedData;
  };

  const currentHeartRateData = getMonthData(data.heartRate, weightMonth);
  const currentWeightData = getMonthData(data.weight, weightMonth);
  const currentBodyFatData = getMonthData(data.bodyFat, bodyFatMonth);
  const currentHRVData = getYearlyHRVData(data.hrv, hrvYear);
  
  const hasHeartRateData = currentHeartRateData.length > 0;
  const hasWeightData = currentWeightData.length > 0;
  const hasBodyFatData = currentBodyFatData.length > 0;
  const hasHRVData = currentHRVData.length > 0;

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

        {/* HRV Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Heart Rate Variability</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => goToPreviousYear(setHrvYear)}
                disabled={isPrevYearDisabled(hrvYear)}
                className={`p-1 rounded-full hover:bg-gray-100 ${
                  isPrevYearDisabled(hrvYear) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm text-gray-600">
                {hrvYear?.getFullYear() || ''}
              </span>
              <button
                onClick={() => goToNextYear(setHrvYear)}
                disabled={isNextYearDisabled(hrvYear)}
                className={`p-1 rounded-full hover:bg-gray-100 ${
                  isNextYearDisabled(hrvYear) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            {!hasHRVData && !data.loading && (
              <div className="h-full flex items-center justify-center text-gray-500">
                No HRV data available for this year
              </div>
            )}
            {hasHRVData && !data.loading && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={currentHRVData}>
                  <CartesianGrid stroke="#E5E7EB" strokeDasharray="1 4" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleString('default', { month: 'short' })}
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
                    labelFormatter={(value) => new Date(value).toLocaleString('default', { month: 'long', year: 'numeric' })}
                    formatter={(value: number) => [`${value} ms`]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#6366F1"
                    strokeWidth={1.5}
                    dot={{ r: 2, fill: '#6366F1' }}
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
            <div className="flex items-center gap-4">
              <button
                onClick={() => goToPreviousMonth(setWeightMonth)}
                disabled={isPrevMonthDisabled(weightMonth)}
                className={`p-1 rounded-full hover:bg-gray-100 ${
                  isPrevMonthDisabled(weightMonth) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm text-gray-600">
                {weightMonth?.toLocaleString('default', { month: 'long', year: 'numeric' }) || ''}
              </span>
              <button
                onClick={() => goToNextMonth(setWeightMonth)}
                disabled={isNextMonthDisabled(weightMonth)}
                className={`p-1 rounded-full hover:bg-gray-100 ${
                  isNextMonthDisabled(weightMonth) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="flex items-center gap-4">
              <button
                onClick={() => goToPreviousMonth(setBodyFatMonth)}
                disabled={isPrevMonthDisabled(bodyFatMonth)}
                className={`p-1 rounded-full hover:bg-gray-100 ${
                  isPrevMonthDisabled(bodyFatMonth) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm text-gray-600">
                {bodyFatMonth?.toLocaleString('default', { month: 'long', year: 'numeric' }) || ''}
              </span>
              <button
                onClick={() => goToNextMonth(setBodyFatMonth)}
                disabled={isNextMonthDisabled(bodyFatMonth)}
                className={`p-1 rounded-full hover:bg-gray-100 ${
                  isNextMonthDisabled(bodyFatMonth) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
