import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('Received upload request');
    const body = (await request.json()) as HandleUploadBody;
    console.log('Request body:', body);

    try {
      const jsonResponse = await handleUpload({
        body,
        request,
        onBeforeGenerateToken: async () => {
          console.log('Validating upload');
          return {
            maximumSizeInBytes: 100 * 1024 * 1024, // 100MB
            allowedContentTypes: ['application/xml'],
          };
        },
        onUploadCompleted: async ({ blob, tokenPayload }) => {
          console.log('Upload completed:', { blob, tokenPayload });
          
          try {
            // Process the health data after upload
            console.log('Processing health data...');
            const processResponse = await fetch('/api/process-health-data', {
              method: 'POST'
            });

            if (!processResponse.ok) {
              throw new Error('Failed to process health data');
            }
            console.log('Health data processing complete');
          } catch (error) {
            console.error('Failed to process health data:', error);
            throw error;
          }
        },
      });

      console.log('Returning response:', jsonResponse);
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