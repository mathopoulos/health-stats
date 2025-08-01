'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { toast } from 'react-hot-toast';

interface Experiment {
  id: string;
  name: string;
  description: string;
  frequency: string;
  duration: string;
  fitnessMarkers: string[];
  bloodMarkers: string[];
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
}

interface EditExperimentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (experiment: Experiment) => void;
  experiment: Experiment | null;
}

// Available options for experiments
const frequencyOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'twice-daily', label: 'Twice Daily' },
  { value: 'every-other-day', label: 'Every Other Day' },
  { value: '3x-per-week', label: '3x per Week' },
  { value: '4x-per-week', label: '4x per Week' },
  { value: '5x-per-week', label: '5x per Week' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi-weekly', label: 'Bi-Weekly' },
];

const durationOptions = [
  { value: '1-week', label: '1 Week' },
  { value: '2-weeks', label: '2 Weeks' },
  { value: '4-weeks', label: '4 Weeks' },
  { value: '6-weeks', label: '6 Weeks' },
  { value: '8-weeks', label: '8 Weeks' },
  { value: '12-weeks', label: '12 Weeks' },
  { value: '16-weeks', label: '16 Weeks' },
  { value: '6-months', label: '6 Months' },
  { value: '1-year', label: '1 Year' },
];

// Only include markers that are supported for visualization in the dashboard
const availableFitnessMarkers = [
  'HRV',
  'VO2 Max', 
  'Weight',
  'Body Fat %'
];

// Blood markers that are supported for visualization in the dashboard
const availableBloodMarkers = [
  // Lipid Panel
  'Total Cholesterol',
  'LDL',
  'HDL', 
  'Triglycerides',
  'ApoB',
  'Lp(a)',
  
  // Complete Blood Count
  'White Blood Cells',
  'Red Blood Cells', 
  'Hematocrit',
  'Hemoglobin',
  'Platelets',
  
  // Glucose Markers
  'HbA1c',
  'Fasting Insulin',
  'Glucose',
  
  // Liver Markers
  'ALT',
  'AST', 
  'GGT',
  
  // Kidney Markers
  'eGFR',
  'Cystatin C',
  'BUN',
  'Creatinine',
  'Albumin',
  
  // Sex Hormones
  'Testosterone',
  'Free Testosterone',
  'Estradiol',
  'SHBG',
  
  // Thyroid Markers
  'T3',
  'T4',
  'TSH',
  
  // Vitamins & Minerals
  'Vitamin D',
  'Vitamin B12',
  'Folate',
  'Iron',
  'Magnesium',
  'RBC Magnesium',
  
  // Inflammation & Growth Factors
  'hs-CRP',
  'Homocysteine',
  'IGF-1',
  
  // Iron Panel
  'Ferritin',
  'Serum Iron',
  'TIBC',
  'Transferrin Saturation',
  
  // Electrolytes
  'Sodium',
  'Potassium',
  'Calcium',
  'Phosphorus',
  'Bicarbonate',
  'Chloride',
  
  // Additional Markers
  'Creatine Kinase',
  'Cortisol'
];

export default function EditExperimentModal({ isOpen, onClose, onSave, experiment }: EditExperimentModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    frequency: '',
    duration: '',
    fitnessMarkers: [] as string[],
    bloodMarkers: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-populate form when experiment changes
  useEffect(() => {
    if (experiment) {
      setFormData({
        name: experiment.name || '',
        description: experiment.description || '',
        frequency: experiment.frequency || '',
        duration: experiment.duration || '',
        fitnessMarkers: experiment.fitnessMarkers || [],
        bloodMarkers: experiment.bloodMarkers || []
      });
    }
  }, [experiment]);

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      frequency: '',
      duration: '',
      fitnessMarkers: [],
      bloodMarkers: []
    });
    setError(null);
    onClose();
  };

  const handleMarkerToggle = (marker: string, type: 'fitness' | 'blood') => {
    if (type === 'fitness') {
      setFormData(prev => ({
        ...prev,
        fitnessMarkers: prev.fitnessMarkers.includes(marker)
          ? prev.fitnessMarkers.filter(m => m !== marker)
          : [...prev.fitnessMarkers, marker]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        bloodMarkers: prev.bloodMarkers.includes(marker)
          ? prev.bloodMarkers.filter(m => m !== marker)
          : [...prev.bloodMarkers, marker]
      }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!experiment) return;
    
    setIsSubmitting(true);
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError('Experiment name is required');
      setIsSubmitting(false);
      return;
    }

    if (!formData.frequency) {
      setError('Frequency is required');
      setIsSubmitting(false);
      return;
    }

    if (!formData.duration) {
      setError('Duration is required');
      setIsSubmitting(false);
      return;
    }

    if (formData.fitnessMarkers.length === 0 && formData.bloodMarkers.length === 0) {
      setError('Please select at least one marker to track');
      setIsSubmitting(false);
      return;
    }

    try {
      // Call PATCH API to update experiment
      const response = await fetch(`/api/experiments?id=${experiment.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update experiment');
      }

      const result = await response.json();
      if (result.success) {
        // Pass the updated experiment back to parent
        onSave({
          ...experiment,
          ...formData
        });
        toast.success('Experiment updated successfully');
        handleClose();
      }
    } catch (error) {
      console.error('Error updating experiment:', error);
      setError(error instanceof Error ? error.message : 'Failed to update experiment');
      toast.error('Failed to update experiment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!experiment) return null;

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black bg-opacity-25" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                Edit Experiment
              </Dialog.Title>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Experiment Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Experiment Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Cold Therapy Protocol"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your experiment and what you hope to achieve..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Frequency and Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Frequency *
                  </label>
                  <select
                    id="frequency"
                    value={formData.frequency}
                    onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select frequency</option>
                    {frequencyOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration *
                  </label>
                  <select
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select duration</option>
                    {durationOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fitness Markers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Fitness Markers to Track
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableFitnessMarkers.map(marker => (
                    <label key={marker} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.fitnessMarkers.includes(marker)}
                        onChange={() => handleMarkerToggle(marker, 'fitness')}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{marker}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Blood Markers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Blood Markers to Track
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableBloodMarkers.map(marker => (
                    <label key={marker} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.bloodMarkers.includes(marker)}
                        onChange={() => handleMarkerToggle(marker, 'blood')}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{marker}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Updating...' : 'Update Experiment'}
                </button>
              </div>
            </form>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 