import React from 'react';

interface Column<T> {
  key: string;
  title: string;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  selectable?: boolean;
  selectedItems?: Set<string>;
  onSelectItem?: (itemId: string) => void;
  onSelectAll?: () => void;
  getItemId?: (item: T) => string;
  className?: string;
}

export default function DataTable<T>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No data available',
  selectable = false,
  selectedItems = new Set(),
  onSelectItem,
  onSelectAll,
  getItemId,
  className = '',
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        <span className="ml-2 text-gray-500 dark:text-gray-400">Loading...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  const allSelected = data.length > 0 && getItemId && selectedItems.size === data.length;

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            {selectable && (
              <th scope="col" className="px-2 py-3">
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 text-indigo-500 focus:ring-indigo-400 focus:ring-opacity-50 focus:ring-offset-0 border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                    checked={allSelected}
                    onChange={onSelectAll}
                  />
                </div>
              </th>
            )}
            {columns.map((column) => (
              <th 
                key={column.key}
                scope="col" 
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${column.className || ''}`}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((item, index) => {
            const itemId = getItemId ? getItemId(item) : index.toString();
            const isSelected = selectedItems.has(itemId);
            
            return (
              <tr 
                key={itemId}
                className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/30'} ${
                  isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                }`}
              >
                {selectable && (
                  <td className="px-2 py-4">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 text-indigo-500 focus:ring-indigo-400 focus:ring-opacity-50 focus:ring-offset-0 border-gray-300 dark:border-gray-600 rounded cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
                        checked={isSelected}
                        onChange={() => onSelectItem?.(itemId)}
                      />
                    </div>
                  </td>
                )}
                {columns.map((column) => (
                  <td 
                    key={column.key}
                    className={`px-6 py-4 whitespace-nowrap text-sm ${column.className || 'text-gray-900 dark:text-white'}`}
                  >
                    {column.render ? column.render(item, index) : String((item as any)[column.key] || '')}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
