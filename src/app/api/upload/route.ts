import { handleUpload } from '@vercel/blob/client';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    try {
      const jsonResponse = await handleUpload({
        body,
        request,
        onBeforeGenerateToken: async () => {
          // Validate the upload before generating a token
          return {
            allowedContentTypes: ['application/xml'],
            maximumSizeInBytes: 100 * 1024 * 1024, // 100MB
          };
        },
        onUploadCompleted: async ({ blob }) => {
          // After the file is uploaded to Vercel Blob
          console.log('Upload completed:', blob.url);
          
          try {
            // Process the health data
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

      return NextResponse.json(jsonResponse);
    } catch (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
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