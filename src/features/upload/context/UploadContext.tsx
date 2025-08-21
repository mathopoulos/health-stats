import React, { createContext, useContext, useReducer, useCallback } from 'react';
import {
  UploadState,
  UploadStatus,
  UploadFile,
  UploadProgress,
  UploadError,
  UploadConfig
} from '../types';

// Upload actions
type UploadAction =
  | { type: 'ADD_FILES'; payload: { files: UploadFile[] } }
  | { type: 'UPDATE_FILE'; payload: { fileId: string; updates: Partial<UploadFile> } }
  | { type: 'REMOVE_FILE'; payload: { fileId: string } }
  | { type: 'CLEAR_FILES' }
  | { type: 'SET_CURRENT_FILE'; payload: { file?: UploadFile } }
  | { type: 'UPDATE_PROGRESS'; payload: { progress: UploadProgress } }
  | { type: 'SET_ERROR'; payload: { error: UploadError } }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_STATUS'; payload: { status: UploadStatus } }
  | { type: 'SET_RESULTS'; payload: { results: any } }
  | { type: 'RESET' };

// Upload context state
interface UploadContextState extends UploadState {
  // Additional computed state
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  uploadingFiles: number;
  isIdle: boolean;
  isActive: boolean;
}

// Upload context value
export interface UploadContextValue extends UploadContextState {
  // Actions
  addFiles: (files: UploadFile[]) => void;
  updateFile: (fileId: string, updates: Partial<UploadFile>) => void;
  removeFile: (fileId: string) => void;
  clearFiles: () => void;
  setCurrentFile: (file?: UploadFile) => void;
  updateProgress: (progress: UploadProgress) => void;
  setError: (error: UploadError) => void;
  clearError: () => void;
  setStatus: (status: UploadStatus) => void;
  setResults: (results: any) => void;
  reset: () => void;

  // Utility actions
  retryFile: (fileId: string) => void;
  cancelFile: (fileId: string) => void;
  retryAllFailed: () => void;
  cancelAll: () => void;
}

// Default configuration
const DEFAULT_CONFIG: UploadConfig = {
  maxFileSize: 95 * 1024 * 1024, // 95MB
  allowedFileTypes: ['*/*'],
  chunkSize: 1 * 1024 * 1024, // 1MB
  maxRetries: 3,
  timeout: 30000
};

// Initial state
const initialState: UploadContextState = {
  status: 'idle',
  files: [],
  progress: { loaded: 0, total: 0, percentage: 0 },
  totalFiles: 0,
  completedFiles: 0,
  failedFiles: 0,
  uploadingFiles: 0,
  isIdle: true,
  isActive: false
};

// Upload reducer
function uploadReducer(state: UploadContextState, action: UploadAction): UploadContextState {
  switch (action.type) {
    case 'ADD_FILES': {
      const newFiles = [...state.files, ...action.payload.files];
      const totalFiles = newFiles.length;
      const completedFiles = newFiles.filter(f => f.status === 'completed').length;
      const failedFiles = newFiles.filter(f => f.status === 'error').length;
      const uploadingFiles = newFiles.filter(f => f.status === 'uploading').length;

      return {
        ...state,
        files: newFiles,
        totalFiles,
        completedFiles,
        failedFiles,
        uploadingFiles,
        isIdle: totalFiles === 0,
        isActive: uploadingFiles > 0 || (totalFiles > 0 && completedFiles < totalFiles)
      };
    }

    case 'UPDATE_FILE': {
      const updatedFiles = state.files.map(file =>
        file.id === action.payload.fileId
          ? { ...file, ...action.payload.updates }
          : file
      );

      const totalFiles = updatedFiles.length;
      const completedFiles = updatedFiles.filter(f => f.status === 'completed').length;
      const failedFiles = updatedFiles.filter(f => f.status === 'error').length;
      const uploadingFiles = updatedFiles.filter(f => f.status === 'uploading').length;

      return {
        ...state,
        files: updatedFiles,
        totalFiles,
        completedFiles,
        failedFiles,
        uploadingFiles,
        isIdle: totalFiles === 0,
        isActive: uploadingFiles > 0 || (totalFiles > 0 && completedFiles < totalFiles)
      };
    }

    case 'REMOVE_FILE': {
      const filteredFiles = state.files.filter(file => file.id !== action.payload.fileId);
      const totalFiles = filteredFiles.length;
      const completedFiles = filteredFiles.filter(f => f.status === 'completed').length;
      const failedFiles = filteredFiles.filter(f => f.status === 'error').length;
      const uploadingFiles = filteredFiles.filter(f => f.status === 'uploading').length;

      return {
        ...state,
        files: filteredFiles,
        totalFiles,
        completedFiles,
        failedFiles,
        uploadingFiles,
        currentFile: state.currentFile?.id === action.payload.fileId ? undefined : state.currentFile,
        isIdle: totalFiles === 0,
        isActive: uploadingFiles > 0 || (totalFiles > 0 && completedFiles < totalFiles)
      };
    }

    case 'CLEAR_FILES':
      return {
        ...state,
        files: [],
        currentFile: undefined,
        totalFiles: 0,
        completedFiles: 0,
        failedFiles: 0,
        uploadingFiles: 0,
        isIdle: true,
        isActive: false
      };

    case 'SET_CURRENT_FILE':
      return {
        ...state,
        currentFile: action.payload.file
      };

    case 'UPDATE_PROGRESS':
      return {
        ...state,
        progress: action.payload.progress
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload.error,
        status: 'error'
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: undefined,
        status: state.files.length > 0 ? 'idle' : 'idle'
      };

    case 'SET_STATUS':
      return {
        ...state,
        status: action.payload.status
      };

    case 'SET_RESULTS':
      return {
        ...state,
        results: action.payload.results
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// Create context
const UploadContext = createContext<UploadContextValue | undefined>(undefined);

// Context provider
interface UploadProviderProps {
  children: React.ReactNode;
  config?: Partial<UploadConfig>;
}

export function UploadProvider({ children, config = {} }: UploadProviderProps) {
  const [state, dispatch] = useReducer(uploadReducer, initialState);

  // Actions
  const addFiles = useCallback((files: UploadFile[]) => {
    dispatch({ type: 'ADD_FILES', payload: { files } });
  }, []);

  const updateFile = useCallback((fileId: string, updates: Partial<UploadFile>) => {
    dispatch({ type: 'UPDATE_FILE', payload: { fileId, updates } });
  }, []);

  const removeFile = useCallback((fileId: string) => {
    dispatch({ type: 'REMOVE_FILE', payload: { fileId } });
  }, []);

  const clearFiles = useCallback(() => {
    dispatch({ type: 'CLEAR_FILES' });
  }, []);

  const setCurrentFile = useCallback((file?: UploadFile) => {
    dispatch({ type: 'SET_CURRENT_FILE', payload: { file } });
  }, []);

  const updateProgress = useCallback((progress: UploadProgress) => {
    dispatch({ type: 'UPDATE_PROGRESS', payload: { progress } });
  }, []);

  const setError = useCallback((error: UploadError) => {
    dispatch({ type: 'SET_ERROR', payload: { error } });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const setStatus = useCallback((status: UploadStatus) => {
    dispatch({ type: 'SET_STATUS', payload: { status } });
  }, []);

  const setResults = useCallback((results: any) => {
    dispatch({ type: 'SET_RESULTS', payload: { results } });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  // Utility actions
  const retryFile = useCallback((fileId: string) => {
    updateFile(fileId, { status: 'pending', progress: 0, error: undefined });
  }, [updateFile]);

  const cancelFile = useCallback((fileId: string) => {
    updateFile(fileId, { status: 'error', error: 'Upload cancelled' });
  }, [updateFile]);

  const retryAllFailed = useCallback(() => {
    state.files.forEach(file => {
      if (file.status === 'error') {
        retryFile(file.id);
      }
    });
  }, [state.files, retryFile]);

  const cancelAll = useCallback(() => {
    state.files.forEach(file => {
      if (file.status === 'uploading' || file.status === 'pending') {
        cancelFile(file.id);
      }
    });
  }, [state.files, cancelFile]);

  const contextValue: UploadContextValue = {
    ...state,
    addFiles,
    updateFile,
    removeFile,
    clearFiles,
    setCurrentFile,
    updateProgress,
    setError,
    clearError,
    setStatus,
    setResults,
    reset,
    retryFile,
    cancelFile,
    retryAllFailed,
    cancelAll
  };

  return (
    <UploadContext.Provider value={contextValue}>
      {children}
    </UploadContext.Provider>
  );
}

// Hook to use upload context
export function useUploadContext(): UploadContextValue {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error('useUploadContext must be used within an UploadProvider');
  }
  return context;
}

// Hook to create upload file objects
export function useUploadFileFactory() {
  const createUploadFile = useCallback((file: File): UploadFile => ({
    file,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: file.name,
    size: file.size,
    type: file.type,
    progress: 0,
    status: 'pending'
  }), []);

  const createUploadFiles = useCallback((files: File[]): UploadFile[] => {
    return files.map(createUploadFile);
  }, [createUploadFile]);

  return { createUploadFile, createUploadFiles };
}
