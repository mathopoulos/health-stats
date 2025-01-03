import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const file = request.body;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Upload to Vercel Blob
    const { url } = await put('export.xml', file, {
      access: 'public',
      contentType: 'application/xml'
    });

    // Process the health data
    const processResponse = await fetch('/api/process-health-data', {
      method: 'POST'
    });

    if (!processResponse.ok) {
      throw new Error('Failed to process health data');
    }

    return NextResponse.json({ 
      success: true, 
      url,
      message: 'File uploaded and processed successfully' 
    });
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