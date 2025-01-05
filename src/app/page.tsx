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
  vo2max: HealthData[];
  loading: boolean;
}

type TimeFrame = 'daily' | 'weekly' | 'monthly' | 'yearly';

export default function Home() {
  const [data, setData] = useState<ChartData>({
    heartRate: [],
    weight: [],
    bodyFat: [],
    hrv: [],
    vo2max: [],
    loading: true
  });
  const [weightTimeframe, setWeightTimeframe] = useState<TimeFrame>('monthly');
  const [weightDate, setWeightDate] = useState<Date | null>(null);
  const [bodyFatTimeframe, setBodyFatTimeframe] = useState<TimeFrame>('monthly');
  const [bodyFatDate, setBodyFatDate] = useState<Date | null>(null);
  const [hrvTimeframe, setHrvTimeframe] = useState<TimeFrame>('monthly');
  const [hrvDate, setHrvDate] = useState<Date | null>(null);
  const [vo2maxTimeframe, setVo2maxTimeframe] = useState<TimeFrame>('monthly');
  const [vo2maxDate, setVo2maxDate] = useState<Date | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  });

  const fetchData = async () => {
    try {
      const [heartRateRes, weightRes, bodyFatRes, hrvRes, vo2maxRes] = await Promise.all([
        fetch('/api/health-data?type=heartRate'),
        fetch('/api/health-data?type=weight'),
        fetch('/api/health-data?type=bodyFat'),
        fetch('/api/health-data?type=hrv'),
        fetch('/api/health-data?type=vo2max')
      ]);

      const responses = await Promise.all([
        heartRateRes.json(),
        weightRes.json(),
        bodyFatRes.json(),
        hrvRes.json(),
        vo2maxRes.json()
      ]);

      const [heartRateData, weightData, bodyFatData, hrvData, vo2maxData] = responses;

      if (!heartRateData.success || !weightData.success || !bodyFatData.success || !hrvData.success || !vo2maxData.success) {
        console.error('One or more data fetches failed:', responses);
        throw new Error('Failed to fetch some data');
      }

      const allDates = [
        ...(heartRateData.data || []),
        ...(weightData.data || []),
        ...(bodyFatData.data || []),
        ...(hrvData.data || []),
        ...(vo2maxData.data || [])
      ].map(item => new Date(item.date));

      if (allDates.length > 0) {
        const start = new Date(Math.min(...allDates.map(d => d.getTime())));
        const end = new Date(Math.max(...allDates.map(d => d.getTime())));
        setDateRange({ start, end });
        
        const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
        
        if (!weightDate) {
          setWeightDate(endMonth);
        }
        if (!bodyFatDate) {
          setBodyFatDate(endMonth);
        }
        if (!hrvDate) {
          setHrvDate(endMonth);
        }
        if (!vo2maxDate) {
          setVo2maxDate(endMonth);
        }
      }

      return {
        heartRate: heartRateData.data || [],
        weight: weightData.data || [],
        bodyFat: bodyFatData.data || [],
        hrv: hrvData.data || [],
        vo2max: vo2maxData.data || []
      };
    } catch (error) {
      console.error('Error fetching data:', error);
      return {
        heartRate: [],
        weight: [],
        bodyFat: [],
        hrv: [],
        vo2max: []
      };
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
      setData(prev => ({
        ...prev,
        loading: false,
        heartRate: [],
        weight: [],
        bodyFat: [],
        hrv: [],
        vo2max: []
      }));
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

  const getHRVData = (data: HealthData[], date: Date | null, timeframe: TimeFrame) => {
    if (!date) return [];
    
    let startDate: Date;
    let endDate: Date;
    let groupingFunction: (date: Date) => string;
    let displayDate: (key: string) => string;
    
    switch (timeframe) {
      case 'daily':
        // Show one month of daily data
        startDate = new Date(date.getFullYear(), date.getMonth(), 1);
        endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
        groupingFunction = (date: Date) => date.toISOString().split('T')[0];
        displayDate = (key: string) => `${key}T12:00:00.000Z`;
        break;
        
      case 'weekly':
        // Show 12 weeks of weekly data
        startDate = new Date(date.getTime());
        startDate.setDate(startDate.getDate() - 84); // 12 weeks back
        endDate = new Date(date.getTime());
        groupingFunction = (date: Date) => {
          const week = new Date(date.getTime());
          week.setDate(week.getDate() - week.getDay());
          return week.toISOString().split('T')[0];
        };
        displayDate = (key: string) => `${key}T12:00:00.000Z`;
        break;
        
      case 'monthly':
        // Show one year of monthly data
        startDate = new Date(date.getFullYear(), 0, 1);
        endDate = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
        groupingFunction = (date: Date) => 
          `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        displayDate = (key: string) => {
          const [year, month] = key.split('-');
          return `${year}-${month}-15T12:00:00.000Z`;
        };
        break;

      case 'yearly':
        // Show 5 years of yearly data
        startDate = new Date(date.getFullYear() - 4, 0, 1);
        endDate = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
        groupingFunction = (date: Date) => date.getFullYear().toString();
        displayDate = (key: string) => `${key}-06-15T12:00:00.000Z`; // Middle of the year
        break;
    }
    
    const filteredData = data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate && itemDate <= endDate;
    });

    const groupedData = filteredData.reduce((acc: { [key: string]: { sum: number; count: number } }, item) => {
      const date = new Date(item.date);
      const key = groupingFunction(date);
      
      if (!acc[key]) {
        acc[key] = { sum: 0, count: 0 };
      }
      
      acc[key].sum += item.value;
      acc[key].count += 1;
      
      return acc;
    }, {});

    const aggregatedData = Object.entries(groupedData).map(([key, { sum, count }]) => ({
      date: displayDate(key),
      value: Math.round(sum / count)
    }));

    aggregatedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return aggregatedData;
  };

  const getTimeframeLabel = (date: Date | null, timeframe: TimeFrame) => {
    if (!date) return '';
    
    switch (timeframe) {
      case 'daily':
        return date.toLocaleString('default', { month: 'long', year: 'numeric' });
      case 'weekly':
        const endDate = new Date(date);
        const startDate = new Date(date);
        startDate.setDate(startDate.getDate() - 84);
        return `${startDate.toLocaleString('default', { month: 'short' })} - ${endDate.toLocaleString('default', { month: 'short' })} ${endDate.getFullYear()}`;
      case 'monthly':
        return date.getFullYear().toString();
      case 'yearly':
        const startYear = date.getFullYear() - 4;
        return `${startYear} - ${date.getFullYear()}`;
    }
  };

  const handleTimeframeNavigation = (
    direction: 'prev' | 'next',
    date: Date | null,
    setDate: React.Dispatch<React.SetStateAction<Date | null>>,
    timeframe: TimeFrame
  ) => {
    setDate((prev: Date | null) => {
      if (!prev) return null;
      const newDate = new Date(prev);
      
      switch (timeframe) {
        case 'daily':
          direction === 'prev' ? newDate.setMonth(prev.getMonth() - 1) : newDate.setMonth(prev.getMonth() + 1);
          break;
        case 'weekly':
          direction === 'prev' ? newDate.setDate(prev.getDate() - 84) : newDate.setDate(prev.getDate() + 84);
          break;
        case 'monthly':
          direction === 'prev' ? newDate.setFullYear(prev.getFullYear() - 1) : newDate.setFullYear(prev.getFullYear() + 1);
          break;
        case 'yearly':
          direction === 'prev' ? newDate.setFullYear(prev.getFullYear() - 5) : newDate.setFullYear(prev.getFullYear() + 5);
          break;
      }
      
      return newDate;
    });
  };

  const isNavigationDisabled = (direction: 'prev' | 'next', date: Date | null, timeframe: TimeFrame) => {
    if (!dateRange.start || !dateRange.end || !date) return true;
    
    const newDate = new Date(date);
    
    switch (timeframe) {
      case 'daily':
        direction === 'prev' ? newDate.setMonth(newDate.getMonth() - 1) : newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'weekly':
        direction === 'prev' ? newDate.setDate(newDate.getDate() - 84) : newDate.setDate(newDate.getDate() + 84);
        break;
      case 'monthly':
        direction === 'prev' ? newDate.setFullYear(newDate.getFullYear() - 1) : newDate.setFullYear(newDate.getFullYear() + 1);
        break;
      case 'yearly':
        direction === 'prev' ? newDate.setFullYear(newDate.getFullYear() - 5) : newDate.setFullYear(newDate.getFullYear() + 5);
        break;
    }
    
    return direction === 'prev' ? newDate < dateRange.start : newDate > dateRange.end;
  };

  const currentHeartRateData = getMonthData(data.heartRate, weightDate);
  const currentWeightData = getHRVData(data.weight, weightDate, weightTimeframe);
  const currentBodyFatData = getHRVData(data.bodyFat, bodyFatDate, bodyFatTimeframe);
  const currentHRVData = getHRVData(data.hrv, hrvDate, hrvTimeframe);
  const currentVO2MaxData = getHRVData(data.vo2max, vo2maxDate, vo2maxTimeframe);
  
  const hasHeartRateData = currentHeartRateData.length > 0;
  const hasWeightData = currentWeightData.length > 0;
  const hasBodyFatData = currentBodyFatData.length > 0;
  const hasHRVData = currentHRVData.length > 0;
  const hasVO2MaxData = currentVO2MaxData.length > 0;

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

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-500">Avg Heart Rate Variability</span>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-gray-900">
                  {data.loading ? (
                    "..."
                  ) : data.hrv.length > 0 ? (
                    `${Math.round(
                      data.hrv
                        .slice(-30)
                        .reduce((sum, item) => sum + item.value, 0) / 
                      Math.min(data.hrv.slice(-30).length, 30)
                    )} ms`
                  ) : (
                    "No data"
                  )}
                </span>
                {!data.loading && data.hrv.length > 30 && (
                  <div className="flex items-center">
                    {(() => {
                      const currentAvg = data.hrv
                        .slice(-30)
                        .reduce((sum, item) => sum + item.value, 0) / 
                        Math.min(data.hrv.slice(-30).length, 30);
                      const prevAvg = data.hrv
                        .slice(-60, -30)
                        .reduce((sum, item) => sum + item.value, 0) / 
                        Math.min(data.hrv.slice(-60, -30).length, 30);
                      const percentChange = ((currentAvg - prevAvg) / prevAvg) * 100;
                      const isIncrease = percentChange > 0;
                      return (
                        <span className={`text-sm flex items-center ${isIncrease ? 'text-red-500' : 'text-green-500'}`}>
                          {isIncrease ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                            </svg>
                          )}
                          <span className="ml-1">{Math.abs(percentChange).toFixed(1)}%</span>
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>
              <span className="mt-1 text-xs text-gray-500">Last 30 days</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-500">Avg VO2 Max</span>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-gray-900">
                  {data.loading ? (
                    "..."
                  ) : data.vo2max.length > 0 ? (
                    `${Math.round(
                      data.vo2max
                        .slice(-30)
                        .reduce((sum, item) => sum + item.value, 0) / 
                      Math.min(data.vo2max.slice(-30).length, 30)
                    )} mL/kg·min`
                  ) : (
                    "No data"
                  )}
                </span>
                {!data.loading && data.vo2max.length > 30 && (
                  <div className="flex items-center">
                    {(() => {
                      const currentAvg = data.vo2max
                        .slice(-30)
                        .reduce((sum, item) => sum + item.value, 0) / 
                        Math.min(data.vo2max.slice(-30).length, 30);
                      const prevAvg = data.vo2max
                        .slice(-60, -30)
                        .reduce((sum, item) => sum + item.value, 0) / 
                        Math.min(data.vo2max.slice(-60, -30).length, 30);
                      const percentChange = ((currentAvg - prevAvg) / prevAvg) * 100;
                      const isIncrease = percentChange > 0;
                      return (
                        <span className={`text-sm flex items-center ${isIncrease ? 'text-red-500' : 'text-green-500'}`}>
                          {isIncrease ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                            </svg>
                          )}
                          <span className="ml-1">{Math.abs(percentChange).toFixed(1)}%</span>
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>
              <span className="mt-1 text-xs text-gray-500">Last 30 days</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-500">Avg Weight</span>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-gray-900">
                  {data.loading ? (
                    "..."
                  ) : data.weight.length > 0 ? (
                    `${(
                      data.weight
                        .slice(-30)
                        .reduce((sum, item) => sum + item.value, 0) / 
                      Math.min(data.weight.slice(-30).length, 30)
                    ).toFixed(1)} lb`
                  ) : (
                    "No data"
                  )}
                </span>
                {!data.loading && data.weight.length > 30 && (
                  <div className="flex items-center">
                    {(() => {
                      const currentAvg = data.weight
                        .slice(-30)
                        .reduce((sum, item) => sum + item.value, 0) / 
                        Math.min(data.weight.slice(-30).length, 30);
                      const prevAvg = data.weight
                        .slice(-60, -30)
                        .reduce((sum, item) => sum + item.value, 0) / 
                        Math.min(data.weight.slice(-60, -30).length, 30);
                      const percentChange = ((currentAvg - prevAvg) / prevAvg) * 100;
                      const isIncrease = percentChange > 0;
                      return (
                        <span className={`text-sm flex items-center ${isIncrease ? 'text-red-500' : 'text-green-500'}`}>
                          {isIncrease ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                            </svg>
                          )}
                          <span className="ml-1">{Math.abs(percentChange).toFixed(1)}%</span>
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>
              <span className="mt-1 text-xs text-gray-500">Last 30 days</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-500">Avg Body Fat</span>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-gray-900">
                  {data.loading ? (
                    "..."
                  ) : data.bodyFat.length > 0 ? (
                    `${(
                      data.bodyFat
                        .slice(-30)
                        .reduce((sum, item) => sum + item.value, 0) / 
                      Math.min(data.bodyFat.slice(-30).length, 30)
                    ).toFixed(1)}%`
                  ) : (
                    "No data"
                  )}
                </span>
                {!data.loading && data.bodyFat.length > 30 && (
                  <div className="flex items-center">
                    {(() => {
                      const currentAvg = data.bodyFat
                        .slice(-30)
                        .reduce((sum, item) => sum + item.value, 0) / 
                        Math.min(data.bodyFat.slice(-30).length, 30);
                      const prevAvg = data.bodyFat
                        .slice(-60, -30)
                        .reduce((sum, item) => sum + item.value, 0) / 
                        Math.min(data.bodyFat.slice(-60, -30).length, 30);
                      const percentChange = ((currentAvg - prevAvg) / prevAvg) * 100;
                      const isIncrease = percentChange > 0;
                      return (
                        <span className={`text-sm flex items-center ${isIncrease ? 'text-red-500' : 'text-green-500'}`}>
                          {isIncrease ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                            </svg>
                          )}
                          <span className="ml-1">{Math.abs(percentChange).toFixed(1)}%</span>
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>
              <span className="mt-1 text-xs text-gray-500">Last 30 days</span>
            </div>
          </div>
        </div>

        {/* HRV Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Heart Rate Variability</h2>
            <div className="flex items-center">
              <select
                value={hrvTimeframe}
                onChange={(e) => setHrvTimeframe(e.target.value as TimeFrame)}
                className="mr-6 h-9 pl-3 pr-8 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 appearance-none cursor-pointer hover:bg-gray-100 transition-colors"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                }}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
              <div className="flex items-center h-9 bg-gray-50 border border-gray-200 rounded-lg">
                <button
                  onClick={() => handleTimeframeNavigation('prev', hrvDate, setHrvDate, hrvTimeframe)}
                  disabled={isNavigationDisabled('prev', hrvDate, hrvTimeframe)}
                  className={`h-full px-2 rounded-l-lg hover:bg-white hover:shadow-sm transition-all ${
                    isNavigationDisabled('prev', hrvDate, hrvTimeframe) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm font-medium text-gray-700 mx-4 min-w-[100px] text-center">
                  {getTimeframeLabel(hrvDate, hrvTimeframe)}
                </span>
                <button
                  onClick={() => handleTimeframeNavigation('next', hrvDate, setHrvDate, hrvTimeframe)}
                  disabled={isNavigationDisabled('next', hrvDate, hrvTimeframe)}
                  className={`h-full px-2 rounded-r-lg hover:bg-white hover:shadow-sm transition-all ${
                    isNavigationDisabled('next', hrvDate, hrvTimeframe) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
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
                No HRV data available for this {hrvTimeframe === 'yearly' ? '5 years' : hrvTimeframe === 'monthly' ? 'year' : hrvTimeframe === 'weekly' ? '12 weeks' : 'month'}
              </div>
            )}
            {hasHRVData && !data.loading && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={currentHRVData}
                  margin={{ top: 20, right: 10, left: 10, bottom: 10 }}
                >
                  <CartesianGrid stroke="#E5E7EB" strokeDasharray="1 4" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => {
                      const d = new Date(date);
                      switch (hrvTimeframe) {
                        case 'daily':
                          return d.getDate().toString();
                        case 'weekly':
                          return d.toLocaleString('default', { month: 'short', day: 'numeric' });
                        case 'monthly':
                          return d.toLocaleString('default', { month: 'short' });
                        case 'yearly':
                          return d.getFullYear().toString();
                      }
                    }}
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={12}
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
                    labelFormatter={(value) => {
                      const d = new Date(value);
                      switch (hrvTimeframe) {
                        case 'daily':
                          return d.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });
                        case 'weekly':
                          const weekEnd = new Date(d);
                          weekEnd.setDate(d.getDate() + 6);
                          return `Week of ${d.toLocaleString('default', { month: 'long', day: 'numeric' })} - ${weekEnd.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' })}`;
                        case 'monthly':
                          return d.toLocaleString('default', { month: 'long', year: 'numeric' });
                        case 'yearly':
                          return d.getFullYear().toString();
                      }
                    }}
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

        {/* VO2 Max Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">VO2 Max</h2>
            <div className="flex items-center">
              <select
                value={vo2maxTimeframe}
                onChange={(e) => setVo2maxTimeframe(e.target.value as TimeFrame)}
                className="mr-6 h-9 pl-3 pr-8 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 appearance-none cursor-pointer hover:bg-gray-100 transition-colors"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                }}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
              <div className="flex items-center h-9 bg-gray-50 border border-gray-200 rounded-lg">
                <button
                  onClick={() => handleTimeframeNavigation('prev', vo2maxDate, setVo2maxDate, vo2maxTimeframe)}
                  disabled={isNavigationDisabled('prev', vo2maxDate, vo2maxTimeframe)}
                  className={`h-full px-2 rounded-l-lg hover:bg-white hover:shadow-sm transition-all ${
                    isNavigationDisabled('prev', vo2maxDate, vo2maxTimeframe) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm font-medium text-gray-700 mx-4 min-w-[100px] text-center">
                  {getTimeframeLabel(vo2maxDate, vo2maxTimeframe)}
                </span>
                <button
                  onClick={() => handleTimeframeNavigation('next', vo2maxDate, setVo2maxDate, vo2maxTimeframe)}
                  disabled={isNavigationDisabled('next', vo2maxDate, vo2maxTimeframe)}
                  className={`h-full px-2 rounded-r-lg hover:bg-white hover:shadow-sm transition-all ${
                    isNavigationDisabled('next', vo2maxDate, vo2maxTimeframe) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div className="h-[300px]">
            {data.loading && (
              <div className="h-full flex items-center justify-center text-gray-500">
                Loading data...
              </div>
            )}
            {!hasVO2MaxData && !data.loading && (
              <div className="h-full flex items-center justify-center text-gray-500">
                No VO2 max data available for this {vo2maxTimeframe === 'yearly' ? '5 years' : vo2maxTimeframe === 'monthly' ? 'year' : vo2maxTimeframe === 'weekly' ? '12 weeks' : 'month'}
              </div>
            )}
            {hasVO2MaxData && !data.loading && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={currentVO2MaxData}
                  margin={{ top: 20, right: 10, left: 10, bottom: 10 }}
                >
                  <CartesianGrid stroke="#E5E7EB" strokeDasharray="1 4" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => {
                      const d = new Date(date);
                      switch (vo2maxTimeframe) {
                        case 'daily':
                          return d.getDate().toString();
                        case 'weekly':
                          return d.toLocaleString('default', { month: 'short', day: 'numeric' });
                        case 'monthly':
                          return d.toLocaleString('default', { month: 'short' });
                        case 'yearly':
                          return d.getFullYear().toString();
                      }
                    }}
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={12}
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
                    labelFormatter={(value) => {
                      const d = new Date(value);
                      switch (vo2maxTimeframe) {
                        case 'daily':
                          return d.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });
                        case 'weekly':
                          const weekEnd = new Date(d);
                          weekEnd.setDate(d.getDate() + 6);
                          return `Week of ${d.toLocaleString('default', { month: 'long', day: 'numeric' })} - ${weekEnd.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' })}`;
                        case 'monthly':
                          return d.toLocaleString('default', { month: 'long', year: 'numeric' });
                        case 'yearly':
                          return d.getFullYear().toString();
                      }
                    }}
                    formatter={(value: number) => [`${value} mL/kg·min`]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#8B5CF6"
                    strokeWidth={1.5}
                    dot={{ r: 2, fill: '#8B5CF6' }}
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
            <div className="flex items-center">
              <select
                value={weightTimeframe}
                onChange={(e) => setWeightTimeframe(e.target.value as TimeFrame)}
                className="mr-6 h-9 pl-3 pr-8 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 appearance-none cursor-pointer hover:bg-gray-100 transition-colors"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                }}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
              <div className="flex items-center h-9 bg-gray-50 border border-gray-200 rounded-lg">
                <button
                  onClick={() => handleTimeframeNavigation('prev', weightDate, setWeightDate, weightTimeframe)}
                  disabled={isNavigationDisabled('prev', weightDate, weightTimeframe)}
                  className={`h-full px-2 rounded-l-lg hover:bg-white hover:shadow-sm transition-all ${
                    isNavigationDisabled('prev', weightDate, weightTimeframe) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm font-medium text-gray-700 mx-4 min-w-[100px] text-center">
                  {getTimeframeLabel(weightDate, weightTimeframe)}
                </span>
                <button
                  onClick={() => handleTimeframeNavigation('next', weightDate, setWeightDate, weightTimeframe)}
                  disabled={isNavigationDisabled('next', weightDate, weightTimeframe)}
                  className={`h-full px-2 rounded-r-lg hover:bg-white hover:shadow-sm transition-all ${
                    isNavigationDisabled('next', weightDate, weightTimeframe) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
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
                No weight data available for this {weightTimeframe === 'yearly' ? '5 years' : weightTimeframe === 'monthly' ? 'year' : weightTimeframe === 'weekly' ? '12 weeks' : 'month'}
              </div>
            )}
            {hasWeightData && !data.loading && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={currentWeightData}
                  margin={{ top: 20, right: 10, left: 10, bottom: 10 }}
                >
                  <CartesianGrid stroke="#E5E7EB" strokeDasharray="1 4" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => {
                      const d = new Date(date);
                      switch (weightTimeframe) {
                        case 'daily':
                          return d.getDate().toString();
                        case 'weekly':
                          return d.toLocaleString('default', { month: 'short', day: 'numeric' });
                        case 'monthly':
                          return d.toLocaleString('default', { month: 'short' });
                        case 'yearly':
                          return d.getFullYear().toString();
                      }
                    }}
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={12}
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
                    labelFormatter={(value) => {
                      const d = new Date(value);
                      switch (weightTimeframe) {
                        case 'daily':
                          return d.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });
                        case 'weekly':
                          const weekEnd = new Date(d);
                          weekEnd.setDate(d.getDate() + 6);
                          return `Week of ${d.toLocaleString('default', { month: 'long', day: 'numeric' })} - ${weekEnd.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' })}`;
                        case 'monthly':
                          return d.toLocaleString('default', { month: 'long', year: 'numeric' });
                        case 'yearly':
                          return d.getFullYear().toString();
                      }
                    }}
                    formatter={(value: number) => [`${value} lb`]}
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
            <div className="flex items-center">
              <select
                value={bodyFatTimeframe}
                onChange={(e) => setBodyFatTimeframe(e.target.value as TimeFrame)}
                className="mr-6 h-9 pl-3 pr-8 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 appearance-none cursor-pointer hover:bg-gray-100 transition-colors"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                }}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
              <div className="flex items-center h-9 bg-gray-50 border border-gray-200 rounded-lg">
                <button
                  onClick={() => handleTimeframeNavigation('prev', bodyFatDate, setBodyFatDate, bodyFatTimeframe)}
                  disabled={isNavigationDisabled('prev', bodyFatDate, bodyFatTimeframe)}
                  className={`h-full px-2 rounded-l-lg hover:bg-white hover:shadow-sm transition-all ${
                    isNavigationDisabled('prev', bodyFatDate, bodyFatTimeframe) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm font-medium text-gray-700 mx-4 min-w-[100px] text-center">
                  {getTimeframeLabel(bodyFatDate, bodyFatTimeframe)}
                </span>
                <button
                  onClick={() => handleTimeframeNavigation('next', bodyFatDate, setBodyFatDate, bodyFatTimeframe)}
                  disabled={isNavigationDisabled('next', bodyFatDate, bodyFatTimeframe)}
                  className={`h-full px-2 rounded-r-lg hover:bg-white hover:shadow-sm transition-all ${
                    isNavigationDisabled('next', bodyFatDate, bodyFatTimeframe) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
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
                No body fat data available for this {bodyFatTimeframe === 'yearly' ? '5 years' : bodyFatTimeframe === 'monthly' ? 'year' : bodyFatTimeframe === 'weekly' ? '12 weeks' : 'month'}
              </div>
            )}
            {hasBodyFatData && !data.loading && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={currentBodyFatData}
                  margin={{ top: 20, right: 10, left: 10, bottom: 10 }}
                >
                  <CartesianGrid stroke="#E5E7EB" strokeDasharray="1 4" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => {
                      const d = new Date(date);
                      switch (bodyFatTimeframe) {
                        case 'daily':
                          return d.getDate().toString();
                        case 'weekly':
                          return d.toLocaleString('default', { month: 'short', day: 'numeric' });
                        case 'monthly':
                          return d.toLocaleString('default', { month: 'short' });
                        case 'yearly':
                          return d.getFullYear().toString();
                      }
                    }}
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={12}
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
                    labelFormatter={(value) => {
                      const d = new Date(value);
                      switch (bodyFatTimeframe) {
                        case 'daily':
                          return d.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });
                        case 'weekly':
                          const weekEnd = new Date(d);
                          weekEnd.setDate(d.getDate() + 6);
                          return `Week of ${d.toLocaleString('default', { month: 'long', day: 'numeric' })} - ${weekEnd.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' })}`;
                        case 'monthly':
                          return d.toLocaleString('default', { month: 'long', year: 'numeric' });
                        case 'yearly':
                          return d.getFullYear().toString();
                      }
                    }}
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
