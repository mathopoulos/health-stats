import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Get the fileId (which is the S3 key) from the URL params
    let fileId = params.fileId;
    
    // The fileId might be double-encoded in the URL, so we need to decode it
    // Try both single and double decoding to handle different scenarios
    let fileKey;
    try {
      // First try with a single decode
      fileKey = decodeURIComponent(fileId);
      
      // If the decoded key still contains encoded characters, try again
      if (fileKey.includes('%')) {
        const doubleDecoded = decodeURIComponent(fileKey);
        console.log('Original fileId appears to be encoded multiple times. Double-decoded:', doubleDecoded);
        fileKey = doubleDecoded;
      }
    } catch (e) {
      console.error('Error decoding fileId:', e);
      fileKey = fileId; // Fallback to the original fileId if decoding fails
    }
    
    console.log('DELETE request for file:', { 
      originalFileId: fileId, 
      decodedKey: fileKey, 
      userId 
    });
    
    // Security check: ensure the file belongs to the current user
    if (!fileKey.startsWith(`uploads/${userId}/`)) {
      console.error('Security check failed: File key does not start with the correct prefix', {
        fileKey,
        expectedPrefix: `uploads/${userId}/`
      });
      return NextResponse.json(
        { error: 'Unauthorized access to this file', success: false },
        { status: 403 }
      );
    }
    
    // Delete the file from S3
    const bucketName = process.env.AWS_BUCKET_NAME!;
    console.log('Attempting to delete file from S3:', { 
      bucket: bucketName, 
      key: fileKey 
    });
    
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
    });
    
    await s3Client.send(command);
    
    console.log('File deleted successfully from S3:', { fileKey });
    
    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    // More detailed error logging
    if (error instanceof Error) {
      console.error({
        message: 'Detailed error info:',
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        params: params
      });
    }
    
    return NextResponse.json(
      { error: 'Failed to delete file', details: error instanceof Error ? error.message : String(error), success: false },
      { status: 500 }
    );
  }
} 