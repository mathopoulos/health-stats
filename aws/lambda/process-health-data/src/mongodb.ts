import { MongoClient, ObjectId } from 'mongodb';
import { env } from './env';

let client: MongoClient | null = null;

async function getMongoClient(): Promise<MongoClient> {
  if (!client) {
    const baseUri = env.MONGODB_URI.split('?')[0];
    
    client = new MongoClient(baseUri, {
      retryWrites: true,
      retryReads: true,
      w: 'majority',
      maxPoolSize: 1,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 5000
    });
    await client.connect();
  }

  return client;
}

export async function updateJobProgress(jobId: string, current: number, total: number, message: string): Promise<void> {
  const client = await getMongoClient();
  const db = client.db('health-stats');

  await db.collection('processing-jobs').updateOne(
    { _id: new ObjectId(jobId) },
    {
      $set: {
        status: 'processing',
        progress: { current, total, message },
        updatedAt: new Date()
      }
    }
  );
}

export async function updateJobStatus(
  jobId: string, 
  status: 'completed' | 'failed', 
  updates: { error?: string; result?: any } = {}
): Promise<void> {
  const client = await getMongoClient();
  const db = client.db('health-stats');

  const updateDoc: any = {
    status,
    updatedAt: new Date()
  };

  if (status === 'completed') {
    updateDoc.completedAt = new Date();
    if (updates.result) {
      updateDoc.result = updates.result;
    }
  } else if (status === 'failed') {
    updateDoc.error = updates.error || 'Unknown error';
  }

  await db.collection('processing-jobs').updateOne(
    { _id: new ObjectId(jobId) },
    { $set: updateDoc }
  );
}

// Cleanup function to be called before Lambda exits
export async function cleanup(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
  }
} 