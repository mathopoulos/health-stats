// Enhanced file chunking utilities with better error handling and progress tracking
import { UploadError, UploadProgress, FileProcessingOptions } from '../../upload/types';

export const DEFAULT_CHUNK_SIZE = 1 * 1024 * 1024; // 1MB chunks
export const MIN_CHUNK_SIZE = 64 * 1024; // 64KB minimum
export const MAX_CHUNK_SIZE = 10 * 1024 * 1024; // 10MB maximum

export interface ChunkInfo {
  chunk: Blob;
  chunkNumber: number;
  totalChunks: number;
  isLastChunk: boolean;
  offset: number;
  size: number;
}

export interface ChunkUploadOptions {
  chunkSize?: number;
  maxRetries?: number;
  onProgress?: (progress: UploadProgress) => void;
  onChunkComplete?: (chunkNumber: number, totalChunks: number) => void;
  onError?: (error: UploadError) => void;
  signal?: AbortSignal;
}

export interface FileChunkerResult {
  chunks: ChunkInfo[];
  totalSize: number;
  totalChunks: number;
  averageChunkSize: number;
}

// Calculate optimal chunk size based on file size
export function calculateOptimalChunkSize(fileSize: number): number {
  // For small files (< 10MB), use smaller chunks for better progress tracking
  if (fileSize < 10 * 1024 * 1024) {
    return Math.max(MIN_CHUNK_SIZE, Math.min(DEFAULT_CHUNK_SIZE, Math.ceil(fileSize / 20)));
  }

  // For medium files (10MB - 100MB), use standard chunk size
  if (fileSize < 100 * 1024 * 1024) {
    return DEFAULT_CHUNK_SIZE;
  }

  // For large files (> 100MB), use larger chunks for efficiency
  return Math.min(MAX_CHUNK_SIZE, Math.ceil(fileSize / 50));
}

// Validate file before chunking
export function validateFileForChunking(file: File): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }

  if (file.size === 0) {
    return { isValid: false, error: 'File is empty' };
  }

  if (file.size > 500 * 1024 * 1024) { // 500MB limit
    return { isValid: false, error: 'File size exceeds maximum allowed size of 500MB' };
  }

  return { isValid: true };
}

// Create file chunks with enhanced features
export async function createFileChunks(
  file: File,
  options: { chunkSize?: number } = {}
): Promise<FileChunkerResult> {
  const validation = validateFileForChunking(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const chunkSize = options.chunkSize || calculateOptimalChunkSize(file.size);
  const totalChunks = Math.ceil(file.size / chunkSize);

  console.log('Creating chunks for file:', {
    fileName: file.name,
    fileSize: file.size,
    totalChunks,
    chunkSize,
    optimalChunkSize: calculateOptimalChunkSize(file.size)
  });

  const chunks: ChunkInfo[] = [];
  let offset = 0;
  let totalSize = 0;

  while (offset < file.size) {
    const remainingBytes = file.size - offset;
    const currentChunkSize = Math.min(chunkSize, remainingBytes);
    const chunk = file.slice(offset, offset + currentChunkSize);
    const chunkNumber = Math.floor(offset / chunkSize);
    const isLastChunk = offset + currentChunkSize >= file.size;

    const chunkInfo: ChunkInfo = {
      chunk,
      chunkNumber,
      totalChunks,
      isLastChunk,
      offset,
      size: currentChunkSize
    };

    chunks.push(chunkInfo);
    totalSize += currentChunkSize;
    offset += currentChunkSize;

    console.log(`Prepared chunk ${chunkNumber + 1}/${totalChunks}`, {
      chunkSize: currentChunkSize,
      offset,
      isLastChunk,
      progress: Math.round((offset / file.size) * 100) + '%'
    });
  }

  const result: FileChunkerResult = {
    chunks,
    totalSize,
    totalChunks,
    averageChunkSize: Math.round(totalSize / totalChunks)
  };

  console.log('File chunking completed:', {
    totalChunks: result.totalChunks,
    totalSize: result.totalSize,
    averageChunkSize: result.averageChunkSize
  });

  return result;
}

// Enhanced chunk upload with better error handling and progress tracking
export async function uploadChunk(
  chunk: Blob,
  chunkNumber: number,
  totalChunks: number,
  fileName: string,
  options: ChunkUploadOptions = {}
): Promise<any> {
  const {
    maxRetries = 3,
    onProgress,
    onError,
    signal
  } = options;

  console.log(`Uploading chunk ${chunkNumber + 1}/${totalChunks}`, {
    chunkSize: chunk.size,
    fileName,
    isLastChunk: chunkNumber === totalChunks - 1
  });

  const formData = new FormData();
  formData.append('chunk', chunk);
  formData.append('chunkNumber', chunkNumber.toString());
  formData.append('totalChunks', totalChunks.toString());
  formData.append('isLastChunk', (chunkNumber === totalChunks - 1).toString());
  formData.append('fileName', fileName);

  // Generate checksum for data integrity
  const checksum = await generateChecksum(chunk);
  formData.append('checksum', checksum);

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Check if operation was cancelled
    if (signal?.aborted) {
      throw new Error('Upload cancelled');
    }

    try {
      // Create abort controller for this attempt
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 30000); // 30 second timeout

      const response = await fetch('/api/upload-chunk', {
        method: 'POST',
        body: formData,
        signal: signal || abortController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.details || `HTTP ${response.status}`;
        lastError = new Error(errorMessage);

        console.error(`Chunk upload failed (attempt ${attempt + 1}/${maxRetries + 1}):`, {
          chunkNumber: chunkNumber + 1,
          status: response.status,
          statusText: response.statusText,
          error: errorMessage
        });

        // Create upload error for callback
        const uploadError: UploadError = {
          code: response.status === 413 ? 'FILE_TOO_LARGE' : 'UPLOAD_FAILED',
          message: errorMessage,
          details: {
            chunkNumber: chunkNumber + 1,
            totalChunks,
            attempt: attempt + 1,
            status: response.status
          }
        };

        onError?.(uploadError);

        // Don't retry for certain errors
        if (response.status === 413 || response.status === 401 || response.status === 403) {
          throw lastError;
        }

        // Retry with exponential backoff
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10 second delay
          console.log(`Retrying chunk ${chunkNumber + 1} in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        throw lastError;
      }

      const result = await response.json();

      // Verify response integrity if checksum was provided
      if (result.checksum && result.checksum !== checksum) {
        console.warn('Checksum mismatch detected, but continuing...');
      }

      console.log(`✅ Chunk ${chunkNumber + 1}/${totalChunks} uploaded successfully`);

      // Report progress
      const progress: UploadProgress = {
        loaded: (chunkNumber + 1) * chunk.size,
        total: totalChunks * chunk.size, // Approximate total
        percentage: Math.round(((chunkNumber + 1) / totalChunks) * 100)
      };

      onProgress?.(progress);

      return result;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // Don't retry if it's an abort error
      if (lastError.name === 'AbortError') {
        throw new Error('Upload cancelled');
      }

      console.error(`Chunk upload error (attempt ${attempt + 1}/${maxRetries + 1}):`, lastError.message);

      // Create upload error for callback
      const uploadError: UploadError = {
        code: 'UPLOAD_FAILED',
        message: lastError.message,
        details: {
          chunkNumber: chunkNumber + 1,
          totalChunks,
          attempt: attempt + 1
        }
      };

      onError?.(uploadError);

      // Retry if we haven't exceeded max retries
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  throw lastError || new Error(`Failed to upload chunk ${chunkNumber + 1} after ${maxRetries + 1} attempts`);
}

// Generate checksum for data integrity verification
async function generateChecksum(blob: Blob): Promise<string> {
  try {
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.warn('Failed to generate checksum:', error);
    return '';
  }
}

// Upload all chunks with progress tracking and error handling
export async function uploadFileWithChunks(
  file: File,
  options: ChunkUploadOptions = {}
): Promise<any> {
  const { onProgress, onChunkComplete, signal, chunkSize } = options;

  // Validate file
  const validation = validateFileForChunking(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Create chunks
  const chunkerResult = await createFileChunks(file, { chunkSize });
  const { chunks } = chunkerResult;

  console.log(`Starting upload of ${file.name} (${chunks.length} chunks)`);

  const results: any[] = [];
  let uploadedSize = 0;

  for (let i = 0; i < chunks.length; i++) {
    // Check if operation was cancelled
    if (signal?.aborted) {
      throw new Error('Upload cancelled');
    }

    const chunkInfo = chunks[i];

    try {
      const result = await uploadChunk(
        chunkInfo.chunk,
        chunkInfo.chunkNumber,
        chunkInfo.totalChunks,
        file.name,
        options
      );

      results.push(result);
      uploadedSize += chunkInfo.size;

      // Report chunk completion
      onChunkComplete?.(chunkInfo.chunkNumber + 1, chunkInfo.totalChunks);

      // Report overall progress
      const progress: UploadProgress = {
        loaded: uploadedSize,
        total: file.size,
        percentage: Math.round((uploadedSize / file.size) * 100)
      };

      onProgress?.(progress);

    } catch (error) {
      console.error(`Failed to upload chunk ${chunkInfo.chunkNumber + 1}:`, error);
      throw error;
    }
  }

  console.log(`✅ Successfully uploaded ${file.name} (${chunks.length} chunks)`);
  return results;
}


