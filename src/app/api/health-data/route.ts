import { NextRequest, NextResponse } from 'next/server';
import { fetchAllHealthData, type HealthDataType, generatePresignedUploadUrl } from '@/server/aws/s3';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/db/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const userId = searchParams.get('userId');
    const forceRefresh = searchParams.get('forceRefresh') === 'true';

    if (!type || !['heartRate', 'weight', 'bodyFat', 'hrv', 'vo2max', 'sleep', 'bloodMarkers', 'workout'].includes(type)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid type parameter. Must be one of: heartRate, weight, bodyFat, hrv, vo2max, sleep, bloodMarkers, workout',
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

    let data: Array<any> = [];
    let success = true;
    let errorMsg: string | null = null;

    if (type === 'bloodMarkers') {
      try {
        // Direct database query instead of internal HTTP call
        const client = await clientPromise;
        const db = client.db("health-stats");

        const query: any = { userId };
        
        // Support for additional query parameters from the original API
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const category = searchParams.get('category');

        if (startDate || endDate) {
          query.date = {};
          if (startDate) query.date.$gte = new Date(startDate);
          if (endDate) query.date.$lte = new Date(endDate);
        }

        if (category) {
          query['markers.category'] = category;
        }

        const results = await db
          .collection('blood-markers')
          .find(query)
          .sort({ date: -1 })
          .toArray();

        data = results;
      } catch (e) {
        console.error('Error fetching blood markers from database:', e);
        success = false;
        errorMsg = e instanceof Error ? e.message : 'Failed to fetch blood markers due to an unexpected error.';
        data = [];
      }
    } else {
      try {
        data = await fetchAllHealthData(type as HealthDataType, userId);
      } catch (e) {
        console.error(`Error fetching ${type} data from S3:`, e);
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
    }
    
    if (!success) {
      return NextResponse.json({
        success: false,
        data: [],
        count: 0,
        error: errorMsg || 'Failed to fetch data for the specified type.',
        lastUpdated: new Date().toISOString()
      }, { 
        status: 500,
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const data = await request.json();
    
    // Validate data structure
    if (!data.measurements || !Array.isArray(data.measurements)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    // Process measurements
    const measurements = data.measurements.filter((m: any) => 
      m.type === 'hrv' && typeof m.value === 'number' && m.timestamp
    );

    if (measurements.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No valid HRV measurements found' 
      }, { status: 400 });
    }

    // Format measurements for storage
    const formattedData = measurements.map((m: any) => ({
      date: new Date(m.timestamp).toISOString().split('T')[0],
      value: m.value
    }));

    // Store data using existing S3 functions
    try {
      // Get the existing data
      const existingData = await fetchAllHealthData('hrv' as HealthDataType, userId);
      
      // Merge with new data and remove duplicates
      const mergedData = [...existingData, ...formattedData];
      mergedData.sort((a, b) => a.date.localeCompare(b.date));
      
      // Remove duplicates based on date
      const uniqueData = mergedData.filter((item, index, self) =>
        index === self.findIndex((t) => t.date === item.date)
      );
      
      // Save to S3
      const url = await generatePresignedUploadUrl('data/hrv.json', 'application/json', userId);
      await fetch(url, {
        method: 'PUT',
        body: JSON.stringify(uniqueData),
        headers: { 'Content-Type': 'application/json' },
      });
      
      return NextResponse.json({ 
        success: true, 
        message: `Successfully processed ${measurements.length} HRV measurements`,
        recordsAdded: formattedData.length
      });
    } catch (error) {
      console.error('Error saving iOS app HRV data:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to save HRV data'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing iOS app health data:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to process health data' 
    }, { status: 500 });
  }
}