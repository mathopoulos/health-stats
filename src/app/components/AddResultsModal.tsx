'use client';

import React, { useState, FormEvent, ChangeEvent } from 'react';
import { Dialog } from '@headlessui/react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import "./datepicker.css";

interface AddResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (results: any) => void;
  onSuccess?: () => void;
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
  { name: 'Chloride', category: 'Electrolytes', unit: 'mEq/L' }
];

export default function AddResultsModal({ isOpen, onClose, onSuccess }: AddResultsModalProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarkers, setSelectedMarkers] = useState<typeof allMarkers[0][]>([]);
  const [results, setResults] = useState<Record<string, number>>({});
  const [step, setStep] = useState<'select' | 'input'>('select');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        return [...prev, marker];
      }
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step === 'select') {
      setStep('input');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/blood-markers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate,
          markers: Object.entries(results).map(([name, value]) => {
            const marker = allMarkers.find(m => m.name === name);
            return {
              name,
              value,
              unit: marker?.unit || '',
              category: marker?.category || ''
            };
          })
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save results');
      }

      // Reset form
      setSelectedDate(new Date());
      setSearchTerm('');
      setSelectedMarkers([]);
      setResults({});
      setStep('select');
      
      // Notify parent of success
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving results:', error);
      setError(error instanceof Error ? error.message : 'Failed to save results');
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
        <Dialog.Panel className="mx-auto max-w-3xl w-full bg-white rounded-2xl p-6">
          <Dialog.Title className="text-2xl font-semibold text-gray-900 mb-6">
            Add Blood Test Results
          </Dialog.Title>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 'select' ? (
              <>
                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Date
                  </label>
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date: Date | null) => date && setSelectedDate(date)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-900"
                    placeholderText="Select a date"
                    dateFormat="MM/dd/yyyy"
                    maxDate={new Date()}
                  />
                </div>

                {/* Marker Search and Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Biomarkers
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by marker name or category..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 mb-4 text-gray-900 placeholder-gray-500"
                  />

                  <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
                    {filteredMarkers.length === 0 ? (
                      <div className="p-4 text-gray-500 text-center">
                        No markers found matching "{searchTerm}"
                      </div>
                    ) : (
                      filteredMarkers.map((marker) => (
                        <div
                          key={marker.name}
                          className={`flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-200 last:border-b-0 ${
                            selectedMarkers.some(m => m.name === marker.name) ? 'bg-indigo-50' : ''
                          }`}
                          onClick={() => handleMarkerToggle(marker)}
                        >
                          <div>
                            <span className="font-medium text-gray-900">{marker.name}</span>
                            <span className="text-sm text-gray-500 ml-2">({marker.category})</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500 mr-2">{marker.unit}</span>
                            {selectedMarkers.some(m => m.name === marker.name) && (
                              <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
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
                  <span className="text-sm text-gray-500">
                    {selectedMarkers.length} marker{selectedMarkers.length !== 1 ? 's' : ''} selected
                  </span>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep('input')}
                      disabled={!isFormValid()}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Value Inputs */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Enter Values for {selectedDate.toLocaleDateString()}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedMarkers.map((marker) => (
                      <div key={marker.name} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {marker.name}
                          <span className="text-sm text-gray-500 ml-1">({marker.unit})</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={results[marker.name] || ''}
                          onChange={(e) => handleValueChange(marker.name, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder={`Enter value in ${marker.unit}`}
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep('select')}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={!isFormValid() || isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      'Save Results'
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 