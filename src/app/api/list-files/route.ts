import { NextResponse } from 'next/server';
import { listAllFiles } from '@/lib/s3';

export async function GET() {
  try {
    const files = await listAllFiles();
    return NextResponse.json({ success: true, files });
  } catch (error) {
    console.error('Error listing files:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 