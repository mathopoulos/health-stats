import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const weightPath = path.join(process.cwd(), 'public', 'data', 'weight.json');
    
    let weightData = [];

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

    return NextResponse.json(weightData);
  } catch (error) {
    console.error('Error reading weight data:', error);
    return NextResponse.json([], { status: 200 }); // Return empty array instead of error
  }
} 