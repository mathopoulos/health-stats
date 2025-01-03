import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { XMLParser } from 'fast-xml-parser/src/fxp';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME || '';

export async function generatePresignedUploadUrl(key: string, contentType: string): Promise<string> {
  if (!BUCKET_NAME) {
    throw new Error('AWS_BUCKET_NAME environment variable is not set');
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

export async function processS3XmlFile(key: string, processor: (chunk: string) => void): Promise<void> {
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

    stream.on('data', (chunk: Buffer) => {
      xmlChunk += chunk.toString('utf-8');
      
      // Process complete records
      while (true) {
        const endIndex = xmlChunk.indexOf(recordEndMarker);
        if (endIndex === -1) break;

        const startIndex = xmlChunk.lastIndexOf(recordStartMarker, endIndex);
        if (startIndex === -1) break;

        // Extract the complete record including the Record tags
        const record = xmlChunk.slice(startIndex, endIndex + recordEndMarker.length);
        
        // Wrap in HealthData tags and process
        const wrappedRecord = `<?xml version="1.0" encoding="UTF-8"?><HealthData>${record}</HealthData>`;
        processor(wrappedRecord);

        // Remove the processed record from the chunk
        xmlChunk = xmlChunk.slice(endIndex + recordEndMarker.length);
      }
    });

    stream.on('error', (error: Error) => {
      console.error('Error reading from S3:', error);
      reject(error);
    });

    stream.on('end', () => {
      // Process any remaining complete record
      if (xmlChunk.includes(recordStartMarker) && xmlChunk.includes(recordEndMarker)) {
        const startIndex = xmlChunk.lastIndexOf(recordStartMarker);
        const endIndex = xmlChunk.indexOf(recordEndMarker, startIndex) + recordEndMarker.length;
        if (startIndex !== -1 && endIndex !== -1) {
          const record = xmlChunk.slice(startIndex, endIndex);
          const wrappedRecord = `<?xml version="1.0" encoding="UTF-8"?><HealthData>${record}</HealthData>`;
          processor(wrappedRecord);
        }
      }
      resolve();
    });
  });
} 