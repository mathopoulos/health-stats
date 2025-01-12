import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { MongoClient, ObjectId } from 'mongodb';
import { readFile } from 'fs/promises';
import path from 'path';
import { env } from './env';

const s3 = new S3Client({ region: env.AWS_REGION });
const userId = 'test-user';
const xmlKey = `uploads/${userId}/test-data.xml`;

async function uploadTestXml() {
  const xmlContent = await readFile(path.resolve(__dirname, '../test/test-data.xml'));
  await s3.send(new PutObjectCommand({
    Bucket: env.AWS_BUCKET_NAME,
    Key: xmlKey,
    Body: xmlContent,
  }));
  console.log('Uploaded test XML to S3:', xmlKey);
}

async function createTestJob() {
  const client = new MongoClient(env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    const result = await db.collection('processing-jobs').insertOne({
      userId,
      status: 'pending',
      type: 'health-data',
      fileKey: xmlKey,
      startedAt: new Date(),
      progress: { current: 0, total: 5 },
    });
    console.log('Created test job in MongoDB:', result.insertedId.toString());
    return result.insertedId.toString();
  } finally {
    await client.close();
  }
}

async function setup() {
  try {
    await uploadTestXml();
    const jobId = await createTestJob();
    console.log('Setup complete. Job ID:', jobId);
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

setup(); 