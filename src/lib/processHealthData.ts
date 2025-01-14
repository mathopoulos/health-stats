import { XMLParser } from 'fast-xml-parser/src/fxp';
import { processS3XmlFile, generatePresignedUploadUrl, fetchAllHealthData, type HealthDataType } from './s3';
import { updateProcessingJobProgress, updateProcessingJobStatus } from './processingJobs';

interface HealthRecord {
  date: string;
  value: number;
  source?: string;
  unit?: string;
  metadata?: Record<string, string>;
}

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

const BATCH_SIZE = 1000; // Smaller batch size for more frequent updates

interface ProcessingStatus {
  recordsProcessed: number;
  batchesSaved: number;
  status: 'pending' | 'processing' | `processing ${HealthDataType}` | 'completed' | 'error';
  error?: string;
  userId?: string;
}

async function saveData(type: HealthDataType, newData: any[], userId: string): Promise<void> {
  if (newData.length === 0) return;

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  async function attemptSave(attempt: number = 0): Promise<void> {
    try {
      console.log(`Fetching existing ${type} data (attempt ${attempt + 1})...`);
      const existingData = await fetchAllHealthData(type, userId);
      console.log(`Found ${existingData.length} existing ${type} records`);
      
      // For single records, check if we already have this exact date
      if (newData.length === 1) {
        const newRecord = newData[0];
        const exists = existingData.some(record => record.date === newRecord.date);
        if (exists) {
          console.log(`Record for ${newRecord.date} already exists, skipping...`);
          return;
        }
        
        // If it doesn't exist, append it to existing data
        const updatedData = [...existingData, newRecord];
        updatedData.sort((a, b) => a.date.localeCompare(b.date));
        
        console.log(`Saving ${type} data to S3 with new record...`);
        const url = await generatePresignedUploadUrl(`data/${type}.json`, 'application/json', userId);
        await fetch(url, {
          method: 'PUT',
          body: JSON.stringify(updatedData),
          headers: { 'Content-Type': 'application/json' },
        });
        
        console.log(`Successfully saved new ${type} record for ${newRecord.date}`);
        return;
      }
      
      // For batch saves, merge and deduplicate
      const mergedData = [...existingData, ...newData];
      mergedData.sort((a, b) => a.date.localeCompare(b.date));

      // Remove duplicates based on date
      const uniqueData = mergedData.filter((item, index, self) =>
        index === self.findIndex((t) => t.date === item.date)
      );
      console.log(`Total ${type} records after merging and deduplication: ${uniqueData.length}`);

      console.log(`Saving ${type} data to S3...`);
      const url = await generatePresignedUploadUrl(`data/${type}.json`, 'application/json', userId);
      
      // Use a more reliable fetch with longer timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        const response = await fetch(url, {
          method: 'PUT',
          body: JSON.stringify(uniqueData),
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } finally {
        clearTimeout(timeoutId);
      }

      console.log(`Successfully saved ${newData.length} new ${type} records`);
    } catch (error) {
      console.error(`Error saving ${type} data (attempt ${attempt + 1}):`, error);
      
      if (attempt < MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY}ms...`);
        await delay(RETRY_DELAY);
        return attemptSave(attempt + 1);
      }
      
      throw error;
    }
  }

  await attemptSave();
}

async function processWeight(xmlKey: string, status: ProcessingStatus): Promise<void> {
  const userId = status.userId;
  if (!userId) throw new Error('User ID is required');
  
  console.log('Starting weight data processing...');
  let recordsProcessed = 0;
  let validRecords = 0;
  let pendingRecords: any[] = [];
  let lastProgressTime = Date.now();
  let lastValidRecordCount = 0;
  let unchangedIterations = 0;
  
  // Create a map of existing dates for quick lookup
  console.log('Fetching existing weight records...');
  const existingRecords = await fetchAllHealthData('weight', userId);
  const existingDates = new Set(existingRecords.map(record => record.date));
  console.log(`Found ${existingRecords.length} existing weight records`);
  
  await processS3XmlFile(xmlKey, async (recordXml) => {
    try {
      recordsProcessed++;
      
      // Log progress every 10000 records or if 30 seconds have passed
      const now = Date.now();
      if (recordsProcessed % 10000 === 0 || now - lastProgressTime > 30000) {
        console.log(`Progress update:
          - Records processed: ${recordsProcessed}
          - Valid weight records found: ${validRecords}
          - Pending records: ${pendingRecords.length}
          - Time since last update: ${Math.round((now - lastProgressTime) / 1000)}s
        `);
        
        // Check if we haven't found any new records in a while
        if (validRecords === lastValidRecordCount) {
          unchangedIterations++;
          if (unchangedIterations >= 10) {
            console.log('No new weight records found in last 100,000 records processed, likely reached end of weight data');
            return false; // This will stop the processing
          }
        } else {
          unchangedIterations = 0;
          lastValidRecordCount = validRecords;
        }
        
        lastProgressTime = now;
      }

      const data = parser.parse(recordXml);
      if (!data?.HealthData?.Record) return;
      
      const records = Array.isArray(data.HealthData.Record) 
        ? data.HealthData.Record 
        : [data.HealthData.Record];

      for (const record of records) {
        if (!record?.type || record.type !== 'HKQuantityTypeIdentifierBodyMass') continue;

        const value = parseFloat(record.value);
        if (isNaN(value)) continue;

        const date = new Date(record.startDate || record.creationDate || record.endDate);
        if (!date || isNaN(date.getTime())) continue;

        const isoDate = date.toISOString();
        
        // Skip if we already have this date
        if (existingDates.has(isoDate)) continue;

        // Create a single record with the exact timestamp
        const weightRecord = {
          date: isoDate,
          value: Math.round(value * 100) / 100  // Round to 2 decimal places
        };

        pendingRecords.push(weightRecord);
        existingDates.add(isoDate);
        validRecords++;
        status.recordsProcessed++;
        
        // Save progress every 50 records
        if (pendingRecords.length >= 50) {
          console.log(`Saving batch of ${pendingRecords.length} weight records...`);
          await saveData('weight', pendingRecords, userId);
          status.batchesSaved++;
          pendingRecords = [];
        }
      }
    } catch (error) {
      console.error('Error processing weight record:', error);
      // Continue processing despite errors
    }
  });

  // Save any remaining records
  if (pendingRecords.length > 0) {
    console.log(`Saving final batch of ${pendingRecords.length} weight records...`);
    await saveData('weight', pendingRecords, userId);
    status.batchesSaved++;
  }

  console.log(`Weight processing complete:
    - Total records processed: ${recordsProcessed}
    - Valid weight records found: ${validRecords}
    - Total batches saved: ${status.batchesSaved}
    - Records unchanged after: ${unchangedIterations * 10000} records
  `);
}

async function processBodyFat(xmlKey: string, status: ProcessingStatus): Promise<void> {
  const userId = status.userId;
  if (!userId) throw new Error('User ID is required');

  console.log('Starting body fat data processing...');
  let recordsProcessed = 0;
  let validRecords = 0;
  let pendingRecords: any[] = [];
  let lastProgressTime = Date.now();
  let lastRecordCount = recordsProcessed;
  let lastValidRecordCount = 0;
  let unchangedIterations = 0;
  let skippedRecords = 0;
  let invalidTypeRecords = 0;
  let invalidValueRecords = 0;
  let invalidDateRecords = 0;
  let duplicateRecords = 0;
  let seenTypes = new Set<string>();
  let foundFirstRecord = false;
  let noRecordsThreshold = 2000000;
  let stallCount = 0;
  const MAX_STALL_TIME = 300000; // 5 minutes
  const MIN_PROCESSING_SPEED = 100; // records per second

  // Create a map of existing dates for quick lookup
  console.log('Fetching existing body fat records...');
  const existingRecords = await fetchAllHealthData('bodyFat', userId);
  const existingDates = new Set(existingRecords.map(record => record.date));
  console.log(`Found ${existingRecords.length} existing body fat records`);
  
  await processS3XmlFile(xmlKey, async (recordXml) => {
    try {
      recordsProcessed++;
      
      // Log progress every 10000 records or if 30 seconds have passed
      const now = Date.now();
      if (recordsProcessed % 10000 === 0 || now - lastProgressTime > 30000) {
        const timeDiff = now - lastProgressTime;
        const recordsDiff = recordsProcessed - lastRecordCount;
        const processingSpeed = recordsDiff / (timeDiff / 1000);

        // Special logging around 780000 records
        if (recordsProcessed >= 770000 && recordsProcessed <= 790000) {
          console.log(`Detailed processing info at ${recordsProcessed} records:`);
          console.log(`Current chunk size: ${recordXml.length} bytes`);
          console.log(`Processing speed: ${processingSpeed.toFixed(2)} records/second`);
          if (processingSpeed < MIN_PROCESSING_SPEED) {
            console.log('Warning: Processing speed has dropped significantly');
          }
        }

        console.log(`Progress update:
          - Records processed: ${recordsProcessed}
          - Valid body fat records found: ${validRecords}
          - Invalid type records: ${invalidTypeRecords}
          - Invalid value records: ${invalidValueRecords}
          - Invalid date records: ${invalidDateRecords}
          - Duplicate records: ${duplicateRecords}
          - Pending records: ${pendingRecords.length}
          - Time since last update: ${Math.round(timeDiff / 1000)}s
          - Processing speed: ${processingSpeed.toFixed(2)} records/second
          - Unique record types seen: ${Array.from(seenTypes).join(', ')}
        `);

        // Check for processing stalls
        if (processingSpeed < MIN_PROCESSING_SPEED) {
          stallCount++;
          console.log(`Warning: Low processing speed detected (${processingSpeed.toFixed(2)} records/second)`);
          if (stallCount >= 3) {
            console.log('Processing appears to be stalled, attempting to continue...');
            // Reset the stall counter and continue processing
            stallCount = 0;
          }
        } else {
          stallCount = 0;
        }

        // Check for timeout
        if (now - lastProgressTime > MAX_STALL_TIME) {
          console.log(`Processing timeout after ${MAX_STALL_TIME/1000} seconds of slow/no progress`);
          return false;
        }
        
        // Check if we've processed too many records without finding any valid ones
        if (!foundFirstRecord && recordsProcessed >= noRecordsThreshold) {
          console.log(`No body fat records found after processing ${noRecordsThreshold} records, stopping processing`);
          return false;
        }
        
        // Only check for no new records if we've found at least one record
        if (foundFirstRecord) {
          if (validRecords === lastValidRecordCount) {
            unchangedIterations++;
            if (unchangedIterations >= 10) {
              console.log('No new body fat records found in last 100,000 records processed after finding some records, stopping processing');
              return false;
            }
          } else {
            unchangedIterations = 0;
            lastValidRecordCount = validRecords;
          }
        }
        
        lastProgressTime = now;
        lastRecordCount = recordsProcessed;
      }

      const data = parser.parse(recordXml);
      if (!data?.HealthData?.Record) {
        skippedRecords++;
        return;
      }
      
      const records = Array.isArray(data.HealthData.Record) 
        ? data.HealthData.Record 
        : [data.HealthData.Record];

      for (const record of records) {
        if (record?.type) {
          seenTypes.add(record.type);
        }

        if (!record?.type || record.type !== 'HKQuantityTypeIdentifierBodyFatPercentage') {
          invalidTypeRecords++;
          continue;
        }

        const value = parseFloat(record.value);
        if (isNaN(value)) {
          invalidValueRecords++;
          continue;
        }

        const date = new Date(record.startDate || record.creationDate || record.endDate);
        if (!date || isNaN(date.getTime())) {
          invalidDateRecords++;
          continue;
        }

        const isoDate = date.toISOString();
        
        // Skip if we already have this date
        if (existingDates.has(isoDate)) {
          duplicateRecords++;
          continue;
        }

        // Create a single record with the exact timestamp
        const bodyFatRecord = {
          date: isoDate,
          value: Math.round(value * 100 * 100) / 100  // Convert to percentage and round to 2 decimal places
        };

        pendingRecords.push(bodyFatRecord);
        existingDates.add(isoDate);
        validRecords++;
        foundFirstRecord = true;  // Mark that we've found at least one record
        status.recordsProcessed++;
        
        // Save progress every 50 records
        if (pendingRecords.length >= 50) {
          console.log(`Saving batch of ${pendingRecords.length} body fat records...`);
          await saveData('bodyFat', pendingRecords, userId);
          status.batchesSaved++;
          pendingRecords = [];
        }
      }
    } catch (error) {
      console.error('Error processing body fat record:', error);
      // Continue processing despite errors
    }
  });

  // Save any remaining records
  if (pendingRecords.length > 0) {
    console.log(`Saving final batch of ${pendingRecords.length} body fat records...`);
    await saveData('bodyFat', pendingRecords, userId);
    status.batchesSaved++;
  }

  if (!foundFirstRecord) {
    console.log('Warning: No body fat records were found in the entire file');
  }

  console.log(`Body fat processing complete:
    - Total records processed: ${recordsProcessed}
    - Valid body fat records found: ${validRecords}
    - Invalid type records: ${invalidTypeRecords}
    - Invalid value records: ${invalidValueRecords}
    - Invalid date records: ${invalidDateRecords}
    - Duplicate records: ${duplicateRecords}
    - Skipped records: ${skippedRecords}
    - Total batches saved: ${status.batchesSaved}
    - Records unchanged after: ${unchangedIterations * 10000} records
    - All record types seen: ${Array.from(seenTypes).join(', ')}
  `);
}

async function processHeartRate(xmlKey: string, status: ProcessingStatus): Promise<void> {
  const userId = status.userId;
  if (!userId) throw new Error('User ID is required');

  console.log('Starting heart rate data processing...');
  let recordsProcessed = 0;
  let validRecords = 0;
  let pendingRecords: any[] = [];
  let lastProgressTime = Date.now();
  let lastValidRecordCount = 0;
  let unchangedIterations = 0;

  // Create a map of existing dates for quick lookup
  console.log('Fetching existing heart rate records...');
  const existingRecords = await fetchAllHealthData('heartRate', userId);
  const existingDates = new Set(existingRecords.map(record => record.date));
  console.log(`Found ${existingRecords.length} existing heart rate records`);
  
  await processS3XmlFile(xmlKey, async (recordXml) => {
    try {
      recordsProcessed++;
      
      // Log progress every 50000 records or if 30 seconds have passed
      const now = Date.now();
      if (recordsProcessed % 50000 === 0 || now - lastProgressTime > 30000) {
        console.log(`Progress update:
          - Records processed: ${recordsProcessed}
          - Valid heart rate records found: ${validRecords}
          - Pending records: ${pendingRecords.length}
          - Time since last update: ${Math.round((now - lastProgressTime) / 1000)}s
        `);
        
        // Check if we haven't found any new records in a while
        if (validRecords === lastValidRecordCount) {
          unchangedIterations++;
          if (unchangedIterations >= 10) {
            console.log('No new heart rate records found in last 500,000 records processed, likely reached end of heart rate data');
            return false; // This will stop the processing
          }
        } else {
          unchangedIterations = 0;
          lastValidRecordCount = validRecords;
        }
        
        lastProgressTime = now;
      }

      const data = parser.parse(recordXml);
      if (!data?.HealthData?.Record) return;
      
      const records = Array.isArray(data.HealthData.Record) 
        ? data.HealthData.Record 
        : [data.HealthData.Record];

      for (const record of records) {
        if (!record?.type || record.type !== 'HKQuantityTypeIdentifierHeartRate') continue;

        const value = parseFloat(record.value);
        if (isNaN(value)) continue;

        const date = new Date(record.startDate || record.creationDate || record.endDate);
        if (!date || isNaN(date.getTime())) continue;

        const isoDate = date.toISOString();
        
        // Skip if we already have this date
        if (existingDates.has(isoDate)) continue;

        // Create a single record with the exact timestamp
        const heartRateRecord = {
          date: isoDate,
          value: Math.round(value)  // Round to nearest whole number for heart rate
        };

        pendingRecords.push(heartRateRecord);
        existingDates.add(isoDate);
        validRecords++;
        status.recordsProcessed++;
        
        // Save progress every 2000 records
        if (pendingRecords.length >= 2000) {
          console.log(`Saving batch of ${pendingRecords.length} heart rate records...`);
          await saveData('heartRate', pendingRecords, userId);
          status.batchesSaved++;
          pendingRecords = [];
        }
      }
    } catch (error) {
      console.error('Error processing heart rate record:', error);
      // Continue processing despite errors
    }
  });

  // Save any remaining records
  if (pendingRecords.length > 0) {
    console.log(`Saving final batch of ${pendingRecords.length} heart rate records...`);
    await saveData('heartRate', pendingRecords, userId);
    status.batchesSaved++;
  }

  console.log(`Heart rate processing complete:
    - Total records processed: ${recordsProcessed}
    - Valid heart rate records found: ${validRecords}
    - Total batches saved: ${status.batchesSaved}
    - Records unchanged after: ${unchangedIterations * 50000} records
  `);
}

async function processHRV(xmlKey: string, status: ProcessingStatus): Promise<void> {
  const userId = status.userId;
  if (!userId) throw new Error('User ID is required');

  console.log('Starting HRV data processing...');
  let recordsProcessed = 0;
  let validRecords = 0;
  let pendingRecords: any[] = [];
  let lastProgressTime = Date.now();
  let lastValidRecordCount = 0;
  let unchangedIterations = 0;
  let skippedRecords = 0;
  let invalidTypeRecords = 0;
  let invalidValueRecords = 0;
  let invalidDateRecords = 0;
  let duplicateRecords = 0;
  let seenTypes = new Set<string>();
  let foundFirstRecord = false;
  let noRecordsThreshold = 2000000; // Increased to 2 million records
  const PROGRESS_LOG_INTERVAL = 50000;
  const BATCH_SAVE_SIZE = 50;

  // Create a map of existing dates for quick lookup
  console.log('Fetching existing HRV records...');
  const existingRecords = await fetchAllHealthData('hrv', userId);
  const existingDates = new Set(existingRecords.map(record => record.date));
  console.log(`Found ${existingRecords.length} existing HRV records`);
  
  await processS3XmlFile(xmlKey, async (recordXml) => {
    try {
      recordsProcessed++;
      
      // Quick check for HRV records before parsing
      if (!recordXml.includes('HKQuantityTypeIdentifierHeartRateVariabilitySDNN')) {
        invalidTypeRecords++;
        return;
      }

      // Log progress less frequently
      const now = Date.now();
      if (recordsProcessed % PROGRESS_LOG_INTERVAL === 0 || now - lastProgressTime > 60000) { // Changed to 60 seconds
        console.log(`Progress update:
          - Records processed: ${recordsProcessed}
          - Valid HRV records found: ${validRecords}
          - Invalid type records: ${invalidTypeRecords}
          - Invalid value records: ${invalidValueRecords}
          - Invalid date records: ${invalidDateRecords}
          - Duplicate records: ${duplicateRecords}
          - Pending records: ${pendingRecords.length}
          - Time since last update: ${Math.round((now - lastProgressTime) / 1000)}s
          - Processing speed: ${Math.round(PROGRESS_LOG_INTERVAL / ((now - lastProgressTime) / 1000))} records/second
          - Unique record types seen: ${Array.from(seenTypes).join(', ')}
        `);
        
        // Check if we've processed too many records without finding any valid ones
        if (!foundFirstRecord && recordsProcessed >= noRecordsThreshold) {
          console.log(`No HRV records found after processing ${noRecordsThreshold} records, stopping processing`);
          return false;
        }
        
        lastProgressTime = now;
      }

      const data = parser.parse(recordXml);
      if (!data?.HealthData?.Record) {
        skippedRecords++;
        return;
      }
      
      const records = Array.isArray(data.HealthData.Record) 
        ? data.HealthData.Record 
        : [data.HealthData.Record];

      for (const record of records) {
        if (record?.type) {
          seenTypes.add(record.type);
        }

        if (!record?.type || record.type !== 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN') {
          continue;
        }

        // Found a valid HRV record
        if (!foundFirstRecord) {
          console.log('\nFound first HRV record:', JSON.stringify(record, null, 2), '\n');
          foundFirstRecord = true;
        }

        const value = parseFloat(record.value);
        if (isNaN(value)) {
          invalidValueRecords++;
          continue;
        }

        const date = new Date(record.startDate || record.creationDate || record.endDate);
        if (!date || isNaN(date.getTime())) {
          invalidDateRecords++;
          continue;
        }

        const isoDate = date.toISOString();
        
        // Skip if we already have this date
        if (existingDates.has(isoDate)) {
          duplicateRecords++;
          continue;
        }

        // Create a single record with the exact timestamp
        const hrvRecord = {
          date: isoDate,
          value: Math.round(value * 100) / 100  // Round to 2 decimal places
        };

        pendingRecords.push(hrvRecord);
        existingDates.add(isoDate);
        validRecords++;
        status.recordsProcessed++;
        
        // Save progress in larger batches
        if (pendingRecords.length >= BATCH_SAVE_SIZE) {
          console.log(`Saving batch of ${pendingRecords.length} HRV records...`);
          await saveData('hrv', pendingRecords, userId);
          status.batchesSaved++;
          pendingRecords = [];
        }
      }
    } catch (error) {
      console.error('Error processing HRV record:', error);
      // Continue processing despite errors
    }
  });

  // Save any remaining records
  if (pendingRecords.length > 0) {
    console.log(`Saving final batch of ${pendingRecords.length} HRV records...`);
    await saveData('hrv', pendingRecords, userId);
    status.batchesSaved++;
  }

  if (!foundFirstRecord) {
    console.log('Warning: No HRV records were found in the entire file');
  }

  console.log(`HRV processing complete:
    - Total records processed: ${recordsProcessed}
    - Valid HRV records found: ${validRecords}
    - Invalid type records: ${invalidTypeRecords}
    - Invalid value records: ${invalidValueRecords}
    - Invalid date records: ${invalidDateRecords}
    - Duplicate records: ${duplicateRecords}
    - Skipped records: ${skippedRecords}
    - Total batches saved: ${status.batchesSaved}
    - Records unchanged after: ${unchangedIterations * 10000} records
    - All record types seen: ${Array.from(seenTypes).join(', ')}
  `);
}

async function processVO2Max(xmlKey: string, status: ProcessingStatus): Promise<void> {
  console.log('⚡️ processVO2Max: Starting execution');
  
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
  let appleWatchRecords = 0;
  let otherSourceRecords = 0;
  let firstRecordLogged = false;
  
  console.log('🔍 processVO2Max: Fetching existing records...');
  const existingRecords = await fetchAllHealthData('vo2max', userId);
  const existingDates = new Set(existingRecords.map(record => record.date));
  console.log(`📊 processVO2Max: Found ${existingRecords.length} existing records`);
  
  const saveBatch = async () => {
    if (pendingRecords.length > 0) {
      console.log(`💾 processVO2Max: Saving batch of ${pendingRecords.length} records...`);
      await saveData('vo2max', pendingRecords, userId);
      status.batchesSaved++;
      pendingRecords = [];
    }
  };
  
  try {
    console.log('📑 processVO2Max: Starting S3 file processing...');
    await processS3XmlFile(xmlKey, async (recordXml) => {
      try {
        recordsProcessed++;
        
        // Log progress and check memory usage every 1000 records
        if (recordsProcessed % 1000 === 0) {
          const currentMemory = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
          const memoryDelta = currentMemory - lastMemoryUsage;
          lastMemoryUsage = currentMemory;
          
          console.log(`⏳ processVO2Max progress:
            Records processed: ${recordsProcessed}
            Valid records: ${validRecords}
            Skipped records: ${skippedRecords}
            Apple Watch records: ${appleWatchRecords}
            Other source records: ${otherSourceRecords}
            Memory usage: ${currentMemory}MB (${memoryDelta > 0 ? '+' : ''}${memoryDelta}MB)
            Processing rate: ${Math.round(recordsProcessed / ((Date.now() - startTime) / 1000))} records/sec
          `);
          
          // Check if we're finding new records
          if (validRecords === lastValidRecordCount) {
            noNewRecordsCount++;
            if (noNewRecordsCount >= 20) {
              console.log('⚠️ No new VO2 max records found in last 20,000 records, stopping processing');
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

        // Quick check for VO2 max records before parsing - exact match
        if (!recordXml.includes('HKQuantityTypeIdentifierVO2Max')) {
          skippedRecords++;
          return;
        }
        
        const data = parser.parse(recordXml);
        
        if (!data?.HealthData?.Record) {
          console.log('⚠️ processVO2Max: No Record found in data');
          return;
        }
        
        const records = Array.isArray(data.HealthData.Record) 
          ? data.HealthData.Record 
          : [data.HealthData.Record];

        for (const record of records) {
          // Exact type check
          if (!record?.type || record.type !== 'HKQuantityTypeIdentifierVO2Max') {
            skippedRecords++;
            continue;
          }

          // Log the first record of each type we encounter
          if (!firstRecordLogged) {
            console.log('First VO2 max record encountered:', JSON.stringify(record, null, 2));
            firstRecordLogged = true;
          }

          const value = parseFloat(record.value);
          if (isNaN(value)) {
            console.log('⚠️ processVO2Max: Invalid value:', value);
            continue;
          }

          const date = new Date(record.startDate || record.creationDate || record.endDate);
          if (!date || isNaN(date.getTime())) {
            console.log('⚠️ processVO2Max: Invalid date');
            continue;
          }

          const isoDate = date.toISOString();
          if (existingDates.has(isoDate)) {
            skippedRecords++;
            continue;
          }

          // Track record sources
          if (record.sourceName) {
            if (record.sourceName.toLowerCase().includes('apple watch')) {
              appleWatchRecords++;
            } else {
              otherSourceRecords++;
            }
          }

          // Create VO2 max record with source information
          const vo2MaxRecord: HealthRecord = {
            date: isoDate,
            value: Math.round(value * 10) / 10, // Round to 1 decimal place
            source: record.sourceName || 'unknown',
            unit: record.unit || 'mL/min·kg' // Use exact unit from Apple Health
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
            
            vo2MaxRecord.metadata = metadata;
          }

          pendingRecords.push(vo2MaxRecord);
          existingDates.add(isoDate);
          validRecords++;
          status.recordsProcessed++;
          
          // Save batch when it reaches the threshold
          if (pendingRecords.length >= 50) {
            await saveBatch();
          }
        }
      } catch (error) {
        console.error('❌ processVO2Max: Error processing record:', error);
        // Log the problematic record for debugging
        console.error('Problematic record:', recordXml);
        // Continue processing despite errors
      }
    });
    
    // Save any remaining records
    await saveBatch();
    
    console.log(`✅ processVO2Max: Completed processing
      Total records processed: ${recordsProcessed}
      Valid records: ${validRecords}
      Skipped records: ${skippedRecords}
      Apple Watch records: ${appleWatchRecords}
      Other source records: ${otherSourceRecords}
      Total time: ${Math.round((Date.now() - startTime) / 1000)}s
      Final memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB
    `);
    
  } catch (error) {
    console.error('❌ processVO2Max: Fatal error:', error);
    throw error;
  }
}

export async function processHealthData(xmlKey: string, userId: string, jobId: string): Promise<{ recordsProcessed: number; recordTypes: string[] }> {
  console.log('\nStarting health data processing...');
  console.log('XML file to process:', xmlKey);
  
  const status: ProcessingStatus = {
    recordsProcessed: 0,
    batchesSaved: 0,
    status: 'processing',
    userId
  };

  const recordTypes: string[] = [];

  try {
    // Process weight first
    console.log('\n=== Starting Weight Processing ===');
    status.status = 'processing weight';
    await updateProcessingJobProgress(jobId, 0, 5, 'Processing weight data...');
    try {
      await processWeight(xmlKey, status);
      console.log('Weight processing completed successfully');
      recordTypes.push('weight');
    } catch (error) {
      console.error('Error during weight processing:', error);
      throw error;
    }

    // Then body fat
    console.log('\n=== Starting Body Fat Processing ===');
    status.status = 'processing bodyFat';
    await updateProcessingJobProgress(jobId, 1, 5, 'Processing body fat data...');
    try {
      await processBodyFat(xmlKey, status);
      console.log('Body fat processing completed successfully');
      console.log('Preparing to start HRV processing...');
      recordTypes.push('bodyFat');
    } catch (error) {
      console.error('Error during body fat processing:', error);
      throw error;
    }

    // Then HRV
    console.log('\n=== Starting HRV Processing ===');
    status.status = 'processing hrv';
    await updateProcessingJobProgress(jobId, 2, 5, 'Processing HRV data...');
    try {
      await processHRV(xmlKey, status);
      console.log('HRV processing completed successfully');
      recordTypes.push('hrv');
    } catch (error) {
      console.error('Error during HRV processing:', error);
      throw error;
    }

    // Then VO2 max
    console.log('\n=== Starting VO2 Max Processing ===');
    status.status = 'processing vo2max';
    await updateProcessingJobProgress(jobId, 3, 5, 'Processing VO2 max data...');
    try {
      await processVO2Max(xmlKey, status);
      console.log('VO2 max processing completed successfully');
      recordTypes.push('vo2max');
    } catch (error) {
      console.error('Error during VO2 max processing:', error);
      throw error;
    }

    // Temporarily skip heart rate processing
    console.log('\n=== Skipping Heart Rate Processing ===');
    await updateProcessingJobProgress(jobId, 4, 5, 'Processing heart rate data...');

    console.log('\n=== Processing Complete ===');
    console.log('Total records processed:', status.recordsProcessed);
    console.log('Total batches saved:', status.batchesSaved);
    console.log('Status:', status.status);
    
    return {
      recordsProcessed: status.recordsProcessed,
      recordTypes
    };
  } catch (error) {
    console.error('\n=== Processing Error ===');
    console.error('Error details:', error);
    status.status = 'error';
    status.error = error instanceof Error ? error.message : 'Unknown error';
    throw error;
  }
}