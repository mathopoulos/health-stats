'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface BloodMarker {
  name: string;
  value: number;
  unit: string;
  category: string;
  flag?: 'High' | 'Low' | null;
}

interface BloodMarkerEntry {
  _id: string;
  userId: string;
  date: string;
  markers: BloodMarker[];
  createdAt: string;
  updatedAt: string;
}

export default function BloodMarkerHistory() {
  const { data: session } = useSession();
  const router = useRouter();
  const [entries, setEntries] = useState<BloodMarkerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<BloodMarkerEntry | null>(null);
  const [editDate, setEditDate] = useState<Date | null>(null);
  const [editMarkers, setEditMarkers] = useState<BloodMarker[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  const [nameFilter, setNameFilter] = useState<string>('');
  const [categoryFilter, setcategoryFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<Date | null>(null);

  // Memoize the fetchBloodMarkers function to avoid recreating it on every render
  const fetchBloodMarkers = useCallback(async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/blood-markers?userId=${session.user.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch blood markers');
      }
      
      const data = await response.json();
      if (data.success) {
        setEntries(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to fetch blood markers');
      }
    } catch (error) {
      console.error('Error fetching blood markers:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch blood markers');
      toast.error('Failed to fetch blood markers');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Fetch data when component mounts or session changes
  useEffect(() => {
    fetchBloodMarkers();
  }, [fetchBloodMarkers, lastRefresh]);

  // Listen for blood marker added event
  useEffect(() => {
    // Function to handle the custom event
    const handleBloodMarkerAdded = () => {
      console.log('Blood marker added event detected, refreshing history');
      setLastRefresh(Date.now()); // Update lastRefresh to trigger a re-fetch
    };

    // Add event listener for custom event
    window.addEventListener('bloodMarkerAdded', handleBloodMarkerAdded);
    
    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener('bloodMarkerAdded', handleBloodMarkerAdded);
    };
  }, []);

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/blood-markers/${entryId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete entry');
      }
      
      const data = await response.json();
      if (data.success) {
        toast.success('Entry deleted successfully');
        // Remove the deleted entry from state
        setEntries(prev => prev.filter(entry => entry._id !== entryId));
        
        // Notify other components about the change
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('bloodMarkerAdded'));
        }
      } else {
        throw new Error(data.error || 'Failed to delete entry');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete entry');
    }
  };

  // New function to delete a single biomarker from an entry
  const handleDeleteSingleMarker = async (entryId: string, markerName: string) => {
    if (!confirm(`Are you sure you want to delete the ${markerName} marker? This action cannot be undone.`)) {
      return;
    }
    
    try {
      // Find the entry containing this marker
      const entry = entries.find(e => e._id === entryId);
      if (!entry) {
        throw new Error('Entry not found');
      }
      
      // Filter out the marker to delete
      const updatedMarkers = entry.markers.filter(marker => marker.name !== markerName);
      
      // If no markers left, delete the entire entry
      if (updatedMarkers.length === 0) {
        return handleDeleteEntry(entryId);
      }
      
      // Otherwise, update the entry with the remaining markers
      const response = await fetch(`/api/blood-markers/${entryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: entry.date,
          markers: updatedMarkers,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update entry');
      }
      
      const data = await response.json();
      if (data.success) {
        toast.success(`${markerName} marker deleted successfully`);
        
        // Update the entry in state
        setEntries(prev => 
          prev.map(e => 
            e._id === entryId ? { ...e, markers: updatedMarkers } : e
          )
        );
        
        // Notify other components about the change
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('bloodMarkerAdded'));
        }
      } else {
        throw new Error(data.error || 'Failed to update entry');
      }
    } catch (error) {
      console.error('Error deleting marker:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete marker');
    }
  };

  const handleEditEntry = (entry: BloodMarkerEntry) => {
    setEditingEntry(entry);
    setEditDate(new Date(entry.date));
    setEditMarkers([...entry.markers]);
    setShowEditModal(true);
  };

  const handleUpdateEntry = async () => {
    if (!editingEntry || !editDate) return;
    
    try {
      const response = await fetch(`/api/blood-markers/${editingEntry._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: editDate,
          markers: editMarkers,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update entry');
      }
      
      const data = await response.json();
      if (data.success) {
        toast.success('Entry updated successfully');
        // Update the entry in state
        setEntries(prev => 
          prev.map(entry => 
            entry._id === editingEntry._id ? data.data : entry
          )
        );
        setShowEditModal(false);
        
        // Notify other components about the change
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('bloodMarkerAdded'));
        }
      } else {
        throw new Error(data.error || 'Failed to update entry');
      }
    } catch (error) {
      console.error('Error updating entry:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update entry');
    }
  };

  const handleMarkerValueChange = (index: number, value: string) => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return;
    
    setEditMarkers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], value: numericValue };
      return updated;
    });
  };

  // Transform data for flat table view (one row per biomarker per date)
  const getFlatTableData = useCallback(() => {
    // Create an array to hold all biomarker readings
    const flatData: Array<{
      name: string;
      category: string;
      unit: string;
      date: string;
      value: number;
      entryId: string;
    }> = [];

    // Process each entry
    entries.forEach(entry => {
      entry.markers.forEach(marker => {
        flatData.push({
          name: marker.name,
          category: marker.category,
          unit: marker.unit,
          date: entry.date,
          value: marker.value,
          entryId: entry._id
        });
      });
    });

    // Sort by biomarker name and then by date (newest first)
    return flatData.sort((a, b) => {
      // First sort by category
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      // Then by name
      if (a.name !== b.name) {
        return a.name.localeCompare(b.name);
      }
      // Then by date (newest first)
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [entries]);

  // New function to format dates for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Function to get the entry ID for a specific date (for editing)
  const getEntryIdForDate = (date: string) => {
    const entry = entries.find(e => e.date === date);
    return entry?._id;
  };

  // Get unique categories for filter dropdown
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    entries.forEach(entry => {
      entry.markers.forEach(marker => {
        if (marker.category) categories.add(marker.category);
      });
    });
    return Array.from(categories).sort();
  }, [entries]);

  // Get unique biomarker names for name filter dropdown
  const uniqueBiomarkerNames = useMemo(() => {
    const names = new Set<string>();
    entries.forEach(entry => {
      entry.markers.forEach(marker => {
        if (marker.name) names.add(marker.name);
      });
    });
    return Array.from(names).sort();
  }, [entries]);

  // Apply filters to the flat table data
  const getFilteredData = useCallback(() => {
    const flatData = getFlatTableData();
    
    return flatData.filter(item => {
      // Filter by name (case insensitive)
      if (nameFilter && item.name !== nameFilter) {
        return false;
      }
      
      // Filter by category
      if (categoryFilter && item.category !== categoryFilter) {
        return false;
      }
      
      // Filter by date
      if (dateFilter) {
        const itemDate = new Date(item.date);
        const filterDate = new Date(dateFilter);
        
        // Compare year, month, and day
        if (
          itemDate.getFullYear() !== filterDate.getFullYear() ||
          itemDate.getMonth() !== filterDate.getMonth() ||
          itemDate.getDate() !== filterDate.getDate()
        ) {
          return false;
        }
      }
      
      return true;
    });
  }, [getFlatTableData, nameFilter, categoryFilter, dateFilter]);

  // Function to clear all filters
  const clearFilters = () => {
    setNameFilter('');
    setcategoryFilter('');
    setDateFilter(null);
  };

  if (loading) {
    return (
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
        <p className="text-center text-gray-500 dark:text-gray-400 mt-2">Loading your blood marker history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-400">
        <p className="text-center">{error}</p>
        <button 
          onClick={fetchBloodMarkers}
          className="mt-2 mx-auto block px-4 py-2 bg-red-100 dark:bg-red-800/30 rounded-lg hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="mt-8 p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-center text-gray-500 dark:text-gray-400">
          No blood marker history found. Upload a blood test PDF or add markers manually to get started.
        </p>
      </div>
    );
  }

  // Prepare data for flat table view with filters applied
  const filteredData = getFilteredData();

  return (
    <div className="mt-8">
      {/* Filters Section */}
      <div className="mb-4">
        <div className="flex items-center gap-3">
          {/* Biomarker Name Filter */}
          <div className="relative w-48">
            <select
              id="nameFilter"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white bg-transparent"
            >
              <option value="">All Biomarkers</option>
              {uniqueBiomarkerNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <svg className="absolute left-2 top-1.5 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          {/* Category Filter */}
          <div className="w-48">
            <select
              id="categoryFilter"
              value={categoryFilter}
              onChange={(e) => setcategoryFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white bg-transparent"
            >
              <option value="">All Categories</option>
              {uniqueCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          {/* Date Filter */}
          <div className="w-48">
            <DatePicker
              id="dateFilter"
              selected={dateFilter}
              onChange={(date: Date | null) => setDateFilter(date)}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white bg-transparent"
              placeholderText="Filter by date"
              dateFormat="MMM d, yyyy"
              isClearable
            />
          </div>
          
          {/* Clear Filters Button - Only shown when filters are applied */}
          {(nameFilter || categoryFilter || dateFilter) && (
            <div className="ml-auto">
              <button 
                onClick={clearFilters}
                className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 focus:outline-none transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Table View */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-700 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Biomarker
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Unit
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Value
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredData.length > 0 ? (
                filteredData.map((item, idx) => (
                  <tr 
                    key={`${item.name}-${item.date}-${idx}`} 
                    className={idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/30'}
                  >
                    <td className="sticky left-0 z-10 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-800">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {formatDate(item.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {item.value}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => {
                            const entry = entries.find(e => e._id === item.entryId);
                            if (entry) handleEditEntry(entry);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleDeleteSingleMarker(item.entryId, item.name)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No blood markers match your filter criteria.
                    <button 
                      onClick={clearFilters}
                      className="ml-2 text-indigo-500 dark:text-indigo-400 hover:underline"
                    >
                      Clear filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Edit Modal */}
      {showEditModal && editingEntry && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Edit Blood Marker Entry
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Test Date
                </label>
                <DatePicker
                  selected={editDate}
                  onChange={(date: Date | null) => date && setEditDate(date)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                  dateFormat="MM/dd/yyyy"
                  maxDate={new Date()}
                />
              </div>
              
              <div className="space-y-4 mt-6 max-h-[50vh] overflow-y-auto pr-2">
                {editMarkers.map((marker, index) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white">{marker.name}</h5>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{marker.category}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={marker.value}
                          onChange={(e) => handleMarkerValueChange(index, e.target.value)}
                          className="w-20 p-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                        />
                        <span className="text-sm text-gray-500 dark:text-gray-400">{marker.unit}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateEntry}
                  className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 