import { NextRequest, NextResponse } from 'next/server';
import { getProcessingStatus } from './processingStatus';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({ complete: getProcessingStatus() });
} 