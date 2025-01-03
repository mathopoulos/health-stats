import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Maximum allowed on hobby plan

export async function POST(request: NextRequest) {
  try {
    console.log('Starting chunk upload...');
    
    const formData = await request.formData();
    const chunk = formData.get('chunk') as Blob;
    const chunkNumber = parseInt(formData.get('chunkNumber') as string);
    const totalChunks = parseInt(formData.get('totalChunks') as string);
    const isLastChunk = formData.get('isLastChunk') === 'true';
    const fileName = formData.get('fileName') as string;

    console.log('Received chunk data:', {
      chunkNumber,
      totalChunks,
      isLastChunk,
      fileName,
      chunkSize: chunk?.size,
    });

    if (!chunk) {
      console.error('No chunk provided in request');
      return NextResponse.json({ error: 'No chunk provided' }, { status: 400 });
    }

    if (!fileName) {
      console.error('No fileName provided in request');
      return NextResponse.json({ error: 'No fileName provided' }, { status: 400 });
    }

    if (isNaN(chunkNumber) || isNaN(totalChunks)) {
      console.error('Invalid chunk number or total chunks:', { chunkNumber, totalChunks });
      return NextResponse.json({ error: 'Invalid chunk number or total chunks' }, { status: 400 });
    }

    try {
      console.log(`Uploading chunk ${chunkNumber} to Vercel Blob storage...`);
      
      // Upload chunk to Vercel Blob storage
      const { url } = await put(
        `temp/${fileName}.chunk${chunkNumber}`,
        chunk,
        { 
          access: 'public',
          addRandomSuffix: false, // Ensure consistent naming
          contentType: 'application/octet-stream'
        }
      );

      console.log(`Successfully uploaded chunk ${chunkNumber} to ${url}`);

      // If this is the last chunk, we'll need to combine them later
      if (isLastChunk) {
        console.log('Last chunk uploaded successfully');
        return NextResponse.json({ 
          success: true, 
          message: 'File upload completed',
          isComplete: true,
          totalChunks,
          fileName,
          url
        });
      }

      return NextResponse.json({ 
        success: true, 
        message: `Chunk ${chunkNumber} of ${totalChunks} uploaded successfully`,
        isComplete: false,
        url
      });
    } catch (uploadError) {
      console.error('Error uploading to Vercel Blob:', uploadError);
      console.error('Upload error details:', {
        message: uploadError instanceof Error ? uploadError.message : 'Unknown error',
        stack: uploadError instanceof Error ? uploadError.stack : undefined
      });
      throw uploadError;
    }
  } catch (error) {
    console.error('Error handling chunk upload:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
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