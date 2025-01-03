import { NextRequest, NextResponse } from 'next/server';
import { del, list } from '@vercel/blob';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('Starting blob cleanup...');

    // List all blobs
    const { blobs } = await list();
    console.log(`Found ${blobs.length} blobs to clean up`);

    // Delete each blob
    const deletePromises = blobs.map(async (blob) => {
      try {
        console.log(`Deleting blob: ${blob.url}`);
        await del(blob.url);
      } catch (error) {
        console.error(`Failed to delete blob ${blob.url}:`, error);
      }
    });

    // Wait for all deletions to complete
    await Promise.all(deletePromises);

    console.log('Blob cleanup complete');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error during blob cleanup:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to clean up blobs',
      },
      { status: 500 }
    );
  }
} 