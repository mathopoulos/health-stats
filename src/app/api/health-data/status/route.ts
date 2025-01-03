import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Keep track of processing status
let processingComplete = false;

export function setProcessingComplete(complete: boolean) {
  processingComplete = complete;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({ complete: processingComplete });
} 