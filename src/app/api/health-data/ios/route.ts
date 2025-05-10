import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Define measurement types and their units
const MEASUREMENT_TYPES = {
  hrv: { unit: 'ms', source: 'iOS App', fileKey: 'hrv' },
  vo2max: { unit: 'mL/kg/min', source: 'iOS App', fileKey: 'vo2max' },
  weight: { unit: 'lb', source: 'iOS App', fileKey: 'weight' },
  bodyfat: { unit: '%', source: 'iOS App', fileKey: 'bodyfat' }
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

// Hardcoded user ID for all iOS submissions
const HARDCODED_USER_ID = '100492380040453908509';

// Simple API key for basic security
const IOS_API_KEY = process.env.IOS_API_KEY || 'ios-test-key-change-me';

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
    default:
      return false;
  }
}

// Process health data from iOS
export async function POST(request: NextRequest) {
  try {
    // Simple API key verification instead of token-based auth
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey || apiKey !== IOS_API_KEY) {
      console.log('iOS health data: Invalid or missing API key');
      return NextResponse.json({ error: 'Unauthorized: Invalid API key' }, { status: 401 });
    }

    // Validate AWS configuration
    if (!validateAwsConfig()) {
      return NextResponse.json({ 
        error: 'Server configuration error: AWS credentials not properly configured',
        errorCode: 'AWS_CONFIG_ERROR' 
      }, { status: 500 });
    }

    // Use the hardcoded user ID for all iOS submissions
    const userId = HARDCODED_USER_ID;
    console.log(`iOS health data: Using hardcoded user ID: ${userId}`);

    // Parse the request body
    const requestData = await request.json();
    
    // Validate basic structure
    if (!requestData?.measurements || typeof requestData.measurements !== 'object') {
      console.log('iOS health data: Invalid data format');
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    const results: Record<MeasurementType, { added: number; total: number }> = {
      hrv: { added: 0, total: 0 },
      vo2max: { added: 0, total: 0 },
      weight: { added: 0, total: 0 },
      bodyfat: { added: 0, total: 0 }
    };

    // Process each measurement type
    for (const [type, config] of Object.entries(MEASUREMENT_TYPES)) {
      const measurementType = type as MeasurementType;
      const measurements = requestData.measurements[type] || [];

      if (!Array.isArray(measurements)) {
        console.log(`iOS health data: Invalid ${type} data format`);
        continue;
      }

      // Validate and filter measurements
      const validMeasurements = measurements.filter((m: any) => {
        return m && 
               typeof m.timestamp === 'string' && 
               typeof m.value === 'number' && 
               !isNaN(m.value) &&
               isValidMeasurement(measurementType, m.value);
      });

      console.log(`iOS health data: Received ${validMeasurements.length} valid ${type} measurements`);

      // Define the S3 key for this measurement type
      const s3Key = `data/${HARDCODED_USER_ID}/${config.fileKey}.json`;

      // Get existing data
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
          console.log(`iOS health data: Found ${existingData.length} existing ${type} records`);
        }
      } catch (error) {
        console.log(`iOS health data: No existing ${type} data found or error reading data:`, error);
      }

      // Convert to standard format
      const normalizedMeasurements: HealthMeasurement[] = validMeasurements.map((item: RawMeasurement) => ({
        date: item.timestamp?.endsWith('Z') ? item.timestamp : `${item.timestamp || ''}Z`,
        value: measurementType === 'weight'
                 ? convertKgToLbs(item.value)
                 : (measurementType === 'bodyfat'
                    ? Math.round(item.value * 100 * 100) / 100 // Multiply by 100 and round to 2 decimal places
                    : item.value),
        source: config.source,
        unit: config.unit,
        metadata: {
          HKAlgorithmVersion: 2
        }
      }));

      // Normalize existing data
      const normalizedExistingData = existingData.map(item => ({
        ...item,
        date: item.date || (item.timestamp?.endsWith('Z') ? item.timestamp : `${item.timestamp}Z`),
        source: item.source || config.source,
        unit: item.unit || config.unit,
        metadata: item.metadata || { HKAlgorithmVersion: 2 }
      }));

      // Remove duplicates
      const existingDates = new Set(normalizedExistingData
        .filter(item => typeof item.date === 'string' && item.date)
        .map(item => item.date.replace(/\.\d{3}Z$/, 'Z'))
      );

      const newMeasurements = normalizedMeasurements
        .filter(item => typeof item.date === 'string' && item.date)
        .filter(item => !existingDates.has(item.date.replace(/\.\d{3}Z$/, 'Z')));

      const combinedData = [...normalizedExistingData, ...newMeasurements];

      // Sort by date
      combinedData.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateA - dateB;
      });

      // Save to S3
      try {
        const putObjectCommand = new PutObjectCommand({
          Bucket: requiredEnvVars.AWS_BUCKET_NAME,
          Key: s3Key,
          Body: JSON.stringify(combinedData),
          ContentType: 'application/json'
        });

        await s3Client.send(putObjectCommand);
        
        results[measurementType] = {
          added: newMeasurements.length,
          total: combinedData.length
        };

        console.log(`iOS health data: Successfully saved ${combinedData.length} ${type} records to S3`);
      } catch (saveError) {
        console.error(`Error saving ${type} data to S3:`, saveError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Health data processed successfully',
      stats: results
    });

  } catch (error) {
    console.error('Error processing iOS health data:', error);
    return NextResponse.json({ 
      error: 'Server error processing data',
      errorDetail: (error as Error).message 
    }, { status: 500 });
  }
} 