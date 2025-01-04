import { XMLParser } from 'fast-xml-parser/src/fxp';
import { processS3XmlFile, generatePresignedUploadUrl, fetchAllHealthData } from './s3';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  textNodeName: "value",
  parseAttributeValue: true,
  ignoreDeclaration: true,
  trimValues: true,
  isArray: (name: string) => name === "Record",
  allowBooleanAttributes: true,
  parseTagValue: true,
  cdataPropName: "value",
  stopNodes: ["*.value"]
});

const BATCH_SIZE = 1000; // Smaller batch size for more frequent updates

interface ProcessingStatus {
  recordsProcessed: number;
  batchesSaved: number;
  status: 'pending' | 'processing' | 'processing weight' | 'processing body fat' | 'processing heart rate' | 'completed' | 'error';
  error?: string;
}

async function saveData(type: 'weight' | 'bodyFat' | 'heartRate', newData: any[]): Promise<void> {
  if (newData.length === 0) return;

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  async function attemptSave(attempt: number = 0): Promise<void> {
    try {
      console.log(`Fetching existing ${type} data (attempt ${attempt + 1})...`);
      const existingData = await fetchAllHealthData(type);
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
        const url = await generatePresignedUploadUrl(`data/${type}.json`, 'application/json');
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
      const url = await generatePresignedUploadUrl(`data/${type}.json`, 'application/json');
      
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
  console.log('Starting weight data processing...');
  let recordsProcessed = 0;
  let validRecords = 0;
  let pendingRecords: any[] = [];
  let lastProgressTime = Date.now();
  let lastValidRecordCount = 0;
  let unchangedIterations = 0;
  
  // Create a map of existing dates for quick lookup
  console.log('Fetching existing weight records...');
  const existingRecords = await fetchAllHealthData('weight');
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
          await saveData('weight', pendingRecords);
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
    await saveData('weight', pendingRecords);
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
  console.log('Starting body fat data processing...');
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
  
  // Create a map of existing dates for quick lookup
  console.log('Fetching existing body fat records...');
  const existingRecords = await fetchAllHealthData('bodyFat');
  const existingDates = new Set(existingRecords.map(record => record.date));
  console.log(`Found ${existingRecords.length} existing body fat records`);
  
  await processS3XmlFile(xmlKey, async (recordXml) => {
    try {
      recordsProcessed++;
      
      // Log progress every 10000 records or if 30 seconds have passed
      const now = Date.now();
      if (recordsProcessed % 10000 === 0 || now - lastProgressTime > 30000) {
        console.log(`Progress update:
          - Records processed: ${recordsProcessed}
          - Valid body fat records found: ${validRecords}
          - Invalid type records: ${invalidTypeRecords}
          - Invalid value records: ${invalidValueRecords}
          - Invalid date records: ${invalidDateRecords}
          - Duplicate records: ${duplicateRecords}
          - Pending records: ${pendingRecords.length}
          - Time since last update: ${Math.round((now - lastProgressTime) / 1000)}s
          - Unique record types seen: ${Array.from(seenTypes).join(', ')}
        `);
        
        // Only check for no new records if we've found at least one record
        if (foundFirstRecord) {
          if (validRecords === lastValidRecordCount) {
            unchangedIterations++;
            if (unchangedIterations >= 10) {
              console.log('No new body fat records found in last 100,000 records processed after finding some records, stopping processing');
              return false; // This will stop the processing
            }
          } else {
            unchangedIterations = 0;
            lastValidRecordCount = validRecords;
          }
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
          await saveData('bodyFat', pendingRecords);
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
    await saveData('bodyFat', pendingRecords);
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
  console.log('Starting heart rate data processing...');
  let recordsProcessed = 0;
  let validRecords = 0;
  let pendingRecords: any[] = [];
  let lastProgressTime = Date.now();
  let lastValidRecordCount = 0;
  let unchangedIterations = 0;
  
  // Create a map of existing dates for quick lookup
  console.log('Fetching existing heart rate records...');
  const existingRecords = await fetchAllHealthData('heartRate');
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
        
        // Save progress every 2000 records (40x more than weight/body fat)
        if (pendingRecords.length >= 2000) {
          console.log(`Saving batch of ${pendingRecords.length} heart rate records...`);
          await saveData('heartRate', pendingRecords);
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
    await saveData('heartRate', pendingRecords);
    status.batchesSaved++;
  }

  console.log(`Heart rate processing complete:
    - Total records processed: ${recordsProcessed}
    - Valid heart rate records found: ${validRecords}
    - Total batches saved: ${status.batchesSaved}
    - Records unchanged after: ${unchangedIterations * 50000} records
  `);
}

export async function processHealthData(xmlKey: string): Promise<ProcessingStatus> {
  console.log('\nStarting health data processing...');
  console.log('XML file to process:', xmlKey);
  
  const status: ProcessingStatus = {
    recordsProcessed: 0,
    batchesSaved: 0,
    status: 'processing'
  };

  try {
    // Process weight first
    console.log('\n=== Starting Weight Processing ===');
    status.status = 'processing weight';
    await processWeight(xmlKey, status);
    console.log('Weight processing completed successfully');

    // Then body fat
    console.log('\n=== Starting Body Fat Processing ===');
    status.status = 'processing body fat';
    await processBodyFat(xmlKey, status);
    console.log('Body fat processing completed successfully');

    // Temporarily skip heart rate processing
    console.log('\n=== Skipping Heart Rate Processing ===');
    // console.log('\n=== Starting Heart Rate Processing ===');
    // status.status = 'processing heart rate';
    // await processHeartRate(xmlKey, status);
    // console.log('Heart rate processing completed successfully');

    status.status = 'completed';
    console.log('\n=== All Processing Complete ===');
    console.log('Total records processed:', status.recordsProcessed);
    console.log('Total batches saved:', status.batchesSaved);
    return status;
  } catch (error) {
    console.error('\n=== Processing Error ===');
    console.error('Error details:', error);
    status.status = 'error';
    status.error = error instanceof Error ? error.message : 'Unknown error';
    throw error;
  }
} 