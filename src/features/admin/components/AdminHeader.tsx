import ThemeToggle from '@components/ThemeToggle';

interface AdminHeaderProps {
  userEmail: string;
}

export function AdminHeader({ userEmail }: AdminHeaderProps) {
  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Admin - User Management
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage all user accounts
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {userEmail}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
