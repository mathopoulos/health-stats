import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const prefix = `uploads/${userId}/`;

    // List all objects in the user's upload directory
    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Prefix: prefix,
    });

    const response = await s3Client.send(command);
    
    if (!response.Contents || response.Contents.length === 0) {
      return NextResponse.json({ success: true, files: [] });
    }

    // Transform the S3 objects into our file format
    const files = response.Contents.map(item => {
      // Extract the filename from the key (path)
      const filename = item.Key!.split('/').pop() || 'unknown';
      
      return {
        id: item.Key!, // Using the S3 key as the ID
        filename,
        uploadDate: item.LastModified?.toISOString() || new Date().toISOString(),
      };
    });

    return NextResponse.json({ success: true, files });
  } catch (error) {
    console.error('Error fetching uploaded files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch uploaded files', success: false },
      { status: 500 }
    );
  }
} 