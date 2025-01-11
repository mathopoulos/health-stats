import { NextResponse } from 'next/server';
import { processHealthData } from '@/lib/processHealthData';
import { listDataFiles } from '@/lib/s3';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { kv } from '@vercel/kv';

// In-memory store for local development
const localProcessingStore = new Map<string, any>();

async function setProcessingStatus(key: string, value: any) {
  if (process.env.VERCEL_ENV) {
    await kv.set(key, value);
  } else {
    localProcessingStore.set(key, value);
  }
}

async function getProcessingStatus(key: string) {
  if (process.env.VERCEL_ENV) {
    return await kv.get(key);
  } else {
    return localProcessingStore.get(key);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // List XML files in the uploads directory for the specific user
    const xmlFiles = await listDataFiles(`uploads/${session.user.id}/`);
    console.log('Found XML files:', xmlFiles);
    
    if (!xmlFiles || xmlFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No XML files found in uploads directory' },
        { status: 404 }
      );
    }

    // Filter for XML files and sort by name to get the latest one
    const xmlFilesOnly = xmlFiles.filter(file => file.toLowerCase().endsWith('.xml'));
    if (xmlFilesOnly.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No XML files found in uploads directory' },
        { status: 404 }
      );
    }

    // Sort by name to get the latest one (assuming files are named with timestamps)
    const latestXmlFile = xmlFilesOnly.sort().pop();
    if (!latestXmlFile) {
      return NextResponse.json(
        { success: false, error: 'Could not determine latest XML file' },
        { status: 404 }
      );
    }

    // Generate a unique processing ID
    const processingId = `process_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const statusKey = `processing:${processingId}`;
    
    // Store initial processing status
    await setProcessingStatus(statusKey, {
      status: 'processing',
      file: latestXmlFile,
      userId: session.user.id,
      startedAt: new Date().toISOString(),
    });

    // Start processing in the background
    processHealthData(latestXmlFile, session.user.id)
      .then(async (status) => {
        // Update status on completion
        await setProcessingStatus(statusKey, {
          status: 'completed',
          file: latestXmlFile,
          userId: session.user.id,
          completedAt: new Date().toISOString(),
          results: status
        });
      })
      .catch(async (error) => {
        // Update status on error
        await setProcessingStatus(statusKey, {
          status: 'error',
          file: latestXmlFile,
          userId: session.user.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date().toISOString()
        });
      });

    return NextResponse.json({ 
      success: true, 
      processingId,
      message: 'Processing started successfully'
    });
  } catch (error) {
    console.error('Error processing health data:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 