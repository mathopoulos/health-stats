import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const bodyFatPath = path.join(process.cwd(), 'public', 'data', 'bodyFat.json');
    
    let bodyFatData = [];

    try {
      await fs.access(bodyFatPath);
      bodyFatData = JSON.parse(await fs.readFile(bodyFatPath, 'utf-8'));
      if (!Array.isArray(bodyFatData)) {
        console.error('Invalid body fat data format');
        bodyFatData = [];
      }
    } catch {
      console.log('Body fat data file not found');
    }

    return NextResponse.json(bodyFatData);
  } catch (error) {
    console.error('Error reading body fat data:', error);
    return NextResponse.json([], { status: 200 }); // Return empty array instead of error
  }
} 