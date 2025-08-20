import React from 'react';
import { useHealthDataUpload } from '../hooks';
import { HealthData } from '../types';
import UploadProgressIndicator from './UploadProgressIndicator';
import UploadErrorDisplay from './UploadErrorDisplay';
import ProcessingStatus from './ProcessingStatus';

interface HealthDataUploadSectionProps {
  className?: string;
}

export default function HealthDataUploadSection({
  className = ''
}: HealthDataUploadSectionProps) {
  // Use the health data upload hook
  const healthDataUpload = useHealthDataUpload({
    onDataExtracted: (data: HealthData) => {
      console.log('Health data extracted:', data);
    },
    onProcessingComplete: (data: HealthData) => {
      console.log('Health data processing completed:', data);
    },
    onProcessingError: (error) => {
      console.error('Health data processing error:', error);
    }
  });

  // Handle file selection
  const handleFileSelect = async (files: File[]) => {
    if (files.length > 0) {
      await healthDataUpload.uploadFile(files[0]);
    }
  };

  // Format data summary
  const getDataSummary = (data: HealthData | null) => {
    if (!data) return null;

    const totalRecords =
      data.steps.length +
      data.weight.length +
      data.sleep.length +
      data.hrv.length;

    return {
      totalRecords,
      steps: data.steps.length,
      weight: data.weight.length,
      sleep: data.sleep.length,
      hrv: data.hrv.length,
      dateRange: getDateRange(data)
    };
  };

  // Get date range from data
  const getDateRange = (data: HealthData) => {
    const allDates = [
      ...data.steps.map(d => d.date),
      ...data.weight.map(d => d.date),
      ...data.sleep.map(d => d.date),
      ...data.hrv.map(d => d.date)
    ].sort();

    if (allDates.length === 0) return null;

    const firstDate = new Date(allDates[0]).toLocaleDateString();
    const lastDate = new Date(allDates[allDates.length - 1]).toLocaleDateString();

    return { first: firstDate, last: lastDate, count: allDates.length };
  };

  const dataSummary = getDataSummary(healthDataUpload.extractedData);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>

            <div className="mt-4">
              <label htmlFor="health-data-file" className="cursor-pointer">
                <span className="mt-2 block text-lg font-medium text-gray-900 dark:text-white">
                  Upload Apple Health Data
                </span>
                <span className="mt-1 block text-sm text-gray-500 dark:text-gray-400">
                  Drop your XML export here, or click to select
                </span>
              </label>

              <input
                id="health-data-file"
                type="file"
                accept=".xml,.txt"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  handleFileSelect(files);
                }}
                disabled={healthDataUpload.isUploading || healthDataUpload.isProcessing}
                className="hidden"
              />
            </div>

            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              <p>Supported: XML files up to 100MB</p>
              <p>Apple Health export files with activity and health metrics</p>
            </div>
          </div>
        </div>

        {/* Upload Progress */}
        {healthDataUpload.files.length > 0 && (
          <div className="px-6 pb-6">
            <UploadProgressIndicator
              progress={{
                loaded: (healthDataUpload.files[0].progress / 100) * healthDataUpload.files[0].size,
                total: healthDataUpload.files[0].size,
                percentage: healthDataUpload.files[0].progress
              }}
              file={healthDataUpload.files[0]}
            />
          </div>
        )}

        {/* Error Display */}
        <UploadErrorDisplay
          error={healthDataUpload.hasError ? {
            code: 'UPLOAD_FAILED',
            message: 'Upload failed',
            details: healthDataUpload.hasError
          } : null}
          onRetry={() => healthDataUpload.files[0] && healthDataUpload.retryUpload(healthDataUpload.files[0].id)}
          canRetry={healthDataUpload.files.length > 0}
        />
      </div>

      {/* Processing Status */}
      <ProcessingStatus
        job={healthDataUpload.processingJob}
        isProcessing={healthDataUpload.isProcessing}
        processingProgress={healthDataUpload.processingProgress}
        onCancel={() => healthDataUpload.files[0] && healthDataUpload.cancelUpload(healthDataUpload.files[0].id)}
        onRetry={healthDataUpload.resetHealthDataState}
      />

      {/* Data Summary */}
      {healthDataUpload.extractedData && dataSummary && (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                Data Successfully Processed
              </h3>
              <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="font-medium">Total Records:</span>
                    <br />
                    {dataSummary.totalRecords.toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Steps:</span>
                    <br />
                    {dataSummary.steps.toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Weight:</span>
                    <br />
                    {dataSummary.weight.toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Sleep:</span>
                    <br />
                    {dataSummary.sleep.toLocaleString()}
                  </div>
                </div>
                {dataSummary.dateRange && (
                  <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-700">
                    <span className="font-medium">Date Range:</span>
                    <br />
                    {dataSummary.dateRange.first} to {dataSummary.dateRange.last}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              How to export Apple Health data
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <ol className="list-decimal list-inside space-y-1">
                <li>Open the Health app on your iPhone</li>
                <li>Tap your profile picture in the top right</li>
                <li>Scroll down and tap "Export All Health Data"</li>
                <li>Choose "Export" and save the ZIP file</li>
                <li>Extract the ZIP and upload the XML file</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
