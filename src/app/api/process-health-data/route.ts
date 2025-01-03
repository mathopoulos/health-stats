import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';
import { mkdir } from 'fs/promises';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('Processing health data request received');
    const { blobUrl } = await request.json();
    console.log('Blob URL:', blobUrl);

    if (!blobUrl) {
      throw new Error('No blob URL provided');
    }

    // Create the data directory if it doesn't exist
    const dataDir = join(process.cwd(), 'public', 'data');
    await mkdir(dataDir, { recursive: true });

    // Download the file from blob storage
    console.log('Downloading file from blob storage...');
    const response = await fetch(blobUrl);
    if (!response.ok) {
      throw new Error('Failed to download file from blob storage');
    }

    // Save the file locally
    const xmlPath = join(process.cwd(), 'export.xml');
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(xmlPath, buffer);
    console.log('File saved locally:', xmlPath);

    // Process the health data
    console.log('Processing health data...');
    const processResponse = await fetch(new URL('/api/extract-health-data', request.url).toString(), {
      method: 'POST',
    });

    if (!processResponse.ok) {
      const errorText = await processResponse.text();
      console.error('Extract health data error:', errorText);
      throw new Error('Failed to extract health data');
    }

    console.log('Health data processing complete');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing health data:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process health data',
      },
      { status: 400 }
    );
  } finally {
    // Clean up the temporary file
    try {
      await fs.unlink(join(process.cwd(), 'export.xml')).catch(() => {});
    } catch (error) {
      console.error('Error cleaning up temporary file:', error);
    }
  }
} 