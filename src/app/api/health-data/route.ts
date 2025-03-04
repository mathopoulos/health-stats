import { NextRequest, NextResponse } from 'next/server';
import { fetchAllHealthData, type HealthDataType } from '@/lib/s3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const userId = searchParams.get('userId');
    const forceRefresh = searchParams.get('forceRefresh') === 'true';

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

    if (!userId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'User ID is required',
          data: [],
          count: 0
        },
        { status: 400 }
      );
    }

    let data: Array<{ date: string; value: number }> = [];
    try {
      data = await fetchAllHealthData(type as HealthDataType, userId);
    } catch (error) {
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
        lastUpdated: new Date().toISOString()
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      data,
      count: data.length,
      lastUpdated: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error fetching health data:', error);
    return NextResponse.json({
      success: false,
      data: [],
      count: 0,
      error: error instanceof Error ? error.message : 'Failed to fetch health data'
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}