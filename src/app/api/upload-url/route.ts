import { NextRequest, NextResponse } from 'next/server';
import { generatePresignedUploadUrl } from '@/lib/s3';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { filename, contentType } = await request.json();

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    // Generate a unique key for the file
    const fileExtension = filename.split('.').pop() || 'xml';
    const uniqueFilename = `${randomUUID()}.${fileExtension}`;
    const key = `uploads/${uniqueFilename}`;

    // Generate the presigned URL
    console.log('Generating presigned URL for:', key, 'contentType:', contentType);
    const url = await generatePresignedUploadUrl(key, contentType || 'application/xml');

    return NextResponse.json({ url, key });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
} 