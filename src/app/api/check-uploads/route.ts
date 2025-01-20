import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check for files in the user's S3 directory
    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Prefix: `uploads/${session.user.id}/`,
      MaxKeys: 1, // We only need to know if there's at least one file
    });

    const response = await s3Client.send(command);
    
    // If Contents exists and has items, the user has uploads
    const hasUploads = !!response.Contents && response.Contents.length > 0;

    return NextResponse.json({ hasUploads });
  } catch (error) {
    console.error('Error checking uploads:', error);
    return NextResponse.json(
      { error: 'Failed to check uploads' },
      { status: 500 }
    );
  }
} 