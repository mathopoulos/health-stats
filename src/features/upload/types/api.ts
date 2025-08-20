// API-specific types for upload functionality
import { BloodMarker, DateGroup, ProcessingJob, UploadError } from './index';

export interface PDFProcessingRequest {
  text: string;
}

export interface PDFProcessingResponse {
  success: boolean;
  markers: BloodMarker[];
  testDate?: string | null;
  dateGroups: DateGroup[];
  hasMultipleDates: boolean;
  error?: string;
}

export interface HealthDataProcessingRequest {
  blobUrl: string;
  tokenPayload?: string;
}

export interface HealthDataProcessingResponse {
  success: boolean;
  data: {
    steps: Array<{ date: string; value: number }>;
    weight: Array<{ date: string; value: number }>;
    sleep: Array<{ date: string; value: number }>;
    hrv: Array<{ date: string; value: number }>;
  };
  error?: string;
}

export interface BloodMarkersSaveRequest {
  markers: BloodMarker[];
  date: string;
}

export interface BloodMarkersSaveResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface ProcessingStatusRequest {
  id: string;
}

export interface ProcessingStatusResponse {
  completed: boolean;
  success?: boolean;
  error?: string;
  results?: any;
}

export interface UploadChunkRequest {
  chunk: Blob;
  chunkNumber: number;
  totalChunks: number;
  isLastChunk: boolean;
  fileName: string;
}

export interface UploadChunkResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface ProcessHealthDataRequest {
  userId: string;
  fileKey: string;
}

export interface ProcessHealthDataResponse {
  success: boolean;
  jobId: string;
  error?: string;
}

// Error response types
export interface APIErrorResponse {
  success: false;
  error: string;
  details?: any;
  code?: string;
}

// Success response wrapper
export interface APISuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

// Union type for all API responses
export type APIResponse<T = any> = APISuccessResponse<T> | APIErrorResponse;

// Processing job types
export interface CreateProcessingJobRequest {
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  type: 'health-data' | 'blood-markers' | 'other';
  fileKey: string;
  startedAt: Date;
}

export interface CreateProcessingJobResponse {
  success: boolean;
  job?: ProcessingJob;
  error?: string;
}

// File upload types
export interface FileUploadRequest {
  file: File;
  onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void;
}

export interface FileUploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

// Lambda invocation types
export interface LambdaInvokeRequest {
  userId: string;
  fileKey: string;
}

export interface LambdaInvokeResponse {
  success: boolean;
  error?: string;
}

// S3 operations types
export interface S3ListFilesRequest {
  prefix: string;
}

export interface S3ListFilesResponse {
  success: boolean;
  files: string[];
  error?: string;
}

// Webhook/callback types
export interface ProcessingWebhookPayload {
  jobId: string;
  status: 'completed' | 'failed';
  result?: any;
  error?: string;
}

// Rate limiting types
export interface RateLimitInfo {
  remaining: number;
  reset: number;
  limit: number;
}

export interface RateLimitedResponse extends APIErrorResponse {
  rateLimit: RateLimitInfo;
}

// Pagination types for list endpoints
export interface PaginatedRequest {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends APISuccessResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
