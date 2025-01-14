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
  let duplicateRecords = 0;
  let invalidDateRecords = 0;
  let invalidValueRecords = 0;
  let datesByMonth: Record<string, number> = {};
  
  console.log('🔍 processWeight: Fetching existing records...');
  const existingRecords = await fetchAllHealthData('weight', userId);
  const existingDates = new Set(existingRecords.map(record => record.date));
  console.log(`📊 processWeight: Found ${existingRecords.length} existing records`);
  
  // Log distribution of existing records by month
  existingRecords.forEach(record => {
    const month = record.date.substring(0, 7); // YYYY-MM format
    datesByMonth[month] = (datesByMonth[month] || 0) + 1;
  });
  console.log('📅 Existing records by month:', datesByMonth);
  
  const saveBatch = async () => {
    if (pendingRecords.length > 0) {
      console.log(`💾 processWeight: Saving batch of ${pendingRecords.length} records...`);
      try {
        await saveData('weight', pendingRecords, userId);
        status.batchesSaved++;
        
        // Log the date range of saved records
        const dates = pendingRecords.map(r => r.date).sort();
        console.log(`📅 Saved records from ${dates[0]} to ${dates[dates.length - 1]}`);
        
        pendingRecords = [];
      } catch (error) {
        console.error('❌ Error saving batch:', error);
        throw error;
      }
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
            Duplicate records: ${duplicateRecords}
            Invalid date records: ${invalidDateRecords}
            Invalid value records: ${invalidValueRecords}
            Withings records: ${withingsRecords}
            Eufy records: ${eufyRecords}
            Other source records: ${otherSourceRecords}
            Memory usage: ${currentMemory}MB (${memoryDelta > 0 ? '+' : ''}${memoryDelta}MB)
            Processing rate: ${Math.round(recordsProcessed / ((Date.now() - startTime) / 1000))} records/sec
          `);
          
          // Check if we're finding new records
          if (validRecords === lastValidRecordCount) {
            noNewRecordsCount++;
            if (noNewRecordsCount >= 50) { // Increased threshold significantly
              console.log('⚠️ No new weight records found in last 50,000 records, stopping processing');
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
            console.log('⚠️ processWeight: Invalid value:', record.value);
            invalidValueRecords++;
            continue;
          }

          const date = new Date(record.startDate || record.creationDate || record.endDate);
          if (!date || isNaN(date.getTime())) {
            console.log('⚠️ processWeight: Invalid date:', record.startDate || record.creationDate || record.endDate);
            invalidDateRecords++;
            continue;
          }

          const isoDate = date.toISOString();
          const month = isoDate.substring(0, 7); // YYYY-MM format
          
          if (existingDates.has(isoDate)) {
            duplicateRecords++;
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
          datesByMonth[month] = (datesByMonth[month] || 0) + 1;
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
    
    // Log final distribution of records by month
    console.log('📅 Final records by month:', datesByMonth);
    
    console.log(`✅ processWeight: Completed processing
      Total records processed: ${recordsProcessed}
      Valid records: ${validRecords}
      Skipped records: ${skippedRecords}
      Duplicate records: ${duplicateRecords}
      Invalid date records: ${invalidDateRecords}
      Invalid value records: ${invalidValueRecords}
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

async function processBodyFat(xmlKey: string, status: ProcessingStatus): Promise<void> {
  console.log('⚡️ processBodyFat: Starting execution');
  
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
  let otherSourceRecords = 0;
  let firstRecordLogged = false;
  
  console.log('🔍 processBodyFat: Fetching existing records...');
  const existingRecords = await fetchAllHealthData('bodyFat', userId);
  const existingDates = new Set(existingRecords.map(record => record.date));
  console.log(`📊 processBodyFat: Found ${existingRecords.length} existing records`);
  
  const saveBatch = async () => {
    if (pendingRecords.length > 0) {
      console.log(`💾 processBodyFat: Saving batch of ${pendingRecords.length} records...`);
      await saveData('bodyFat', pendingRecords, userId);
      status.batchesSaved++;
      pendingRecords = [];
    }
  };
  
  try {
    console.log('📑 processBodyFat: Starting S3 file processing...');
    await processS3XmlFile(xmlKey, async (recordXml) => {
      try {
        recordsProcessed++;
        
        // Log progress and check memory usage every 1000 records
        if (recordsProcessed % 1000 === 0) {
          const currentMemory = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
          const memoryDelta = currentMemory - lastMemoryUsage;
          lastMemoryUsage = currentMemory;
          
          console.log(`⏳ processBodyFat progress:
            Records processed: ${recordsProcessed}
            Valid records: ${validRecords}
            Skipped records: ${skippedRecords}
            Withings records: ${withingsRecords}
            Other source records: ${otherSourceRecords}
            Memory usage: ${currentMemory}MB (${memoryDelta > 0 ? '+' : ''}${memoryDelta}MB)
            Processing rate: ${Math.round(recordsProcessed / ((Date.now() - startTime) / 1000))} records/sec
          `);
          
          // Check if we're finding new records
          if (validRecords === lastValidRecordCount) {
            noNewRecordsCount++;
            if (noNewRecordsCount >= 20) { // Increased threshold to account for sparse records
              console.log('⚠️ No new body fat records found in last 20,000 records, stopping processing');
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
        
        // Quick check for body fat records before parsing
        if (!recordXml.includes('HKQuantityTypeIdentifierBodyFatPercentage')) {
          skippedRecords++;
          return;
        }
        
        const data = parser.parse(recordXml);
        
        if (!data?.HealthData?.Record) {
          console.log('⚠️ processBodyFat: No Record found in data');
          return;
        }
        
        const records = Array.isArray(data.HealthData.Record) 
          ? data.HealthData.Record 
          : [data.HealthData.Record];

        for (const record of records) {
          if (!record?.type || record.type !== 'HKQuantityTypeIdentifierBodyFatPercentage') {
            skippedRecords++;
            continue;
          }

          // Log the first record of each type we encounter
          if (!firstRecordLogged) {
            console.log('First body fat record encountered:', JSON.stringify(record, null, 2));
            firstRecordLogged = true;
          }

          const value = parseFloat(record.value);
          if (isNaN(value)) {
            console.log('⚠️ processBodyFat: Invalid value');
            continue;
          }

          const date = new Date(record.startDate || record.creationDate || record.endDate);
          if (!date || isNaN(date.getTime())) {
            console.log('⚠️ processBodyFat: Invalid date');
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
              default:
                otherSourceRecords++;
                break;
            }
          }

          // Create body fat record with source information
          const bodyFatRecord: HealthRecord = {
            date: isoDate,
            value: value * 100, // Convert decimal to percentage
            source: record.sourceName || 'unknown',
            unit: record.unit || '%'
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
            bodyFatRecord.metadata = metadata;
          }

          pendingRecords.push(bodyFatRecord);
          existingDates.add(isoDate);
          validRecords++;
          status.recordsProcessed++;
          
          // Save batch when it reaches the threshold
          if (pendingRecords.length >= 50) {
            await saveBatch();
          }
        }
      } catch (error) {
        console.error('❌ processBodyFat: Error processing record:', error);
        // Log the problematic record for debugging
        console.error('Problematic record:', recordXml);
        // Continue processing despite errors
      }
    });
    
    // Save any remaining records
    await saveBatch();
    
    console.log(`✅ processBodyFat: Completed processing
      Total records processed: ${recordsProcessed}
      Valid records: ${validRecords}
      Skipped records: ${skippedRecords}
      Withings records: ${withingsRecords}
      Other source records: ${otherSourceRecords}
      Total time: ${Math.round((Date.now() - startTime) / 1000)}s
      Final memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB
    `);
    
  } catch (error) {
    console.error('❌ processBodyFat: Fatal error:', error);
    throw error;
  }
}

async function processHRV(xmlKey: string, status: ProcessingStatus): Promise<void> {
  console.log('⚡️ processHRV: Starting execution');
  
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
  let sleepRecords = 0;
  let wakeRecords = 0;
  let workoutRecords = 0;
  
  console.log('🔍 processHRV: Fetching existing records...');
  const existingRecords = await fetchAllHealthData('hrv', userId);
  const existingDates = new Set(existingRecords.map(record => record.date));
  console.log(`📊 processHRV: Found ${existingRecords.length} existing records`);
  
  const saveBatch = async () => {
    if (pendingRecords.length > 0) {
      console.log(`💾 processHRV: Saving batch of ${pendingRecords.length} records...`);
      await saveData('hrv', pendingRecords, userId);
      status.batchesSaved++;
      pendingRecords = [];
    }
  };
  
  try {
    console.log('📑 processHRV: Starting S3 file processing...');
    await processS3XmlFile(xmlKey, async (recordXml) => {
      try {
        recordsProcessed++;
        
        // Log progress and check memory usage every 2000 records
        if (recordsProcessed % 2000 === 0) {
          const currentMemory = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
          const memoryDelta = currentMemory - lastMemoryUsage;
          lastMemoryUsage = currentMemory;
          
          console.log(`⏳ processHRV progress:
            Records processed: ${recordsProcessed}
            Valid records: ${validRecords}
            Skipped records: ${skippedRecords}
            Apple Watch records: ${appleWatchRecords}
            Other source records: ${otherSourceRecords}
            Sleep context: ${sleepRecords}
            Wake context: ${wakeRecords}
            Workout context: ${workoutRecords}
            Memory usage: ${currentMemory}MB (${memoryDelta > 0 ? '+' : ''}${memoryDelta}MB)
            Processing rate: ${Math.round(recordsProcessed / ((Date.now() - startTime) / 1000))} records/sec
          `);
          
          // Check if we're finding new records
          if (validRecords === lastValidRecordCount) {
            noNewRecordsCount++;
            if (noNewRecordsCount >= 30) { // Adjusted threshold for HRV data
              console.log('⚠️ No new HRV records found in last 60,000 records, stopping processing');
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
        
        // Quick check for HRV records before parsing
        if (!recordXml.includes('HKQuantityTypeIdentifierHeartRateVariabilitySDNN')) {
          skippedRecords++;
          return;
        }
        
        const data = parser.parse(recordXml);
        
        if (!data?.HealthData?.Record) {
          console.log('⚠️ processHRV: No Record found in data');
          return;
        }
        
        const records = Array.isArray(data.HealthData.Record) 
          ? data.HealthData.Record 
          : [data.HealthData.Record];

        for (const record of records) {
          if (!record?.type || record.type !== 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN') {
            skippedRecords++;
            continue;
          }

          // Log the first record of each type we encounter
          if (!firstRecordLogged) {
            console.log('First HRV record encountered:', JSON.stringify(record, null, 2));
            firstRecordLogged = true;
          }

          const value = parseFloat(record.value);
          if (isNaN(value) || value < 0 || value > 500) { // Basic HRV range validation
            console.log('⚠️ processHRV: Invalid value or out of normal range:', value);
            continue;
          }

          const date = new Date(record.startDate || record.creationDate || record.endDate);
          if (!date || isNaN(date.getTime())) {
            console.log('⚠️ processHRV: Invalid date');
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
              case 'apple watch':
                appleWatchRecords++;
                break;
              default:
                otherSourceRecords++;
                break;
            }
          }

          // Create HRV record with source information
          const hrvRecord: HealthRecord = {
            date: isoDate,
            value: Math.round(value * 100) / 100, // Round to 2 decimal places
            source: record.sourceName || 'unknown',
            unit: record.unit || 'ms'
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
            
            // Track context-specific records
            if (metadata['HKContextType']) {
              switch (metadata['HKContextType']) {
                case 'HKContextTypeSleep':
                  sleepRecords++;
                  break;
                case 'HKContextTypeWake':
                  wakeRecords++;
                  break;
                case 'HKContextTypeWorkout':
                  workoutRecords++;
                  break;
              }
              metadata['context'] = metadata['HKContextType'];
            }
            
            hrvRecord.metadata = metadata;
          }

          pendingRecords.push(hrvRecord);
          existingDates.add(isoDate);
          validRecords++;
          status.recordsProcessed++;
          
          // Save batch when it reaches the threshold
          if (pendingRecords.length >= 50) {
            await saveBatch();
          }
        }
      } catch (error) {
        console.error('❌ processHRV: Error processing record:', error);
        // Log the problematic record for debugging
        console.error('Problematic record:', recordXml);
        // Continue processing despite errors
      }
    });
    
    // Save any remaining records
    await saveBatch();
    
    console.log(`✅ processHRV: Completed processing
      Total records processed: ${recordsProcessed}
      Valid records: ${validRecords}
      Skipped records: ${skippedRecords}
      Apple Watch records: ${appleWatchRecords}
      Other source records: ${otherSourceRecords}
      Sleep context: ${sleepRecords}
      Wake context: ${wakeRecords}
      Workout context: ${workoutRecords}
      Total time: ${Math.round((Date.now() - startTime) / 1000)}s
      Final memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB
    `);
    
  } catch (error) {
    console.error('❌ processHRV: Fatal error:', error);
    throw error;
  }
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
  const existingRecords = await fetchAllHealthData('vo2Max', userId);
  const existingDates = new Set(existingRecords.map(record => record.date));
  console.log(`📊 processVO2Max: Found ${existingRecords.length} existing records`);
  
  const saveBatch = async () => {
    if (pendingRecords.length > 0) {
      console.log(`💾 processVO2Max: Saving batch of ${pendingRecords.length} records...`);
      await saveData('vo2Max', pendingRecords, userId);
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
        
        // Quick check for VO2 max records before parsing
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
          if (isNaN(value) || value < 10 || value > 100) { // Basic VO2 max range validation
            console.log('⚠️ processVO2Max: Invalid value or out of normal range:', value);
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
            switch (record.sourceName.toLowerCase()) {
              case 'apple watch':
                appleWatchRecords++;
                break;
              default:
                otherSourceRecords++;
                break;
            }
          }

          // Create VO2 max record with source information
          const vo2MaxRecord: HealthRecord = {
            date: isoDate,
            value: Math.round(value * 10) / 10, // Round to 1 decimal place
            source: record.sourceName || 'unknown',
            unit: record.unit || 'mL/kg/min'
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

    // Process weight data
    console.log('📊 Starting weight data processing...');
    status.status = 'processing weight';
    await updateJobProgress(jobId, 0, 4, 'Processing weight data...');
    await processWeight(xmlKey, status);
    recordTypes.push('weight');
    console.log('✅ Weight data processing complete');

    // Process body fat data
    console.log('📊 Starting body fat data processing...');
    status.status = 'processing bodyFat';
    await updateJobProgress(jobId, 1, 4, 'Processing body fat data...');
    await processBodyFat(xmlKey, status);
    recordTypes.push('bodyFat');
    console.log('✅ Body fat data processing complete');

    // Process HRV data
    console.log('📊 Starting HRV data processing...');
    status.status = 'processing hrv';
    await updateJobProgress(jobId, 2, 4, 'Processing HRV data...');
    await processHRV(xmlKey, status);
    recordTypes.push('hrv');
    console.log('✅ HRV data processing complete');

    // Process VO2 max data
    console.log('📊 Starting VO2 max data processing...');
    status.status = 'processing vo2Max';
    await updateJobProgress(jobId, 3, 4, 'Processing VO2 max data...');
    await processVO2Max(xmlKey, status);
    recordTypes.push('vo2Max');
    console.log('✅ VO2 max data processing complete');

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
💾 Total batches saved: ${status.batchesSaved}
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
        batchesSaved: status.batchesSaved,
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