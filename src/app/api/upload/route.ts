import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// New route segment config format
export const maxDuration = 60;
export const fetchCache = 'force-no-store';

// Configure body size limit
export async function POST(request: NextRequest) {
  try {
    if (!request.body) {
      return NextResponse.json(
        { error: 'No request body' },
        { status: 400 }
      );
    }

    let formData;
    try {
      formData = await request.formData();
    } catch (error) {
      if (error instanceof Error && error.message.includes('entity too large')) {
        return NextResponse.json(
          { error: 'File size too large. Maximum size is 50MB.' },
          { status: 413 }
        );
      }
      throw error;
    }

    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Check file size (50MB in bytes)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 50MB.' },
        { status: 413 }
      );
    }

    try {
      // Create public directory if it doesn't exist
      const publicDir = join(process.cwd(), 'public');
      await mkdir(publicDir, { recursive: true });

      // Create data directory if it doesn't exist
      const dataDir = join(publicDir, 'data');
      await mkdir(dataDir, { recursive: true });

      // Convert the file to a Buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Save the file
      const filePath = join(publicDir, 'export.xml');
      await writeFile(filePath, buffer);

      return NextResponse.json({ success: true, message: 'File uploaded successfully' });
    } catch (fsError) {
      console.error('Filesystem error:', fsError);
      return NextResponse.json(
        { 
          error: 'Error saving file',
          details: process.env.NODE_ENV === 'development' 
            ? fsError instanceof Error ? fsError.message : 'Unknown filesystem error'
            : 'Server configuration error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error handling upload:', error);
    return NextResponse.json(
      { 
        error: 'Error processing upload',
        details: process.env.NODE_ENV === 'development' 
          ? error instanceof Error ? error.message : 'Unknown error'
          : 'Server error'
      },
      { status: 500 }
    );
  }
} 