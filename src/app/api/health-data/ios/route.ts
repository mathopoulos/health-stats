import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// AWS S3 configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY || '',
    secretAccessKey: process.env.AWS_SECRET_KEY || ''
  }
});

// Hardcoded user ID for all iOS submissions
const HARDCODED_USER_ID = '100492380040453908509';

// Simple API key for basic security
const IOS_API_KEY = process.env.IOS_API_KEY || 'ios-test-key-change-me';

// Define type for HRV measurements
interface HrvMeasurement {
  timestamp: string;
  value: number;
  [key: string]: any; // Allow additional properties
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
    let existingData = [];
    try {
      // Get the existing data from S3
      const getObjectCommand = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: s3Key
      });
      
      const response = await s3Client.send(getObjectCommand);
      const responseBody = await response.Body?.transformToString();
      
      if (responseBody) {
        existingData = JSON.parse(responseBody);
        console.log(`iOS health data: Found ${existingData.length} existing HRV records`);
      }
    } catch (error) {
      // File might not exist yet, which is fine
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
    const putObjectCommand = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3Key,
      Body: JSON.stringify(combinedData),
      ContentType: 'application/json'
    });

    await s3Client.send(putObjectCommand);

    return NextResponse.json({
      success: true,
      message: 'HRV data processed successfully',
      stats: {
        recordsAdded: newMeasurements.length,
        totalRecords: combinedData.length
      }
    });
  } catch (error) {
    console.error('Error processing iOS health data:', error);
    return NextResponse.json({ error: 'Server error processing data' }, { status: 500 });
  }
} 