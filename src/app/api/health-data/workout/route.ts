import { NextResponse } from 'next/server';
import { z } from 'zod';
import { saveHealthData, type HealthDataType } from '@server/services/s3';

const IOS_USER_ID = '100492380040453908509';

// Define the schema for workout metrics
const WorkoutMetricsSchema = z.object({
  distance: z.number().optional(),
  duration: z.number(),
  energyBurned: z.number().optional(),
  avgHeartRate: z.number().optional(),
  maxHeartRate: z.number().optional(),
  avgCadence: z.number().optional(),
  avgPace: z.number().optional()
}).partial();

// Define the schema for workout data
const WorkoutDataSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  activityType: z.string(),
  metrics: WorkoutMetricsSchema.optional(),
  source: z.string().optional()
});

// Define the schema for the entire request body
const RequestSchema = z.object({
  data: WorkoutDataSchema
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
        error: 'Invalid workout data format',
        details: validationResult.error.errors
      }, { status: 400 });
    }

    // Prepare the data for saving
    const workoutData = {
      type: 'workout' as HealthDataType,
      userId: IOS_USER_ID,
      data: validationResult.data.data,
      timestamp: new Date().toISOString()
    };

    // Save the data
    await saveHealthData(workoutData);

    return NextResponse.json({ 
      success: true,
      message: 'Workout data saved successfully'
    });

  } catch (error) {
    console.error('Error saving workout data:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to save workout data'
    }, { status: 500 });
  }
} 