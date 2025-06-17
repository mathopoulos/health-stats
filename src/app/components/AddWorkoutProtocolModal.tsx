'use client';

import React, { useState, FormEvent } from 'react';
import { Dialog } from '@headlessui/react';
import { toast } from 'react-hot-toast';

interface AddWorkoutProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (protocols: Array<{ type: string; frequency: number }>) => Promise<void>;
}

// Available workout types in a flat list
const workoutTypes = [
  { value: 'strength-training', label: 'Strength Training / Weightlifting' },
  { value: 'powerlifting', label: 'Powerlifting' },
  { value: 'bodybuilding', label: 'Bodybuilding' },
  { value: 'calisthenics', label: 'Calisthenics' },
  { value: 'bodyweight', label: 'Bodyweight Training' },
  { value: 'running', label: 'Running' },
  { value: 'cycling', label: 'Cycling' },
  { value: 'swimming', label: 'Swimming' },
  { value: 'cardio', label: 'General Cardio' },
  { value: 'hiking', label: 'Hiking' },
  { value: 'crossfit', label: 'CrossFit' },
  { value: 'hiit', label: 'HIIT' },
  { value: 'martial-arts', label: 'Martial Arts' },
  { value: 'boxing', label: 'Boxing' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'pilates', label: 'Pilates' },
  { value: 'stretching', label: 'Stretching' },
  { value: 'tai-chi', label: 'Tai Chi' },
  { value: 'tennis', label: 'Tennis' },
  { value: 'basketball', label: 'Basketball' },
  { value: 'soccer', label: 'Soccer' },
  { value: 'climbing', label: 'Rock Climbing' },
  { value: 'dance', label: 'Dance' },
  { value: 'other', label: 'Other' },
];

export default function AddWorkoutProtocolModal({ isOpen, onClose, onSave }: AddWorkoutProtocolModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProtocols, setSelectedProtocols] = useState<Array<{
    type: string;
    label: string;
    frequency: number;
    category: string;
  }>>([]);
  const [step, setStep] = useState<'select' | 'frequency'>('select');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWorkoutToggle = (workout: { value: string; label: string }) => {
    setSelectedProtocols(prev => {
      const isSelected = prev.some(p => p.type === workout.value);
      if (isSelected) {
        return prev.filter(p => p.type !== workout.value);
      } else {
        return [...prev, { 
          type: workout.value, 
          label: workout.label, 
          frequency: 2, // Default frequency
          category: 'Workout' // Simple category since we removed categorization
        }];
      }
    });
  };

  const handleFrequencyChange = (type: string, frequency: number) => {
    setSelectedProtocols(prev => 
      prev.map(p => p.type === type ? { ...p, frequency } : p)
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const protocols = selectedProtocols.map(protocol => ({
        type: protocol.type,
        frequency: protocol.frequency
      }));

      await onSave(protocols);
      toast.success('Workout protocols saved successfully');
      handleClose();
    } catch (error) {
      console.error('Error saving workout protocols:', error);
      setError('Failed to save workout protocols');
      toast.error('Failed to save workout protocols');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep('select');
    setSearchTerm('');
    setSelectedProtocols([]);
    setError(null);
    onClose();
  };

  const handleNext = () => {
    if (selectedProtocols.length > 0) {
      setStep('frequency');
    }
  };

  const isFormValid = () => {
    if (step === 'select') {
      return selectedProtocols.length > 0;
    }
    return selectedProtocols.every(protocol => 
      protocol.frequency >= 1 && protocol.frequency <= 7
    );
  };

  // Filter workouts based on search term
  const filteredWorkouts = workoutTypes.filter(workout =>
    workout.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-3xl w-full bg-white dark:bg-gray-800 rounded-2xl p-6">
          <Dialog.Title className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Add Workout Protocols
          </Dialog.Title>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 'select' ? (
              <>
                {/* Workout Search and Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Search Workout Types
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by workout name..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 mb-4 text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400"
                  />

                  <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
                    {filteredWorkouts.length === 0 ? (
                      <div className="p-4 text-gray-500 dark:text-gray-400 text-center">
                        No workout types found matching "{searchTerm}"
                      </div>
                    ) : (
                      filteredWorkouts.map((workout) => (
                        <div
                          key={workout.value}
                          className={`flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
                            selectedProtocols.some(p => p.type === workout.value) ? 'bg-indigo-50 dark:bg-indigo-900/50' : ''
                          }`}
                          onClick={() => handleWorkoutToggle(workout)}
                        >
                          <span className="font-medium text-gray-900 dark:text-white">{workout.label}</span>
                          {selectedProtocols.some(p => p.type === workout.value) && (
                            <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Selected Protocols Count */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedProtocols.length} workout type{selectedProtocols.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Set Weekly Frequency
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Choose how many times per week you plan to do each workout type.
                  </p>
                </div>
                
                {selectedProtocols.map((protocol) => (
                  <div key={protocol.type} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {protocol.label}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        ({protocol.category})
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-700 dark:text-gray-300">
                        Times per week:
                      </label>
                      <select
                        value={protocol.frequency}
                        onChange={(e) => handleFrequencyChange(protocol.type, Number(e.target.value))}
                        className="h-9 rounded-md border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-600 text-sm px-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                      >
                        {Array.from({ length: 7 }, (_, i) => i + 1).map(num => (
                          <option key={num} value={num}>{num}x</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
                
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Total weekly sessions:</strong> {selectedProtocols.reduce((sum, p) => sum + p.frequency, 0)}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              {step === 'select' ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={selectedProtocols.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('select')}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={!isFormValid() || isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Saving...' : `Save ${selectedProtocols.length} Protocol${selectedProtocols.length !== 1 ? 's' : ''}`}
                  </button>
                </div>
              )}
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 