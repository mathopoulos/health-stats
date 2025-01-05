import { NextRequest, NextResponse } from 'next/server';
import { fetchAllHealthData, type HealthDataType } from '@/lib/s3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');

    if (!type || !['heartRate', 'weight', 'bodyFat', 'hrv', 'vo2max'].includes(type)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid type parameter. Must be one of: heartRate, weight, bodyFat, hrv, vo2max',
          data: [],
          count: 0
        },
        { status: 400 }
      );
    }

    let data: Array<{ date: string; value: number }> = [];
    try {
      console.log(`Fetching ${type} data from S3...`);
      data = await fetchAllHealthData(type as HealthDataType);
      console.log(`Fetched ${type} data:`, data);
    } catch (error) {
      console.error(`Error fetching ${type} data from S3:`, error);
      // Don't throw error for missing files, just return empty data
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
        lastUpdated: new Date().toISOString()
      });
    }
    
    return NextResponse.json({
      success: true,
      data,
      count: data.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching health data:', error);
    return NextResponse.json({
      success: false,
      data: [],
      count: 0,
      error: error instanceof Error ? error.message : 'Failed to fetch health data'
    }, { status: 500 });
  }
} 