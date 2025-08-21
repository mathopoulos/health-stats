'use client';

import { useState } from 'react';

export interface UseFileProcessingReturn {
  // Processing state
  isProcessing: boolean;
  processingStatus: string;
  hasExistingUploads: boolean;
  setHasExistingUploads: (has: boolean) => void;
  
  // Processing handler
  handleProcess: () => void;
}

export function useFileProcessing(): UseFileProcessingReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [hasExistingUploads, setHasExistingUploads] = useState(false);

  const handleProcess = async () => {
    setIsProcessing(true);
    setProcessingStatus('Starting processing...');

    try {
      const response = await fetch('/api/process-health-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Processing failed');
      }

      const data = await response.json();
      
      if (data.jobId) {
        setProcessingStatus('Processing your data...');
        
        // Poll for job status
        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch(`/api/processing-job/${data.jobId}`);
            const statusData = await statusResponse.json();
            
            if (statusData.status === 'completed') {
              setProcessingStatus('Processing completed successfully!');
              clearInterval(pollInterval);
              setIsProcessing(false);
            } else if (statusData.status === 'failed') {
              setProcessingStatus('Processing failed. Please try again.');
              clearInterval(pollInterval);
              setIsProcessing(false);
            } else {
              setProcessingStatus(statusData.message || 'Processing...');
            }
          } catch (error) {
            console.error('Error checking job status:', error);
            setProcessingStatus('Error checking processing status');
            clearInterval(pollInterval);
            setIsProcessing(false);
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Processing error:', error);
      setProcessingStatus('Processing failed. Please try again.');
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    processingStatus,
    hasExistingUploads,
    setHasExistingUploads,
    handleProcess,
  };
}
