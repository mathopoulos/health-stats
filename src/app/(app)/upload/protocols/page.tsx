'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import AddWorkoutProtocolModal from '@features/experiments/components/AddWorkoutProtocolModal';
import AddSupplementProtocolModal from '@features/experiments/components/AddSupplementProtocolModal';
import AddExperimentModal from '@features/experiments/components/AddExperimentModal';
import EditExperimentModal from '@features/experiments/components/EditExperimentModal';
import EditSupplementProtocolModal from '@features/experiments/components/EditSupplementProtocolPopover';
import { ProtocolsTab, DesktopNavigation, MobileNavigation, MobileHeader } from '@features/upload/components';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY
): Promise<T | void> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetchFn();
    } catch (error) {
      console.log(`Attempt ${i + 1} failed:`, error);
      if (i === retries - 1) {
        console.error('All retry attempts failed');
        return;
      }
      await sleep(delay * Math.pow(2, i)); // Exponential backoff
    }
  }
}

export default function ProtocolsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  
  // Diet protocol state
  const [currentDiet, setCurrentDiet] = useState<string>('');
  const [isSavingProtocol, setIsSavingProtocol] = useState(false);
  
  // Workout protocol state
  const [workoutProtocols, setWorkoutProtocols] = useState<Array<{
    type: string;
    frequency: number;
  }>>([]);
  const [isSavingWorkoutProtocol, setIsSavingWorkoutProtocol] = useState(false);
  const [isAddWorkoutProtocolModalOpen, setIsAddWorkoutProtocolModalOpen] = useState(false);
  const [editingWorkoutType, setEditingWorkoutType] = useState<string | null>(null);

  // Supplement protocol state
  const [supplementProtocols, setSupplementProtocols] = useState<Array<{
    type: string;
    frequency: string;
    dosage: string;
    unit: string;
  }>>([]);
  const [isSavingSupplementProtocol, setIsSavingSupplementProtocol] = useState(false);
  const [isAddSupplementProtocolModalOpen, setIsAddSupplementProtocolModalOpen] = useState(false);
  const [editingSupplementProtocol, setEditingSupplementProtocol] = useState<{
    type: string;
    frequency: string;
    dosage: string;
    unit: string;
  } | null>(null);
  const [isEditSupplementProtocolModalOpen, setIsEditSupplementProtocolModalOpen] = useState(false);

  // Experiment state
  const [experiments, setExperiments] = useState<Array<{
    id: string;
    name: string;
    description: string;
    frequency: string;
    duration: string;
    fitnessMarkers: string[];
    bloodMarkers: string[];
    status: 'active' | 'completed' | 'paused';
    createdAt: string;
  }>>([]);
  const [isSavingExperiment, setIsSavingExperiment] = useState(false);
  const [isAddExperimentModalOpen, setIsAddExperimentModalOpen] = useState(false);
  const [isLoadingExperiments, setIsLoadingExperiments] = useState(false);
  const [isEditExperimentModalOpen, setIsEditExperimentModalOpen] = useState(false);
  const [editingExperiment, setEditingExperiment] = useState<{
    id: string;
    name: string;
    description: string;
    frequency: string;
    duration: string;
    fitnessMarkers: string[];
    bloodMarkers: string[];
    status: 'active' | 'completed' | 'paused';
    createdAt: string;
  } | null>(null);

  const [status, setStatus] = useState<string>('');

  // Fix session race condition in preview deployments
  useEffect(() => {
    if (sessionStatus === 'authenticated' && !session?.user?.id) {
      console.log('Session authenticated but missing user ID, forcing refresh...');
      window.location.reload();
      return;
    }
  }, [session, sessionStatus]);

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (!session?.user?.id) return;

    const fetchCurrentDiet = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch(`/api/health-protocols?protocolType=diet&activeOnly=true&userId=${session.user.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.length > 0) {
            setCurrentDiet(data.data[0].protocol || '');
          }
        }
      } catch (error) {
        console.error('Error fetching current diet:', error);
      }
    };

    const fetchCurrentWorkoutProtocols = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch(`/api/health-protocols?protocolType=exercise&activeOnly=true&userId=${session.user.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.length > 0) {
            const protocolData = JSON.parse(data.data[0].protocol);
            setWorkoutProtocols(protocolData.workouts || []);
          }
        }
      } catch (error) {
        console.error('Error fetching current workout protocols:', error);
      }
    };

    const fetchCurrentSupplementProtocols = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch(`/api/health-protocols?protocolType=supplement&activeOnly=true&userId=${session.user.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.length > 0) {
            const protocolData = JSON.parse(data.data[0].protocol);
            setSupplementProtocols(protocolData.supplements || []);
          }
        }
      } catch (error) {
        console.error('Error fetching current supplement protocols:', error);
      }
    };

    const fetchExperiments = async () => {
      if (!session?.user?.id) return;
      
      setIsLoadingExperiments(true);
      try {
        const timestamp = Date.now();
        const response = await fetch(`/api/experiments?userId=${session.user.id}&t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setExperiments(data.data);
          }
        }
      } catch (error) {
        console.error('Error fetching experiments:', error);
      } finally {
        setIsLoadingExperiments(false);
      }
    };

    // Use retry mechanism for session-dependent data fetching
    fetchWithRetry(fetchCurrentDiet);
    fetchWithRetry(fetchCurrentWorkoutProtocols);
    fetchWithRetry(fetchCurrentSupplementProtocols);
    fetchWithRetry(fetchExperiments);
  }, [session?.user?.id, sessionStatus]);

  // Diet protocol handlers
  const handleDietChange = async (newDiet: string) => {
    if (newDiet === currentDiet) return;
    
    setIsSavingProtocol(true);
    setCurrentDiet(newDiet);
    
    try {
      const response = await fetch('/api/health-protocols', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          protocolType: 'diet',
          protocol: newDiet,
          startDate: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save diet protocol');
      }

      setStatus('Diet protocol updated successfully');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Error updating diet protocol:', error);
      setCurrentDiet(currentDiet); // Revert on error
      setStatus(error instanceof Error ? error.message : 'Failed to update diet protocol');
      setTimeout(() => setStatus(''), 3000);
    } finally {
      setIsSavingProtocol(false);
    }
  };

  // Workout protocol handlers
  const addWorkoutProtocol = (type: string) => {
    if (!workoutProtocols.find(w => w.type === type)) {
      setWorkoutProtocols(prev => [...prev, { type, frequency: 2 }]);
    }
  };

  const removeWorkoutProtocol = async (type: string) => {
    const updatedProtocols = workoutProtocols.filter(w => w.type !== type);
    setWorkoutProtocols(updatedProtocols);
    
    try {
      const response = await fetch('/api/health-protocols', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          protocolType: 'exercise',
          protocol: JSON.stringify({ workouts: updatedProtocols }),
          startDate: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove workout protocol');
      }

      setStatus('Workout protocol removed successfully');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Error removing workout protocol:', error);
      setWorkoutProtocols(workoutProtocols);
      setStatus(error instanceof Error ? error.message : 'Failed to remove workout protocol');
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const updateWorkoutProtocolFrequency = async (type: string, newFrequency: number) => {
    const originalFrequency = workoutProtocols.find(w => w.type === type)?.frequency || 2;
    
    setWorkoutProtocols(prev => 
      prev.map(w => 
        w.type === type 
          ? { ...w, frequency: newFrequency }
          : w
      )
    );

    try {
      const updatedProtocols = workoutProtocols.map(w => 
        w.type === type 
          ? { ...w, frequency: newFrequency }
          : w
      );

      const response = await fetch('/api/health-protocols', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          protocolType: 'exercise',
          protocol: JSON.stringify({ workouts: updatedProtocols }),
          startDate: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update workout protocol');
      }

      setStatus('Workout protocol updated successfully');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Error updating workout protocol:', error);
      setWorkoutProtocols(prev => 
        prev.map(w => 
          w.type === type 
            ? { ...w, frequency: originalFrequency }
            : w
        )
      );
      setStatus(error instanceof Error ? error.message : 'Failed to update workout protocol');
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const handleSaveWorkoutProtocols = async (newProtocols: Array<{ type: string; frequency: number }>) => {
    setIsSavingWorkoutProtocol(true);
    
    try {
      const updatedProtocols = [...workoutProtocols];
      
      newProtocols.forEach(newProtocol => {
        const existingIndex = updatedProtocols.findIndex(p => p.type === newProtocol.type);
        if (existingIndex >= 0) {
          updatedProtocols[existingIndex] = newProtocol;
        } else {
          updatedProtocols.push(newProtocol);
        }
      });

      const response = await fetch('/api/health-protocols', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          protocolType: 'exercise',
          protocol: JSON.stringify({ workouts: updatedProtocols }),
          startDate: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save workout protocols');
      }

      setWorkoutProtocols(updatedProtocols);
      setStatus('Workout protocols updated successfully');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Error updating workout protocols:', error);
      setStatus(error instanceof Error ? error.message : 'Failed to update workout protocols');
      setTimeout(() => setStatus(''), 3000);
    } finally {
      setIsSavingWorkoutProtocol(false);
    }
  };

  // Supplement protocol handlers
  const addSupplementProtocol = (type: string, frequency: string, dosage: string, unit: string) => {
    if (!supplementProtocols.find(s => s.type === type)) {
      setSupplementProtocols(prev => [...prev, { type, frequency, dosage, unit }]);
    }
  };

  const updateSupplementProtocol = async (type: string, field: string, newValue: string) => {
    const originalProtocol = supplementProtocols.find(s => s.type === type);
    if (!originalProtocol) return;

    setSupplementProtocols(prev => 
      prev.map(s => 
        s.type === type 
          ? { ...s, [field]: newValue }
          : s
      )
    );

    try {
      const updatedProtocols = supplementProtocols.map(s => 
        s.type === type 
          ? { ...s, [field]: newValue }
          : s
      );

      const response = await fetch('/api/health-protocols', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          protocolType: 'supplement',
          protocol: JSON.stringify({ supplements: updatedProtocols }),
          startDate: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update supplement protocol');
      }

      setStatus('Supplement protocol updated successfully');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Error updating supplement protocol:', error);
      setSupplementProtocols(prev => 
        prev.map(s => 
          s.type === type 
            ? originalProtocol
            : s
        )
      );
      setStatus(error instanceof Error ? error.message : 'Failed to update supplement protocol');
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const handleSaveSupplementProtocols = async (newProtocols: Array<{ type: string; frequency: string; dosage: string; unit: string }>) => {
    setIsSavingSupplementProtocol(true);
    
    try {
      const updatedProtocols = [...supplementProtocols];
      
      newProtocols.forEach(newProtocol => {
        const existingIndex = updatedProtocols.findIndex(p => p.type === newProtocol.type);
        if (existingIndex >= 0) {
          updatedProtocols[existingIndex] = newProtocol;
        } else {
          updatedProtocols.push(newProtocol);
        }
      });

      const response = await fetch('/api/health-protocols', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          protocolType: 'supplement',
          protocol: JSON.stringify({ supplements: updatedProtocols }),
          startDate: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save supplement protocols');
      }

      setSupplementProtocols(updatedProtocols);
      setStatus('Supplement protocols updated successfully');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Error updating supplement protocols:', error);
      setStatus(error instanceof Error ? error.message : 'Failed to update supplement protocols');
      setTimeout(() => setStatus(''), 3000);
    } finally {
      setIsSavingSupplementProtocol(false);
    }
  };

  // Experiment handlers
  const handleSaveExperiment = async (experimentData: {
    name: string;
    description: string;
    frequency: string;
    duration: string;
    fitnessMarkers: string[];
    bloodMarkers: string[];
  }) => {
    setIsSavingExperiment(true);
    try {
      const response = await fetch('/api/experiments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...experimentData,
          status: 'active'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create experiment');
      }

      // Refresh experiments list
      const fetchExperiments = async () => {
        if (!session?.user?.id) return;
        
        setIsLoadingExperiments(true);
        try {
          const timestamp = Date.now();
          const response = await fetch(`/api/experiments?userId=${session.user.id}&t=${timestamp}`, {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              setExperiments(data.data);
            }
          }
        } catch (error) {
          console.error('Error fetching experiments:', error);
        } finally {
          setIsLoadingExperiments(false);
        }
      };

      await fetchExperiments();
      setStatus('Experiment created successfully');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Error creating experiment:', error);
      setStatus(error instanceof Error ? error.message : 'Failed to create experiment');
      setTimeout(() => setStatus(''), 3000);
    } finally {
      setIsSavingExperiment(false);
    }
  };

  const removeExperiment = async (id: string) => {
    try {
      const response = await fetch(`/api/experiments?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete experiment');
      }

      // Remove from local state
      setExperiments(prev => prev.filter(exp => exp.id !== id));
      setStatus('Experiment deleted successfully');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Error deleting experiment:', error);
      setStatus(error instanceof Error ? error.message : 'Failed to delete experiment');
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const handleEditExperiment = (experiment: typeof experiments[0]) => {
    setEditingExperiment(experiment);
    setIsEditExperimentModalOpen(true);
  };

  const handleUpdateExperiment = async (updatedExperiment: typeof experiments[0]) => {
    try {
      // Update local state
      setExperiments(prev => 
        prev.map(exp => 
          exp.id === updatedExperiment.id 
            ? { ...exp, ...updatedExperiment }
            : exp
        )
      );
      setStatus('Experiment updated successfully');
      setTimeout(() => setStatus(''), 3000);
      setIsEditExperimentModalOpen(false);
      setEditingExperiment(null);
    } catch (error) {
      console.error('Error updating experiment:', error);
      setStatus(error instanceof Error ? error.message : 'Failed to update experiment');
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const handleTabChange = (tab: string) => {
    switch (tab) {
      case 'profile':
        router.push('/upload/profile');
        break;
      case 'protocols':
        // Already on protocols page
        break;
      case 'fitness':
        router.push('/upload/fitness');
        break;
      case 'blood':
        router.push('/upload/blood');
        break;
      case 'more':
        router.push('/upload/settings');
        break;
      default:
        router.push('/upload/profile');
    }
  };

  // Loading state
  if (sessionStatus === 'loading') {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  // Unauthenticated state
  if (sessionStatus === 'unauthenticated') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Authentication Required</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Please sign in to access the upload functionality.</p>
          <a
            href="/auth/signin"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Sign In
          </a>
        </div>
      </main>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Navigation */}
      <DesktopNavigation
        activeTab="protocols"
        onTabChange={handleTabChange}
        session={session}
        profileImage={null}
        name=""
      />

      {/* Mobile Header */}
      <MobileHeader />

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8 md:p-8 pt-16 md:pt-8 pb-24 md:pb-8">
          {status && (
            <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 text-sm">
              {status}
            </div>
          )}
          
          <ProtocolsTab
            currentDiet={currentDiet}
            setCurrentDiet={setCurrentDiet}
            isSavingProtocol={isSavingProtocol}
            setIsSavingProtocol={setIsSavingProtocol}
            workoutProtocols={workoutProtocols}
            setWorkoutProtocols={setWorkoutProtocols}
            isSavingWorkoutProtocol={isSavingWorkoutProtocol}
            setIsSavingWorkoutProtocol={setIsSavingWorkoutProtocol}
            supplementProtocols={supplementProtocols}
            setSupplementProtocols={setSupplementProtocols}
            isSavingSupplementProtocol={isSavingSupplementProtocol}
            setIsSavingSupplementProtocol={setIsSavingSupplementProtocol}
            experiments={experiments}
            setExperiments={setExperiments}
            isLoadingExperiments={isLoadingExperiments}
            setIsLoadingExperiments={setIsLoadingExperiments}
            editingExperiment={editingExperiment}
            setEditingExperiment={setEditingExperiment}
            isAddWorkoutProtocolModalOpen={isAddWorkoutProtocolModalOpen}
            setIsAddWorkoutProtocolModalOpen={setIsAddWorkoutProtocolModalOpen}
            isAddSupplementProtocolModalOpen={isAddSupplementProtocolModalOpen}
            setIsAddSupplementProtocolModalOpen={setIsAddSupplementProtocolModalOpen}
            isEditSupplementProtocolModalOpen={isEditSupplementProtocolModalOpen}
            setIsEditSupplementProtocolModalOpen={setIsEditSupplementProtocolModalOpen}
            isAddExperimentModalOpen={isAddExperimentModalOpen}
            setIsAddExperimentModalOpen={setIsAddExperimentModalOpen}
            isEditExperimentModalOpen={isEditExperimentModalOpen}
            setIsEditExperimentModalOpen={setIsEditExperimentModalOpen}
            handleDietChange={handleDietChange}
            addWorkoutProtocol={addWorkoutProtocol}
            removeWorkoutProtocol={removeWorkoutProtocol}
            updateWorkoutProtocolFrequency={updateWorkoutProtocolFrequency}
            handleSaveWorkoutProtocols={handleSaveWorkoutProtocols}
            addSupplementProtocol={addSupplementProtocol}
            updateSupplementProtocol={updateSupplementProtocol}
            handleSaveSupplementProtocols={handleSaveSupplementProtocols}
            fetchExperiments={async () => {
              if (!session?.user?.id) return;
              
              setIsLoadingExperiments(true);
              try {
                const timestamp = Date.now();
                const response = await fetch(`/api/experiments?userId=${session.user.id}&t=${timestamp}`, {
                  headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                  }
                });
                if (response.ok) {
                  const data = await response.json();
                  if (data.success && data.data) {
                    setExperiments(data.data);
                  }
                }
              } catch (error) {
                console.error('Error fetching experiments:', error);
              } finally {
                setIsLoadingExperiments(false);
              }
            }}
            handleSaveExperiment={handleSaveExperiment}
            removeExperiment={removeExperiment}
            handleEditExperiment={handleEditExperiment}
            handleUpdateExperiment={handleUpdateExperiment}
          />
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation
        activeTab="protocols"
        onTabChange={handleTabChange}
      />

      {/* Add Workout Protocol Modal */}
      <AddWorkoutProtocolModal
        isOpen={isAddWorkoutProtocolModalOpen}
        onClose={() => setIsAddWorkoutProtocolModalOpen(false)}
        onSave={handleSaveWorkoutProtocols}
      />

      {/* Add Supplement Protocol Modal */}
      <AddSupplementProtocolModal
        isOpen={isAddSupplementProtocolModalOpen}
        onClose={() => setIsAddSupplementProtocolModalOpen(false)}
        onSave={handleSaveSupplementProtocols}
      />

      {/* Edit Supplement Protocol Modal */}
      <EditSupplementProtocolModal
        isOpen={isEditSupplementProtocolModalOpen}
        onClose={() => {
          setIsEditSupplementProtocolModalOpen(false);
          setEditingSupplementProtocol(null);
        }}
        supplement={editingSupplementProtocol}
        onUpdate={updateSupplementProtocol}
        isSaving={isSavingSupplementProtocol}
      />

      {/* Add Experiment Modal */}
      <AddExperimentModal
        isOpen={isAddExperimentModalOpen}
        onClose={() => setIsAddExperimentModalOpen(false)}
        onSave={handleSaveExperiment}
      />

      {/* Edit Experiment Modal */}
      <EditExperimentModal
        isOpen={isEditExperimentModalOpen}
        onClose={() => {
          setIsEditExperimentModalOpen(false);
          setEditingExperiment(null);
        }}
        onSave={handleUpdateExperiment}
        experiment={editingExperiment}
      />
    </div>
  );
}
