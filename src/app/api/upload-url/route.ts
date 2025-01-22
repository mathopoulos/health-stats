import { NextRequest, NextResponse } from 'next/server';
import { generatePresignedUploadUrl } from '@/lib/s3';
import { nanoid } from 'nanoid';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { filename, contentType } = await request.json();

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "Missing filename or contentType" }, 
        { status: 400 }
      );
    }

    // Generate a unique key for the file
    const fileExtension = filename.split('.').pop();
    const key = `uploads/${session.user.id}/${nanoid()}.${fileExtension}`;

    // Generate the presigned URL
    console.log('Generating presigned URL for:', key, 'contentType:', contentType);
    const url = await generatePresignedUploadUrl(key, contentType, session.user.id);

    return NextResponse.json({ 
      success: true,
      url, 
      key 
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json(
      { 
        error: "Failed to generate upload URL",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 