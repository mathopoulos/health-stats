import React, { useState } from 'react';
import UploadTabs, { DEFAULT_UPLOAD_TABS } from './UploadTabs';
import BloodTestUploadSection from './BloodTestUploadSection';
import HealthDataUploadSection from './HealthDataUploadSection';
import AddExperimentModal from '../../experiments/components/AddExperimentModal';
import AddResultsModal from '../../experiments/components/AddResultsModal';
import AddWorkoutProtocolModal from '../../experiments/components/AddWorkoutProtocolModal';
import AddSupplementProtocolModal from '../../experiments/components/AddSupplementProtocolModal';
import EditExperimentModal from '../../experiments/components/EditExperimentModal';

interface UploadDashboardProps {
  className?: string;
}

export default function UploadDashboard({
  className = ''
}: UploadDashboardProps) {
  const [activeTab, setActiveTab] = useState('blood-test');

  // Modal states
  const [showAddExperiment, setShowAddExperiment] = useState(false);
  const [showAddResults, setShowAddResults] = useState(false);
  const [showAddWorkoutProtocol, setShowAddWorkoutProtocol] = useState(false);
  const [showAddSupplementProtocol, setShowAddSupplementProtocol] = useState(false);
  const [showEditExperiment, setShowEditExperiment] = useState(false);

  // Handle tab change with experiment modal
  const handleTabChange = (tabId: string) => {
    if (tabId === 'experiments') {
      setShowAddExperiment(true);
      return;
    }
    setActiveTab(tabId);
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'blood-test':
        return <BloodTestUploadSection />;
      case 'health-data':
        return <HealthDataUploadSection />;
      default:
        return null;
    }
  };

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Health Data Upload
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Upload and manage your health data, blood test results, and experiment protocols.
        </p>
      </div>

      {/* Upload Tabs */}
      <UploadTabs
        tabs={DEFAULT_UPLOAD_TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        className="mb-8"
      />

      {/* Tab Content */}
      <div className="tab-content">
        {renderTabContent()}
      </div>

      {/* Experiment Modals */}
      <AddExperimentModal
        isOpen={showAddExperiment}
        onClose={() => setShowAddExperiment(false)}
        onSave={(experiment) => {
          setShowAddExperiment(false);
          // Optionally refresh data or handle the experiment
          console.log('Experiment saved:', experiment);
        }}
      />

      <AddResultsModal
        isOpen={showAddResults}
        onClose={() => setShowAddResults(false)}
        prefilledResults={null}
      />

      <AddWorkoutProtocolModal
        isOpen={showAddWorkoutProtocol}
        onClose={() => setShowAddWorkoutProtocol(false)}
        onSave={async (protocols) => {
          setShowAddWorkoutProtocol(false);
          // Optionally refresh data or handle the protocols
          console.log('Workout protocols saved:', protocols);
        }}
      />

      <AddSupplementProtocolModal
        isOpen={showAddSupplementProtocol}
        onClose={() => setShowAddSupplementProtocol(false)}
        onSave={async (protocols) => {
          setShowAddSupplementProtocol(false);
          // Optionally refresh data or handle the protocols
          console.log('Supplement protocols saved:', protocols);
        }}
      />

      <EditExperimentModal
        isOpen={showEditExperiment}
        onClose={() => setShowEditExperiment(false)}
        experiment={null} // Would need to be passed in
        onSave={(experiment) => {
          setShowEditExperiment(false);
          // Optionally refresh data or handle the experiment
          console.log('Experiment updated:', experiment);
        }}
      />
    </div>
  );
}
