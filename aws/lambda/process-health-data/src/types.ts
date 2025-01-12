export type HealthDataType = 'heartRate' | 'weight' | 'bodyFat' | 'hrv' | 'vo2max';

export interface ProcessingStatus {
  recordsProcessed: number;
  batchesSaved: number;
  status: 'pending' | 'processing' | `processing ${HealthDataType}` | 'completed' | 'error';
  error?: string;
  userId?: string;
}

export interface HealthRecord {
  date: string;
  value: number;
}

export interface LambdaEvent {
  jobId: string;
  userId: string;
  xmlKey: string;
} 