import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI!;
const FINAL_USER_ID = 'usr_W2LWz83EurLxZwfjqT_EL'; // Using the ID that blood markers are already using

async function cleanupUsers() {
  console.log('\nStarting user cleanup...');
  const client = await MongoClient.connect(MONGODB_URI, {
    connectTimeoutMS: 60000, // 60 seconds
    socketTimeoutMS: 60000,
  });
  const db = client.db('health-stats');

  try {
    // Delete all user records except the one we want to keep
    const deleteResult = await db.collection('users').deleteMany({
      $or: [
        { userId: { $ne: FINAL_USER_ID } },
        { userId: { $exists: false } }
      ]
    });

    console.log(`Deleted ${deleteResult.deletedCount} user records`);

    // Create or update the final user record
    const upsertResult = await db.collection('users').updateOne(
      { userId: FINAL_USER_ID },
      {
        $set: {
          email: 'alexandros@mathopoulos.com',
          name: 'Alexandros Mathopoulos',
          dashboardPublished: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    console.log('Updated final user record');

    // Verify the cleanup
    const users = await db.collection('users').find().toArray();
    console.log('\nRemaining user records:', JSON.stringify(users, null, 2));

    const bloodMarkers = await db.collection('blood-markers')
      .find({ userId: FINAL_USER_ID })
      .toArray();

    console.log(`\nFound ${bloodMarkers.length} blood markers with final user ID`);
  } catch (error) {
    console.error('Error cleaning up users:', error);
    throw error;
  } finally {
    await client.close();
  }
}

async function main() {
  try {
    console.log('Starting cleanup...');
    await cleanupUsers();
    console.log('\nCleanup completed successfully');
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

main(); 