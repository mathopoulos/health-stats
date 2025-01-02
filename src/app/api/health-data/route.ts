import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const heartRatePath = path.join(process.cwd(), 'public', 'data', 'heartRate.json');
    
    // Check if file exists
    try {
      await fs.access(heartRatePath);
    } catch {
      console.log('Heart rate data file not found. Please run npm run extract-health-data first.');
      return NextResponse.json({
        heartRate: []
      });
    }

    const heartRateData = JSON.parse(await fs.readFile(heartRatePath, 'utf-8'));

    if (!Array.isArray(heartRateData)) {
      console.error('Invalid heart rate data format');
      return NextResponse.json({
        heartRate: []
      });
    }

    return NextResponse.json({
      heartRate: heartRateData
    });
  } catch (error) {
    console.error('Error reading health data:', error);
    return NextResponse.json(
      { heartRate: [] },
      { status: 200 } // Return empty array instead of error
    );
  }
} 