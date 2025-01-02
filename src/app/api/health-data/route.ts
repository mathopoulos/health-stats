import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const heartRatePath = path.join(process.cwd(), 'public', 'data', 'heartRate.json');
    const weightPath = path.join(process.cwd(), 'public', 'data', 'weight.json');
    
    let heartRateData = [];
    let weightData = [];

    // Load heart rate data
    try {
      await fs.access(heartRatePath);
      heartRateData = JSON.parse(await fs.readFile(heartRatePath, 'utf-8'));
      if (!Array.isArray(heartRateData)) {
        console.error('Invalid heart rate data format');
        heartRateData = [];
      }
    } catch {
      console.log('Heart rate data file not found');
    }

    // Load weight data
    try {
      await fs.access(weightPath);
      weightData = JSON.parse(await fs.readFile(weightPath, 'utf-8'));
      if (!Array.isArray(weightData)) {
        console.error('Invalid weight data format');
        weightData = [];
      }
    } catch {
      console.log('Weight data file not found');
    }

    return NextResponse.json({
      heartRate: heartRateData,
      weight: weightData
    });
  } catch (error) {
    console.error('Error reading health data:', error);
    return NextResponse.json(
      { heartRate: [], weight: [] },
      { status: 200 } // Return empty arrays instead of error
    );
  }
} 