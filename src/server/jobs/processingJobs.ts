import { ProcessingJob, CreateProcessingJob, ProcessingStatus } from '@/types/processingJob';
import clientPromise from '@/db/client';
import { ObjectId } from 'mongodb';

const COLLECTION = 'processing-jobs';
const DB_NAME = 'health-stats';

export async function createProcessingJob(job: CreateProcessingJob): Promise<ProcessingJob> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  
  const now = new Date();
  const jobWithTimestamps = {
    ...job,
    createdAt: now,
    updatedAt: now
  };

  const result = await db.collection(COLLECTION).insertOne(jobWithTimestamps);
  
  return {
    ...jobWithTimestamps,
    _id: result.insertedId.toString()
  };
}

export async function getProcessingJob(jobId: string): Promise<ProcessingJob | null> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  
  const job = await db.collection(COLLECTION).findOne({
    _id: new ObjectId(jobId)
  });
  
  if (!job) return null;
  
  return {
    ...job,
    _id: job._id.toString()
  } as ProcessingJob;
}

export async function updateProcessingJobStatus(
  jobId: string,
  status: ProcessingStatus,
  updates: Partial<ProcessingJob> = {}
): Promise<ProcessingJob | null> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  
  const result = await db.collection(COLLECTION).findOneAndUpdate(
    { _id: new ObjectId(jobId) },
    {
      $set: {
        ...updates,
        status,
        updatedAt: new Date(),
        ...(status === 'completed' || status === 'failed' ? { completedAt: new Date() } : {})
      }
    },
    { returnDocument: 'after' }
  );
  
  if (!result) return null;
  
  return {
    ...result,
    _id: result._id.toString()
  } as ProcessingJob;
}

export async function getLatestProcessingJob(userId: string): Promise<ProcessingJob | null> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  
  const job = await db.collection(COLLECTION)
    .findOne(
      { userId },
      { sort: { createdAt: -1 } }
    );
  
  if (!job) return null;
  
  return {
    ...job,
    _id: job._id.toString()
  } as ProcessingJob;
}

export async function updateProcessingJobProgress(
  jobId: string,
  current: number,
  total: number,
  message?: string
): Promise<ProcessingJob | null> {
  return updateProcessingJobStatus(jobId, 'processing', {
    progress: { current, total, message }
  });
}


