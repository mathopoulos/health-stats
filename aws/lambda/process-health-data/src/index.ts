import { Handler, Context } from 'aws-lambda';
import { XMLParser } from 'fast-xml-parser';
import { processS3XmlFile, saveData, fetchAllHealthData } from './s3';
import { updateJobProgress, updateJobStatus, cleanup } from './mongodb';
import { LambdaEvent, ProcessingStatus, HealthDataType } from './types';
import dotenv from 'dotenv';
import path from 'path';

// Get the absolute path to the project root directory
const rootDir = path.resolve(process.cwd(), '../../..');
const envPath = path.join(rootDir, '.env.local');
dotenv.config({ path: envPath });

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  textNodeName: "value",
  parseAttributeValue: true,
  ignoreDeclaration: true,
  trimValues: true,
  isArray: (name: string) => name === "Record" || name === "MetadataEntry",
  allowBooleanAttributes: true,
  parseTagValue: true,
  cdataPropName: "value",
  stopNodes: ["*.value"],
  preserveOrder: false
});

async function processWeight(xmlKey: string, status: ProcessingStatus): Promise<void> {
  const userId = status.userId;
  if (!userId) throw new Error('User ID is required');
  
  let recordsProcessed = 0;
  let validRecords = 0;
  let pendingRecords: any[] = [];
  
  // Create a map of existing dates for quick lookup
  const existingRecords = await fetchAllHealthData('weight', userId);
  const existingDates = new Set(existingRecords.map(record => record.date));
  
  await processS3XmlFile(xmlKey, async (recordXml) => {
    try {
      recordsProcessed++;
      console.log('Processing XML record:', recordXml);
      
      const data = parser.parse(recordXml);
      console.log('Parsed data:', JSON.stringify(data, null, 2));
      
      if (!data?.HealthData?.Record) {
        console.log('No Record found in data');
        return;
      }
      
      const records = Array.isArray(data.HealthData.Record) 
        ? data.HealthData.Record 
        : [data.HealthData.Record];

      for (const record of records) {
        console.log('Processing record:', JSON.stringify(record, null, 2));
        
        if (!record?.type || record.type !== 'HKQuantityTypeIdentifierBodyMass') {
          console.log('Skipping record - not a weight record or missing type');
          continue;
        }

        const value = parseFloat(record.value);
        if (isNaN(value)) {
          console.log('Skipping record - invalid value');
          continue;
        }

        const date = new Date(record.startDate || record.creationDate || record.endDate);
        if (!date || isNaN(date.getTime())) {
          console.log('Skipping record - invalid date');
          continue;
        }

        const isoDate = date.toISOString();
        if (existingDates.has(isoDate)) {
          console.log('Skipping record - date already exists');
          continue;
        }

        console.log('Adding valid record:', { date: isoDate, value });
        pendingRecords.push({
          date: isoDate,
          value: Math.round(value * 100) / 100
        });
        existingDates.add(isoDate);
        validRecords++;
        status.recordsProcessed++;
        
        if (pendingRecords.length >= 50) {
          await saveData('weight', pendingRecords, userId);
          status.batchesSaved++;
          pendingRecords = [];
        }
      }
    } catch (error) {
      console.error('Error processing weight record:', error);
      throw error; // Re-throw to ensure we catch parsing errors
    }
  });

  if (pendingRecords.length > 0) {
    await saveData('weight', pendingRecords, userId);
    status.batchesSaved++;
  }
  
  console.log(`Weight processing completed: ${validRecords} valid records out of ${recordsProcessed} processed`);
}

// Similar functions for bodyFat, HRV, and VO2Max would go here...

export const handler: Handler<LambdaEvent, any> = async (event: LambdaEvent, context: Context) => {
  const { jobId, userId, xmlKey } = event;
  
  try {
    const status: ProcessingStatus = {
      recordsProcessed: 0,
      batchesSaved: 0,
      status: 'processing',
      userId
    };

    const recordTypes: string[] = [];

    // Process weight
    status.status = 'processing weight';
    await updateJobProgress(jobId, 0, 4, 'Processing weight data...');
    await processWeight(xmlKey, status);
    recordTypes.push('weight');

    // Process body fat
    status.status = 'processing bodyFat';
    await updateJobProgress(jobId, 1, 4, 'Processing body fat data...');
    // await processBodyFat(xmlKey, status);
    // recordTypes.push('bodyFat');

    // Process HRV
    status.status = 'processing hrv';
    await updateJobProgress(jobId, 2, 4, 'Processing HRV data...');
    // await processHRV(xmlKey, status);
    // recordTypes.push('hrv');

    // Process VO2 max
    status.status = 'processing vo2max';
    await updateJobProgress(jobId, 3, 4, 'Processing VO2 max data...');
    // await processVO2Max(xmlKey, status);
    // recordTypes.push('vo2max');

    // Update final status
    await updateJobStatus(jobId, 'completed', {
      result: {
        recordsProcessed: status.recordsProcessed,
        recordTypes
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        recordsProcessed: status.recordsProcessed,
        recordTypes
      })
    };
  } catch (error) {
    console.error('Processing error:', error);
    
    await updateJobStatus(jobId, 'failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  } finally {
    await cleanup();
  }
}; 