import { NextRequest, NextResponse } from 'next/server';
import { fetchAllHealthData } from '@/lib/s3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');

    if (!type || !['heartRate', 'weight', 'bodyFat', 'hrv'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type parameter. Must be one of: heartRate, weight, bodyFat, hrv' },
        { status: 400 }
      );
    }

    console.log(`Fetching ${type} data from S3...`);
    const data = await fetchAllHealthData(type as 'heartRate' | 'weight' | 'bodyFat' | 'hrv');
    console.log(`Fetched ${type} data:`, data);
    
    return NextResponse.json({
      success: true,
      data,
      count: data.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching health data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch health data' },
      { status: 500 }
    );
  }
} 