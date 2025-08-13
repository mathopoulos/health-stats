import { MongoClient } from 'mongodb';
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { put } from '@vercel/blob';
import * as dotenv from 'dotenv';
import path from 'path';
import { nanoid } from 'nanoid';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Generate a proper user ID (21 characters, URL-safe)
const NEW_USER_ID = 'usr_' + nanoid();
const MONGODB_URI = process.env.MONGODB_URI!;
const BUCKET_NAME = process.env.AWS_BUCKET_NAME!;

console.log('Generated new user ID:', NEW_USER_ID);

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

async function migrateMongoDBData() {
  console.log('Starting MongoDB migration...');
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db('health-stats');

  try {
    // Update blood markers collection
    const result = await db.collection('blood-markers').updateMany(
      { userId: 'test-user' },
      { $set: { userId: NEW_USER_ID } }
    );

    console.log(`MongoDB migration complete:
      - Matched documents: ${result.matchedCount}
      - Modified documents: ${result.modifiedCount}
    `);

    // Store the user ID mapping for future reference
    await db.collection('users').insertOne({
      userId: NEW_USER_ID,
      email: 'alexandros@mathopoulos.com',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('Created user record with ID mapping');
  } catch (error) {
    console.error('Error migrating MongoDB data:', error);
    throw error;
  } finally {
    await client.close();
  }
}

async function migrateS3Data() {
  console.log('Starting S3 migration...');
  const dataTypes = ['heartRate', 'weight', 'bodyFat', 'hrv', 'vo2max'];

  try {
    for (const type of dataTypes) {
      console.log(`Migrating ${type} data...`);
      
      // List objects in the root data directory
      const listCommand = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: `data/${type}.json`,
      });
      
      const response = await s3Client.send(listCommand);
      const objects = response.Contents || [];

      for (const object of objects) {
        if (!object.Key) continue;

        // Get the old file
        const getCommand = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: object.Key,
        });

        const oldFile = await s3Client.send(getCommand);
        const fileContent = await oldFile.Body?.transformToString();
        
        if (!fileContent) {
          console.warn(`No content found for ${object.Key}`);
          continue;
        }

        // Upload to new path using Vercel Blob
        const newKey = `data/${NEW_USER_ID}/${type}.json`;
        await put(newKey, fileContent, { 
          contentType: 'application/json',
          access: 'public'
        });

        console.log(`Copied ${object.Key} to ${newKey}`);
      }
    }

    console.log('S3 migration complete');
    console.log('Note: Original files were kept in place due to permission restrictions');
  } catch (error) {
    console.error('Error migrating S3 data:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('Starting data migration...');
    console.log('Using MongoDB URI:', MONGODB_URI);
    console.log('Using S3 bucket:', BUCKET_NAME);
    
    // Migrate MongoDB data
    await migrateMongoDBData();
    
    // Migrate S3 data
    await migrateS3Data();
    
    console.log('Migration completed successfully');
    console.log('IMPORTANT: Save this user ID for reference:', NEW_USER_ID);
    console.log('Note: You will need admin access to S3 to delete the old files manually');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main(); 