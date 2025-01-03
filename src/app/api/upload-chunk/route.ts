import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, appendFile, rename } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const chunk = formData.get('chunk') as Blob;
    const chunkNumber = parseInt(formData.get('chunkNumber') as string);
    const totalChunks = parseInt(formData.get('totalChunks') as string);
    const isLastChunk = formData.get('isLastChunk') === 'true';
    const fileName = formData.get('fileName') as string;

    if (!chunk) {
      return NextResponse.json({ error: 'No chunk provided' }, { status: 400 });
    }

    // Create temp directory if it doesn't exist
    const tempDir = join(process.cwd(), 'public', 'temp');
    await mkdir(tempDir, { recursive: true });

    // Create a temporary file for this upload
    const tempFilePath = join(tempDir, `${fileName}.part`);
    const finalFilePath = join(process.cwd(), 'public', 'export.xml');

    // Convert chunk to Buffer
    const buffer = Buffer.from(await chunk.arrayBuffer());

    // If it's the first chunk, write it directly
    if (chunkNumber === 1) {
      await writeFile(tempFilePath, buffer);
    } else {
      // Append subsequent chunks
      await appendFile(tempFilePath, buffer);
    }

    // If this is the last chunk, move the file to its final location
    if (isLastChunk) {
      await rename(tempFilePath, finalFilePath);
      return NextResponse.json({ 
        success: true, 
        message: 'File upload completed',
        isComplete: true
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Chunk ${chunkNumber} of ${totalChunks} uploaded successfully`,
      isComplete: false
    });

  } catch (error) {
    console.error('Error handling chunk upload:', error);
    return NextResponse.json(
      { 
        error: 'Error processing chunk upload',
        details: process.env.NODE_ENV === 'development' 
          ? error instanceof Error ? error.message : 'Unknown error'
          : 'Server error'
      },
      { status: 500 }
    );
  }
} 