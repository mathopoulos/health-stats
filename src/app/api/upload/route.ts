import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// New route segment config format
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    if (!request.body) {
      return NextResponse.json(
        { error: 'No request body' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
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