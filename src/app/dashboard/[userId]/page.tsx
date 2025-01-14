'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HealthData {
  date: string;
  value: number;
}

interface BloodMarker {
  date: string;
  markers: Array<{
    name: string;
    value: number;
    unit: string;
    referenceRange?: {
      low: number;
      high: number;
    };
  }>;
}

export default function UserDashboard() {
  const params = useParams();
  const userId = params.userId as string;
  const [heartRateData, setHeartRateData] = useState<HealthData[]>([]);
  const [weightData, setWeightData] = useState<HealthData[]>([]);
  const [bodyFatData, setBodyFatData] = useState<HealthData[]>([]);
  const [hrvData, setHrvData] = useState<HealthData[]>([]);
  const [vo2maxData, setVo2maxData] = useState<HealthData[]>([]);
  const [bloodMarkers, setBloodMarkers] = useState<BloodMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch all health data types
        const types = ['heartRate', 'weight', 'bodyFat', 'hrv', 'vo2max'];
        const responses = await Promise.all(
          types.map(type =>
            fetch(`/api/health-data?type=${type}&userId=${userId}`).then(res => res.json())
          )
        );

        // Set data for each type
        responses.forEach((response, index) => {
          if (response.success) {
            switch (types[index]) {
              case 'heartRate':
                setHeartRateData(response.data);
                break;
              case 'weight':
                setWeightData(response.data);
                break;
              case 'bodyFat':
                setBodyFatData(response.data);
                break;
              case 'hrv':
                setHrvData(response.data);
                break;
              case 'vo2max':
                setVo2maxData(response.data);
                break;
            }
          }
        });

        // Fetch blood markers
        const bloodMarkersResponse = await fetch(`/api/blood-markers?userId=${userId}`);
        const bloodMarkersData = await bloodMarkersResponse.json();
        if (bloodMarkersData.success) {
          setBloodMarkers(bloodMarkersData.data);
        }

      } catch (err) {
        setError('Failed to fetch health data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchData();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-2 text-gray-600">Loading health data...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="text-red-600">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Heart Rate Chart */}
        {heartRateData.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Heart Rate</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={heartRateData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    formatter={(value: number) => [`${value} bpm`, 'Heart Rate']}
                  />
                  <Line type="monotone" dataKey="value" stroke="#6366f1" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Weight Chart */}
        {weightData.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Weight</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    formatter={(value: number) => [`${value} kg`, 'Weight']}
                  />
                  <Line type="monotone" dataKey="value" stroke="#10b981" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Body Fat Chart */}
        {bodyFatData.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Body Fat Percentage</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bodyFatData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    formatter={(value: number) => [`${value}%`, 'Body Fat']}
                  />
                  <Line type="monotone" dataKey="value" stroke="#f59e0b" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* HRV Chart */}
        {hrvData.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Heart Rate Variability</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hrvData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    formatter={(value: number) => [`${value} ms`, 'HRV']}
                  />
                  <Line type="monotone" dataKey="value" stroke="#8b5cf6" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* VO2 Max Chart */}
        {vo2maxData.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-medium text-gray-900 mb-4">VO2 Max</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vo2maxData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    formatter={(value: number) => [`${value} mL/kg/min`, 'VO2 Max']}
                  />
                  <Line type="monotone" dataKey="value" stroke="#ec4899" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Blood Markers */}
        {bloodMarkers.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Blood Test Results</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marker
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference Range
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bloodMarkers.map((entry, entryIndex) =>
                    entry.markers.map((marker, markerIndex) => (
                      <tr key={`${entryIndex}-${markerIndex}`}>
                        {markerIndex === 0 && (
                          <td
                            rowSpan={entry.markers.length}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                          >
                            {new Date(entry.date).toLocaleDateString()}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {marker.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {marker.value} {marker.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {marker.referenceRange
                            ? `${marker.referenceRange.low} - ${marker.referenceRange.high} ${marker.unit}`
                            : 'N/A'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No Data Message */}
        {!heartRateData.length && !weightData.length && !bodyFatData.length && 
         !hrvData.length && !vo2maxData.length && !bloodMarkers.length && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-center text-gray-500">
              No health data available yet. Upload your Apple Health export or add blood test results to see your data.
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 