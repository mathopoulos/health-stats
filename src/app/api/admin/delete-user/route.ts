import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import clientPromise from '@server/services/mongodb';
import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';

const ADMIN_EMAIL = 'alexandros@mathopoulos.com';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME!;

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is the admin
    if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log(`Admin ${session.user.email} starting account deletion for user: ${userId}`);

    const client = await clientPromise;
    const db = client.db("health-stats");

    // First, check if the user exists
    const userToDelete = await db.collection('users').findOne({ userId });
    if (!userToDelete) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    let deletionResults = {
      mongodb: {
        users: 0,
        bloodMarkers: 0,
        healthProtocols: 0,
        processingJobs: 0
      },
      s3: {
        uploads: 0,
        data: 0,
        profileImages: 0
      },
      errors: [] as string[]
    };

    // 1. Delete from MongoDB collections
    try {
      // Delete user record
      const userResult = await db.collection('users').deleteMany({ userId });
      deletionResults.mongodb.users = userResult.deletedCount;

      // Delete blood markers
      const bloodMarkersResult = await db.collection('blood-markers').deleteMany({ userId });
      deletionResults.mongodb.bloodMarkers = bloodMarkersResult.deletedCount;

      // Delete health protocols
      const healthProtocolsResult = await db.collection('health-protocols').deleteMany({ userId });
      deletionResults.mongodb.healthProtocols = healthProtocolsResult.deletedCount;

      // Delete processing jobs
      const processingJobsResult = await db.collection('processing-jobs').deleteMany({ userId });
      deletionResults.mongodb.processingJobs = processingJobsResult.deletedCount;

      console.log('MongoDB deletion completed:', deletionResults.mongodb);
    } catch (error) {
      console.error('Error deleting from MongoDB:', error);
      deletionResults.errors.push(`MongoDB deletion error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // 2. Delete from S3
    try {
      // Define S3 prefixes to delete
      const s3Prefixes = [
        `uploads/${userId}/`,
        `data/${userId}/`,
        `profile-images/${userId}/`
      ];

      for (const prefix of s3Prefixes) {
        try {
          console.log(`Deleting S3 objects with prefix: ${prefix}`);
          
          // List all objects with this prefix
          const listCommand = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: prefix,
          });

          const listResponse = await s3Client.send(listCommand);
          const objectsToDelete = listResponse.Contents || [];

          if (objectsToDelete.length > 0) {
            // Delete each object
            const deletePromises = objectsToDelete.map(async (obj) => {
              if (!obj.Key) return false;

              try {
                const deleteCommand = new DeleteObjectCommand({
                  Bucket: BUCKET_NAME,
                  Key: obj.Key,
                });

                await s3Client.send(deleteCommand);
                console.log(`Deleted S3 object: ${obj.Key}`);
                return true;
              } catch (error) {
                console.error(`Error deleting S3 object ${obj.Key}:`, error);
                deletionResults.errors.push(`Failed to delete S3 object: ${obj.Key}`);
                return false;
              }
            });

            const deleteResults = await Promise.all(deletePromises);
            const successCount = deleteResults.filter(Boolean).length;

            // Update deletion results based on prefix
            if (prefix.includes('uploads/')) {
              deletionResults.s3.uploads = successCount;
            } else if (prefix.includes('data/')) {
              deletionResults.s3.data = successCount;
            } else if (prefix.includes('profile-images/')) {
              deletionResults.s3.profileImages = successCount;
            }
          }
        } catch (error) {
          console.error(`Error processing S3 prefix ${prefix}:`, error);
          deletionResults.errors.push(`S3 deletion error for ${prefix}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      console.log('S3 deletion completed:', deletionResults.s3);
    } catch (error) {
      console.error('Error deleting from S3:', error);
      deletionResults.errors.push(`S3 deletion error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // 3. Calculate totals
    const totalMongoDeleted = Object.values(deletionResults.mongodb).reduce((sum, count) => sum + count, 0);
    const totalS3Deleted = Object.values(deletionResults.s3).reduce((sum, count) => sum + count, 0);

    console.log(`Admin account deletion completed for user ${userId}:`, {
      totalMongoDeleted,
      totalS3Deleted,
      errors: deletionResults.errors.length,
      deletedUser: userToDelete.name || userToDelete.email || userId
    });

    return NextResponse.json({
      success: true,
      message: `Account for ${userToDelete.name || userToDelete.email || userId} deleted successfully`,
      details: {
        deletedUser: {
          userId,
          name: userToDelete.name,
          email: userToDelete.email
        },
        mongodb: {
          total: totalMongoDeleted,
          breakdown: deletionResults.mongodb
        },
        s3: {
          total: totalS3Deleted,
          breakdown: deletionResults.s3
        },
        errors: deletionResults.errors
      }
    });

  } catch (error) {
    console.error('Error during admin account deletion:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete account',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 