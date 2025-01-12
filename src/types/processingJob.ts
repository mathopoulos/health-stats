export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type ProcessingJobType = 'health-data';

export interface ProcessingJob {
  _id?: string;
  userId: string;
  status: ProcessingStatus;
  type: ProcessingJobType;
  fileKey: string;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  progress?: {
    current: number;
    total: number;
    message?: string;
  };
  result?: {
    recordsProcessed: number;
    recordTypes: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export type CreateProcessingJob = Omit<ProcessingJob, '_id' | 'createdAt' | 'updatedAt'>; 