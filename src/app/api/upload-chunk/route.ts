import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { join } from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

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

    try {
      // Upload chunk to Vercel Blob storage
      const { url } = await put(
        `temp/${fileName}.chunk${chunkNumber}`,
        chunk,
        { access: 'public' }
      );

      // If this is the last chunk, we'll need to combine them later
      if (isLastChunk) {
        return NextResponse.json({ 
          success: true, 
          message: 'File upload completed',
          isComplete: true,
          totalChunks,
          fileName
        });
      }

      return NextResponse.json({ 
        success: true, 
        message: `Chunk ${chunkNumber} of ${totalChunks} uploaded successfully`,
        isComplete: false
      });
    } catch (uploadError) {
      console.error('Error uploading to Vercel Blob:', uploadError);
      throw uploadError;
    }
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