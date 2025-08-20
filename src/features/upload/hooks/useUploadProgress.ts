import { useState, useCallback, useEffect } from 'react';
import { UploadProgress, UploadFile } from '../types';

interface UseUploadProgressOptions {
  onProgress?: (progress: UploadProgress) => void;
  onComplete?: () => void;
  onError?: (error: any) => void;
  trackIndividualFiles?: boolean;
}

interface UseUploadProgressReturn {
  // Overall progress
  overallProgress: UploadProgress;
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  processingFiles: number;

  // Individual file progress
  fileProgress: Map<string, UploadProgress>;

  // Actions
  updateFileProgress: (fileId: string, progress: UploadProgress) => void;
  resetProgress: () => void;

  // Helpers
  getFileProgress: (fileId: string) => UploadProgress | null;
  isComplete: boolean;
  hasErrors: boolean;
  progressPercentage: number;
}

export function useUploadProgress(options: UseUploadProgressOptions = {}): UseUploadProgressReturn {
  const {
    onProgress,
    onComplete,
    onError,
    trackIndividualFiles = true
  } = options;

  const [fileProgress, setFileProgress] = useState<Map<string, UploadProgress>>(new Map());
  const [overallProgress, setOverallProgress] = useState<UploadProgress>({
    loaded: 0,
    total: 0,
    percentage: 0
  });

  // Calculate overall progress from individual file progress
  const calculateOverallProgress = useCallback((progressMap: Map<string, UploadProgress>): UploadProgress => {
    if (progressMap.size === 0) {
      return { loaded: 0, total: 0, percentage: 0 };
    }

    let totalLoaded = 0;
    let totalSize = 0;

    for (const progress of progressMap.values()) {
      totalLoaded += progress.loaded;
      totalSize += progress.total;
    }

    const percentage = totalSize > 0 ? Math.round((totalLoaded / totalSize) * 100) : 0;

    return {
      loaded: totalLoaded,
      total: totalSize,
      percentage
    };
  }, []);

  // Update file progress
  const updateFileProgress = useCallback((fileId: string, progress: UploadProgress) => {
    setFileProgress(prev => {
      const newProgress = new Map(prev);
      newProgress.set(fileId, progress);

      // Calculate and update overall progress
      const newOverallProgress = calculateOverallProgress(newProgress);
      setOverallProgress(newOverallProgress);

      // Call progress callback
      onProgress?.(newOverallProgress);

      // Check if all files are complete
      const allComplete = Array.from(newProgress.values()).every(p => p.percentage === 100);
      if (allComplete && newProgress.size > 0) {
        onComplete?.();
      }

      return newProgress;
    });
  }, [calculateOverallProgress, onProgress, onComplete]);

  // Reset all progress
  const resetProgress = useCallback(() => {
    setFileProgress(new Map());
    setOverallProgress({ loaded: 0, total: 0, percentage: 0 });
  }, []);

  // Get specific file progress
  const getFileProgress = useCallback((fileId: string): UploadProgress | null => {
    return fileProgress.get(fileId) || null;
  }, [fileProgress]);

  // Calculate statistics
  const totalFiles = fileProgress.size;
  const completedFiles = Array.from(fileProgress.values()).filter(p => p.percentage === 100).length;
  const processingFiles = Array.from(fileProgress.values()).filter(p => p.percentage > 0 && p.percentage < 100).length;
  const failedFiles = Array.from(fileProgress.values()).filter(p => p.percentage === 0 && p.total > 0).length;

  const isComplete = totalFiles > 0 && completedFiles === totalFiles;
  const hasErrors = failedFiles > 0;
  const progressPercentage = overallProgress.percentage;

  return {
    overallProgress,
    totalFiles,
    completedFiles,
    failedFiles,
    processingFiles,
    fileProgress,
    updateFileProgress,
    resetProgress,
    getFileProgress,
    isComplete,
    hasErrors,
    progressPercentage
  };
}
