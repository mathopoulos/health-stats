'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [editDate, setEditDate] = useState<Date | null>(null);
  const [editMarkers, setEditMarkers] = useState<BloodMarker[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

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

  const toggleExpandEntry = (entryId: string) => {
    setExpandedEntry(prevId => prevId === entryId ? null : entryId);
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

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Blood Marker History
      </h3>
      
      <div className="space-y-4">
        {entries.map(entry => (
          <div key={entry._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div 
              className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
              onClick={() => toggleExpandEntry(entry._id)}
            >
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {new Date(entry.date).toLocaleDateString(undefined, { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {entry.markers.length} markers
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditEntry(entry);
                  }}
                  className="p-2 text-gray-400 hover:text-indigo-500 dark:text-gray-500 dark:hover:text-indigo-400 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteEntry(entry._id);
                  }}
                  className="p-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <svg 
                  className={`w-5 h-5 text-gray-400 transition-transform ${expandedEntry === entry._id ? 'transform rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {expandedEntry === entry._id && (
              <div className="border-t border-gray-100 dark:border-gray-700">
                <div className="p-4">
                  <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Categories</h5>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {Array.from(new Set(entry.markers.map(marker => marker.category))).map(category => (
                      <span 
                        key={category} 
                        className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 text-xs rounded-full"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                  
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                    <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Markers</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {entry.markers.map((marker, idx) => (
                        <div 
                          key={idx}
                          className="p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg"
                        >
                          <h6 className="font-medium text-gray-900 dark:text-white">{marker.name}</h6>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-sm text-gray-500 dark:text-gray-400">{marker.category}</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200">
                              {marker.value} {marker.unit}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
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