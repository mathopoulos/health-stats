import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { generatePresignedUploadUrl, fetchAllHealthData } from '@/lib/s3';

// Secret used for token verification
const secret = process.env.NEXTAUTH_SECRET || 'default-secret-change-me';

export async function POST(request: NextRequest) {
  try {
    // Verify token using NextAuth
    const token = await getToken({ req: request as any, secret });
    
    if (!token || !token.sub) {
      console.log("iOS health data - Unauthorized access attempt");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // The user ID is stored in the 'sub' field of the token
    const userId = token.sub;
    
    console.log(`iOS health data - Processing for user ID: ${userId}`);
    
    // Parse the request body
    const data = await request.json();
    
    // Validate data structure
    if (!data.measurements || !Array.isArray(data.measurements)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }
    
    // Filter and format HRV measurements
    const measurements = data.measurements
      .filter((m: any) => m.type === 'hrv' && typeof m.value === 'number' && m.timestamp)
      .map((m: any) => ({
        date: new Date(m.timestamp).toISOString().split('T')[0],
        value: m.value
      }));
    
    if (measurements.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No valid HRV measurements found' 
      }, { status: 400 });
    }
    
    console.log(`iOS health data - Found ${measurements.length} valid HRV measurements`);
    
    // Save data
    try {
      // Get existing data
      const existingData = await fetchAllHealthData('hrv', userId);
      console.log(`iOS health data - Found ${existingData.length} existing measurements`);
      
      // Merge with new data and remove duplicates
      const mergedData = [...existingData, ...measurements];
      mergedData.sort((a, b) => a.date.localeCompare(b.date));
      
      // Remove duplicates based on date
      const uniqueData = mergedData.filter((item, index, self) =>
        index === self.findIndex((t) => t.date === item.date)
      );
      
      console.log(`iOS health data - Saving ${uniqueData.length} measurements (${uniqueData.length - existingData.length} new)`);
      
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
        recordsAdded: measurements.length,
        totalRecords: uniqueData.length
      });
    } catch (error) {
      console.error('iOS health data - Error saving HRV data:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to save HRV data'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('iOS health data - Error processing health data:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 