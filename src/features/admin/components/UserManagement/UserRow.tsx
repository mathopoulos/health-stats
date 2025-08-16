import type { UserData } from '../../types';
import { formatDate, getUserDisplayName, getUserInitial } from '../../utils';

interface UserRowProps {
  user: UserData;
  onDeleteClick: (user: UserData) => void;
  deletingUserId: string | null;
}

export function UserRow({ user, onDeleteClick, deletingUserId }: UserRowProps) {
  const isDeleting = deletingUserId === user.userId;

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            {user.profileImage ? (
              <img
                className="h-10 w-10 rounded-full"
                src={user.profileImage}
                alt=""
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {getUserInitial(user)}
                </span>
              </div>
            )}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {getUserDisplayName(user)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {user.email}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">
              {user.userId}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900 dark:text-white">
          <div className="flex space-x-4">
            <span className="text-xs">Blood: {user.dataCounts.bloodMarkers}</span>
            <span className="text-xs">Protocols: {user.dataCounts.healthProtocols}</span>
            <span className="text-xs">Jobs: {user.dataCounts.processingJobs}</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Total: {user.dataCounts.total}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          user.dashboardPublished
            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        }`}>
          {user.dashboardPublished ? 'Published' : 'Private'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {formatDate(user.createdAt)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button
          onClick={() => onDeleteClick(user)}
          disabled={isDeleting}
          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </td>
    </tr>
  );
}
