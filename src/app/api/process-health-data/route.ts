import { NextResponse } from 'next/server';
import { processHealthData } from '@/lib/processHealthData';

const OWNER_ID = 'usr_W2LWz83EurLxZwfjqT_EL';

export async function POST(request: Request) {
  try {
    const { xmlKey } = await request.json();
    if (!xmlKey) {
      return NextResponse.json(
        { success: false, error: 'No XML key provided' },
        { status: 400 }
      );
    }

    const status = await processHealthData(xmlKey, OWNER_ID);
    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('Error processing health data:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 