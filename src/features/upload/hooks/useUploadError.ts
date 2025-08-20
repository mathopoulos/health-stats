import { useState, useCallback, useEffect } from 'react';
import { UploadError } from '../types';

interface UseUploadErrorOptions {
  onError?: (error: UploadError) => void;
  onRetry?: (error: UploadError) => void;
  maxRetries?: number;
  enableAutoRetry?: boolean;
}

interface UseUploadErrorReturn {
  // Current error state
  currentError: UploadError | null;
  errorHistory: UploadError[];
  retryCount: number;

  // Actions
  setError: (error: UploadError) => void;
  clearError: () => void;
  retryLastError: () => Promise<boolean>;
  clearHistory: () => void;

  // Status
  hasError: boolean;
  canRetry: boolean;
  isRetrying: boolean;
}

export function useUploadError(options: UseUploadErrorOptions = {}): UseUploadErrorReturn {
  const {
    onError,
    onRetry,
    maxRetries = 3,
    enableAutoRetry = false
  } = options;

  const [currentError, setCurrentError] = useState<UploadError | null>(null);
  const [errorHistory, setErrorHistory] = useState<UploadError[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Set a new error
  const setError = useCallback((error: UploadError) => {
    setCurrentError(error);
    setErrorHistory(prev => [...prev, error]);
    setRetryCount(0); // Reset retry count for new errors

    onError?.(error);

    // Auto-retry if enabled
    if (enableAutoRetry && error.code !== 'VALIDATION_FAILED') {
      setTimeout(() => {
        retryLastError();
      }, 1000);
    }
  }, [onError, enableAutoRetry]);

  // Clear current error
  const clearError = useCallback(() => {
    setCurrentError(null);
  }, []);

  // Clear error history
  const clearHistory = useCallback(() => {
    setErrorHistory([]);
    setRetryCount(0);
  }, []);

  // Retry the last error
  const retryLastError = useCallback(async (): Promise<boolean> => {
    if (!currentError || retryCount >= maxRetries) {
      return false;
    }

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    try {
      onRetry?.(currentError);

      // In a real implementation, you would attempt the failed operation here
      // For now, we'll just simulate a retry
      await new Promise(resolve => setTimeout(resolve, 1000));

      // If retry succeeds, clear the error
      clearError();
      setIsRetrying(false);
      return true;

    } catch (error) {
      // Retry failed, keep the error
      setIsRetrying(false);
      return false;
    }
  }, [currentError, retryCount, maxRetries, onRetry, clearError]);

  // Auto-clear errors after a timeout
  useEffect(() => {
    if (currentError && !isRetrying) {
      const timeout = setTimeout(() => {
        clearError();
      }, 10000); // Clear error after 10 seconds

      return () => clearTimeout(timeout);
    }
  }, [currentError, isRetrying, clearError]);

  // Helper properties
  const hasError = currentError !== null;
  const canRetry = currentError !== null &&
                   retryCount < maxRetries &&
                   currentError.code !== 'VALIDATION_FAILED';

  return {
    currentError,
    errorHistory,
    retryCount,
    setError,
    clearError,
    retryLastError,
    clearHistory,
    hasError,
    canRetry,
    isRetrying
  };
}
