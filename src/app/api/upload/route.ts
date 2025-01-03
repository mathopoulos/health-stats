import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Validate file type
        return {
          allowedContentTypes: ['application/xml'],
          tokenPayload: JSON.stringify({
            // optional, sent to your server on upload completion
            pathname
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Get notified of client upload completion
        console.log('blob upload completed', blob);

        try {
          // Trigger health data processing
          await fetch('/api/process-health-data', {
            method: 'POST'
          });
        } catch (error) {
          console.error('Failed to process health data:', error);
          throw new Error('Could not process health data');
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
} 