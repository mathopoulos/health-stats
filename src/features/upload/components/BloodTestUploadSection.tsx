import React, { useState } from 'react';
import { usePDFUpload } from '../hooks';
import { BloodMarker, DateGroup } from '../types';
import UploadProgressIndicator from './UploadProgressIndicator';
import UploadErrorDisplay from './UploadErrorDisplay';
import ProcessingStatus from './ProcessingStatus';
import BloodMarkerPreview from '../../blood-markers/components/BloodMarkerPreview';

interface BloodTestUploadSectionProps {
  className?: string;
}

export default function BloodTestUploadSection({
  className = ''
}: BloodTestUploadSectionProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showPreview, setShowPreview] = useState(false);

  // Use the PDF upload hook
  const pdfUpload = usePDFUpload({
    onMarkersExtracted: (markers, dateGroups) => {
      console.log('Blood markers extracted:', markers);
      setShowPreview(true);
    },
    onTextExtracted: (text) => {
      console.log('PDF text extracted:', text.length, 'characters');
    }
  });

  // Handle file selection
  const handleFileSelect = async (files: File[]) => {
    if (files.length > 0) {
      await pdfUpload.uploadFile(files[0]);
    }
  };

  // Handle save markers
  const handleSaveMarkers = async (markers: BloodMarker[], date: Date) => {
    // This will be handled by the BloodMarkerPreview component
    // using the existing save logic
    return true;
  };

  // Get drag and drop props
  const getDragDropProps = () => ({
    onDrop: handleFileSelect,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    disabled: pdfUpload.isUploading || pdfUpload.isProcessing,
  });

  // Calculate upload progress
  const uploadProgress = pdfUpload.files.length > 0 ? pdfUpload.files[0].progress : 0;

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
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>

            <div className="mt-4">
              <label htmlFor="blood-test-file" className="cursor-pointer">
                <span className="mt-2 block text-lg font-medium text-gray-900 dark:text-white">
                  Upload Blood Test PDF
                </span>
                <span className="mt-1 block text-sm text-gray-500 dark:text-gray-400">
                  Drop your PDF here, or click to select
                </span>
              </label>

              <input
                id="blood-test-file"
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  handleFileSelect(files);
                }}
                disabled={pdfUpload.isUploading || pdfUpload.isProcessing}
                className="hidden"
              />
            </div>

            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              <p>Supported: PDF files up to 10MB</p>
              <p>Lab results with blood markers will be automatically extracted</p>
            </div>
          </div>
        </div>

        {/* Upload Progress */}
        {pdfUpload.files.length > 0 && (
          <div className="px-6 pb-6">
            <UploadProgressIndicator
              progress={{
                loaded: (pdfUpload.files[0].progress / 100) * pdfUpload.files[0].size,
                total: pdfUpload.files[0].size,
                percentage: pdfUpload.files[0].progress
              }}
              file={pdfUpload.files[0]}
            />
          </div>
        )}

        {/* Error Display */}
        <UploadErrorDisplay
          error={pdfUpload.hasError ? {
            code: 'UPLOAD_FAILED',
            message: 'Upload failed',
            details: pdfUpload.hasError
          } : null}
          onRetry={() => pdfUpload.files[0] && pdfUpload.retryUpload(pdfUpload.files[0].id)}
          canRetry={pdfUpload.files.length > 0}
        />
      </div>

      {/* Processing Status */}
      <ProcessingStatus
        isProcessing={pdfUpload.isProcessing}
        processingProgress={pdfUpload.processingProgress}
        onCancel={() => pdfUpload.files[0] && pdfUpload.cancelUpload(pdfUpload.files[0].id)}
      />

      {/* Blood Marker Preview Modal */}
      <BloodMarkerPreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        markers={pdfUpload.extractedMarkers}
        onSave={handleSaveMarkers}
        initialDate={pdfUpload.extractedText ? new Date().toISOString().split('T')[0] : undefined}
        dateGroups={pdfUpload.dateGroups}
        isProcessing={pdfUpload.isProcessing}
        processingProgress={pdfUpload.processingProgress}
      />

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
              How it works
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <ul className="list-disc list-inside space-y-1">
                <li>Upload your blood test PDF file</li>
                <li>We'll automatically extract blood markers and test dates</li>
                <li>Review and confirm the extracted data</li>
                <li>Save the data to your health dashboard</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
