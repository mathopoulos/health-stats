import { useState, useCallback, useRef } from 'react';
import {
  UploadFile,
  UploadProgress,
  UploadError,
  UploadState,
  UploadStatus,
  FileProcessingOptions,
  APIResponse
} from '../types';

interface UseFileUploadOptions extends FileProcessingOptions {
  maxFileSize?: number;
  allowedTypes?: string[];
  autoStart?: boolean;
  maxRetries?: number;
  chunkSize?: number;
}

interface UseFileUploadReturn {
  // State
  state: UploadState;
  files: UploadFile[];

  // Actions
  uploadFile: (file: File) => Promise<void>;
  uploadFiles: (files: File[]) => Promise<void>;
  cancelUpload: (fileId: string) => void;
  retryUpload: (fileId: string) => Promise<void>;
  clearFiles: () => void;

  // Status helpers
  isUploading: boolean;
  isProcessing: boolean;
  hasError: boolean;
  hasCompleted: boolean;
}

export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const {
    maxFileSize = 95 * 1024 * 1024, // 95MB
    allowedTypes = ['*/*'],
    autoStart = true,
    maxRetries = 3,
    chunkSize = 1 * 1024 * 1024, // 1MB
    onProgress,
    onError,
    onComplete
  } = options;

  const [state, setState] = useState<UploadState>({
    status: 'idle',
    files: [],
    progress: { loaded: 0, total: 0, percentage: 0 }
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // File validation
  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    // Size validation
    if (file.size > maxFileSize) {
      return {
        isValid: false,
        error: `File size exceeds maximum allowed size of ${Math.round(maxFileSize / 1024 / 1024)}MB`
      };
    }

    // Type validation
    if (!allowedTypes.includes('*/*')) {
      const isAllowedType = allowedTypes.some(type => {
        if (type.includes('*')) {
          const [mainType] = type.split('/');
          return file.type.startsWith(mainType);
        }
        return file.type === type;
      });

      if (!isAllowedType) {
        return {
          isValid: false,
          error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
        };
      }
    }

    return { isValid: true };
  }, [maxFileSize, allowedTypes]);

  // Create upload file object
  const createUploadFile = useCallback((file: File): UploadFile => ({
    file,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: file.name,
    size: file.size,
    type: file.type,
    progress: 0,
    status: 'pending'
  }), []);

  // Update file progress
  const updateFileProgress = useCallback((fileId: string, progress: UploadProgress) => {
    setState(prev => ({
      ...prev,
      files: prev.files.map(f =>
        f.id === fileId
          ? { ...f, progress: progress.percentage, status: progress.percentage === 100 ? 'processing' : 'uploading' }
          : f
      ),
      currentFile: prev.currentFile?.id === fileId ? { ...prev.currentFile, progress: progress.percentage } : prev.currentFile,
      progress
    }));

    onProgress?.(progress);
  }, [onProgress]);

  // Handle upload error
  const handleUploadError = useCallback((fileId: string, error: UploadError) => {
    setState(prev => ({
      ...prev,
      files: prev.files.map(f =>
        f.id === fileId
          ? { ...f, status: 'error', error: error.message }
          : f
      ),
      status: 'error',
      error
    }));

    onError?.(error);
  }, [onError]);

  // Handle successful upload
  const handleUploadSuccess = useCallback((fileId: string, result: any) => {
    setState(prev => ({
      ...prev,
      files: prev.files.map(f =>
        f.id === fileId
          ? { ...f, status: 'completed', progress: 100 }
          : f
      ),
      status: prev.files.every(f => f.id === fileId || f.status === 'completed') ? 'completed' : prev.status,
      results: result
    }));

    onComplete?.(result);
  }, [onComplete]);

  // Upload single chunk
  const uploadChunk = useCallback(async (
    chunk: Blob,
    chunkNumber: number,
    totalChunks: number,
    isLastChunk: boolean,
    fileName: string,
    fileId: string
  ): Promise<void> => {
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('chunkNumber', chunkNumber.toString());
    formData.append('totalChunks', totalChunks.toString());
    formData.append('isLastChunk', isLastChunk.toString());
    formData.append('fileName', fileName);

    let retryCount = 0;
    const maxChunkRetries = maxRetries;

    while (retryCount < maxChunkRetries) {
      try {
        const response = await fetch('/api/upload-chunk', {
          method: 'POST',
          body: formData,
          signal: abortControllerRef.current?.signal
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error ||
            errorData.details ||
            `Failed to upload chunk ${chunkNumber} (HTTP ${response.status})`
          );
        }

        return; // Success, exit retry loop
      } catch (error) {
        retryCount++;

        if (retryCount >= maxChunkRetries) {
          throw error; // Max retries reached
        }

        // Wait before retry with exponential backoff
        const delay = Math.pow(2, retryCount - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }, [maxRetries]);

  // Upload file using chunking
  const uploadFileWithChunking = useCallback(async (uploadFile: UploadFile): Promise<void> => {
    const { file, id } = uploadFile;
    const totalChunks = Math.ceil(file.size / chunkSize);

    try {
      // Update status to uploading
      setState(prev => ({
        ...prev,
        files: prev.files.map(f => f.id === id ? { ...f, status: 'uploading' } : f),
        currentFile: uploadFile,
        status: 'uploading'
      }));

      // Upload chunks
      for (let i = 0; i < totalChunks; i++) {
        const offset = i * chunkSize;
        const chunk = file.slice(offset, offset + chunkSize);
        const isLastChunk = i === totalChunks - 1;

        await uploadChunk(chunk, i, totalChunks, isLastChunk, file.name, id);

        // Update progress
        const progress: UploadProgress = {
          loaded: Math.min(offset + chunk.size, file.size),
          total: file.size,
          percentage: Math.round(((offset + chunk.size) / file.size) * 100)
        };

        updateFileProgress(id, progress);
      }

      // All chunks uploaded successfully
      handleUploadSuccess(id, { message: 'File uploaded successfully' });

    } catch (error) {
      const uploadError: UploadError = {
        code: 'UPLOAD_FAILED',
        message: error instanceof Error ? error.message : 'Upload failed',
        details: error
      };

      handleUploadError(id, uploadError);
    }
  }, [chunkSize, uploadChunk, updateFileProgress, handleUploadSuccess, handleUploadError]);

  // Main upload function
  const uploadFile = useCallback(async (file: File): Promise<void> => {
    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      const error: UploadError = {
        code: 'VALIDATION_FAILED',
        message: validation.error || 'File validation failed'
      };
      onError?.(error);
      return;
    }

    // Create upload file object
    const uploadFile = createUploadFile(file);

    // Add to state
    setState(prev => ({
      ...prev,
      files: [...prev.files, uploadFile]
    }));

    // Start upload if autoStart is enabled
    if (autoStart) {
      await uploadFileWithChunking(uploadFile);
    }
  }, [validateFile, createUploadFile, autoStart, uploadFileWithChunking, onError]);

  // Upload multiple files
  const uploadFiles = useCallback(async (files: File[]): Promise<void> => {
    for (const file of files) {
      await uploadFile(file);
    }
  }, [uploadFile]);

  // Cancel upload
  const cancelUpload = useCallback((fileId: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState(prev => ({
      ...prev,
      files: prev.files.map(f =>
        f.id === fileId
          ? { ...f, status: 'error', error: 'Upload cancelled' }
          : f
      )
    }));
  }, []);

  // Retry upload
  const retryUpload = useCallback(async (fileId: string): Promise<void> => {
    const fileToRetry = state.files.find(f => f.id === fileId);
    if (!fileToRetry) return;

    // Reset file state
    setState(prev => ({
      ...prev,
      files: prev.files.map(f =>
        f.id === fileId
          ? { ...f, status: 'pending', progress: 0, error: undefined }
          : f
      )
    }));

    await uploadFileWithChunking(fileToRetry);
  }, [state.files, uploadFileWithChunking]);

  // Clear all files
  const clearFiles = useCallback(() => {
    setState(prev => ({
      ...prev,
      files: [],
      currentFile: undefined,
      status: 'idle',
      progress: { loaded: 0, total: 0, percentage: 0 },
      error: undefined,
      results: undefined
    }));
  }, []);

  return {
    state,
    files: state.files,
    uploadFile,
    uploadFiles,
    cancelUpload,
    retryUpload,
    clearFiles,
    isUploading: state.status === 'uploading',
    isProcessing: state.status === 'processing',
    hasError: state.status === 'error',
    hasCompleted: state.status === 'completed'
  };
}
