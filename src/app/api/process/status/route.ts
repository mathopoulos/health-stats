import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// In-memory store for local development
const localProcessingStore = new Map<string, any>();

interface ProcessingStatus {
  status: 'processing' | 'completed' | 'error';
  file: string;
  userId: string;
  startedAt: string;
  completedAt?: string;
  results?: any;
  error?: string;
}

async function getProcessingStatus(key: string): Promise<ProcessingStatus | null> {
  if (process.env.VERCEL_ENV) {
    const status = await kv.get(key);
    return status as ProcessingStatus;
  } else {
    return localProcessingStore.get(key) || null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const processingId = request.nextUrl.searchParams.get('id');
    if (!processingId) {
      return NextResponse.json(
        { success: false, error: 'Processing ID is required' },
        { status: 400 }
      );
    }

    const status = await getProcessingStatus(`processing:${processingId}`);
    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Processing status not found' },
        { status: 404 }
      );
    }

    // Verify the user owns this processing task
    if (status.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      ...status,
      completed: status.status === 'completed',
      error: status.status === 'error' ? status.error : undefined
    });
  } catch (error) {
    console.error('Error checking processing status:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 