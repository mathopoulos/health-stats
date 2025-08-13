import { NextResponse } from 'next/server';
import { z } from 'zod';
import { saveHealthData, type HealthDataType } from '@server/services/s3';

const IOS_USER_ID = '100492380040453908509';

// Define the schema for sleep stage durations
const StageDurationsSchema = z.object({
  deep: z.number().min(0),
  core: z.number().min(0),
  rem: z.number().min(0),
  awake: z.number().min(0)
});

// Define the schema for sleep data
const SleepDataSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  stageDurations: StageDurationsSchema
});

// Define the schema for the entire request body
const RequestSchema = z.object({
  data: SleepDataSchema
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validationResult = RequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid sleep data format',
        details: validationResult.error.errors
      }, { status: 400 });
    }

    // Prepare the data for saving
    const sleepData = {
      type: 'sleep' as HealthDataType,
      userId: IOS_USER_ID,
      data: validationResult.data.data,
      timestamp: new Date().toISOString()
    };

    // Save the data
    await saveHealthData(sleepData);

    return NextResponse.json({ 
      success: true,
      message: 'Sleep data saved successfully'
    });

  } catch (error) {
    console.error('Error saving sleep data:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to save sleep data'
    }, { status: 500 });
  }
} 