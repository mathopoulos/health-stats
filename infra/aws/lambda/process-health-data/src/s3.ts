import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { HealthDataType, HealthRecord } from './types';
import { env } from './env';
import { networkInterfaces } from 'os';

// Log AWS environment variables
console.log('AWS Environment:');
console.log(`- AWS_REGION: ${env.AWS_REGION}`);
console.log(`- AWS_BUCKET_NAME: ${env.AWS_BUCKET_NAME}`);
console.log(`- Lambda memory: ${process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE}MB`);
console.log(`- Lambda timeout: ${process.env.AWS_LAMBDA_FUNCTION_TIMEOUT}s`);
console.log(`- Lambda function name: ${process.env.AWS_LAMBDA_FUNCTION_NAME}`);
console.log(`- Lambda execution environment: ${process.env.AWS_EXECUTION_ENV}`);

// Log network interfaces
try {
  console.log('Network interfaces:');
  const interfaces = networkInterfaces();
  Object.keys(interfaces).forEach(name => {
    console.log(`Interface: ${name}`);
    interfaces[name]?.forEach(iface => {
      console.log(`  Address: ${iface.address}, Family: ${iface.family}, Internal: ${iface.internal}`);
    });
  });
} catch (err) {
  console.log('Error getting network interfaces:', err);
}

// Create S3 client with standard configuration
const s3Client = new S3Client({
  region: env.AWS_REGION,
  maxAttempts: 3,  // Retry up to 3 times
});

console.log('S3 client created with configuration:', {
  region: env.AWS_REGION,
  maxAttempts: 3
});

export async function processS3XmlFile(key: string, processor: (chunk: string) => Promise<boolean | void>): Promise<void> {
  console.log('Starting to process S3 XML file:', key);
  
  // First, get the file size
  try {
    console.log('Getting file metadata first...');
    const headCommand = new HeadObjectCommand({
      Bucket: env.AWS_BUCKET_NAME,
      Key: key,
    });
    
    const headResponse = await s3Client.send(headCommand);
    const fileSize = headResponse.ContentLength || 0;
    
    console.log(`File size: ${fileSize} bytes (${(fileSize / (1024 * 1024)).toFixed(2)} MB)`);

    // Process the file in chunks to avoid memory issues
    const chunkSize = 10 * 1024 * 1024; // 10 MB chunks
    let startByte = 0;
    let recordBuffer = '';
    let recordCount = 0;
    
    while (startByte < fileSize) {
      const endByte = Math.min(startByte + chunkSize - 1, fileSize - 1);
      console.log(`Fetching part ${startByte}-${endByte} of ${fileSize} (${((endByte - startByte + 1) / (1024 * 1024)).toFixed(2)} MB)`);
      
      const command = new GetObjectCommand({
        Bucket: env.AWS_BUCKET_NAME,
        Key: key,
        Range: `bytes=${startByte}-${endByte}`
      });
      
      try {
        console.log(`Sending request for part ${startByte}-${endByte}...`);
        const response = await s3Client.send(command);
        console.log(`Received response for part ${startByte}-${endByte}`);
        
        if (!response.Body) {
          throw new Error('Response body is empty');
        }
        
        const stream = response.Body as any;
        let chunkData = '';
        
        for await (const chunk of stream) {
          chunkData += chunk.toString('utf-8');
        }
        
        console.log(`Received ${chunkData.length} bytes of data for part ${startByte}-${endByte}`);
        
        // Combine with any leftover from previous chunk
        const data = recordBuffer + chunkData;
        recordBuffer = '';
        
        // Process complete records
        let index = 0;
        while (index < data.length) {
          const recordStart = data.indexOf('<Record', index);
          if (recordStart === -1) break;
          
          const recordEnd = data.indexOf('</Record>', recordStart);
          if (recordEnd === -1) {
            // Record is incomplete, save for next chunk
            recordBuffer = data.substring(recordStart);
            break;
          }
          
          // Process complete record
          const record = data.substring(recordStart, recordEnd + 9);
          const wrappedRecord = `<?xml version="1.0" encoding="UTF-8"?><HealthData>${record}</HealthData>`;
          
          try {
            await processor(wrappedRecord);
            recordCount++;
            if (recordCount % 100 === 0) {
              console.log(`Processed ${recordCount} records, memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
            }
          } catch (error) {
            console.error('Error processing record:', error);
          }
          
          index = recordEnd + 9;
        }
        
        startByte = endByte + 1;
        
        // Log memory usage after each part
        console.log(`After processing part ${startByte-chunkSize}-${endByte}: Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
        
      } catch (error) {
        console.error(`Error processing part ${startByte}-${endByte}:`, error);
        throw error;
      }
    }
    
    console.log(`Finished processing file. Total records processed: ${recordCount}`);
    
    // Process any remaining buffer data if there is any
    if (recordBuffer.length > 0) {
      console.log(`Processing remaining buffer (${recordBuffer.length} bytes)...`);
      
      const recordStart = recordBuffer.indexOf('<Record');
      if (recordStart !== -1) {
        const recordEnd = recordBuffer.indexOf('</Record>', recordStart);
        if (recordEnd !== -1) {
          const record = recordBuffer.substring(recordStart, recordEnd + 9);
          const wrappedRecord = `<?xml version="1.0" encoding="UTF-8"?><HealthData>${record}</HealthData>`;
          
          try {
            await processor(wrappedRecord);
            recordCount++;
            console.log(`Processed final record, total: ${recordCount}`);
          } catch (error) {
            console.error('Error processing final record:', error);
          }
        }
      }
    }
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error processing S3 file:', error);
    throw error;
  }
}

export async function saveData(type: HealthDataType, newData: HealthRecord[], userId: string): Promise<void> {
  if (!env.AWS_BUCKET_NAME) throw new Error('AWS_BUCKET_NAME environment variable is not set');
  if (newData.length === 0) return;

  try {
    // Fetch existing data
    const existingData = await fetchAllHealthData(type, userId);
    
    // Merge and deduplicate data
    const mergedData = [...existingData, ...newData];
    mergedData.sort((a, b) => a.date.localeCompare(b.date));

    // Remove duplicates based on date
    const uniqueData = mergedData.filter((item, index, self) =>
      index === self.findIndex((t) => t.date === item.date)
    );

    // Save to S3 - Convert type to lowercase for file path
    const key = `data/${userId}/${type.toLowerCase()}.json`;
    const command = new PutObjectCommand({
      Bucket: env.AWS_BUCKET_NAME,
      Key: key,
      Body: JSON.stringify(uniqueData),
      ContentType: 'application/json'
    });

    await s3Client.send(command);
  } catch (error) {
    console.error(`Error saving ${type} data:`, error);
    throw error;
  }
}

export async function fetchAllHealthData(type: HealthDataType, userId: string): Promise<HealthRecord[]> {
  if (!env.AWS_BUCKET_NAME) throw new Error('AWS_BUCKET_NAME environment variable is not set');

  try {
    // Convert type to lowercase for file path
    const key = `data/${userId}/${type.toLowerCase()}.json`;
    const command = new GetObjectCommand({
      Bucket: env.AWS_BUCKET_NAME,
      Key: key
    });

    try {
      const response = await s3Client.send(command);
      const stream = response.Body as any;
      let data = '';

      for await (const chunk of stream) {
        data += chunk.toString('utf-8');
      }

      return JSON.parse(data);
    } catch (error: any) {
      if (error.name === 'NoSuchKey') {
        return [];
      }
      throw error;
    }
  } catch (error) {
    console.error(`Error fetching ${type} data:`, error);
    return [];
  }
} 