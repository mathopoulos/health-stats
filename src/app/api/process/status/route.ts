import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getProcessingJob } from '@/lib/processingJobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    const job = await getProcessingJob(processingId);
    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Processing status not found' },
        { status: 404 }
      );
    }

    // Verify the user owns this processing task
    if (job.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Convert the MongoDB job status to the format expected by the frontend
    return NextResponse.json({
      success: true,
      status: job.status,
      completed: job.status === 'completed',
      error: job.status === 'failed' ? job.error : undefined,
      progress: job.progress,
      results: job.result,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      message: job.progress?.message || getStatusMessage(job.status)
    });
  } catch (error) {
    console.error('Error checking processing status:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function getStatusMessage(status: string): string {
  switch (status) {
    case 'pending':
      return 'Processing queued...';
    case 'processing':
      return 'Processing in progress...';
    case 'completed':
      return 'Processing completed successfully';
    case 'failed':
      return 'Processing failed';
    default:
      return 'Unknown status';
  }
} 