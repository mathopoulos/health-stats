import { Handler, Context } from 'aws-lambda';
import { XMLParser } from 'fast-xml-parser';
import { processS3XmlFile, saveData, fetchAllHealthData } from './s3';
import { updateJobProgress, updateJobStatus, cleanup } from './mongodb';
import { LambdaEvent, ProcessingStatus, HealthDataType, HealthRecord } from './types';
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
  console.log('⚡️ processWeight: Starting execution');
  
  const userId = status.userId;
  if (!userId) throw new Error('User ID is required');
  
  let recordsProcessed = 0;
  let validRecords = 0;
  let skippedRecords = 0;
  let pendingRecords: any[] = [];
  let lastProgressTime = Date.now();
  let startTime = Date.now();
  let lastMemoryUsage = 0;
  let noNewRecordsCount = 0;
  let lastValidRecordCount = 0;
  let withingsRecords = 0;
  let eufyRecords = 0;
  let otherSourceRecords = 0;
  let firstRecordLogged = false;
  
  console.log('🔍 processWeight: Fetching existing records...');
  const existingRecords = await fetchAllHealthData('weight', userId);
  const existingDates = new Set(existingRecords.map(record => record.date));
  console.log(`📊 processWeight: Found ${existingRecords.length} existing records`);
  
  const saveBatch = async () => {
    if (pendingRecords.length > 0) {
      console.log(`💾 processWeight: Saving batch of ${pendingRecords.length} records...`);
      await saveData('weight', pendingRecords, userId);
      status.batchesSaved++;
      pendingRecords = [];
    }
  };
  
  try {
    console.log('📑 processWeight: Starting S3 file processing...');
    await processS3XmlFile(xmlKey, async (recordXml) => {
      try {
        recordsProcessed++;
        
        // Log progress and check memory usage every 1000 records
        if (recordsProcessed % 1000 === 0) {
          const currentMemory = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
          const memoryDelta = currentMemory - lastMemoryUsage;
          lastMemoryUsage = currentMemory;
          
          console.log(`⏳ processWeight progress:
            Records processed: ${recordsProcessed}
            Valid records: ${validRecords}
            Skipped records: ${skippedRecords}
            Withings records: ${withingsRecords}
            Eufy records: ${eufyRecords}
            Other source records: ${otherSourceRecords}
            Memory usage: ${currentMemory}MB (${memoryDelta > 0 ? '+' : ''}${memoryDelta}MB)
            Processing rate: ${Math.round(recordsProcessed / ((Date.now() - startTime) / 1000))} records/sec
          `);
          
          // Check if we're finding new records
          if (validRecords === lastValidRecordCount) {
            noNewRecordsCount++;
            if (noNewRecordsCount >= 20) { // Increased threshold to account for sparse records
              console.log('⚠️ No new weight records found in last 20,000 records, stopping processing');
              await saveBatch(); // Save any remaining records
              return false; // Stop processing
            }
          } else {
            noNewRecordsCount = 0;
            lastValidRecordCount = validRecords;
          }
          
          // Force garbage collection if available
          if (global.gc) {
            try {
              global.gc();
            } catch (e) {
              // Ignore GC errors
            }
          }
        }
        
        // Quick check for weight records before parsing
        if (!recordXml.includes('HKQuantityTypeIdentifierBodyMass')) {
          skippedRecords++;
          return;
        }
        
        const data = parser.parse(recordXml);
        
        if (!data?.HealthData?.Record) {
          console.log('⚠️ processWeight: No Record found in data');
          return;
        }
        
        const records = Array.isArray(data.HealthData.Record) 
          ? data.HealthData.Record 
          : [data.HealthData.Record];

        for (const record of records) {
          if (!record?.type || record.type !== 'HKQuantityTypeIdentifierBodyMass') {
            skippedRecords++;
            continue;
          }

          // Log the first record of each type we encounter
          if (!firstRecordLogged) {
            console.log('First weight record encountered:', JSON.stringify(record, null, 2));
            firstRecordLogged = true;
          }

          const value = parseFloat(record.value);
          if (isNaN(value)) {
            console.log('⚠️ processWeight: Invalid value');
            continue;
          }

          const date = new Date(record.startDate || record.creationDate || record.endDate);
          if (!date || isNaN(date.getTime())) {
            console.log('⚠️ processWeight: Invalid date');
            continue;
          }

          const isoDate = date.toISOString();
          if (existingDates.has(isoDate)) {
            skippedRecords++;
            continue;
          }

          // Track record sources
          if (record.sourceName) {
            switch (record.sourceName.toLowerCase()) {
              case 'withings':
                withingsRecords++;
                break;
              case 'eufy life':
                eufyRecords++;
                break;
              default:
                otherSourceRecords++;
                break;
            }
          }

          // Create weight record with source information
          const weightRecord: HealthRecord = {
            date: isoDate,
            value: Math.round(value * 100) / 100,
            source: record.sourceName || 'unknown',
            unit: record.unit || 'lb'
          };

          // Add metadata if present
          if (record.MetadataEntry) {
            const metadata: Record<string, string> = {};
            const entries = Array.isArray(record.MetadataEntry) 
              ? record.MetadataEntry 
              : [record.MetadataEntry];
            
            for (const entry of entries) {
              if (entry.key && entry.value !== undefined) {
                metadata[entry.key] = entry.value;
              }
            }
            weightRecord.metadata = metadata;
          }

          pendingRecords.push(weightRecord);
          existingDates.add(isoDate);
          validRecords++;
          status.recordsProcessed++;
          
          // Save batch when it reaches the threshold
          if (pendingRecords.length >= 50) {
            await saveBatch();
          }
        }
      } catch (error) {
        console.error('❌ processWeight: Error processing record:', error);
        // Log the problematic record for debugging
        console.error('Problematic record:', recordXml);
        // Continue processing despite errors
      }
    });
    
    // Save any remaining records
    await saveBatch();
    
    console.log(`✅ processWeight: Completed processing
      Total records processed: ${recordsProcessed}
      Valid records: ${validRecords}
      Skipped records: ${skippedRecords}
      Withings records: ${withingsRecords}
      Eufy records: ${eufyRecords}
      Other source records: ${otherSourceRecords}
      Total time: ${Math.round((Date.now() - startTime) / 1000)}s
      Final memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB
    `);
    
  } catch (error) {
    console.error('❌ processWeight: Fatal error:', error);
    throw error;
  }
}

// Similar functions for bodyFat, HRV, and VO2Max would go here...

export const handler: Handler<LambdaEvent, any> = async (event: LambdaEvent, context: Context) => {
  console.log('🚀 Starting Lambda function execution with event:', JSON.stringify(event));
  console.log('⏰ Remaining time (ms):', context.getRemainingTimeInMillis());
  
  const { jobId, userId, xmlKey } = event;
  let startTime = Date.now();
  
  // Register cleanup handler
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    console.log('👤 Processing for user:', userId);
    console.log('📁 Processing file:', xmlKey);
    
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
    
    console.log('⏳ Before processWeight call');
    await processWeight(xmlKey, status);
    console.log('✅ After processWeight call');
    
    recordTypes.push('weight');
    console.log('✅ Weight data processing complete');

    // Update final status
    console.log('📝 Updating final job status...');
    await updateJobStatus(jobId, 'completed', {
      result: {
        recordsProcessed: status.recordsProcessed,
        recordTypes
      }
    });

    const executionTime = (Date.now() - startTime) / 1000;
    console.log(`
🏁 Lambda function execution completed:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 Total records processed: ${status.recordsProcessed}
⏱️  Total execution time: ${executionTime.toFixed(2)} seconds
🔄 Record types processed: ${recordTypes.join(', ')}
🧹 Starting cleanup...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);

    // Explicitly cleanup and exit
    console.log('🧹 Running cleanup...');
    await cleanup();
    console.log('✨ Cleanup complete');
    
    const response = {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        recordsProcessed: status.recordsProcessed,
        recordTypes,
        executionTime: executionTime.toFixed(2)
      })
    };
    
    console.log('📤 Returning response:', JSON.stringify(response));
    return response;

  } catch (error) {
    console.error('❌ Processing error:', error);
    console.log('⏰ Time remaining at error (ms):', context.getRemainingTimeInMillis());
    
    try {
      console.log('📝 Updating job status to failed...');
      await updateJobStatus(jobId, 'failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log('✅ Job status updated to failed');
    } catch (statusError) {
      console.error('❌ Failed to update job status:', statusError);
    }

    // Cleanup and exit on error
    try {
      console.log('🧹 Running cleanup after error...');
      await cleanup();
      console.log('✨ Cleanup after error complete');
    } catch (cleanupError) {
      console.error('❌ Cleanup failed:', cleanupError);
    }

    const errorResponse = {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
    
    console.log('📤 Returning error response:', JSON.stringify(errorResponse));
    return errorResponse;
  }
}; 