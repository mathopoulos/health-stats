'use client';

import React, { useRef, DragEvent } from 'react';
import FitnessMetricsHistory from '@features/workouts/components/FitnessMetricsHistory';

interface FitnessTabProps {
  // Drag & Drop state
  isDragging: boolean;
  
  // File upload state
  inputFileRef: React.RefObject<HTMLInputElement>;
  isFileLoading: boolean;
  setIsFileLoading: (loading: boolean) => void;
  fileKey: number;
  setFileKey: (key: number | ((prev: number) => number)) => void;
  error: string | null;
  setError: (error: string | null) => void;
  uploading: boolean;
  progress: number;
  uploadSuccess: boolean;
  setUploadSuccess: (success: boolean) => void;
  
  // Processing state
  isProcessing: boolean;
  processingStatus: string;
  hasExistingUploads: boolean;
  
  // File management state
  uploadedFiles: Array<{
    id: string;
    filename: string;
    uploadDate: string;
  }>;
  selectedFiles: Set<string>;
  isLoadingFiles: boolean;
  
  // Help state
  isHelpExpanded: boolean;
  setIsHelpExpanded: (expanded: boolean) => void;
  
  // Event handlers
  handleDragEnter: (e: DragEvent<HTMLDivElement>) => void;
  handleDragLeave: (e: DragEvent<HTMLDivElement>) => void;
  handleDragOver: (e: DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: DragEvent<HTMLDivElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  handleProcess: () => void;
  
  // File management handlers
  fetchUploadedFiles: () => void;
  deleteSelectedFiles: () => void;
  toggleSelectAllFiles: () => void;
  toggleFileSelection: (fileId: string) => void;
  isFileSelected: (fileId: string) => boolean;
  handleDeleteFile: (fileId: string) => void;
}

export default function FitnessTab({
  isDragging,
  inputFileRef,
  isFileLoading,
  setIsFileLoading,
  fileKey,
  setFileKey,
  error,
  setError,
  uploading,
  progress,
  uploadSuccess,
  setUploadSuccess,
  isProcessing,
  processingStatus,
  hasExistingUploads,
  uploadedFiles,
  selectedFiles,
  isLoadingFiles,
  isHelpExpanded,
  setIsHelpExpanded,
  handleDragEnter,
  handleDragLeave,
  handleDragOver,
  handleDrop,
  handleSubmit,
  handleProcess,
  fetchUploadedFiles,
  deleteSelectedFiles,
  toggleSelectAllFiles,
  toggleFileSelection,
  isFileSelected,
  handleDeleteFile,
}: FitnessTabProps) {
  return (
    <div className="space-y-6">
      <h2 className="hidden md:block text-2xl font-bold text-gray-900 dark:text-white">Fitness Metrics</h2>

      {/* iOS App Sync Section - Simplified */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Get automatic syncing with our iOS app 
              <a 
                href="https://testflight.apple.com/join/P3P1dtH6" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center ml-2 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-800/40 border border-indigo-200 dark:border-indigo-700 rounded-md transition-colors"
              >
                Download Beta
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Manual Upload Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Upload Apple Health Data</h3>
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            XML files exported from Apple Health
          </div>
        </div>

        {/* Existing file upload functionality */}
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => inputFileRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
              : 'border-gray-300 dark:border-gray-700'
          }`}
        >
          <input
            key={fileKey}
            type="file"
            ref={inputFileRef}
            onChange={(e) => {
              setIsFileLoading(true);
              if (e.target.files?.[0]) {
                setError(null);
                setUploadSuccess(false);
              }
              setTimeout(() => {
                setIsFileLoading(false);
              }, 500);
            }}
            className="hidden"
            accept=".xml,.fit"
          />
          <div className="space-y-4">
            {isFileLoading ? (
              // Loading state
              <div className="flex flex-col items-center space-y-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800">
                  <svg className="animate-spin h-6 w-6 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Adding file...
                </p>
              </div>
            ) : inputFileRef.current?.files?.[0] ? (
              // Show selected file info
              <div className="flex flex-col items-center space-y-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/20">
                  <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {inputFileRef.current.files[0].name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Ready to upload
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (inputFileRef.current) {
                      inputFileRef.current.value = '';
                      setIsFileLoading(false);
                      setFileKey(prev => prev + 1);
                    }
                  }}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 cursor-pointer"
                >
                  Remove file
                </button>
              </div>
            ) : (
              // Default upload state
              <>
                <div className="flex justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <button
                    onClick={() => inputFileRef.current?.click()}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-medium cursor-pointer"
                  >
                    Upload a file
                  </button>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    or drag and drop your Apple Health XML file here
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
        {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
        {uploading && (
          <div className="mt-4">
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                    Uploading
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-indigo-600">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
                <div
                  style={{ width: `${progress}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
                />
              </div>
            </div>
          </div>
        )}
        {isProcessing && (
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{processingStatus}</p>
        )}

        {/* Processing Buttons */}
        <div className="flex gap-4 mt-4">
          <button
            type="submit"
            onClick={(e) => handleSubmit(e as any)}
            disabled={uploading || !inputFileRef.current?.files?.[0]}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {uploading ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Uploading...
              </>
            ) : 'Upload'}
          </button>
          {(uploadSuccess || hasExistingUploads) && (
            <button
              onClick={handleProcess}
              disabled={isProcessing || uploading}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white transition-colors ${
                isProcessing || uploading
                  ? 'bg-gray-400 dark:bg-gray-600' 
                  : 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 cursor-pointer'
              } disabled:cursor-not-allowed`}
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </>
              ) : 'Process Latest Upload'}
            </button>
          )}
        </div>

        {/* Help Section - How to export Apple Health data - Now Expandable */}
        <div className="mt-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => setIsHelpExpanded(!isHelpExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between text-left bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 text-indigo-500 dark:text-indigo-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-gray-900 dark:text-white text-sm">
                How to export your Apple Health data
              </span>
            </div>
            <svg 
              className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isHelpExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isHelpExpanded ? 'max-h-96 py-4 px-6' : 'max-h-0'}`}>
            <ol className="space-y-3">
              <li className="flex gap-3 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex-none w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-900 dark:text-white">1</span>
                <span>Open the Health app on your iPhone</span>
              </li>
              <li className="flex gap-3 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex-none w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-900 dark:text-white">2</span>
                <span>Tap your profile picture in the top right</span>
              </li>
              <li className="flex gap-3 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex-none w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-900 dark:text-white">3</span>
                <span>Scroll down and tap "Export All Health Data"</span>
              </li>
              <li className="flex gap-3 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex-none w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-900 dark:text-white">4</span>
                <span>Upload the exported ZIP file here</span>
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Uploaded Files History Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Uploaded Files History</h3>
          <button
            onClick={fetchUploadedFiles}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
        
        {/* Show delete selected button when files are selected */}
        {selectedFiles.size > 0 && (
          <div className="flex items-center justify-between mb-4 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-md">
            <span className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">
              {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={deleteSelectedFiles}
              className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              Delete Selected
            </button>
          </div>
        )}
        
        {isLoadingFiles ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            <span className="ml-2 text-gray-500 dark:text-gray-400">Loading uploaded files...</span>
          </div>
        ) : uploadedFiles.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No files uploaded yet. Upload your Apple Health data to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {/* Checkbox column for select all */}
                  <th scope="col" className="px-2 py-3">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 text-indigo-500 focus:ring-indigo-400 focus:ring-opacity-50 focus:ring-offset-0 border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                        checked={uploadedFiles.length > 0 && selectedFiles.size === uploadedFiles.length}
                        onChange={toggleSelectAllFiles}
                      />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Filename
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Upload Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {uploadedFiles.map((file, idx) => (
                  <tr 
                    key={file.id} 
                    className={`${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/30'} ${
                      isFileSelected(file.id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                    }`}
                  >
                    {/* Checkbox for row selection */}
                    <td className="px-2 py-4">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 text-indigo-500 focus:ring-indigo-400 focus:ring-opacity-50 focus:ring-offset-0 border-gray-300 dark:border-gray-600 rounded cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
                          checked={isFileSelected(file.id)}
                          onChange={() => toggleFileSelection(file.id)}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {file.filename}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(file.uploadDate).toLocaleDateString(undefined, { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button 
                        onClick={() => handleDeleteFile(file.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        aria-label={`Delete ${file.filename}`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Move FitnessMetricsHistory component here, below the Uploaded Files History section */}
      <FitnessMetricsHistory />
    </div>
  );
}
