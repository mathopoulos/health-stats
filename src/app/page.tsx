'use client';

import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { parseHealthData } from '@/utils/healthDataParser';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface HealthData {
  heartRate: { date: string; value: number }[];
  weight: { date: string; value: number }[];
}

interface DailyAverage {
  date: string;
  average: number;
  count: number;
}

interface WeightRecord {
  date: string;
  value: number;
}

interface BodyFatRecord {
  date: string;
  value: number;
  sourceName: string;
  unit: string;
}

const ENTRIES_PER_PAGE = 30; // Show 1 month of data at a time

export default function Home() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [rawWeightData, setRawWeightData] = useState<WeightRecord[]>([]);
  const [rawBodyFatData, setRawBodyFatData] = useState<BodyFatRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [heartRatePage, setHeartRatePage] = useState<number | null>(null);
  const [weightPage, setWeightPage] = useState<number | null>(null);
  const [bodyFatPage, setBodyFatPage] = useState<number | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [healthResponse, weightResponse, bodyFatResponse] = await Promise.all([
          fetch('/api/health-data'),
          fetch('/api/weight-data'),
          fetch('/api/body-fat-data')
        ]);

        if (healthResponse.ok && weightResponse.ok && bodyFatResponse.ok) {
          const [healthJson, weightJson, bodyFatJson] = await Promise.all([
            healthResponse.json(),
            weightResponse.json(),
            bodyFatResponse.json()
          ]);

          setHealthData(healthJson);
          setRawWeightData(weightJson);
          setRawBodyFatData(bodyFatJson);
          
          // Start all charts from page 0
          setHeartRatePage(0);
          setWeightPage(0);
          setBodyFatPage(0);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Calculate daily averages
  const calculateDailyAverages = (data: { date: string; value: number }[]): DailyAverage[] => {
    console.log('Calculating averages for dates:', data.map(d => d.date));
    const dailyData = data.reduce((acc: { [key: string]: { sum: number; count: number } }, record) => {
      const date = record.date;
      if (!acc[date]) {
        acc[date] = { sum: 0, count: 0 };
      }
      acc[date].sum += record.value;
      acc[date].count += 1;
      return acc;
    }, {});

    const averages = Object.entries(dailyData)
      .map(([date, { sum, count }]) => ({
        date,
        average: Math.round(sum / count),
        count
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort in reverse chronological order
    
    console.log('Calculated averages:', averages);
    return averages;
  };

  // Get paginated data with specific page
  const getPaginatedData = (data: DailyAverage[], page: number) => {
    // Start from the end of the array (most recent data)
    const endIndex = data.length;
    const startIndex = Math.max(0, endIndex - ENTRIES_PER_PAGE - (page * ENTRIES_PER_PAGE));
    const pageData = data.slice(startIndex, startIndex + ENTRIES_PER_PAGE);
    
    // If we have less than ENTRIES_PER_PAGE items, pad with the available data
    if (pageData.length < ENTRIES_PER_PAGE && startIndex > 0) {
      const remainingItems = ENTRIES_PER_PAGE - pageData.length;
      const additionalData = data.slice(Math.max(0, startIndex - remainingItems), startIndex);
      return [...additionalData, ...pageData];
    }
    
    return pageData;
  };

  // Navigation handlers for heart rate
  const handlePrevHeartRatePage = () => {
    // Going left means increasing the page number (showing older data)
    const maxPage = Math.ceil(dailyAverages.length / ENTRIES_PER_PAGE) - 1;
    setHeartRatePage(prev => Math.min(maxPage, (prev || 0) + 1));
  };

  const handleNextHeartRatePage = () => {
    // Going right means decreasing the page number (showing newer data)
    setHeartRatePage(prev => Math.max(0, (prev || 0) - 1));
  };

  // Navigation handlers for weight
  const handlePrevWeightPage = () => {
    // Going left means increasing the page number (showing older data)
    const maxPage = Math.ceil(weightAverages.length / ENTRIES_PER_PAGE) - 1;
    setWeightPage(prev => Math.min(maxPage, (prev || 0) + 1));
  };

  const handleNextWeightPage = () => {
    // Going right means decreasing the page number (showing newer data)
    setWeightPage(prev => Math.max(0, (prev || 0) - 1));
  };

  // Navigation handlers for body fat
  const handlePrevBodyFatPage = () => {
    // Going left means increasing the page number (showing older data)
    const maxPage = Math.ceil(bodyFatAverages.length / ENTRIES_PER_PAGE) - 1;
    setBodyFatPage(prev => Math.min(maxPage, (prev || 0) + 1));
  };

  const handleNextBodyFatPage = () => {
    // Going right means decreasing the page number (showing newer data)
    setBodyFatPage(prev => Math.max(0, (prev || 0) - 1));
  };

  // Early return for loading state or if pages are not set yet
  if (isLoading || heartRatePage === null || weightPage === null || bodyFatPage === null) {
    return (
      <main className="min-h-screen dot-grid p-8 font-sans">
        <div className="flex items-center justify-center h-screen">
          <p className="text-xl font-mono text-gray-600">Loading health data...</p>
        </div>
      </main>
    );
  }

  // Early return for error state
  if (!healthData && rawWeightData.length === 0) {
    return (
      <main className="min-h-screen dot-grid p-8 font-sans">
        <div className="flex items-center justify-center h-screen">
          <p className="text-xl font-mono text-gray-600">No health data available.</p>
        </div>
      </main>
    );
  }

  const dailyAverages = healthData?.heartRate ? calculateDailyAverages(healthData.heartRate) : [];
  const weightAverages = calculateDailyAverages(rawWeightData);
  const bodyFatAverages = calculateDailyAverages(rawBodyFatData);

  const paginatedHeartRateData = getPaginatedData(dailyAverages, heartRatePage);
  const paginatedWeightData = getPaginatedData(weightAverages, weightPage);
  const paginatedBodyFatData = getPaginatedData(bodyFatAverages, bodyFatPage);

  const heartRateData = {
    labels: paginatedHeartRateData.map(d => new Date(d.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric' 
    })),
    datasets: [
      {
        label: 'Average Heart Rate (bpm)',
        data: paginatedHeartRateData.map(d => d.average),
        borderColor: '#f59e0b',
        backgroundColor: '#f59e0b',
        tension: 0.4,
      },
    ],
  };

  const weightChartData = {
    labels: paginatedWeightData.map(d => d.date),
    datasets: [{
      label: 'Weight (kg)',
      data: paginatedWeightData.map(d => d.average),
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
      tension: 0.4
    }]
  };

  const bodyFatChartData = {
    labels: paginatedBodyFatData.map(d => d.date),
    datasets: [{
      label: 'Body Fat (%)',
      data: paginatedBodyFatData.map(d => d.average),
      borderColor: 'rgb(244, 63, 94)',
      backgroundColor: 'rgba(244, 63, 94, 0.5)',
      tension: 0.4
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: {
            family: 'ui-monospace, monospace',
            size: 12,
            weight: 'bold' as const
          },
          usePointStyle: true,
          padding: 16,
          boxWidth: 8,
          boxHeight: 8
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1a1a1a',
        bodyColor: '#1a1a1a',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          family: 'ui-monospace, monospace',
          size: 14,
          weight: 'bold' as const
        },
        bodyFont: {
          family: 'ui-sans-serif, system-ui, sans-serif',
          size: 13
        },
        callbacks: {
          label: function(context: any) {
            const dataPoint = dailyAverages[context.dataIndex];
            return [
              `Average: ${context.parsed.y} bpm`,
              `Readings: ${dataPoint.count}`
            ];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.06)',
        },
        ticks: {
          font: {
            family: 'ui-monospace, monospace',
            size: 12,
            weight: 'bold' as const
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            family: 'ui-monospace, monospace',
            size: 12,
            weight: 'bold' as const
          }
        }
      }
    },
    elements: {
      line: {
        borderWidth: 3
      },
      point: {
        radius: 4,
        hoverRadius: 6
      }
    }
  };

  return (
    <main className="min-h-screen dot-grid p-8 font-sans">
      {/* Profile Section */}
      <div className="mb-8 flex items-center space-x-6 bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.04)]">
        <img
          src="/images/profile.jpg"
          alt="Lex Mathopoulos"
          className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg"
        />
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2 font-mono">Lex Mathopoulos</h1>
          <p className="text-gray-600 text-lg font-medium">Health Dashboard</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 p-6">
        {/* Heart Rate Chart */}
        {dailyAverages.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-700 font-mono">Daily Average Heart Rate</h3>
              <div className="flex gap-2">
                <button 
                  onClick={handlePrevHeartRatePage}
                  disabled={heartRatePage >= Math.ceil(dailyAverages.length / ENTRIES_PER_PAGE) - 1}
                  className="px-3 py-1 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ←
                </button>
                <button 
                  onClick={handleNextHeartRatePage}
                  disabled={heartRatePage === 0}
                  className="px-3 py-1 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  →
                </button>
              </div>
            </div>
            <div className="relative h-[400px]">
              <Line
                data={heartRateData}
                options={{
                  ...chartOptions,
                  maintainAspectRatio: false,
                  responsive: true
                }}
              />
            </div>
          </div>
        )}

        {/* Weight Chart */}
        {weightAverages.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-700 font-mono">Body Weight</h3>
              <div className="flex gap-2">
                <button 
                  onClick={handlePrevWeightPage}
                  disabled={weightPage >= Math.ceil(weightAverages.length / ENTRIES_PER_PAGE) - 1}
                  className="px-3 py-1 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ←
                </button>
                <button 
                  onClick={handleNextWeightPage}
                  disabled={weightPage === 0}
                  className="px-3 py-1 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  →
                </button>
              </div>
            </div>
            <div className="relative h-[400px]">
              <Line
                data={weightChartData}
                options={{
                  ...chartOptions,
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: {
                    ...chartOptions.plugins,
                    tooltip: {
                      ...chartOptions.plugins.tooltip,
                      callbacks: {
                        label: function(context: any) {
                          const dataPoint = paginatedWeightData[context.dataIndex];
                          return [
                            `Weight: ${context.parsed.y.toFixed(1)} kg`,
                            `Readings: ${dataPoint.count}`
                          ];
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Body Fat Chart */}
        {bodyFatAverages.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-700 font-mono">Body Fat Percentage</h3>
              <div className="flex gap-2">
                <button 
                  onClick={handlePrevBodyFatPage}
                  disabled={bodyFatPage >= Math.ceil(bodyFatAverages.length / ENTRIES_PER_PAGE) - 1}
                  className="px-3 py-1 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ←
                </button>
                <button 
                  onClick={handleNextBodyFatPage}
                  disabled={bodyFatPage === 0}
                  className="px-3 py-1 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  →
                </button>
              </div>
            </div>
            <div className="relative h-[400px]">
              <Line
                data={bodyFatChartData}
                options={{
                  ...chartOptions,
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: {
                    ...chartOptions.plugins,
                    tooltip: {
                      ...chartOptions.plugins.tooltip,
                      callbacks: {
                        label: function(context: any) {
                          const dataPoint = paginatedBodyFatData[context.dataIndex];
                          return [
                            `Body Fat: ${context.parsed.y.toFixed(1)}%`,
                            `Readings: ${dataPoint.count}`
                          ];
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
