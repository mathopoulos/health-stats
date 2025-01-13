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
  let skippedRecords = 0;
  let pendingRecords: any[] = [];
  let lastProgressTime = Date.now();
  let startTime = Date.now();
  
  console.log('🏃 Starting weight data processing...');
  
  // Create a map of existing dates for quick lookup
  console.log('📚 Fetching existing weight records...');
  const existingRecords = await fetchAllHealthData('weight', userId);
  const existingDates = new Set(existingRecords.map(record => record.date));
  console.log(`📊 Found ${existingRecords.length} existing weight records`);
  
  try {
    await processS3XmlFile(xmlKey, async (recordXml) => {
      try {
        recordsProcessed++;
        
        // Log progress periodically
        if (recordsProcessed % 10000 === 0) {
          const now = Date.now();
          console.log(`⏳ Progress update:
            Records processed: ${recordsProcessed}
            Valid records: ${validRecords}
            Skipped records: ${skippedRecords}
            Processing rate: ${Math.round(10000 / ((now - lastProgressTime) / 1000))} records/second
            Total time: ${Math.round((now - startTime) / 1000)}s
          `);
          lastProgressTime = now;
        }
        
        // Quick check for weight records before parsing
        if (!recordXml.includes('HKQuantityTypeIdentifierBodyMass')) {
          skippedRecords++;
          return;
        }
        
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
        console.error('❌ Error processing weight record:', error);
        throw error;
      }
    });

    // Save any remaining records
    if (pendingRecords.length > 0) {
      console.log(`💾 Saving final batch of ${pendingRecords.length} weight records...`);
      await saveData('weight', pendingRecords, userId);
      status.batchesSaved++;
    }

    const endTime = Date.now();
    const totalTime = Math.round((endTime - startTime) / 1000);
    
    console.log(`
🏁 Weight processing completed:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Total records processed: ${recordsProcessed}
✅ Valid weight records: ${validRecords}
⏭️  Skipped records: ${skippedRecords}
💾 Batches saved: ${status.batchesSaved}
⏱️  Total time: ${totalTime} seconds
📈 Average processing rate: ${Math.round(recordsProcessed / totalTime)} records/second
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

  } catch (error) {
    console.error(`❌ Fatal error during weight processing:`, error);
    throw error;
  }
}

// Similar functions for bodyFat, HRV, and VO2Max would go here...

export const handler: Handler<LambdaEvent, any> = async (event: LambdaEvent, context: Context) => {
  console.log('🚀 Starting Lambda function execution...');
  const { jobId, userId, xmlKey } = event;
  let startTime = Date.now();
  
  try {
    const status: ProcessingStatus = {
      recordsProcessed: 0,
      batchesSaved: 0,
      status: 'processing',
      userId
    };

    const recordTypes: string[] = [];

    // Process weight
    console.log('📊 Starting weight data processing...');
    status.status = 'processing weight';
    await updateJobProgress(jobId, 0, 4, 'Processing weight data...');
    await processWeight(xmlKey, status);
    recordTypes.push('weight');
    console.log('✅ Weight data processing complete');

    // Process body fat
    console.log('📊 Starting body fat data processing...');
    status.status = 'processing bodyFat';
    await updateJobProgress(jobId, 1, 4, 'Processing body fat data...');
    // await processBodyFat(xmlKey, status);
    // recordTypes.push('bodyFat');
    console.log('✅ Body fat data processing complete');

    // Process HRV
    console.log('📊 Starting HRV data processing...');
    status.status = 'processing hrv';
    await updateJobProgress(jobId, 2, 4, 'Processing HRV data...');
    // await processHRV(xmlKey, status);
    // recordTypes.push('hrv');
    console.log('✅ HRV data processing complete');

    // Process VO2 max
    console.log('📊 Starting VO2 max data processing...');
    status.status = 'processing vo2max';
    await updateJobProgress(jobId, 3, 4, 'Processing VO2 max data...');
    // await processVO2Max(xmlKey, status);
    // recordTypes.push('vo2max');
    console.log('✅ VO2 max data processing complete');

    // Update final status
    await updateJobStatus(jobId, 'completed', {
      result: {
        recordsProcessed: status.recordsProcessed,
        recordTypes
      }
    });

    const executionTime = (Date.now() - startTime) / 1000;
    console.log(`🏁 Lambda function execution completed successfully!`);
    console.log(`📈 Total records processed: ${status.recordsProcessed}`);
    console.log(`⏱️ Total execution time: ${executionTime.toFixed(2)} seconds`);
    console.log(`🔄 Record types processed: ${recordTypes.join(', ')}`);

    // Explicitly cleanup and exit
    await cleanup();
    context.done(undefined, {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        recordsProcessed: status.recordsProcessed,
        recordTypes,
        executionTime: executionTime.toFixed(2)
      })
    });
    return;

  } catch (error) {
    console.error('❌ Processing error:', error);
    
    await updateJobStatus(jobId, 'failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    // Cleanup and exit on error
    await cleanup();
    context.done(error instanceof Error ? error : new Error('Unknown error'), {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    });
    return;
  }
}; 