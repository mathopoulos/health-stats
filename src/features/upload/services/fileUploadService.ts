// File upload and processing related API calls and business logic

export interface UploadedFile {
  id: string;
  filename: string;
  uploadDate: string;
}

export interface ProcessingJobStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message?: string;
}

export class FileUploadService {
  static async uploadFile(file: File, type: string = 'health-data'): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  }

  static async startProcessing(): Promise<{ jobId: string }> {
    const response = await fetch('/api/process-health-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Processing failed');
    }

    return response.json();
  }

  static async checkProcessingStatus(jobId: string): Promise<ProcessingJobStatus> {
    const response = await fetch(`/api/processing-job/${jobId}`);
    
    if (!response.ok) {
      throw new Error('Failed to check processing status');
    }

    return response.json();
  }

  static async getUploadedFiles(): Promise<UploadedFile[]> {
    const response = await fetch('/api/uploaded-files');
    
    if (!response.ok) {
      throw new Error('Failed to fetch uploaded files');
    }

    return response.json();
  }

  static async deleteFiles(fileIds: string[]): Promise<void> {
    const response = await fetch('/api/uploaded-files', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileIds }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete files');
    }
  }

  static validateFile(file: File): string | null {
    if (!file.name.endsWith('.xml') && !file.name.endsWith('.fit')) {
      return 'Please upload an XML or FIT file';
    }
    return null;
  }

  static pollProcessingStatus(
    jobId: string, 
    onUpdate: (status: ProcessingJobStatus) => void,
    interval = 2000
  ): () => void {
    const pollInterval = setInterval(async () => {
      try {
        const status = await FileUploadService.checkProcessingStatus(jobId);
        onUpdate(status);
        
        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Error checking job status:', error);
        onUpdate({
          status: 'failed',
          message: 'Error checking processing status'
        });
        clearInterval(pollInterval);
      }
    }, interval);

    // Return cleanup function
    return () => clearInterval(pollInterval);
  }
}
