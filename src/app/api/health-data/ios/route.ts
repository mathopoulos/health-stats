import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Define type for HRV measurements
interface HrvMeasurement {
  timestamp: string;
  value: number;
  [key: string]: any; // Allow additional properties
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
    if (!requestData || !requestData.measurements || !Array.isArray(requestData.measurements)) {
      console.log('iOS health data: Invalid data format');
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    // Extract and validate HRV measurements
    const measurements = requestData.measurements;
    const validHrvMeasurements = measurements.filter((m: any) => {
      // Basic validation for HRV measurements
      return m && 
             typeof m.timestamp === 'string' && 
             typeof m.value === 'number' && 
             !isNaN(m.value);
    });

    console.log(`iOS health data: Received ${validHrvMeasurements.length} valid HRV measurements`);

    // Define the S3 key for this user's data
    const s3Key = `data/${userId}/hrv.json`;

    // Check if the user already has data in S3
    let existingData: HrvMeasurement[] = [];
    try {
      // Get the existing data from S3
      const getObjectCommand = new GetObjectCommand({
        Bucket: requiredEnvVars.AWS_BUCKET_NAME,
        Key: s3Key
      });
      
      const response = await s3Client.send(getObjectCommand);
      const responseBody = await response.Body?.transformToString();
      
      if (responseBody) {
        existingData = JSON.parse(responseBody);
        console.log(`iOS health data: Found ${existingData.length} existing HRV records`);
      }
    } catch (error) {
      // Only log the error and continue - first upload will create the file
      console.log('iOS health data: No existing data found or error reading data:', error);
    }

    // Combine existing and new data, avoiding duplicates
    // Use timestamp as the unique identifier
    const existingTimestamps = new Set(existingData.map((item: HrvMeasurement) => item.timestamp));
    const newMeasurements = validHrvMeasurements.filter((item: HrvMeasurement) => !existingTimestamps.has(item.timestamp));
    
    const combinedData = [...existingData, ...newMeasurements];
    console.log(`iOS health data: Adding ${newMeasurements.length} new records, total: ${combinedData.length}`);

    // Sort by timestamp
    combinedData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Save the combined data back to S3
    try {
      const putObjectCommand = new PutObjectCommand({
        Bucket: requiredEnvVars.AWS_BUCKET_NAME,
        Key: s3Key,
        Body: JSON.stringify(combinedData),
        ContentType: 'application/json'
      });

      await s3Client.send(putObjectCommand);
      
      console.log(`iOS health data: Successfully saved ${combinedData.length} records to S3`);
      
      return NextResponse.json({
        success: true,
        message: 'HRV data processed successfully',
        stats: {
          recordsAdded: newMeasurements.length,
          totalRecords: combinedData.length
        }
      });
    } catch (saveError) {
      console.error('Error saving data to S3:', saveError);
      return NextResponse.json({ 
        error: 'Failed to save data to S3',
        errorDetail: (saveError as Error).message 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing iOS health data:', error);
    return NextResponse.json({ 
      error: 'Server error processing data',
      errorDetail: (error as Error).message 
    }, { status: 500 });
  }
} 