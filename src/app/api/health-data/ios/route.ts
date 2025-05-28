import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { decode } from 'next-auth/jwt'; // Import decode for JWT validation

// Define measurement types and their units
const MEASUREMENT_TYPES = {
  hrv: { unit: 'ms', source: 'iOS App', fileKey: 'hrv' },
  vo2max: { unit: 'mL/kg/min', source: 'iOS App', fileKey: 'vo2max' },
  weight: { unit: 'lb', source: 'iOS App', fileKey: 'weight' },
  bodyfat: { unit: '%', source: 'iOS App', fileKey: 'bodyfat' },
  workout: { unit: '', source: 'iOS App', fileKey: 'workout' },
  sleep: { unit: 'minutes', source: 'iOS App', fileKey: 'sleep' }
} as const;

type MeasurementType = keyof typeof MEASUREMENT_TYPES;

// Define type for manual measurement format
interface HealthMeasurement {
  date: string;
  value: number;
  source?: string;
  unit?: string;
  metadata?: {
    HKAlgorithmVersion?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

// Define type for iOS measurement format
interface RawMeasurement {
  timestamp: string;
  value: number;
  [key: string]: any;
}

// Check if required environment variables are available
const requiredEnvVars = {
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME
};

// Create S3 client with proper variable names (AWS SDK expects specific names)
const s3Client = new S3Client({
  region: requiredEnvVars.AWS_REGION,
  credentials: {
    accessKeyId: requiredEnvVars.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: requiredEnvVars.AWS_SECRET_ACCESS_KEY || ''
  }
});

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

// Check if AWS credentials are properly configured
function validateAwsConfig() {
  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    return false;
  }
  return true;
}

// Convert kg to lbs
function convertKgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 100) / 100; // Convert to lbs and round to 2 decimal places
}

// Validate measurement value based on type
function isValidMeasurement(type: MeasurementType, value: number): boolean {
  switch (type) {
    case 'bodyfat':
      return value >= 0 && value <= 100;
    case 'weight':
      return value > 0 && value < 1100; // Reasonable weight range in lbs (500kg * 2.20462)
    case 'vo2max':
      return value > 0 && value < 100; // Reasonable VO2 max range
    case 'hrv':
      return value > 0 && value < 300; // Reasonable HRV range
    case 'workout':
      return true; // For workout, validation is handled differently as it's an object
    case 'sleep':
      return true; // For sleep, validation is handled differently as it's an object with stage durations
    default:
      return false;
  }
}

// Helper function to extract Bearer token
function extractBearerToken(header: string | null): string | null {
  if (!header) return null;
  const parts = header.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }
  return null;
}

// Process health data from iOS
export async function POST(request: NextRequest) {
  if (!NEXTAUTH_SECRET) {
    console.error('Server configuration error: NEXTAUTH_SECRET is not set.');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    // --- JWT Authentication ---
    const authorizationHeader = request.headers.get('Authorization');
    const tokenString = extractBearerToken(authorizationHeader);

    if (!tokenString) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid Authorization header' }, { status: 401 });
    }

    const token = await decode({
      token: tokenString,
      secret: NEXTAUTH_SECRET,
    });

    if (!token || !token.sub) { // Check for valid token and subject (user ID)
      console.error('iOS health data: Invalid or expired token', { token });
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired token' }, { status: 401 });
    }

    // Get user ID from validated token
    const userId = token.sub; 
    console.log(`iOS health data: Processing request for user ID: ${userId}`);
    // --- End JWT Authentication ---

    // Validate AWS configuration
    if (!validateAwsConfig()) {
      return NextResponse.json({ 
        error: 'Server configuration error: AWS credentials not properly configured',
        errorCode: 'AWS_CONFIG_ERROR' 
      }, { status: 500 });
    }

    // Parse the request body
    const requestData = await request.json();
    
    // Validate basic structure
    if (!requestData?.measurements || typeof requestData.measurements !== 'object') {
      console.log('iOS health data: Invalid data format for user:', userId);
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    const results: Record<string, { added: number; total: number }> = {};

    // Process each measurement type (Restored loop structure)
    for (const [type, config] of Object.entries(MEASUREMENT_TYPES)) {
      const measurementType = type as MeasurementType;
      const measurements = requestData.measurements[type] || [];

      if (!Array.isArray(measurements)) {
        console.log(`iOS health data: Invalid ${type} data format for user ${userId}`);
        continue;
      }

      // Special handling for workout data which has a different structure (Restored logic)
      if (type === 'workout') {
        console.log(`iOS health data: Processing ${measurements.length} workout entries for user ${userId}`);
        
        // Define the S3 key for workouts using dynamic userId
        const s3Key = `data/${userId}/${config.fileKey}.json`;
        
        // Get existing workout data
        let existingWorkouts: any[] = [];
        try {
          const getObjectCommand = new GetObjectCommand({
            Bucket: requiredEnvVars.AWS_BUCKET_NAME,
            Key: s3Key
          });
          const response = await s3Client.send(getObjectCommand);
          const responseBody = await response.Body?.transformToString();
          if (responseBody) {
            existingWorkouts = JSON.parse(responseBody);
            console.log(`iOS health data: Found ${existingWorkouts.length} existing workout records for user ${userId}`);
          }
        } catch (error: any) {
           if (error.name !== 'NoSuchKey') {
             console.error(`iOS health data: Error reading existing workout S3 data for user ${userId}:`, error);
           }
           console.log(`iOS health data: No existing workout data found for user ${userId}`);
        }
        
        // Filter valid workout entries (Restored logic)
        const validWorkouts = measurements.filter((workout: any) => 
          workout && 
          typeof workout.timestamp === 'string' &&
          typeof workout.startDate === 'string' &&
          typeof workout.endDate === 'string' &&
          typeof workout.activityType === 'string' &&
          typeof workout.duration === 'number'
        );
        
        console.log(`iOS health data: Found ${validWorkouts.length} valid workout entries for user ${userId}`);
        
        // Format workout data for storage using dynamic userId (Restored logic)
        const workoutEntries = validWorkouts.map((workout: any) => ({
          type: 'workout',
          userId: userId, // Use dynamic userId
          data: {
            startDate: workout.startDate,
            endDate: workout.endDate,
            activityType: workout.activityType,
            metrics: {
              duration: workout.duration,
              ...(workout.distance !== undefined && { distance: workout.distance }),
              ...(workout.energyBurned !== undefined && { energyBurned: workout.energyBurned }),
              ...(workout.avgHeartRate !== undefined && { avgHeartRate: workout.avgHeartRate }),
              ...(workout.maxHeartRate !== undefined && { maxHeartRate: workout.maxHeartRate }),
              ...(workout.avgCadence !== undefined && { avgCadence: workout.avgCadence }),
              ...(workout.avgPace !== undefined && { avgPace: workout.avgPace })
            },
            source: workout.source || 'iOS App'
          },
          timestamp: workout.timestamp
        }));
        
        // Check for duplicates based on startDate (Restored logic)
        const startDateMap = new Map(existingWorkouts.map(entry => 
          [entry.data?.startDate, true]
        ));
        const newWorkoutEntries = workoutEntries.filter(entry => 
          !startDateMap.has(entry.data.startDate)
        );
        
        console.log(`iOS health data: ${newWorkoutEntries.length} new workout entries to add for user ${userId}`);
        
        // Combine with existing data (Restored logic)
        const combinedWorkouts = [...existingWorkouts, ...newWorkoutEntries];
        combinedWorkouts.sort((a, b) => 
          new Date(b.data.startDate).getTime() - new Date(a.data.startDate).getTime()
        );
        
        // Save to S3 (Restored logic)
        try {
          const putObjectCommand = new PutObjectCommand({
            Bucket: requiredEnvVars.AWS_BUCKET_NAME,
            Key: s3Key,
            Body: JSON.stringify(combinedWorkouts),
            ContentType: 'application/json'
          });
          await s3Client.send(putObjectCommand);
          results.workout = {
            added: newWorkoutEntries.length,
            total: combinedWorkouts.length
          };
          console.log(`iOS health data: Successfully saved ${combinedWorkouts.length} workout records to S3 for user ${userId}, added ${newWorkoutEntries.length} new entries`);
        } catch (saveError) {
          console.error(`Error saving workout data to S3 for user ${userId}:`, saveError);
        }
        
        continue; // Skip standard processing for workouts
      }

      // Special handling for sleep data which has a different structure
      if (type === 'sleep') {
        console.log(`iOS health data: Processing ${measurements.length} sleep entries for user ${userId}`);
        
        // Define the S3 key for sleep using dynamic userId
        const s3Key = `data/${userId}/${config.fileKey}.json`;
        
        // Get existing sleep data
        let existingSleep: any[] = [];
        try {
          const getObjectCommand = new GetObjectCommand({
            Bucket: requiredEnvVars.AWS_BUCKET_NAME,
            Key: s3Key
          });
          const response = await s3Client.send(getObjectCommand);
          const responseBody = await response.Body?.transformToString();
          if (responseBody) {
            existingSleep = JSON.parse(responseBody);
            console.log(`iOS health data: Found ${existingSleep.length} existing sleep records for user ${userId}`);
          }
        } catch (error: any) {
           if (error.name !== 'NoSuchKey') {
             console.error(`iOS health data: Error reading existing sleep S3 data for user ${userId}:`, error);
           }
           console.log(`iOS health data: No existing sleep data found for user ${userId}`);
        }
        
        // Filter valid sleep entries
        const validSleep = measurements.filter((sleep: any) => 
          sleep && 
          typeof sleep.timestamp === 'string' &&
          typeof sleep.startDate === 'string' &&
          typeof sleep.endDate === 'string' &&
          typeof sleep.stageDurations === 'object' &&
          sleep.stageDurations !== null
        );
        
        console.log(`iOS health data: Found ${validSleep.length} valid sleep entries for user ${userId}`);
        
        // Format sleep data for storage using dynamic userId
        const sleepEntries = validSleep.map((sleep: any) => ({
          type: 'sleep',
          userId: userId,
          data: {
            startDate: sleep.startDate,
            endDate: sleep.endDate,
            stageDurations: {
              deep: sleep.stageDurations.deep || 0,
              core: sleep.stageDurations.core || 0,
              rem: sleep.stageDurations.rem || 0,
              awake: sleep.stageDurations.awake || 0
            },
            source: sleep.source || 'iOS App'
          },
          timestamp: sleep.timestamp
        }));
        
        // Check for duplicates based on startDate
        const startDateMap = new Map(existingSleep.map(entry => 
          [entry.data?.startDate, true]
        ));
        const newSleepEntries = sleepEntries.filter(entry => 
          !startDateMap.has(entry.data.startDate)
        );
        
        console.log(`iOS health data: ${newSleepEntries.length} new sleep entries to add for user ${userId}`);
        
        // Combine with existing data
        const combinedSleep = [...existingSleep, ...newSleepEntries];
        combinedSleep.sort((a, b) => 
          new Date(b.data.startDate).getTime() - new Date(a.data.startDate).getTime()
        );
        
        // Save to S3
        try {
          const putObjectCommand = new PutObjectCommand({
            Bucket: requiredEnvVars.AWS_BUCKET_NAME,
            Key: s3Key,
            Body: JSON.stringify(combinedSleep),
            ContentType: 'application/json'
          });
          await s3Client.send(putObjectCommand);
          results.sleep = {
            added: newSleepEntries.length,
            total: combinedSleep.length
          };
          console.log(`iOS health data: Successfully saved ${combinedSleep.length} sleep records to S3 for user ${userId}, added ${newSleepEntries.length} new entries`);
        } catch (saveError) {
          console.error(`Error saving sleep data to S3 for user ${userId}:`, saveError);
        }
        
        continue; // Skip standard processing for sleep
      }

      // Standard processing for other measurement types (Restored logic)
      const validMeasurements = measurements.filter((m: any) => {
        return m && 
               typeof m.timestamp === 'string' && 
               typeof m.value === 'number' && 
               !isNaN(m.value) &&
               isValidMeasurement(measurementType, m.value);
      });

      if (validMeasurements.length === 0) {
        console.log(`iOS health data: No valid ${type} measurements received for user ${userId}`);
        continue;
      }
      console.log(`iOS health data: Received ${validMeasurements.length} valid ${type} measurements for user ${userId}`);

      // Define the S3 key using dynamic userId
      const s3Key = `data/${userId}/${config.fileKey}.json`;

      // Get existing data (Restored logic)
      let existingData: HealthMeasurement[] = [];
      try {
        const getObjectCommand = new GetObjectCommand({
          Bucket: requiredEnvVars.AWS_BUCKET_NAME,
          Key: s3Key
        });
        const response = await s3Client.send(getObjectCommand);
        const responseBody = await response.Body?.transformToString();
        if (responseBody) {
          existingData = JSON.parse(responseBody);
          console.log(`iOS health data: Found ${existingData.length} existing ${type} records for user ${userId}`);
        }
      } catch (error: any) {
         if (error.name !== 'NoSuchKey') {
           console.error(`iOS health data: Error reading existing S3 data for user ${userId}, type ${type}:`, error);
         }
         console.log(`iOS health data: No existing ${type} data found for user ${userId}`);
      }

      // Convert to standard format (Restored logic)
      const normalizedMeasurements: HealthMeasurement[] = validMeasurements.map((item: RawMeasurement) => ({
        date: item.timestamp?.endsWith('Z') ? item.timestamp : `${item.timestamp || ''}Z`,
        value: measurementType === 'weight'
                 ? convertKgToLbs(item.value)
                 : (measurementType === 'bodyfat'
                    ? Math.round(item.value * 100 * 100) / 100
                    : item.value),
        source: config.source,
        unit: config.unit,
        metadata: {
          HKAlgorithmVersion: 2 // Assuming default metadata
        }
      }));
      const normalizedExistingData = existingData.map(item => ({
        ...item,
        date: item.date || (item.timestamp?.endsWith('Z') ? item.timestamp : `${item.timestamp}Z`),
        source: item.source || config.source,
        unit: item.unit || config.unit,
        metadata: item.metadata || { HKAlgorithmVersion: 2 }
      }));

      // Remove duplicates (Restored logic)
      const existingDates = new Set(
        normalizedExistingData
          .filter(item => typeof item.date === 'string' && item.date)
          .map(item => item.date.replace(/\.\d{3}Z$/, 'Z'))
      );
      const newMeasurements = normalizedMeasurements
        .filter(item => typeof item.date === 'string' && item.date)
        .filter(item => !existingDates.has(item.date.replace(/\.\d{3}Z$/, 'Z')));

      if (newMeasurements.length === 0) {
        console.log(`iOS health data: No new unique ${type} measurements to add for user ${userId}`);
        results[measurementType] = {
          added: 0,
          total: existingData.length,
        };
        continue;
      }
      
      const combinedData = [...normalizedExistingData, ...newMeasurements];
      combinedData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort descending

      // Save to S3 (Restored logic)
      try {
        const putObjectCommand = new PutObjectCommand({
          Bucket: requiredEnvVars.AWS_BUCKET_NAME,
          Key: s3Key,
          Body: JSON.stringify(combinedData, null, 2), // Pretty print JSON
          ContentType: 'application/json'
        });
        await s3Client.send(putObjectCommand);
        results[measurementType] = {
          added: newMeasurements.length,
          total: combinedData.length
        };
        console.log(`iOS health data: Successfully uploaded ${newMeasurements.length} new ${type} records for user ${userId}. Total: ${combinedData.length}`);
      } catch (saveError) {
        console.error(`Error saving ${type} data to S3 for user ${userId}:`, saveError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Health data processed successfully',
      stats: results
    });

  } catch (error) {
    console.error('iOS health data: General error in POST handler:', error);
    return NextResponse.json({ 
      error: 'Server error processing data',
      errorDetail: (error instanceof Error) ? error.message : String(error) 
    }, { status: 500 });
  }
}

// Existing GET function remains unchanged
export async function GET(request: NextRequest) {
  // ... existing GET logic ...
} 