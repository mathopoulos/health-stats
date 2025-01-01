'use client';

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
import { UserCircleIcon } from '@heroicons/react/24/solid';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Generate fake data for the charts
const generateData = (count: number, min: number, max: number) => {
  return Array.from({ length: count }, () =>
    Math.floor(Math.random() * (max - min + 1) + min)
  );
};

const dates = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - i);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}).reverse();

export default function Home() {
  const chartOptions = {
    responsive: true,
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

  const bodyCompositionData = {
    labels: dates,
    datasets: [
      {
        label: 'Weight (kg)',
        data: generateData(7, 70, 75),
        borderColor: '#6366f1',
        backgroundColor: '#6366f1',
        tension: 0.4,
      },
      {
        label: 'BMI',
        data: generateData(7, 21, 23),
        borderColor: '#f43f5e',
        backgroundColor: '#f43f5e',
        tension: 0.4,
      },
    ],
  };

  const sleepData = {
    labels: dates,
    datasets: [
      {
        label: 'Sleep Duration (hours)',
        data: generateData(7, 6, 9),
        borderColor: '#8b5cf6',
        backgroundColor: '#8b5cf6',
        tension: 0.4,
      },
    ],
  };

  const stepsData = {
    labels: dates,
    datasets: [
      {
        label: 'Daily Steps',
        data: generateData(7, 5000, 12000),
        borderColor: '#10b981',
        backgroundColor: '#10b981',
        tension: 0.4,
      },
    ],
  };

  const hrvData = {
    labels: dates,
    datasets: [
      {
        label: 'HRV (ms)',
        data: generateData(7, 40, 70),
        borderColor: '#f59e0b',
        backgroundColor: '#f59e0b',
        tension: 0.4,
      },
    ],
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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.04)] hover:shadow-[0_0_25px_rgba(0,0,0,0.06)] transition-shadow">
          <h2 className="text-xl font-mono font-bold mb-6 text-gray-800">Body Composition</h2>
          <Line options={chartOptions} data={bodyCompositionData} />
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.04)] hover:shadow-[0_0_25px_rgba(0,0,0,0.06)] transition-shadow">
          <h2 className="text-xl font-mono font-bold mb-6 text-gray-800">Sleep Quality</h2>
          <Line options={chartOptions} data={sleepData} />
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.04)] hover:shadow-[0_0_25px_rgba(0,0,0,0.06)] transition-shadow">
          <h2 className="text-xl font-mono font-bold mb-6 text-gray-800">Daily Steps</h2>
          <Line options={chartOptions} data={stepsData} />
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.04)] hover:shadow-[0_0_25px_rgba(0,0,0,0.06)] transition-shadow">
          <h2 className="text-xl font-mono font-bold mb-6 text-gray-800">Heart Rate Variability</h2>
          <Line options={chartOptions} data={hrvData} />
        </div>
      </div>
    </main>
  );
}
