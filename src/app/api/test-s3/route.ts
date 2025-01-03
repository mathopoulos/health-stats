import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

export async function GET(request: NextRequest) {
  try {
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_BUCKET_NAME || '',
      MaxKeys: 1,
    });

    await s3Client.send(command);
    
    return NextResponse.json({ success: true, message: 'Successfully connected to S3' });
  } catch (error) {
    console.error('S3 test error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to S3', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 