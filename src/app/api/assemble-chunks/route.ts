import { NextRequest, NextResponse } from 'next/server';
import { list, del, put } from '@vercel/blob';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Maximum allowed on hobby plan

export async function POST(request: NextRequest) {
  try {
    const { fileName, totalChunks } = await request.json();

    // List all chunks
    const { blobs } = await list({ prefix: `temp/${fileName}.chunk` });
    
    if (blobs.length !== totalChunks) {
      return NextResponse.json({
        error: `Missing chunks. Found ${blobs.length} of ${totalChunks} expected chunks.`
      }, { status: 400 });
    }

    // Sort chunks by number
    const sortedBlobs = blobs.sort((a, b) => {
      const aNum = parseInt(a.pathname.split('chunk')[1]);
      const bNum = parseInt(b.pathname.split('chunk')[1]);
      return aNum - bNum;
    });

    // Download and combine all chunks
    const chunks: Blob[] = [];
    for (const blob of sortedBlobs) {
      const response = await fetch(blob.url);
      const chunk = await response.blob();
      chunks.push(chunk);
    }

    // Combine chunks into a single blob
    const combinedBlob = new Blob(chunks, { type: 'application/xml' });

    // Upload the combined file
    const { url } = await put('export.xml', combinedBlob, { access: 'public' });

    // Clean up chunks
    await Promise.all(sortedBlobs.map(blob => del(blob.url)));

    return NextResponse.json({ 
      success: true,
      message: 'File assembled successfully',
      url
    });
  } catch (error) {
    console.error('Error assembling chunks:', error);
    return NextResponse.json(
      { 
        error: 'Error assembling chunks',
        details: process.env.NODE_ENV === 'development' 
          ? error instanceof Error ? error.message : 'Unknown error'
          : 'Server error'
      },
      { status: 500 }
    );
  }
} 