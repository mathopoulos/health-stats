'use client';

import { LineChart, Line, ResponsiveContainer } from 'recharts';

const demoHRVData = [
  { date: '2024-01', value: 45 },
  { date: '2024-02', value: 48 },
  { date: '2024-03', value: 52 },
  { date: '2024-04', value: 49 },
  { date: '2024-05', value: 55 },
  { date: '2024-06', value: 53 },
  { date: '2024-07', value: 58 }
];

const demoVO2MaxData = [
  { date: '2024-01', value: 42 },
  { date: '2024-02', value: 42.5 },
  { date: '2024-03', value: 43 },
  { date: '2024-04', value: 43.2 },
  { date: '2024-05', value: 43.5 },
  { date: '2024-06', value: 44 },
  { date: '2024-07', value: 44.2 }
];

export default function Home() {
    return (
    <main className="min-h-screen bg-[#0A0B1E] text-white overflow-hidden">
      {/* Hero Section */}
      <div className="relative">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/20 to-transparent pointer-events-none" />
        
        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          {/* Rocket Icon */}
          <div className="flex justify-center mb-8">
            <div className="text-4xl animate-bounce">🚀</div>
        </div>

          {/* Main Title */}
          <h1 className="text-center">
            <span className="block text-5xl md:text-6xl font-bold mb-4">
              Share Your Health
                      </span>
            <span className="block text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
              Like a Main Character
                      </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-8 text-xl text-center text-gray-300 max-w-3xl mx-auto">
            Join the movement of radical health transparency. Track your metrics, share your wins, inspire your community.
          </p>
          <p className="mt-4 text-lg text-center text-indigo-400 font-medium">
            No gatekeeping, just vibes ✨
          </p>

          {/* CTA Buttons */}
          <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
            <a href="/upload" className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-300">
              Start Your Story →
            </a>
            <button className="inline-flex items-center justify-center px-8 py-3 border border-gray-700 text-base font-medium rounded-lg text-gray-300 hover:bg-gray-800 transition-colors duration-300">
              Explore
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>

          {/* Demo Charts */}
          <div className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* HRV Chart */}
            <div className="bg-gray-900/50 backdrop-blur rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-medium text-gray-300 mb-2">Heart Rate Variability</h3>
              <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={demoHRVData}>
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#6366F1"
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#6366F1' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                </div>
              </div>

              {/* VO2 Max Chart */}
            <div className="bg-gray-900/50 backdrop-blur rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-medium text-gray-300 mb-2">VO2 Max</h3>
              <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={demoVO2MaxData}>
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#8B5CF6"
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#8B5CF6' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
              </div>
                </div>
              </div>

          {/* Features Grid */}
          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-900/30 backdrop-blur rounded-xl p-6 border border-gray-800/50">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
              <h3 className="text-lg font-semibold mb-2">Track Everything</h3>
              <p className="text-gray-400">Monitor your health metrics from HRV to blood markers, all in one place.</p>
              </div>

            {/* Feature 2 */}
            <div className="bg-gray-900/30 backdrop-blur rounded-xl p-6 border border-gray-800/50">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
              <h3 className="text-lg font-semibold mb-2">Share Progress</h3>
              <p className="text-gray-400">Build in public and inspire others with your health journey.</p>
              </div>
              
            {/* Feature 3 */}
            <div className="bg-gray-900/30 backdrop-blur rounded-xl p-6 border border-gray-800/50">
              <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                  </div>
              <h3 className="text-lg font-semibold mb-2">Optimize Health</h3>
              <p className="text-gray-400">Get insights and optimize your health with data-driven decisions.</p>
                </div>
                  </div>
                </div>
                </div>

      {/* Footer */}
      <footer className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-between items-center">
            <p className="text-gray-400">© 2024 OpenHealth. All rights reserved.</p>
            <div className="flex items-center space-x-6">
              <a href="#" className="text-gray-400 hover:text-gray-300 transition-colors">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-gray-300 transition-colors">Terms</a>
              <a href="#" className="text-gray-400 hover:text-gray-300 transition-colors">Contact</a>
                  </div>
                </div>
                  </div>
      </footer>
      </main>
  );
}