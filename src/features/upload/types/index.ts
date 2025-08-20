// Core upload types and interfaces
export interface UploadFile {
  file: File;
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadError {
  code: string;
  message: string;
  details?: any;
}

export interface ProcessingResult {
  success: boolean;
  message: string;
  error?: string;
  results?: Array<{
    message: string;
  }>;
}

// Blood marker types
export interface BloodMarker {
  name: string;
  value: number;
  unit: string;
  flag: 'High' | 'Low' | null;
  category: string;
}

export interface DateGroup {
  testDate: string;
  markers: BloodMarker[];
}

// Health data types
export interface HealthDataRecord {
  type: string;
  date: string;
  value: number;
}

export interface HealthData {
  steps: HealthDataRecord[];
  weight: HealthDataRecord[];
  sleep: HealthDataRecord[];
  hrv: HealthDataRecord[];
}

// File processing types
export interface ChunkInfo {
  filename: string;
  chunkIndex: number;
  totalChunks: number;
  offset: number;
  isLastChunk: boolean;
}

export interface FileProcessingOptions {
  chunkSize?: number;
  maxRetries?: number;
  onProgress?: (progress: UploadProgress) => void;
  onError?: (error: UploadError) => void;
  onComplete?: (result: any) => void;
}

// Upload state types
export type UploadStatus =
  | 'idle'
  | 'selecting'
  | 'validating'
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'error';

export interface UploadState {
  status: UploadStatus;
  files: UploadFile[];
  currentFile?: UploadFile;
  progress: UploadProgress;
  error?: UploadError;
  results?: any;
}

// PDF processing types
export interface PDFProcessingOptions {
  extractText?: boolean;
  extractImages?: boolean;
  maxPages?: number;
}

export interface PDFProcessingResult {
  text?: string;
  images?: string[];
  metadata?: {
    pages: number;
    fileSize: number;
    extractedAt: string;
  };
}

// Validation types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FileValidationOptions {
  maxSize?: number;
  allowedTypes?: string[];
  required?: boolean;
}

// Error handling types
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

export interface RetryOptions {
  maxAttempts?: number;
  backoffMs?: number;
  exponentialBackoff?: boolean;
}

// API response types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ProcessingJob {
  _id: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  type: 'health-data' | 'blood-markers' | 'other';
  fileKey: string;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

// Upload configuration
export interface UploadConfig {
  maxFileSize: number;
  allowedFileTypes: string[];
  chunkSize: number;
  maxRetries: number;
  timeout: number;
}

// Event types for upload events
export interface UploadEvents {
  'upload:start': { file: UploadFile };
  'upload:progress': { file: UploadFile; progress: UploadProgress };
  'upload:complete': { file: UploadFile; result: any };
  'upload:error': { file: UploadFile; error: UploadError };
  'processing:start': { jobId: string };
  'processing:complete': { jobId: string; result: any };
  'processing:error': { jobId: string; error: UploadError };
}

// Re-export API types
export * from './api';