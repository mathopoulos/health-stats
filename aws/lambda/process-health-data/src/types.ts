export type HealthDataType = 'weight' | 'bodyFat' | 'heartRate' | 'hrv' | 'vo2Max';

export interface HealthRecord {
  date: string;
  value: number;
  source?: string;
  unit?: string;
  metadata?: Record<string, string>;
}

export interface ProcessingStatus {
  recordsProcessed: number;
  batchesSaved: number;
  status: 'pending' | 'processing' | `processing ${HealthDataType}` | 'completed' | 'error';
  error?: string;
  userId?: string;
}

export interface LambdaEvent {
  jobId: string;
  userId: string;
  xmlKey: string;
} 