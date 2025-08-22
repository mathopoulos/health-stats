'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';

interface SupplementProtocol {
  type: string;
  frequency: string;
  dosage: string;
  unit: string;
}

interface EditSupplementProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplement: SupplementProtocol | null;
  onUpdate: (type: string, field: string, newValue: string) => void;
  isSaving?: boolean;
}

const frequencyOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'twice-daily', label: 'Twice Daily' },
  { value: 'three-times-daily', label: 'Three Times Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'as-needed', label: 'As Needed' },
];

const unitOptions = [
  { value: 'mg', label: 'mg' },
  { value: 'mcg', label: 'mcg' },
  { value: 'g', label: 'g' },
  { value: 'IU', label: 'IU' },
  { value: 'capsule', label: 'capsule' },
  { value: 'tablet', label: 'tablet' },
  { value: 'ml', label: 'ml' },
  { value: 'drops', label: 'drops' },
];

export default function EditSupplementProtocolModal({ 
  isOpen,
  onClose,
  supplement, 
  onUpdate, 
  isSaving = false 
}: EditSupplementProtocolModalProps) {
  const [localDosage, setLocalDosage] = useState(supplement?.dosage || '');
  const [localUnit, setLocalUnit] = useState(supplement?.unit || 'mg');
  const [localFrequency, setLocalFrequency] = useState(supplement?.frequency || 'daily');

  // Update local state when supplement changes
  useEffect(() => {
    if (supplement) {
      setLocalDosage(supplement.dosage);
      setLocalUnit(supplement.unit);
      setLocalFrequency(supplement.frequency);
    }
  }, [supplement]);

  const handleSave = async () => {
    if (!supplement) return;
    
    // Only update if values have changed
    if (localDosage !== supplement.dosage) {
      onUpdate(supplement.type, 'dosage', localDosage);
    }
    if (localUnit !== supplement.unit) {
      onUpdate(supplement.type, 'unit', localUnit);
    }
    if (localFrequency !== supplement.frequency) {
      onUpdate(supplement.type, 'frequency', localFrequency);
    }
    onClose();
  };

  const handleCancel = () => {
    // Reset to original values
    if (supplement) {
      setLocalDosage(supplement.dosage);
      setLocalUnit(supplement.unit);
      setLocalFrequency(supplement.frequency);
    }
    onClose();
  };

  if (!supplement) return null;

  return (
    <Dialog open={isOpen} onClose={handleCancel} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                  Edit {supplement.type.split('-').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </Dialog.Title>
                <button
                  onClick={handleCancel}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Dosage and Unit Row */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Dosage
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={localDosage}
                      onChange={(e) => setLocalDosage(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Amount"
                      aria-label="Dosage amount"
                    />
                    <select
                      value={localUnit}
                      onChange={(e) => setLocalUnit(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      aria-label="Unit"
                    >
                      {unitOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Frequency */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Frequency
                  </label>
                  <select
                    value={localFrequency}
                    onChange={(e) => setLocalFrequency(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    aria-label="Frequency"
                  >
                    {frequencyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
}
