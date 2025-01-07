'use client';

import React, { useState, FormEvent, ChangeEvent } from 'react';
import { Dialog } from '@headlessui/react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import "./datepicker.css";

interface AddResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (results: any) => void;
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

export default function AddResultsModal({ isOpen, onClose, onSubmit }: AddResultsModalProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarkers, setSelectedMarkers] = useState<typeof allMarkers[0][]>([]);
  const [results, setResults] = useState<Record<string, number>>({});
  const [step, setStep] = useState<'select' | 'input'>('select');

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

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step === 'select') {
      setStep('input');
      return;
    }
    
    onSubmit({
      date: selectedDate,
      results: Object.entries(results).map(([name, value]) => ({
        name,
        value,
        unit: allMarkers.find(m => m.name === name)?.unit
      }))
    });
    onClose();
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
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-3xl w-full bg-white rounded-2xl p-6">
          <Dialog.Title className="text-2xl font-semibold text-gray-900 mb-6">
            Add Blood Test Results
          </Dialog.Title>

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
                    {filteredMarkers.map((marker) => (
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
                    ))}
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
                      disabled={selectedMarkers.length === 0}
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
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Save Results
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