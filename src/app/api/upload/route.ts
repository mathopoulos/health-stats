import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ChunkInfo {
  filename: string;
  chunkIndex: number;
  totalChunks: number;
  offset: number;
  isLastChunk: boolean;
}

interface UploadPayload {
  pathname: string;
  callbackUrl: string;
  multipart: boolean;
  clientPayload: string | null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('Received upload request');
    const body = (await request.json()) as HandleUploadBody;
    console.log('Request body:', JSON.stringify(body, null, 2));

    try {
      const jsonResponse = await handleUpload({
        body,
        request,
        onBeforeGenerateToken: async (pathname: string) => {
          console.log('Validating upload for pathname:', pathname);
          
          let chunkInfo: ChunkInfo | null = null;
          try {
            const payload = body.payload as UploadPayload;
            if (payload?.clientPayload) {
              chunkInfo = JSON.parse(payload.clientPayload) as ChunkInfo;
              console.log('Processing chunk:', chunkInfo);
            }
          } catch (error) {
            console.error('Error parsing client payload:', error);
          }

          return {
            maximumSizeInBytes: 20 * 1024 * 1024, // 20MB per chunk
            allowedContentTypes: ['application/xml'],
          };
        },
        onUploadCompleted: async ({ blob, tokenPayload }) => {
          console.log('Chunk upload completed, blob:', JSON.stringify(blob, null, 2));
          
          try {
            let chunkInfo: ChunkInfo | null = null;
            try {
              if (tokenPayload) {
                chunkInfo = JSON.parse(tokenPayload) as ChunkInfo;
                console.log('Chunk upload complete:', chunkInfo);
              }
            } catch (error) {
              console.error('Error parsing token payload:', error);
            }

            // Only process the health data after the last chunk
            if (chunkInfo?.isLastChunk) {
              console.log('Processing health data for completed upload...');
              const baseUrl = process.env.VERCEL_URL 
                ? `https://${process.env.VERCEL_URL}` 
                : 'http://localhost:3000';
                
              const processResponse = await fetch(`${baseUrl}/api/process-health-data`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
                  // Add host header to help with routing
                  'Host': process.env.VERCEL_URL || 'localhost:3000'
                },
                body: JSON.stringify({
                  blobUrl: blob.url,
                  tokenPayload,
                }),
              });

              if (!processResponse.ok) {
                const errorText = await processResponse.text();
                console.error('Process response error:', errorText);
                throw new Error('Failed to process health data');
              }
              console.log('Health data processing complete');
            }
          } catch (error) {
            console.error('Failed to process health data:', error);
            throw error;
          }
        },
      });

      console.log('Returning response:', JSON.stringify(jsonResponse, null, 2));
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