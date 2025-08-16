import type { AdminStats } from '../../types';

interface UserStatsProps {
  stats: AdminStats;
}

export function UserStats({ stats }: UserStatsProps) {
  return (
    <div className="mb-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {stats.totalUsers}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.publishedDashboards}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Published Dashboards</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.totalBloodMarkers}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Blood Markers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.totalDataPoints}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Data Points</div>
          </div>
        </div>
      </div>
    </div>
  );
}
