import { NextRequest, NextResponse } from 'next/server';
import { getProcessingJob } from '@/lib/processingJobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('id');
    
    if (!jobId) {
      return NextResponse.json({ error: 'No job ID provided' }, { status: 400 });
    }

    const job = await getProcessingJob(jobId);
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check if job is completed or errored
    if (job.status === 'completed') {
      return NextResponse.json({
        completed: true,
        message: 'Processing completed successfully',
        results: job.result || []
      });
    }

    if (job.status === 'failed') {
      return NextResponse.json({
        completed: false,
        error: job.error || 'An unknown error occurred'
      });
    }

    // Job is still processing
    let progress = '';
    if (job.progress) {
      const { current, total, message } = job.progress;
      progress = `${message || 'Processing'} (${current}/${total})`;
    }

    return NextResponse.json({
      completed: false,
      progress,
      status: job.status
    });
  } catch (error) {
    console.error('Error checking job status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check job status' },
      { status: 500 }
    );
  }
} 