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

export default function Home() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [rawWeightData, setRawWeightData] = useState<WeightRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [healthResponse, weightResponse] = await Promise.all([
          fetch('/api/health-data'),
          fetch('/api/weight-data')
        ]);

        if (healthResponse.ok && weightResponse.ok) {
          const [healthJson, weightJson] = await Promise.all([
            healthResponse.json(),
            weightResponse.json()
          ]);

          setHealthData(healthJson);
          setRawWeightData(weightJson);
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
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    console.log('Calculated averages:', averages);
    return averages;
  };

  // Early return for loading state
  if (isLoading) {
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

  const heartRateData = {
    labels: dailyAverages.map(d => new Date(d.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric' 
    })),
    datasets: [
      {
        label: 'Average Heart Rate (bpm)',
        data: dailyAverages.map(d => d.average),
        borderColor: '#f59e0b',
        backgroundColor: '#f59e0b',
        tension: 0.4,
      },
    ],
  };

  const weightChartData = {
    labels: weightAverages.map(d => d.date),
    datasets: [{
      label: 'Weight (kg)',
      data: weightAverages.map(d => d.average),
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
      tension: 0.1
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        {/* Heart Rate Chart */}
        {dailyAverages.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-4 h-[400px]">
            <h3 className="text-lg font-medium text-gray-700 mb-4 font-mono">Daily Average Heart Rate</h3>
            <div className="relative h-[calc(100%-3rem)] w-full">
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
          <div className="bg-white rounded-xl shadow-lg p-4 h-[400px]">
            <h3 className="text-lg font-medium text-gray-700 mb-4 font-mono">Body Weight</h3>
            <div className="relative h-[calc(100%-3rem)] w-full">
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
                          const dataPoint = weightAverages[context.dataIndex];
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
      </div>
    </main>
  );
}
