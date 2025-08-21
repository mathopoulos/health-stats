import { useState, useCallback } from 'react';
import { useFileUpload } from './useFileUpload';
import {
  HealthData,
  HealthDataRecord,
  UploadError,
  APIResponse,
  ProcessingJob
} from '../types';

interface UseHealthDataUploadOptions {
  onDataExtracted?: (data: HealthData) => void;
  onProcessingStart?: (jobId: string) => void;
  onProcessingComplete?: (data: HealthData) => void;
  onProcessingError?: (error: UploadError) => void;
  maxRetries?: number;
  pollingInterval?: number;
}

interface UseHealthDataUploadReturn {
  // File upload functionality
  uploadFile: (file: File) => Promise<void>;
  uploadFiles: (files: File[]) => Promise<void>;
  cancelUpload: (fileId: string) => void;
  retryUpload: (fileId: string) => Promise<void>;
  clearFiles: () => void;

  // Health data specific functionality
  processHealthData: (file: File) => Promise<void>;
  startProcessing: () => Promise<string>;
  checkProcessingStatus: (jobId: string) => Promise<ProcessingJob | null>;
  resetHealthDataState: () => void;

  // State
  isProcessing: boolean;
  processingProgress: string;
  extractedData: HealthData | null;
  processingJob: ProcessingJob | null;
  processingStatus: 'idle' | 'starting' | 'processing' | 'completed' | 'failed';

  // Inherited from useFileUpload
  files: any[];
  isUploading: boolean;
  hasError: boolean;
  hasCompleted: boolean;
}

export function useHealthDataUpload(options: UseHealthDataUploadOptions = {}): UseHealthDataUploadReturn {
  const {
    onDataExtracted,
    onProcessingStart,
    onProcessingComplete,
    onProcessingError,
    maxRetries = 3,
    pollingInterval = 5000 // 5 seconds
  } = options;

  // Local state for health data processing
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState('');
  const [extractedData, setExtractedData] = useState<HealthData | null>(null);
  const [processingJob, setProcessingJob] = useState<ProcessingJob | null>(null);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'starting' | 'processing' | 'completed' | 'failed'>('idle');

  // Use the base file upload hook
  const fileUpload = useFileUpload({
    allowedTypes: ['application/xml', 'text/xml'],
    maxFileSize: 100 * 1024 * 1024, // 100MB for XML files
    autoStart: false, // We'll handle the upload manually
    maxRetries
  });

  // Start processing job
  const startProcessing = useCallback(async (): Promise<string> => {
    setProcessingStatus('starting');
    setProcessingProgress('Starting processing...');

    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to start processing');
      }

      const responseData = await response.json();
      const { processingId } = responseData;

      setProcessingStatus('processing');
      setProcessingProgress('Processing started. Waiting for results...');

      const job: ProcessingJob = {
        _id: processingId,
        userId: '', // Will be set by the API
        status: 'processing',
        type: 'health-data',
        fileKey: '', // Will be set by the API
        startedAt: new Date()
      };

      setProcessingJob(job);
      onProcessingStart?.(processingId);

      return processingId;
    } catch (error) {
      const uploadError: UploadError = {
        code: 'PROCESSING_START_FAILED',
        message: error instanceof Error ? error.message : 'Failed to start processing',
        details: error
      };

      setProcessingStatus('failed');
      setProcessingProgress('');
      onProcessingError?.(uploadError);

      throw uploadError;
    }
  }, [onProcessingStart, onProcessingError]);

  // Check processing status
  const checkProcessingStatus = useCallback(async (jobId: string): Promise<ProcessingJob | null> => {
    try {
      const response = await fetch(`/api/process/status?id=${jobId}`);

      if (!response.ok) {
        throw new Error('Failed to check processing status');
      }

      const statusData = await response.json();

      if (statusData.completed) {
        const job: ProcessingJob = {
          _id: jobId,
          userId: '',
          status: 'completed',
          type: 'health-data',
          fileKey: '',
          startedAt: new Date(),
          completedAt: new Date()
        };

        setProcessingJob(job);
        setProcessingStatus('completed');
        setProcessingProgress('Processing completed!');

        return job;
      }

      return null; // Still processing
    } catch (error) {
      console.error('Error checking processing status:', error);
      return null;
    }
  }, []);

  // Poll for processing completion
  const pollProcessingStatus = useCallback(async (jobId: string) => {
    const maxAttempts = 60; // 5 minutes total with 5 second intervals
    let attempts = 0;

    while (attempts < maxAttempts) {
      const job = await checkProcessingStatus(jobId);

      if (job) {
        // Processing completed
        return job;
      }

      attempts++;
      setProcessingProgress(`Processing... (${Math.round((attempts / maxAttempts) * 100)}% complete)`);

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollingInterval));
    }

    // Timeout reached
    throw new Error('Processing timed out');
  }, [checkProcessingStatus, pollingInterval]);

  // Process health data file
  const processHealthData = useCallback(async (file: File) => {
    setIsProcessing(true);
    setExtractedData(null);

    try {
      // First upload the file
      await fileUpload.uploadFile(file);

      // Then start processing
      const jobId = await startProcessing();

      // Poll for completion
      const completedJob = await pollProcessingStatus(jobId);

      // For now, we'll create mock data since we don't have the actual processing endpoint
      // In a real implementation, you would fetch the actual processed data
      const mockData: HealthData = {
        steps: [], // Would be populated from actual processing
        weight: [],
        sleep: [],
        hrv: []
      };

      setExtractedData(mockData);
      onDataExtracted?.(mockData);
      onProcessingComplete?.(mockData);

    } catch (error) {
      const uploadError: UploadError = {
        code: 'HEALTH_DATA_PROCESSING_FAILED',
        message: error instanceof Error ? error.message : 'Failed to process health data',
        details: error
      };

      setProcessingStatus('failed');
      onProcessingError?.(uploadError);
    } finally {
      setIsProcessing(false);
      setProcessingProgress('');
    }
  }, [
    fileUpload,
    startProcessing,
    pollProcessingStatus,
    onDataExtracted,
    onProcessingComplete,
    onProcessingError
  ]);

  // Enhanced upload function that includes health data processing
  const uploadHealthDataFile = useCallback(async (file: File) => {
    await processHealthData(file);
  }, [processHealthData]);

  // Upload multiple health data files
  const uploadHealthDataFiles = useCallback(async (files: File[]) => {
    for (const file of files) {
      if (file.type === 'application/xml' || file.type === 'text/xml') {
        await uploadHealthDataFile(file);
      }
    }
  }, [uploadHealthDataFile]);

  // Reset function to clear all state
  const resetHealthDataState = useCallback(() => {
    setIsProcessing(false);
    setProcessingProgress('');
    setExtractedData(null);
    setProcessingJob(null);
    setProcessingStatus('idle');
  }, []);

  // Enhanced clear files that also resets health data state
  const clearFiles = useCallback(() => {
    fileUpload.clearFiles();
    resetHealthDataState();
  }, [fileUpload, resetHealthDataState]);

  return {
    // File upload functionality
    uploadFile: uploadHealthDataFile,
    uploadFiles: uploadHealthDataFiles,
    cancelUpload: fileUpload.cancelUpload,
    retryUpload: fileUpload.retryUpload,
    clearFiles,

    // Health data specific functionality
    processHealthData,
    startProcessing,
    checkProcessingStatus,
    resetHealthDataState,

    // State
    isProcessing,
    processingProgress,
    extractedData,
    processingJob,
    processingStatus,

    // Inherited from useFileUpload
    files: fileUpload.files,
    isUploading: fileUpload.isUploading,
    hasError: fileUpload.hasError,
    hasCompleted: fileUpload.hasCompleted
  };
}
