'use client';

import React, { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import "./datepicker.css";
import { toast } from 'react-hot-toast';

interface AddResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledResults: Array<{
    name: string;
    value: number;
    unit: string;
    category: string;
  }> | null;
}

// Flatten all markers into a single array with their categories
const allMarkers = [
  { name: 'Total Cholesterol', category: 'Lipid Panel', unit: 'mg/dL' },
  { name: 'LDL-C', category: 'Lipid Panel', unit: 'mg/dL' },
  { name: 'HDL-C', category: 'Lipid Panel', unit: 'mg/dL' },
  { name: 'Triglycerides', category: 'Lipid Panel', unit: 'mg/dL' },
  { name: 'ApoB', category: 'Lipid Panel', unit: 'mg/dL' },
  { name: 'Lp(a)', category: 'Lipid Panel', unit: 'nmol/L' },
  { name: 'White Blood Cells', category: 'Complete Blood Count', unit: 'K/µL' },
  { name: 'Red Blood Cells', category: 'Complete Blood Count', unit: 'M/µL' },
  { name: 'Hematocrit', category: 'Complete Blood Count', unit: '%' },
  { name: 'Hemoglobin', category: 'Complete Blood Count', unit: 'g/dL' },
  { name: 'Platelets', category: 'Complete Blood Count', unit: 'K/µL' },
  { name: 'HbA1c', category: 'Glucose Markers', unit: '%' },
  { name: 'Fasting Insulin', category: 'Glucose Markers', unit: 'µIU/mL' },
  { name: 'Glucose', category: 'Glucose Markers', unit: 'mg/dL' },
  { name: 'ALT', category: 'Liver Markers', unit: 'U/L' },
  { name: 'AST', category: 'Liver Markers', unit: 'U/L' },
  { name: 'GGT', category: 'Liver Markers', unit: 'U/L' },
  { name: 'eGFR', category: 'Kidney Markers', unit: 'mL/min/1.73m²' },
  { name: 'Cystatin C', category: 'Kidney Markers', unit: 'mg/L' },
  { name: 'BUN', category: 'Kidney Markers', unit: 'mg/dL' },
  { name: 'Creatinine', category: 'Kidney Markers', unit: 'mg/dL' },
  { name: 'Albumin', category: 'Kidney Markers', unit: 'g/dL' },
  { name: 'Testosterone', category: 'Sex Hormones', unit: 'ng/dL' },
  { name: 'Free Testosterone', category: 'Sex Hormones', unit: 'pg/mL' },
  { name: 'Estradiol', category: 'Sex Hormones', unit: 'pg/mL' },
  { name: 'SHBG', category: 'Sex Hormones', unit: 'nmol/L' },
  { name: 'T3', category: 'Thyroid Markers', unit: 'pg/mL' },
  { name: 'T4', category: 'Thyroid Markers', unit: 'ng/dL' },
  { name: 'TSH', category: 'Thyroid Markers', unit: 'mIU/L' },
  { name: 'Vitamin D3', category: 'Vitamins & Inflammation', unit: 'ng/mL' },
  { name: 'hs-CRP', category: 'Vitamins & Inflammation', unit: 'mg/L' },
  { name: 'Homocysteine', category: 'Vitamins & Inflammation', unit: 'µmol/L' },
  { name: 'IGF-1', category: 'Growth Factors', unit: 'ng/mL' },
  { name: 'Ferritin', category: 'Iron Panel', unit: 'ng/mL' },
  { name: 'Serum Iron', category: 'Iron Panel', unit: 'µg/dL' },
  { name: 'TIBC', category: 'Iron Panel', unit: 'µg/dL' },
  { name: 'Transferrin Saturation', category: 'Iron Panel', unit: '%' },
  { name: 'Sodium', category: 'Electrolytes', unit: 'mEq/L' },
  { name: 'Potassium', category: 'Electrolytes', unit: 'mEq/L' },
  { name: 'Calcium', category: 'Electrolytes', unit: 'mg/dL' },
  { name: 'Phosphorus', category: 'Electrolytes', unit: 'mg/dL' },
  { name: 'Magnesium', category: 'Electrolytes', unit: 'mg/dL' },
  { name: 'Bicarbonate', category: 'Electrolytes', unit: 'mEq/L' },
  { name: 'Chloride', category: 'Electrolytes', unit: 'mEq/L' },
  
  // Biological Age & Longevity
  { name: 'Biological Age', category: 'Longevity Markers', unit: 'years' },
  { name: 'Epigenetic Age (DNAm)', category: 'Longevity Markers', unit: 'years' },
  { name: 'Phenotypic Age', category: 'Longevity Markers', unit: 'years' },
  { name: 'GrimAge', category: 'Longevity Markers', unit: 'years' },
  { name: 'PhenoAge', category: 'Longevity Markers', unit: 'years' },
  { name: 'Horvath Age', category: 'Longevity Markers', unit: 'years' },
  { name: 'Hannum Age', category: 'Longevity Markers', unit: 'years' },
  { name: 'Telomere Length', category: 'Longevity Markers', unit: 'kb' }
];

export default function AddResultsModal({ isOpen, onClose, prefilledResults }: AddResultsModalProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarkers, setSelectedMarkers] = useState<Array<{
    name: string;
    value: string;
    unit: string;
    category: string;
  }>>([]);
  const [results, setResults] = useState<Record<string, number>>({});
  const [step, setStep] = useState<'select' | 'input'>('select');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with prefilled results when they change
  useEffect(() => {
    if (prefilledResults) {
      // Convert prefilled results to the format expected by the component
      const markers = prefilledResults.map(marker => ({
        name: marker.name,
        value: marker.value.toString(),
        unit: marker.unit,
        category: marker.category
      }));
      
      setSelectedMarkers(markers);
      setStep('input'); // Skip the selection step
    }
  }, [prefilledResults]);

  const filteredMarkers = allMarkers.filter(marker => 
    marker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    marker.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMarkerToggle = (marker: typeof allMarkers[0]) => {
    setSelectedMarkers(prev => {
      const isSelected = prev.some(m => m.name === marker.name);
      if (isSelected) {
        return prev.filter(m => m.name !== marker.name);
      } else {
        return [...prev, { ...marker, value: '' }];
      }
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Convert values to numbers
      const markers = selectedMarkers.map(marker => ({
        name: marker.name,
        value: results[marker.name] || 0,
        unit: marker.unit,
        category: marker.category
      }));

      const response = await fetch('/api/blood-markers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate,
          markers
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save blood markers');
      }

      toast.success('Blood markers saved successfully');
      onClose();
    } catch (error) {
      console.error('Error saving blood markers:', error);
      setError('Failed to save blood markers');
      toast.error('Failed to save blood markers');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValueChange = (marker: string, value: string) => {
    setResults(prev => ({
      ...prev,
      [marker]: parseFloat(value) || 0
    }));
  };

  const handleClose = () => {
    setStep('select');
    setSearchTerm('');
    setSelectedMarkers([]);
    setResults({});
    setError(null);
    onClose();
  };

  // Add a new function to handle the "Next" button click
  const handleNext = () => {
    if (selectedMarkers.length > 0) {
      setStep('input');
    }
  };

  const isFormValid = () => {
    if (step === 'select') {
      return selectedMarkers.length > 0;
    }
    return selectedMarkers.every(marker => 
      typeof results[marker.name] === 'number' && !isNaN(results[marker.name])
    );
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-3xl w-full bg-white dark:bg-gray-800 rounded-2xl p-6">
          <Dialog.Title className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Add Blood Test Results
          </Dialog.Title>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 'select' ? (
              <>
                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Test Date
                  </label>
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date: Date | null) => date && setSelectedDate(date)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholderText="Select a date"
                    dateFormat="MM/dd/yyyy"
                    maxDate={new Date()}
                  />
                </div>

                {/* Marker Search and Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Search Biomarkers
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by marker name or category..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 mb-4 text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400"
                  />

                  <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
                    {filteredMarkers.length === 0 ? (
                      <div className="p-4 text-gray-500 dark:text-gray-400 text-center">
                        No markers found matching "{searchTerm}"
                      </div>
                    ) : (
                      filteredMarkers.map((marker) => (
                        <div
                          key={marker.name}
                          className={`flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
                            selectedMarkers.some(m => m.name === marker.name) ? 'bg-indigo-50 dark:bg-indigo-900/50' : ''
                          }`}
                          onClick={() => handleMarkerToggle(marker)}
                        >
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">{marker.name}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({marker.category})</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">{marker.unit}</span>
                            {selectedMarkers.some(m => m.name === marker.name) && (
                              <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Selected Markers Count */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedMarkers.length} marker{selectedMarkers.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                {selectedMarkers.map((marker) => (
                  <div key={marker.name} className="flex items-center gap-4">
                    <label className="flex-1">
                      <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {marker.name}
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">
                          ({marker.unit})
                        </span>
                      </span>
                      <input
                        type="number"
                        step="any"
                        value={results[marker.name] || ''}
                        onChange={(e) => handleValueChange(marker.name, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                        placeholder={`Enter value in ${marker.unit}`}
                      />
                    </label>
                  </div>
                ))}
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
                  disabled={selectedMarkers.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!isFormValid() || isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </span>
                  ) : 'Save Results'}
                </button>
              )}
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 