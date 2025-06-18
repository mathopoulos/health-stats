'use client';

import React, { useState, FormEvent } from 'react';
import { Dialog } from '@headlessui/react';
import { toast } from 'react-hot-toast';

interface AddSupplementProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (protocols: Array<{ type: string; frequency: string; dosage: string; unit: string }>) => Promise<void>;
}

// Available supplement types organized by category
const supplementTypes = [
  // Vitamins
  { value: 'vitamin-d3', label: 'Vitamin D3', category: 'Vitamins', defaultUnit: 'IU', commonDosages: ['1000', '2000', '5000', '10000'] },
  { value: 'vitamin-c', label: 'Vitamin C', category: 'Vitamins', defaultUnit: 'mg', commonDosages: ['500', '1000', '2000'] },
  { value: 'vitamin-b12', label: 'Vitamin B12', category: 'Vitamins', defaultUnit: 'mcg', commonDosages: ['100', '500', '1000'] },
  { value: 'vitamin-b-complex', label: 'B-Complex', category: 'Vitamins', defaultUnit: 'capsule', commonDosages: ['1', '2'] },
  { value: 'vitamin-k2', label: 'Vitamin K2', category: 'Vitamins', defaultUnit: 'mcg', commonDosages: ['100', '200'] },
  { value: 'vitamin-a', label: 'Vitamin A', category: 'Vitamins', defaultUnit: 'IU', commonDosages: ['5000', '10000'] },
  { value: 'vitamin-e', label: 'Vitamin E', category: 'Vitamins', defaultUnit: 'IU', commonDosages: ['400', '800'] },
  { value: 'folate', label: 'Folate', category: 'Vitamins', defaultUnit: 'mcg', commonDosages: ['400', '800'] },
  
  // Minerals
  { value: 'magnesium', label: 'Magnesium', category: 'Minerals', defaultUnit: 'mg', commonDosages: ['200', '400', '600'] },
  { value: 'zinc', label: 'Zinc', category: 'Minerals', defaultUnit: 'mg', commonDosages: ['15', '30', '50'] },
  { value: 'iron', label: 'Iron', category: 'Minerals', defaultUnit: 'mg', commonDosages: ['18', '25', '65'] },
  { value: 'calcium', label: 'Calcium', category: 'Minerals', defaultUnit: 'mg', commonDosages: ['500', '1000'] },
  { value: 'selenium', label: 'Selenium', category: 'Minerals', defaultUnit: 'mcg', commonDosages: ['100', '200'] },
  { value: 'iodine', label: 'Iodine', category: 'Minerals', defaultUnit: 'mcg', commonDosages: ['150', '300'] },
  { value: 'copper', label: 'Copper', category: 'Minerals', defaultUnit: 'mg', commonDosages: ['1', '2'] },
  { value: 'chromium', label: 'Chromium', category: 'Minerals', defaultUnit: 'mcg', commonDosages: ['200', '400'] },
  
  // Omega-3 & Fatty Acids
  { value: 'fish-oil', label: 'Fish Oil', category: 'Omega-3 & Fatty Acids', defaultUnit: 'mg', commonDosages: ['1000', '2000', '3000'] },
  { value: 'omega-3', label: 'Omega-3', category: 'Omega-3 & Fatty Acids', defaultUnit: 'mg', commonDosages: ['1000', '2000'] },
  { value: 'cod-liver-oil', label: 'Cod Liver Oil', category: 'Omega-3 & Fatty Acids', defaultUnit: 'tsp', commonDosages: ['1', '2'] },
  { value: 'flaxseed-oil', label: 'Flaxseed Oil', category: 'Omega-3 & Fatty Acids', defaultUnit: 'tbsp', commonDosages: ['1', '2'] },
  
  // Probiotics & Digestive
  { value: 'probiotic', label: 'Probiotic', category: 'Probiotics & Digestive', defaultUnit: 'CFU billion', commonDosages: ['10', '25', '50', '100'] },
  { value: 'digestive-enzymes', label: 'Digestive Enzymes', category: 'Probiotics & Digestive', defaultUnit: 'capsule', commonDosages: ['1', '2'] },
  { value: 'fiber', label: 'Fiber Supplement', category: 'Probiotics & Digestive', defaultUnit: 'g', commonDosages: ['5', '10', '15'] },
  { value: 'l-glutamine', label: 'L-Glutamine', category: 'Probiotics & Digestive', defaultUnit: 'g', commonDosages: ['5', '10', '15'] },
  
  // Adaptogens & Herbs
  { value: 'ashwagandha', label: 'Ashwagandha', category: 'Adaptogens & Herbs', defaultUnit: 'mg', commonDosages: ['300', '500', '600'] },
  { value: 'rhodiola', label: 'Rhodiola', category: 'Adaptogens & Herbs', defaultUnit: 'mg', commonDosages: ['200', '400'] },
  { value: 'turmeric', label: 'Turmeric/Curcumin', category: 'Adaptogens & Herbs', defaultUnit: 'mg', commonDosages: ['500', '1000'] },
  { value: 'ginseng', label: 'Ginseng', category: 'Adaptogens & Herbs', defaultUnit: 'mg', commonDosages: ['200', '400'] },
  { value: 'milk-thistle', label: 'Milk Thistle', category: 'Adaptogens & Herbs', defaultUnit: 'mg', commonDosages: ['150', '300'] },
  { value: 'ginkgo', label: 'Ginkgo Biloba', category: 'Adaptogens & Herbs', defaultUnit: 'mg', commonDosages: ['120', '240'] },
  
  // Cognitive & Nootropics
  { value: 'lions-mane', label: "Lion's Mane", category: 'Cognitive & Nootropics', defaultUnit: 'mg', commonDosages: ['500', '1000'] },
  { value: 'bacopa-monnieri', label: 'Bacopa Monnieri', category: 'Cognitive & Nootropics', defaultUnit: 'mg', commonDosages: ['300', '600'] },
  { value: 'alpha-gpc', label: 'Alpha-GPC', category: 'Cognitive & Nootropics', defaultUnit: 'mg', commonDosages: ['300', '600'] },
  { value: 'phosphatidylserine', label: 'Phosphatidylserine', category: 'Cognitive & Nootropics', defaultUnit: 'mg', commonDosages: ['100', '200'] },
  
  // Performance & Fitness
  { value: 'creatine', label: 'Creatine', category: 'Performance & Fitness', defaultUnit: 'g', commonDosages: ['3', '5', '10'] },
  { value: 'protein-powder', label: 'Protein Powder', category: 'Performance & Fitness', defaultUnit: 'scoop', commonDosages: ['1', '2'] },
  { value: 'bcaa', label: 'BCAA', category: 'Performance & Fitness', defaultUnit: 'g', commonDosages: ['5', '10', '15'] },
  { value: 'beta-alanine', label: 'Beta-Alanine', category: 'Performance & Fitness', defaultUnit: 'g', commonDosages: ['2', '3', '5'] },
  { value: 'hmb', label: 'HMB', category: 'Performance & Fitness', defaultUnit: 'g', commonDosages: ['1', '3'] },
  
  // Sleep & Recovery
  { value: 'melatonin', label: 'Melatonin', category: 'Sleep & Recovery', defaultUnit: 'mg', commonDosages: ['0.5', '1', '3', '5'] },
  { value: 'magnesium-glycinate', label: 'Magnesium Glycinate', category: 'Sleep & Recovery', defaultUnit: 'mg', commonDosages: ['200', '400'] },
  { value: 'l-theanine', label: 'L-Theanine', category: 'Sleep & Recovery', defaultUnit: 'mg', commonDosages: ['100', '200', '400'] },
  { value: 'valerian-root', label: 'Valerian Root', category: 'Sleep & Recovery', defaultUnit: 'mg', commonDosages: ['300', '600'] },
  { value: 'gaba', label: 'GABA', category: 'Sleep & Recovery', defaultUnit: 'mg', commonDosages: ['500', '750'] },
  
  // Heart & Cardiovascular
  { value: 'coq10', label: 'CoQ10', category: 'Heart & Cardiovascular', defaultUnit: 'mg', commonDosages: ['100', '200', '300'] },
  { value: 'nattokinase', label: 'Nattokinase', category: 'Heart & Cardiovascular', defaultUnit: 'FU', commonDosages: ['2000', '4000'] },
  { value: 'berberine', label: 'Berberine', category: 'Heart & Cardiovascular', defaultUnit: 'mg', commonDosages: ['500', '1000'] },
  { value: 'red-yeast-rice', label: 'Red Yeast Rice', category: 'Heart & Cardiovascular', defaultUnit: 'mg', commonDosages: ['600', '1200'] },
  
  // Other
  { value: 'multivitamin', label: 'Multivitamin', category: 'Other', defaultUnit: 'tablet', commonDosages: ['1', '2'] },
  { value: 'collagen', label: 'Collagen', category: 'Other', defaultUnit: 'g', commonDosages: ['10', '20'] },
  { value: 'spirulina', label: 'Spirulina', category: 'Other', defaultUnit: 'g', commonDosages: ['1', '3', '5'] },
  { value: 'chlorella', label: 'Chlorella', category: 'Other', defaultUnit: 'g', commonDosages: ['1', '3'] },
  { value: 'other', label: 'Other', category: 'Other', defaultUnit: 'unit', commonDosages: ['1'] },
];

// Frequency options
const frequencyOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'twice-daily', label: 'Twice Daily' },
  { value: 'three-times-daily', label: '3x Daily' },
  { value: 'every-other-day', label: 'Every Other Day' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'as-needed', label: 'As Needed' },
];



export default function AddSupplementProtocolModal({ isOpen, onClose, onSave }: AddSupplementProtocolModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProtocols, setSelectedProtocols] = useState<Array<{
    type: string;
    label: string;
    frequency: string;
    dosage: string;
    unit: string;
    category: string;
  }>>([]);
  const [step, setStep] = useState<'select' | 'details'>('select');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSupplementToggle = (supplement: typeof supplementTypes[0]) => {
    setSelectedProtocols(prev => {
      const isSelected = prev.some(p => p.type === supplement.value);
      if (isSelected) {
        return prev.filter(p => p.type !== supplement.value);
      } else {
        return [...prev, { 
          type: supplement.value, 
          label: supplement.label, 
          frequency: 'daily', // Default frequency
          dosage: supplement.commonDosages[0] || '1', // Default to first common dosage
          unit: supplement.defaultUnit,
          category: supplement.category
        }];
      }
    });
  };

  const handleProtocolChange = (type: string, field: string, value: string) => {
    setSelectedProtocols(prev => 
      prev.map(p => p.type === type ? { ...p, [field]: value } : p)
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const protocols = selectedProtocols.map(protocol => ({
        type: protocol.type,
        frequency: protocol.frequency,
        dosage: protocol.dosage,
        unit: protocol.unit
      }));

      await onSave(protocols);
      toast.success('Supplement protocols saved successfully');
      handleClose();
    } catch (error) {
      console.error('Error saving supplement protocols:', error);
      setError('Failed to save supplement protocols');
      toast.error('Failed to save supplement protocols');
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
      setStep('details');
    }
  };

  const isFormValid = () => {
    if (step === 'select') {
      return selectedProtocols.length > 0;
    }
    return selectedProtocols.every(protocol => 
      protocol.frequency && protocol.dosage && protocol.unit
    );
  };

  // Filter supplements based on search term
  const filteredSupplements = supplementTypes.filter(supplement => {
    return supplement.label.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Get supplement details for dosage suggestions
  const getSupplementDetails = (type: string) => {
    return supplementTypes.find(s => s.value === type);
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-4xl w-full bg-white dark:bg-gray-800 rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Add Supplement Protocols
          </Dialog.Title>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 'select' ? (
              <>
                {/* Search */}
                <div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search supplements..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>

                {/* Supplement List */}
                <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
                  {filteredSupplements.length === 0 ? (
                    <div className="p-4 text-gray-500 dark:text-gray-400 text-center">
                      No supplements found matching your criteria
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredSupplements.map((supplement) => (
                        <div
                          key={supplement.value}
                          className={`flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${
                            selectedProtocols.some(p => p.type === supplement.value) ? 'bg-indigo-50 dark:bg-indigo-900/50' : ''
                          }`}
                          onClick={() => handleSupplementToggle(supplement)}
                        >
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{supplement.label}</span>
                          {selectedProtocols.some(p => p.type === supplement.value) && (
                            <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>


              </>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedProtocols.map((protocol) => {
                    const supplementDetails = getSupplementDetails(protocol.type);
                    return (
                      <div key={protocol.type} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {protocol.label}
                          </h4>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          {/* Dosage */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Dosage
                            </label>
                            <div className="flex">
                              <input
                                type="text"
                                value={protocol.dosage}
                                onChange={(e) => handleProtocolChange(protocol.type, 'dosage', e.target.value)}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                                placeholder="Amount"
                              />
                              <select
                                value={protocol.unit}
                                onChange={(e) => handleProtocolChange(protocol.type, 'unit', e.target.value)}
                                className="px-2 py-1 text-sm border-l-0 border border-gray-300 dark:border-gray-600 rounded-r-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                              >
                                <option value={protocol.unit}>{protocol.unit}</option>
                                <option value="mg">mg</option>
                                <option value="g">g</option>
                                <option value="mcg">mcg</option>
                                <option value="IU">IU</option>
                                <option value="ml">ml</option>
                                <option value="capsule">capsule</option>
                                <option value="tablet">tablet</option>
                                <option value="tsp">tsp</option>
                                <option value="tbsp">tbsp</option>
                                <option value="scoop">scoop</option>
                              </select>
                            </div>
                          </div>

                          {/* Frequency */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Frequency
                            </label>
                            <select
                              value={protocol.frequency}
                              onChange={(e) => handleProtocolChange(protocol.type, 'frequency', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                            >
                              {frequencyOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </div>


                        </div>
                      </div>
                    );
                  })}
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
                    {isSubmitting ? 'Saving...' : `Save ${selectedProtocols.length} Supplement${selectedProtocols.length !== 1 ? 's' : ''}`}
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