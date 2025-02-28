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

  console.log(`Fetching file from S3 bucket ${env.AWS_BUCKET_NAME}...`);
  
  try {
    console.log('Sending S3 request...');
    const response = await s3Client.send(command);
    console.log('S3 request successful, getting stream...');
    const stream = response.Body as any;
    console.log('Stream obtained, setting up listeners...');
    
    return new Promise((resolve, reject) => {
      let buffer = '';
      let totalBytes = 0;
      let recordCount = 0;
      const CHUNK_SIZE = 32 * 1024; // Reduced to 32KB chunks for better memory management
      const MAX_BUFFER_SIZE = 1024 * 1024; // 1MB max buffer size
      let processingPromise = Promise.resolve();
      let chunkCount = 0;

      const processBuffer = async () => {
        try {
          console.log(`Processing buffer (size: ${buffer.length} bytes)...`);
          while (buffer.length > 0) {
            const recordStart = buffer.indexOf('<Record');
            const recordEnd = buffer.indexOf('</Record>');
            
            if (recordStart === -1 || recordEnd === -1) {
              // No complete record found
              console.log(`No complete record found in buffer of size ${buffer.length} bytes`);
              if (buffer.length > MAX_BUFFER_SIZE) {
                // Buffer too large, likely corrupted data
                console.warn(`Buffer exceeded ${MAX_BUFFER_SIZE} bytes with no complete record, clearing buffer`);
                buffer = '';
              }
              break;
            }

            // Extract and process the record
            const record = buffer.slice(recordStart, recordEnd + 9); // Include </Record>
            const wrappedRecord = `<?xml version="1.0" encoding="UTF-8"?><HealthData>${record}</HealthData>`;
            
            try {
              await processor(wrappedRecord);
              recordCount++;
              if (recordCount % 1000 === 0) {
                console.log(`Processed ${recordCount} records, memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
              }
            } catch (error) {
              console.error('Error processing record:', error);
              // Continue processing despite errors
            }

            // Remove the processed record from buffer
            buffer = buffer.slice(recordEnd + 9);
          }
          console.log(`Buffer processing completed, remaining buffer size: ${buffer.length} bytes`);
        } catch (error) {
          console.error('Error in processBuffer:', error);
          throw error;
        }
      };

      stream.on('data', async (chunk: Buffer) => {
        try {
          chunkCount++;
          totalBytes += chunk.length;
          console.log(`Received chunk #${chunkCount} (${chunk.length} bytes), total so far: ${totalBytes} bytes`);
          
          if (totalBytes % (1024 * 1024) === 0) { // Log every 1MB
            console.log(`Reading file: ${(totalBytes / (1024 * 1024)).toFixed(2)}MB processed`);
          }

          buffer += chunk.toString('utf-8');
          console.log(`Added chunk to buffer, new buffer size: ${buffer.length} bytes`);
          
          // Process buffer when it gets large enough
          if (buffer.length > CHUNK_SIZE) {
            console.log(`Buffer size ${buffer.length} exceeds chunk size ${CHUNK_SIZE}, processing...`);
            processingPromise = processingPromise
              .then(processBuffer)
              .catch(error => {
                console.error('Error processing chunk:', error);
                reject(error);
              });
          }
        } catch (error) {
          console.error('Error handling data chunk:', error);
          reject(error);
        }
      });

      stream.on('error', (error: Error) => {
        console.error('Error reading S3 file:', error);
        reject(error);
      });

      stream.on('end', async () => {
        console.log(`Stream end event received after ${chunkCount} chunks and ${totalBytes} total bytes`);
        try {
          // Process any remaining data
          console.log('Processing any remaining data...');
          await processingPromise;
          await processBuffer();
          console.log(`Finished processing ${recordCount} records`);
          resolve();
        } catch (error) {
          console.error('Error processing remaining data:', error);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error in S3 file retrieval:', error);
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