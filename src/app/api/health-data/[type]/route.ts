import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { HealthDataType } from '@/lib/s3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME || '';

// DELETE API endpoint to delete a specific type of health data
export async function DELETE(
  request: NextRequest,
  { params }: { params: { type: string } }
): Promise<NextResponse> {
  try {
    const type = params.type;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    // Validate type parameter
    if (!type || !['heartRate', 'weight', 'bodyFat', 'hrv', 'vo2max'].includes(type)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid type parameter. Must be one of: heartRate, weight, bodyFat, hrv, vo2max',
        },
        { status: 400 }
      );
    }

    // Validate userId parameter
    if (!userId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'User ID is required',
        },
        { status: 400 }
      );
    }
    
    // Get objects to delete
    let deletedCount = 0;
    let deletionResults: boolean[] = [];
    
    // 1. Delete the directory contents (individual files)
    const listDirCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `data/${userId}/${type}/`,
    });

    const listDirResponse = await s3Client.send(listDirCommand);
    const directoryObjectsToDelete = listDirResponse.Contents || [];

    if (directoryObjectsToDelete.length > 0) {
      // Delete each object in the directory
      const dirDeletionResults = await Promise.all(
        directoryObjectsToDelete.map(async (obj) => {
          if (!obj.Key) return false;

          const deleteCommand = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: obj.Key,
          });

          try {
            await s3Client.send(deleteCommand);
            return true;
          } catch (error) {
            console.error(`Error deleting ${obj.Key}:`, error);
            return false;
          }
        })
      );
      
      deletionResults = [...deletionResults, ...dirDeletionResults];
    }
    
    // 2. Delete the consolidated JSON file
    const jsonFileKey = `data/${userId}/${type}.json`;
    try {
      const deleteJsonCommand = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: jsonFileKey,
      });
      
      await s3Client.send(deleteJsonCommand);
      deletionResults.push(true);
      console.log(`Deleted consolidated JSON file: ${jsonFileKey}`);
    } catch (error) {
      console.error(`Error deleting consolidated JSON file ${jsonFileKey}:`, error);
      deletionResults.push(false);
    }
    
    // Also try lowercase variant for bodyFat
    if (type === 'bodyFat') {
      try {
        const lowercaseJsonFileKey = `data/${userId}/bodyfat.json`;
        const deleteLowercaseJsonCommand = new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: lowercaseJsonFileKey,
        });
        
        await s3Client.send(deleteLowercaseJsonCommand);
        deletionResults.push(true);
        console.log(`Deleted lowercase variant JSON file: ${lowercaseJsonFileKey}`);
      } catch (error) {
        console.error(`Error deleting lowercase bodyfat JSON file:`, error);
        deletionResults.push(false);
      }
    }

    deletedCount = deletionResults.filter(Boolean).length;

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deletedCount} ${type} data entries`,
      deletedCount
    });
  } catch (error) {
    console.error('Error in delete health data API:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete health data',
    }, { status: 500 });
  }
} 