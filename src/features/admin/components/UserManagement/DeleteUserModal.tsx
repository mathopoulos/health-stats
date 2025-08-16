import type { DeleteConfirmation } from '../../types';
import { generateDeleteConfirmationText, getUserDisplayName } from '../../utils';

interface DeleteUserModalProps {
  deleteConfirmation: DeleteConfirmation;
  onConfirm: () => void;
  onCancel: () => void;
  onConfirmationTextChange: (text: string) => void;
  isDeleting: boolean;
}

export function DeleteUserModal({
  deleteConfirmation,
  onConfirm,
  onCancel,
  onConfirmationTextChange,
  isDeleting
}: DeleteUserModalProps) {
  if (!deleteConfirmation.isOpen || !deleteConfirmation.user) {
    return null;
  }

  const user = deleteConfirmation.user;
  const expectedText = generateDeleteConfirmationText(user);
  const isConfirmDisabled = deleteConfirmation.confirmationText !== expectedText || isDeleting;
  const displayName = getUserDisplayName(user);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" 
          onClick={onCancel}
          aria-hidden="true"
        />

        {/* Dialog */}
        <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:max-w-lg sm:w-full">
          <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                  Delete User Account
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    This will permanently delete the account for{' '}
                    <span className="font-semibold">{displayName}</span>
                    {' '}and all associated data. This action cannot be undone.
                  </p>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      Data to be deleted:
                    </p>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• {user.dataCounts.bloodMarkers} blood markers</li>
                      <li>• {user.dataCounts.healthProtocols} health protocols</li>
                      <li>• {user.dataCounts.processingJobs} processing jobs</li>
                      <li>• All uploaded files and profile images</li>
                    </ul>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      To confirm, type{' '}
                      <span className="font-mono font-semibold text-red-600 dark:text-red-400">
                        {expectedText}
                      </span>
                      {' '}in the box below:
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmation.confirmationText}
                      onChange={(e) => onConfirmationTextChange(e.target.value)}
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm px-3 py-2"
                      placeholder={expectedText}
                      disabled={isDeleting}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              disabled={isConfirmDisabled}
              className="inline-flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onConfirm}
            >
              {isDeleting ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Deleting...
                </>
              ) : (
                'Delete User'
              )}
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
              onClick={onCancel}
              disabled={isDeleting}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
