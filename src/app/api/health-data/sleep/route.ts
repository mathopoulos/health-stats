import { NextResponse } from 'next/server';
import { saveHealthData } from '@/lib/s3';
import { z } from 'zod';

const sleepDataSchema = z.object({
  userId: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  sleepStages: z.array(z.object({
    stage: z.enum(['deep', 'light', 'rem', 'awake']),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  })),
  totalSleepTime: z.number(),
  sleepEfficiency: z.number(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = sleepDataSchema.parse(body);

    const sleepData = {
      type: 'sleep' as const,
      userId: validatedData.userId,
      data: validatedData,
      timestamp: new Date().toISOString(),
    };

    await saveHealthData(sleepData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving sleep data:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid sleep data format' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to save sleep data' }, { status: 500 });
  }
} 