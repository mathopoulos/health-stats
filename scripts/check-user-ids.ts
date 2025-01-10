import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI!;

async function checkUserIds() {
  console.log('\nChecking MongoDB data...');
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db('health-stats');

  try {
    // Get all unique user IDs from blood markers
    const uniqueUserIds = await db.collection('blood-markers')
      .distinct('userId');

    console.log('Unique user IDs in blood markers:', uniqueUserIds);

    // Get all users
    const users = await db.collection('users').find().toArray();
    console.log('\nUser records:', JSON.stringify(users, null, 2));

    // Get sample entries for each user ID
    for (const userId of uniqueUserIds) {
      const sample = await db.collection('blood-markers')
        .findOne({ userId });
      console.log(`\nSample entry for user ID ${userId}:`, JSON.stringify(sample, null, 2));
    }
  } catch (error) {
    console.error('Error checking user IDs:', error);
    throw error;
  } finally {
    await client.close();
  }
}

async function main() {
  try {
    console.log('Starting user ID check...');
    await checkUserIds();
    console.log('\nCheck completed successfully');
  } catch (error) {
    console.error('Check failed:', error);
    process.exit(1);
  }
}

main(); 