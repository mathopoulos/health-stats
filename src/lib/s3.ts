import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { XMLParser } from 'fast-xml-parser/src/fxp';

export type HealthDataType = 'heartRate' | 'weight' | 'bodyFat' | 'hrv' | 'vo2max' | 'sleep';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME || '';

export async function generatePresignedUploadUrl(key: string, contentType: string, userId?: string): Promise<string> {
  if (!BUCKET_NAME) {
    throw new Error('AWS_BUCKET_NAME environment variable is not set');
  }

  // If userId is provided and the key is for data storage (not temporary uploads),
  // include it in the path
  if (userId && key.startsWith('data/')) {
    key = `data/${userId}/${key.slice(5)}`;
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  try {
    const url = await getSignedUrl(s3Client, command, { 
      expiresIn: 3600,
      signableHeaders: new Set(['content-type']),
    });
    console.log('Generated presigned URL for:', key);
    return url;
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw error;
  }
}

export async function generatePresignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

export async function processS3XmlFile(key: string, processor: (chunk: string) => Promise<boolean | void>): Promise<void> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds
  const MAX_CHUNK_SIZE = 50 * 1024 * 1024; // Increased to 50MB
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  async function attemptProcessing(attempt: number = 0): Promise<void> {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      const response = await s3Client.send(command);
      const stream = response.Body as any;

      return new Promise((resolve, reject) => {
        let xmlChunk = '';
        const recordEndMarker = '</Record>';
        const recordStartMarker = '<Record';
        let shouldStop = false;
        let processingPromise = Promise.resolve();
        let streamError: Error | null = null;
        let lastProcessTime = Date.now();
        let processedRecords = 0;

        const cleanup = () => {
          try {
            if (stream) {
              stream.destroy();
            }
          } catch (err) {
            console.error('Error during stream cleanup:', err);
          }
        };

        // Process chunks in smaller batches
        const processChunk = async () => {
          while (!shouldStop) {
            const endIndex = xmlChunk.indexOf(recordEndMarker);
            if (endIndex === -1) {
              // If chunk is too large and no end marker found, try to find a safe point to trim
              if (xmlChunk.length > MAX_CHUNK_SIZE) {
                // Look for the last complete record
                const lastCompleteEnd = xmlChunk.lastIndexOf(recordEndMarker);
                if (lastCompleteEnd !== -1) {
                  // Keep everything after the last complete record
                  xmlChunk = xmlChunk.slice(lastCompleteEnd + recordEndMarker.length);
                  console.log(`Trimmed chunk to ${xmlChunk.length} bytes, keeping partial record`);
                } else {
                  // If we can't find any complete records, we have to clear it
                  console.log(`Warning: Clearing ${xmlChunk.length} bytes of data with no complete records`);
                  xmlChunk = '';
                }
              }
              break;
            }

            const startIndex = xmlChunk.lastIndexOf(recordStartMarker, endIndex);
            if (startIndex === -1) {
              // If we have a corrupted chunk, try to salvage what we can
              const nextStart = xmlChunk.indexOf(recordStartMarker, endIndex);
              if (nextStart !== -1) {
                xmlChunk = xmlChunk.slice(nextStart);
              } else {
                xmlChunk = xmlChunk.slice(endIndex + recordEndMarker.length);
              }
              continue;
            }

            const record = xmlChunk.slice(startIndex, endIndex + recordEndMarker.length);
            const wrappedRecord = `<?xml version="1.0" encoding="UTF-8"?><HealthData>${record}</HealthData>`;
            
            try {
              const result = await processor(wrappedRecord);
              processedRecords++;
              
              // Log progress every 10000 records
              if (processedRecords % 10000 === 0) {
                console.log(`Processed ${processedRecords} records`);
              }
              
              if (result === false) {
                shouldStop = true;
                cleanup();
                break;
              }
            } catch (error) {
              console.error('Error processing record:', error);
              // Continue with next record despite errors
            }

            xmlChunk = xmlChunk.slice(endIndex + recordEndMarker.length);

            // Add periodic cleanup to prevent memory buildup
            const now = Date.now();
            if (now - lastProcessTime > 30000) { // Every 30 seconds
              lastProcessTime = now;
              console.log(`Processing status: ${processedRecords} records processed, current chunk size: ${xmlChunk.length} bytes`);
              // Force garbage collection if available
              if (global.gc) {
                try {
                  global.gc();
                } catch (e) {
                  // Ignore GC errors
                }
              }
            }
          }
        };

        stream.on('data', (chunk: Buffer) => {
          if (shouldStop) {
            cleanup();
            return;
          }

          try {
            xmlChunk += chunk.toString('utf-8');
            
            // Process chunk when it gets large
            if (xmlChunk.length > MAX_CHUNK_SIZE / 2) { // Process at half max size to prevent overflow
              processingPromise = processingPromise
                .then(processChunk)
                .catch(error => {
                  console.error('Error in processing promise:', error);
                  streamError = error instanceof Error ? error : new Error(String(error));
                  cleanup();
                });
            }
          } catch (error) {
            console.error('Error processing data chunk:', error);
            streamError = error instanceof Error ? error : new Error(String(error));
            cleanup();
          }
        });

        stream.on('error', (error: Error) => {
          console.error('Stream error:', error);
          streamError = error;
          cleanup();
          reject(error);
        });

        stream.on('end', () => {
          processingPromise
            .then(processChunk) // Process any remaining data
            .then(() => {
              if (streamError) {
                reject(streamError);
                return;
              }
              console.log(`Processing complete. Total records processed: ${processedRecords}`);
              resolve();
            })
            .catch(reject);
        });

        stream.on('close', () => {
          if (shouldStop) {
            resolve();
          }
        });
      });
    } catch (error) {
      console.error(`Error during S3 file processing (attempt ${attempt + 1}):`, error);
      
      if (attempt < MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY}ms...`);
        await delay(RETRY_DELAY);
        return attemptProcessing(attempt + 1);
      }
      
      throw error;
    }
  }

  return attemptProcessing();
}

export async function listDataFiles(prefix: string): Promise<string[]> {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: prefix,
  });

  const response = await s3Client.send(command);
  return response.Contents?.map(obj => obj.Key || '') || [];
}

export async function fetchDataFile(key: string): Promise<any> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const response = await s3Client.send(command);
  const stream = response.Body as any;
  
  return new Promise((resolve, reject) => {
    let data = '';
    
    stream.on('data', (chunk: Buffer) => {
      data += chunk.toString('utf-8');
    });

    stream.on('error', (error: Error) => {
      console.error('Error reading from S3:', error);
      reject(error);
    });

    stream.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(error);
      }
    });
  });
}

export async function fetchAllHealthData(type: HealthDataType, userId: string): Promise<any[]> {
  try {
    const key = `data/${userId}/${type}.json`;
    
    try {
      try {
        const data = await fetchDataFile(key);
        
        // Handle sleep data which is stored as a single object
        if (type === 'sleep' && !Array.isArray(data)) {
          return data ? [data] : [];
        }
        
        // Handle array data for other types
        return Array.isArray(data) ? data : [];
      } catch (error) {
        // If we're looking for bodyFat but couldn't find it, try the lowercase variant
        if (type === 'bodyFat') {
          const lowercaseKey = `data/${userId}/bodyfat.json`;
          const data = await fetchDataFile(lowercaseKey);
          return Array.isArray(data) ? data : [];
        }
        throw error; // Re-throw for other data types
      }
    } catch (error) {
      console.log(`No data found for ${type}:`, error);
      return [];
    }
  } catch (error) {
    console.error(`Error fetching ${type} data:`, error);
    return [];
  }
}

export async function deleteOldXmlFiles(userId: string): Promise<void> {
  try {
    // List all XML files for the user
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `uploads/${userId}/`,
    });

    const response = await s3Client.send(command);
    const xmlFiles = response.Contents?.filter(obj => obj.Key?.endsWith('.xml')) || [];

    // Delete each XML file
    for (const file of xmlFiles) {
      if (!file.Key) continue;

      const deleteCommand = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: file.Key,
      });

      await s3Client.send(deleteCommand);
      console.log(`Deleted old XML file: ${file.Key}`);
    }

    console.log(`Deleted ${xmlFiles.length} old XML files for user ${userId}`);
  } catch (error) {
    console.error('Error deleting old XML files:', error);
    throw error;
  }
}

export interface HealthData {
  type: HealthDataType;
  data: any;
  timestamp: string;
  userId: string;
}

export async function saveHealthData(healthData: HealthData): Promise<void> {
  const key = `data/${healthData.userId}/${healthData.type}.json`;

  try {
    // For sleep data, always store as array
    if (healthData.type === 'sleep') {
      let sleepDataArray: any[] = [];
      
      try {
        // Try to get existing data
        const existingData = await fetchDataFile(key);
        sleepDataArray = Array.isArray(existingData) ? existingData : existingData ? [existingData] : [];
      } catch (error) {
        console.log('No existing sleep data found, starting with empty array');
      }

      // Add new data
      const newEntry = {
        type: healthData.type,
        userId: healthData.userId,
        data: healthData.data,
        timestamp: healthData.timestamp
      };

      // Check if we already have this sleep session (based on startDate)
      const existingIndex = sleepDataArray.findIndex(
        (entry: any) => entry.data.startDate === healthData.data.startDate
      );

      if (existingIndex >= 0) {
        // Update existing entry
        sleepDataArray[existingIndex] = newEntry;
      } else {
        // Add new entry
        sleepDataArray.push(newEntry);
      }

      // Sort by startDate in descending order (newest first)
      sleepDataArray.sort((a: any, b: any) => 
        new Date(b.data.startDate).getTime() - new Date(a.data.startDate).getTime()
      );

      // Always save as array
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: JSON.stringify(sleepDataArray),
        ContentType: 'application/json',
      });

      await s3Client.send(command);
      console.log(`Saved sleep data to ${key}, total entries: ${sleepDataArray.length}`);
      return;
    }

    // For non-sleep data
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: JSON.stringify(healthData),
      ContentType: 'application/json',
    });

    await s3Client.send(command);
    console.log(`Saved ${healthData.type} data to ${key}`);
  } catch (error) {
    console.error(`Error saving ${healthData.type} data:`, error);
    throw error;
  }
} 