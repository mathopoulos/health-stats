import { MongoClient } from 'mongodb';
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const OLD_EMAIL = 'alexandros@mathopoulos.com';
const MONGODB_URI = process.env.MONGODB_URI!;
const BUCKET_NAME = process.env.AWS_BUCKET_NAME!;

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

async function checkMongoDBData() {
  console.log('\nChecking MongoDB data...');
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db('health-stats');

  try {
    // Check blood markers collection with old email
    const bloodMarkers = await db.collection('blood-markers')
      .find({ userEmail: OLD_EMAIL })
      .toArray();

    console.log(`Found ${bloodMarkers.length} blood marker entries for email: ${OLD_EMAIL}`);
    
    if (bloodMarkers.length > 0) {
      console.log('Sample blood marker entry:', JSON.stringify(bloodMarkers[0], null, 2));
    }

    // Also check for any documents with userId field
    const bloodMarkersWithUserId = await db.collection('blood-markers')
      .find({ userId: { $exists: true } })
      .toArray();

    console.log(`Found ${bloodMarkersWithUserId.length} blood marker entries with userId field`);
    
    if (bloodMarkersWithUserId.length > 0) {
      console.log('Sample blood marker entry with userId:', JSON.stringify(bloodMarkersWithUserId[0], null, 2));
    }
  } catch (error) {
    console.error('Error checking MongoDB data:', error);
    throw error;
  } finally {
    await client.close();
  }
}

async function checkS3Data() {
  console.log('\nChecking S3 data...');
  const dataTypes = ['heartRate', 'weight', 'bodyFat', 'hrv', 'vo2max'];

  try {
    // First check old email-based paths
    console.log('\nChecking old email-based paths:');
    for (const type of dataTypes) {
      console.log(`\nChecking ${type} data...`);
      
      const listCommand = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: `data/${OLD_EMAIL}/${type}.json`,
      });
      
      const response = await s3Client.send(listCommand);
      const objects = response.Contents || [];

      if (objects.length === 0) {
        console.log(`No ${type} data found in old path`);
        continue;
      }

      for (const object of objects) {
        if (!object.Key) continue;

        const getCommand = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: object.Key,
        });

        const file = await s3Client.send(getCommand);
        const fileContent = await file.Body?.transformToString();
        
        if (!fileContent) {
          console.warn(`No content found for ${object.Key}`);
          continue;
        }

        const data = JSON.parse(fileContent);
        console.log(`${type} data in old path:
          - File: ${object.Key}
          - Number of records: ${data.length}
          - First record: ${JSON.stringify(data[0])}
        `);
      }
    }

    // Then check root data directory for any files
    console.log('\nChecking root data directory:');
    const rootListCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'data/',
    });
    
    const rootResponse = await s3Client.send(rootListCommand);
    const rootObjects = rootResponse.Contents || [];

    console.log('All files in data directory:');
    rootObjects.forEach(obj => console.log(obj.Key));
  } catch (error) {
    console.error('Error checking S3 data:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('Starting data check...');
    
    // Check MongoDB data
    await checkMongoDBData();
    
    // Check S3 data
    await checkS3Data();
    
    console.log('\nCheck completed successfully');
  } catch (error) {
    console.error('Check failed:', error);
    process.exit(1);
  }
}

main(); 