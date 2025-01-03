import { handleUpload } from '@vercel/blob/client';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    const blob = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['application/xml'],
        maximumSizeInBytes: 100 * 1024 * 1024, // 100MB
      }),
      onUploadCompleted: async ({ blob }) => {
        try {
          // Process the health data after upload
          const processResponse = await fetch('/api/process-health-data', {
            method: 'POST'
          });

          if (!processResponse.ok) {
            throw new Error('Failed to process health data');
          }
        } catch (error) {
          console.error('Failed to process health data:', error);
          throw error;
        }
      },
    });

    return NextResponse.json(blob);
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