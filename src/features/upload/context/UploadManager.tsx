import { useCallback, useRef } from 'react';
import { useUploadContext, useUploadFileFactory } from './UploadContext';
import { UploadFile, UploadProgress, UploadError } from '../types';
import { uploadFileWithChunks } from '../../health-data/utils/fileChunker';

export interface UploadManagerOptions {
  autoStart?: boolean;
  maxConcurrentUploads?: number;
  onFileComplete?: (file: UploadFile) => void;
  onFileError?: (file: UploadFile, error: UploadError) => void;
  onAllComplete?: () => void;
}

export interface UploadManagerReturn {
  // Upload operations
  uploadFiles: (files: File[]) => Promise<void>;
  uploadFile: (file: File) => Promise<void>;

  // Queue management
  pause: () => void;
  resume: () => void;
  cancelAll: () => void;

  // Status
  isPaused: boolean;
  activeUploads: number;
  queueSize: number;
}

export function useUploadManager(options: UploadManagerOptions = {}): UploadManagerReturn {
  const {
    autoStart = true,
    maxConcurrentUploads = 3,
    onFileComplete,
    onFileError,
    onAllComplete
  } = options;

  const context = useUploadContext();
  const { createUploadFiles } = useUploadFileFactory();

  const isPausedRef = useRef(false);
  const activeUploadsRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Process a single file upload
  const processFileUpload = useCallback(async (uploadFile: UploadFile) => {
    if (isPausedRef.current) {
      return;
    }

    activeUploadsRef.current++;
    context.setCurrentFile(uploadFile);
    context.updateFile(uploadFile.id, { status: 'uploading' });

    try {
      const results = await uploadFileWithChunks(
        uploadFile.file,
        {
          chunkSize: 1 * 1024 * 1024, // 1MB chunks
          maxRetries: 3,
          signal: abortControllerRef.current?.signal,
          onProgress: (progress) => {
            context.updateProgress(progress);
            context.updateFile(uploadFile.id, {
              progress: progress.percentage,
              status: progress.percentage === 100 ? 'processing' : 'uploading'
            });
          },
          onError: (error) => {
            context.setError(error);
          }
        }
      );

      // Upload completed successfully
      context.updateFile(uploadFile.id, {
        status: 'completed',
        progress: 100
      });

      onFileComplete?.(uploadFile);

    } catch (error) {
      const uploadError: UploadError = {
        code: 'UPLOAD_FAILED',
        message: error instanceof Error ? error.message : 'Upload failed',
        details: error
      };

      context.updateFile(uploadFile.id, {
        status: 'error',
        error: uploadError.message
      });

      context.setError(uploadError);
      onFileError?.(uploadFile, uploadError);

    } finally {
      activeUploadsRef.current = Math.max(0, activeUploadsRef.current - 1);

      // Check if all uploads are complete
      const allComplete = context.files.every(f =>
        f.status === 'completed' || f.status === 'error'
      );

      if (allComplete && context.files.length > 0) {
        onAllComplete?.();
      }
    }
  }, [context, onFileComplete, onFileError, onAllComplete]);

  // Process files in queue with concurrency control
  const processQueue = useCallback(async (files: UploadFile[]) => {
    const pendingFiles = files.filter(f => f.status === 'pending');

    // Process files in batches based on maxConcurrentUploads
    for (let i = 0; i < pendingFiles.length; i += maxConcurrentUploads) {
      if (isPausedRef.current) {
        break;
      }

      const batch = pendingFiles.slice(i, i + maxConcurrentUploads);
      await Promise.allSettled(batch.map(processFileUpload));

      // Small delay between batches to prevent overwhelming the system
      if (i + maxConcurrentUploads < pendingFiles.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }, [maxConcurrentUploads, processFileUpload]);

  // Upload multiple files
  const uploadFiles = useCallback(async (files: File[]) => {
    const uploadFiles = createUploadFiles(files);
    context.addFiles(uploadFiles);

    if (autoStart) {
      await processQueue(uploadFiles);
    }
  }, [createUploadFiles, context, autoStart, processQueue]);

  // Upload single file
  const uploadFile = useCallback(async (file: File) => {
    await uploadFiles([file]);
  }, [uploadFiles]);

  // Pause uploads
  const pause = useCallback(() => {
    isPausedRef.current = true;
    abortControllerRef.current?.abort();
  }, []);

  // Resume uploads
  const resume = useCallback(() => {
    isPausedRef.current = false;
    abortControllerRef.current = new AbortController();

    // Resume pending uploads
    const pendingFiles = context.files.filter(f => f.status === 'pending');
    if (pendingFiles.length > 0) {
      processQueue(pendingFiles);
    }
  }, [context.files, processQueue]);

  // Cancel all uploads
  const cancelAll = useCallback(() => {
    isPausedRef.current = true;
    abortControllerRef.current?.abort();
    context.cancelAll();
    activeUploadsRef.current = 0;
  }, [context]);

  // Calculate queue size (pending + uploading files)
  const queueSize = context.files.filter(f =>
    f.status === 'pending' || f.status === 'uploading'
  ).length;

  return {
    uploadFiles,
    uploadFile,
    pause,
    resume,
    cancelAll,
    isPaused: isPausedRef.current,
    activeUploads: activeUploadsRef.current,
    queueSize
  };
}

// Hook for managing upload queues and priorities
export function useUploadQueue() {
  const context = useUploadContext();

  const moveToTop = useCallback((fileId: string) => {
    const fileIndex = context.files.findIndex(f => f.id === fileId);
    if (fileIndex > 0) {
      const newFiles = [...context.files];
      const [file] = newFiles.splice(fileIndex, 1);
      newFiles.unshift(file);
      context.clearFiles();
      context.addFiles(newFiles);
    }
  }, [context]);

  const moveToBottom = useCallback((fileId: string) => {
    const fileIndex = context.files.findIndex(f => f.id === fileId);
    if (fileIndex >= 0 && fileIndex < context.files.length - 1) {
      const newFiles = [...context.files];
      const [file] = newFiles.splice(fileIndex, 1);
      newFiles.push(file);
      context.clearFiles();
      context.addFiles(newFiles);
    }
  }, [context]);

  const removeCompleted = useCallback(() => {
    const completedFiles = context.files.filter(f => f.status === 'completed');
    completedFiles.forEach(file => context.removeFile(file.id));
  }, [context]);

  const clearFailed = useCallback(() => {
    const failedFiles = context.files.filter(f => f.status === 'error');
    failedFiles.forEach(file => context.removeFile(file.id));
  }, [context]);

  return {
    moveToTop,
    moveToBottom,
    removeCompleted,
    clearFailed,
    pendingFiles: context.files.filter(f => f.status === 'pending'),
    uploadingFiles: context.files.filter(f => f.status === 'uploading'),
    completedFiles: context.files.filter(f => f.status === 'completed'),
    failedFiles: context.files.filter(f => f.status === 'error')
  };
}

// Hook for upload analytics and metrics
export function useUploadAnalytics() {
  const context = useUploadContext();

  const metrics = {
    totalFiles: context.totalFiles,
    completedFiles: context.completedFiles,
    failedFiles: context.failedFiles,
    uploadingFiles: context.uploadingFiles,
    successRate: context.totalFiles > 0 ? (context.completedFiles / context.totalFiles) * 100 : 0,
    averageProgress: context.files.length > 0
      ? context.files.reduce((sum, f) => sum + f.progress, 0) / context.files.length
      : 0,
    totalSize: context.files.reduce((sum, f) => sum + f.size, 0),
    uploadedSize: context.files.reduce((sum, f) => sum + (f.size * f.progress / 100), 0)
  };

  const resetMetrics = useCallback(() => {
    context.reset();
  }, [context]);

  return { metrics, resetMetrics };
}
