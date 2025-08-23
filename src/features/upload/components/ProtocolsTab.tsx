'use client';

import React, { useState } from 'react';
import {
  useDietProtocol,
  useWorkoutProtocols,
  useSupplementProtocols,
  useExperiments,
  useProtocolModals,
} from '../hooks';
import {
  AddSupplementProtocolModal,
  EditSupplementProtocolModal,
  AddWorkoutProtocolModal,
  AddExperimentModal,
  EditExperimentModal,
} from './modals';

type SupplementProtocol = {
  type: string;
  frequency: string;
  dosage: string;
  unit: string;
};

interface ProtocolsTabProps {
  // Initial values from preloaded data for smooth tab switching
  initialDiet?: string;
  initialWorkoutProtocols?: Array<{ type: string; frequency: number }>;
  initialSupplementProtocols?: Array<{ type: string; frequency: string; dosage: string; unit: string }>;
}

export default function ProtocolsTab({
  initialDiet = '',
  initialWorkoutProtocols = [],
  initialSupplementProtocols = [],
}: ProtocolsTabProps) {
  // State for tracking which supplement is being edited
  const [editingSupplement, setEditingSupplement] = useState<SupplementProtocol | null>(null);
  
  // Initialize hooks with preloaded data
  const dietProtocol = useDietProtocol(initialDiet);
  const workoutProtocols = useWorkoutProtocols(initialWorkoutProtocols);
  const supplementProtocols = useSupplementProtocols(initialSupplementProtocols);
  const experiments = useExperiments();
  const protocolModals = useProtocolModals();
  
  return (
    <div className="space-y-6">
      <h2 className="hidden md:block text-2xl font-bold text-gray-900 dark:text-white">Protocols & Experiments</h2>
      
      {/* Current Diet Protocol */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Current Diet Protocol</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Select your current dietary approach to track its impact on your health metrics.
        </p>
        
        <div className="max-w-md relative">
          <select
            name="currentDiet"
            id="currentDiet"
            value={dietProtocol.currentDiet}
            onChange={(e) => dietProtocol.handleDietChange(e.target.value)}
            disabled={dietProtocol.isSavingProtocol}
            className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-12 px-4 text-gray-900 appearance-none bg-no-repeat disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: `right 0.5rem center`,
              backgroundSize: `1.5em 1.5em`
            }}
          >
            <option value="">Select your current diet</option>
            <option value="ketogenic">Ketogenic Diet</option>
            <option value="carnivore">Carnivore Diet</option>
            <option value="mediterranean">Mediterranean Diet</option>
            <option value="paleo">Paleo Diet</option>
            <option value="vegan">Vegan Diet</option>
            <option value="vegetarian">Vegetarian Diet</option>
            <option value="whole30">Whole30</option>
            <option value="low-carb">Low Carb Diet</option>
            <option value="variable-no-particular">Variable - No Particular Diet</option>
            <option value="other">Other</option>
          </select>
          {dietProtocol.isSavingProtocol && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="animate-spin h-4 w-4 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Current Workout Protocols */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Current Workout Protocols</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Track your regular workout routines and their frequency to understand their impact on your health metrics.
        </p>
        
        <button
          onClick={() => protocolModals.openModal('add-workout')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Workout Protocol
        </button>

        {/* Current Workout Protocols List */}
        {workoutProtocols.workoutProtocols.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Your Current Protocols:</h4>
            <div className="space-y-3">
              {workoutProtocols.workoutProtocols.map((workout) => (
                <div key={workout.type} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex-1">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {workout.type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </h5>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => workoutProtocols.updateWorkoutProtocolFrequency(workout.type, Math.max(1, workout.frequency - 1))}
                        disabled={workoutProtocols.isSavingWorkoutProtocol || workout.frequency <= 1}
                        className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[60px] text-center">
                        {workout.frequency}x/week
                      </span>
                      <button
                        onClick={() => workoutProtocols.updateWorkoutProtocolFrequency(workout.type, Math.min(7, workout.frequency + 1))}
                        disabled={workoutProtocols.isSavingWorkoutProtocol || workout.frequency >= 7}
                        className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                    <button
                      onClick={() => workoutProtocols.removeWorkoutProtocol(workout.type)}
                      disabled={workoutProtocols.isSavingWorkoutProtocol}
                      className="text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Total: {workoutProtocols.workoutProtocols.reduce((sum, w) => sum + w.frequency, 0)} sessions/week
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Current Supplement Protocols */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Current Supplement Protocols</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Track your supplement regimen to understand its impact on your health metrics and biomarkers.
        </p>
        
        <button
          onClick={() => protocolModals.openModal('add-supplement')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Supplement Protocol
        </button>

        {/* Current Supplement Protocols List */}
        {supplementProtocols.supplementProtocols.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Your Current Protocols:</h4>
            <div className="space-y-3">
              {supplementProtocols.supplementProtocols.map((supplement) => (
                <div key={supplement.type} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex-1">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {supplement.type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {supplement.dosage} {supplement.unit} - {supplement.frequency}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingSupplement(supplement);
                        protocolModals.openModal('edit-supplement');
                      }}
                      disabled={supplementProtocols.isSavingSupplementProtocol}
                      className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Total: {supplementProtocols.supplementProtocols.length} supplement{supplementProtocols.supplementProtocols.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Experiments & Trials */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Experiments & Trials</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Create and track health and fitness experiments to optimize your protocols and measure their impact.
        </p>
        
        <button
          onClick={() => protocolModals.openModal('add-experiment')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Experiment
        </button>

        {/* Loading State */}
        {experiments.isLoadingExperiments && (
          <div className="mt-6 flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading experiments...</span>
          </div>
        )}

        {/* Current Experiments List */}
        {!experiments.isLoadingExperiments && experiments.experiments.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Your Active Experiments:</h4>
            <div className="space-y-3">
              {experiments.experiments.filter(exp => exp.status === 'active').map((experiment) => (
                <div key={experiment.id} className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex-1">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                      {experiment.name}
                    </h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {experiment.description}
                    </p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {experiment.frequency} • {experiment.duration}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Created: {new Date(experiment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {[...experiment.fitnessMarkers.slice(0, 3), ...experiment.bloodMarkers.slice(0, 3)].map((marker) => (
                        <span
                          key={marker}
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                        >
                          {marker}
                        </span>
                      ))}
                      {(experiment.fitnessMarkers.length + experiment.bloodMarkers.length) > 6 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400">
                          +{(experiment.fitnessMarkers.length + experiment.bloodMarkers.length) - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => {
                        experiments.handleEditExperiment(experiment);
                        protocolModals.openModal('edit-experiment');
                      }}
                      className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => experiments.removeExperiment(experiment.id)}
                      className="text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Total: {experiments.experiments.filter(exp => exp.status === 'active').length} active experiment{experiments.experiments.filter(exp => exp.status === 'active').length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!experiments.isLoadingExperiments && experiments.experiments.length === 0 && (
          <div className="mt-6 text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No experiments yet</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating your first health experiment.
            </p>
          </div>
        )}

      </div>

      {/* Protocol Modals */}
      <AddSupplementProtocolModal
        isOpen={protocolModals.isAddSupplementProtocolModalOpen}
        onClose={() => protocolModals.closeModal('add-supplement')}
        onSave={supplementProtocols.handleSaveSupplementProtocols}
      />

      <EditSupplementProtocolModal
        isOpen={protocolModals.isEditSupplementProtocolModalOpen}
        onClose={() => {
          setEditingSupplement(null);
          protocolModals.closeModal('edit-supplement');
        }}
        supplement={editingSupplement}
        onUpdate={supplementProtocols.updateSupplementProtocol}
        isSaving={supplementProtocols.isSavingSupplementProtocol}
      />

      <AddWorkoutProtocolModal
        isOpen={protocolModals.isAddWorkoutProtocolModalOpen}
        onClose={() => protocolModals.closeModal('add-workout')}
        onSave={workoutProtocols.handleSaveWorkoutProtocols}
      />

      <AddExperimentModal
        isOpen={protocolModals.isAddExperimentModalOpen}
        onClose={() => protocolModals.closeModal('add-experiment')}
        onSave={experiments.handleSaveExperiment}
      />

      <EditExperimentModal
        isOpen={protocolModals.isEditExperimentModalOpen}
        onClose={() => {
          experiments.setEditingExperiment(null);
          protocolModals.closeModal('edit-experiment');
        }}
        experiment={experiments.editingExperiment}
        onSave={experiments.handleUpdateExperiment}
      />
    </div>
  );
}
