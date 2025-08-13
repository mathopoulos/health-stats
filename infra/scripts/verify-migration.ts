import { MongoClient } from 'mongodb';
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Get user ID from command line argument or exit
const USER_ID = process.argv[2];
if (!USER_ID) {
  console.error('Please provide a user ID as an argument');
  console.error('Example: npm run verify-migration usr_123abc...');
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI!;
const BUCKET_NAME = process.env.AWS_BUCKET_NAME!;

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

async function verifyMongoDBData() {
  console.log('\nVerifying MongoDB data...');
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db('health-stats');

  try {
    // Check user record
    const user = await db.collection('users').findOne({ userId: USER_ID });
    if (user) {
      console.log('Found user record:', JSON.stringify(user, null, 2));
    } else {
      console.log('No user record found');
    }

    // Check blood markers collection
    const bloodMarkers = await db.collection('blood-markers')
      .find({ userId: USER_ID })
      .toArray();

    console.log(`Found ${bloodMarkers.length} blood marker entries for user ID: ${USER_ID}`);
    
    if (bloodMarkers.length > 0) {
      console.log('Sample blood marker entry:', JSON.stringify(bloodMarkers[0], null, 2));
    }
  } catch (error) {
    console.error('Error verifying MongoDB data:', error);
    throw error;
  } finally {
    await client.close();
  }
}

async function verifyS3Data() {
  console.log('\nVerifying S3 data...');
  const dataTypes = ['heartRate', 'weight', 'bodyFat', 'hrv', 'vo2max'];

  try {
    for (const type of dataTypes) {
      console.log(`\nChecking ${type} data...`);
      
      // List objects in the new path
      const listCommand = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: `data/${USER_ID}/${type}.json`,
      });
      
      const response = await s3Client.send(listCommand);
      const objects = response.Contents || [];

      if (objects.length === 0) {
        console.log(`No ${type} data found`);
        continue;
      }

      for (const object of objects) {
        if (!object.Key) continue;

        // Get the file
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
        console.log(`${type} data:
          - File: ${object.Key}
          - Number of records: ${data.length}
          - First record: ${JSON.stringify(data[0])}
        `);
      }
    }
  } catch (error) {
    console.error('Error verifying S3 data:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('Starting verification...');
    console.log('Verifying data for user ID:', USER_ID);
    
    // Verify MongoDB data
    await verifyMongoDBData();
    
    // Verify S3 data
    await verifyS3Data();
    
    console.log('\nVerification completed successfully');
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}

main(); 