import { NextRequest, NextResponse } from 'next/server';
import { decode } from 'next-auth/jwt';
import { generatePresignedUploadUrl, fetchAllHealthData } from '@/lib/s3';

// Secret used for token verification - must match NextAuth
const secret = process.env.NEXTAUTH_SECRET || 'default-secret-change-me';

// Verify the iOS token from the Authorization header
async function verifyIosToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = await decode({ token, secret });
    
    if (!decoded || !decoded.isIosApp) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('Error verifying iOS token:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify token
    const decoded = await verifyIosToken(request);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // The user ID is stored in the 'sub' field of the token
    const userId = decoded.sub;
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid user identification' }, { status: 401 });
    }
    
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
    
    // Save data using the S3 functions
    try {
      // Get existing data
      const existingData = await fetchAllHealthData('hrv', userId);
      
      // Merge with new data and remove duplicates
      const mergedData = [...existingData, ...measurements];
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
        recordsAdded: measurements.length
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
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 