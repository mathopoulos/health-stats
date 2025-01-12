import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { HealthDataType, HealthRecord } from './types';
import { env } from './env';

const s3Client = new S3Client({
  region: env.AWS_REGION
});

export async function processS3XmlFile(key: string, processor: (chunk: string) => Promise<boolean | void>): Promise<void> {
  console.log('Starting to process S3 XML file:', key);
  
  const command = new GetObjectCommand({
    Bucket: env.AWS_BUCKET_NAME,
    Key: key,
  });

  console.log('Fetching file from S3...');
  const response = await s3Client.send(command);
  const stream = response.Body as any;
  
  return new Promise((resolve, reject) => {
    let buffer = '';
    let totalBytes = 0;
    const CHUNK_SIZE = 64 * 1024; // 64KB chunks

    stream.on('data', async (chunk: Buffer) => {
      try {
        totalBytes += chunk.length;
        if (totalBytes % (1024 * 1024) === 0) { // Log every 1MB
          console.log(`Reading file: ${(totalBytes / (1024 * 1024)).toFixed(2)}MB processed`);
        }

        buffer += chunk.toString('utf-8');
        
        // Process complete records when we have enough data
        if (buffer.length > CHUNK_SIZE) {
          const endIndex = buffer.lastIndexOf('</Record>');
          if (endIndex !== -1) {
            const recordsToProcess = buffer.substring(0, endIndex + 9); // Include the closing tag
            buffer = buffer.substring(endIndex + 9);
            
            // Wrap in HealthData tags if not present
            const wrappedRecords = recordsToProcess.includes('<HealthData>') 
              ? recordsToProcess 
              : `<HealthData>${recordsToProcess}</HealthData>`;
              
            await processor(wrappedRecords);
          }
        }
      } catch (error) {
        reject(error);
      }
    });

    stream.on('error', (error: Error) => {
      console.error('Error reading S3 file:', error);
      reject(error);
    });
    
    stream.on('end', async () => {
      try {
        // Process any remaining data
        if (buffer.length > 0) {
          const wrappedRecords = buffer.includes('<HealthData>') 
            ? buffer 
            : `<HealthData>${buffer}</HealthData>`;
          await processor(wrappedRecords);
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
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

    // Save to S3
    const key = `data/${userId}/${type}.json`;
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
    const key = `data/${userId}/${type}.json`;
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