import { NextRequest, NextResponse } from 'next/server';
import { processHealthData } from '@/lib/processHealthData';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { blobUrl } = await request.json();
    if (!blobUrl) {
      return NextResponse.json({ error: 'No blob URL provided' }, { status: 400 });
    }

    console.log('Processing health data from blob:', blobUrl);
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const status = await processHealthData(blobUrl, session.user.id, jobId);

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('Error processing health data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process health data' },
      { status: 500 }
    );
  }
} 