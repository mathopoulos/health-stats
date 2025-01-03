import fs from 'fs';
import path from 'path';
import { Transform } from 'stream';
import { createReadStream } from 'fs';
import { parseString } from 'xml2js';
import { promisify } from 'util';

const parseXML = promisify(parseString);

interface HeartRateRecord {
  date: string;
  value: number;
  sourceName: string;
  unit: string;
  startTime: string;
  endTime: string;
}

async function extractHeartRate() {
  console.log('Starting heart rate data extraction...');
  
  const inputPath = path.join(process.cwd(), 'public', 'export.xml');
  const outputPath = path.join(process.cwd(), 'public', 'data', 'heartRate.json');

  // Check if input file exists
  try {
    if (!fs.existsSync(inputPath)) {
      console.error('export.xml file not found in public directory');
      return;
    }
    const stats = fs.statSync(inputPath);
    console.log(`Found export.xml file (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  } catch (error) {
    console.error('Error checking export.xml:', error);
    return;
  }

  // Create data directory if it doesn't exist
  const dataDir = path.join(process.cwd(), 'public', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('Created data directory');
  }
  console.log('Ensured data directory exists');

  // Initialize or read existing data
  let heartRateData: HeartRateRecord[] = [];
  if (fs.existsSync(outputPath)) {
    try {
      const existingData = fs.readFileSync(outputPath, 'utf8');
      heartRateData = JSON.parse(existingData);
      console.log(`Loaded ${heartRateData.length} existing records`);
    } catch (error) {
      console.error('Error reading existing data, starting fresh:', error);
    }
  }

  let xmlChunk = '';
  let recordsProcessed = 0;
  let heartRateRecordsFound = heartRateData.length;
  let bytesProcessed = 0;
  let shouldStop = false;  // Add flag to control when to stop

  // Get the date 30 days ago for a good amount of historical data
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return new Promise((resolve, reject) => {
    console.log('Starting to read export.xml...');
    
    const stream = createReadStream(inputPath, { 
      encoding: 'utf-8',
      highWaterMark: 64 * 1024 // Read in 64KB chunks
    })
      .pipe(new Transform({
        async transform(chunk, encoding, callback) {
          try {
            // If we should stop, just pass through the chunk without processing
            if (shouldStop) {
              callback();
              return;
            }

            bytesProcessed += chunk.length;
            xmlChunk += chunk;
            
            // Look for complete heart rate records
            const matches = xmlChunk.match(/<Record type="HKQuantityTypeIdentifierHeartRate"[^>]*>[\s\S]*?<\/Record>/g) || [];
            
            for (const record of matches) {
              if (shouldStop) break;
              
              recordsProcessed++;
              if (recordsProcessed % 100 === 0) {
                console.log(`Processed ${recordsProcessed} records, found ${heartRateRecordsFound} heart rate records...`);
                console.log(`Processed ${(bytesProcessed / 1024 / 1024).toFixed(2)} MB`);
              }
              
              try {
                const result = await parseXML(record);
                const recordData = (result as any).Record.$;
                
                if (recordData.type === 'HKQuantityTypeIdentifierHeartRate' && recordData.unit === 'count/min') {
                  // Parse the date, considering timezone
                  const startDate = new Date(recordData.startDate);
                  const endDate = new Date(recordData.endDate);
                  const dateStr = startDate.toISOString().split('T')[0];
                  
                  if (startDate >= thirtyDaysAgo) {
                    const newRecord: HeartRateRecord = {
                      date: dateStr,
                      value: parseFloat(recordData.value),
                      sourceName: recordData.sourceName,
                      unit: recordData.unit,
                      startTime: startDate.toISOString(),
                      endTime: endDate.toISOString()
                    };
                    heartRateData.push(newRecord);
                    heartRateRecordsFound++;

                    // Only write to file every 100 records to reduce disk I/O
                    if (heartRateRecordsFound % 100 === 0) {
                      fs.writeFileSync(outputPath, JSON.stringify(heartRateData, null, 2), 'utf8');
                      console.log(`Saved ${heartRateRecordsFound} records to file...`);
                    }

                    // Set flag to stop after finding 100000 records
                    if (heartRateRecordsFound >= 100000) {
                      console.log('Found 100000 records, stopping...');
                      // Write final data before stopping
                      fs.writeFileSync(outputPath, JSON.stringify(heartRateData, null, 2), 'utf8');
                      shouldStop = true;
                      resolve(heartRateData);
                      return;
                    }
                  }
                }
              } catch (error) {
                console.error('Error processing record:', error);
                continue;
              }
            }

            // Keep only the last partial record if we're not stopping
            if (!shouldStop) {
              const lastRecordStart = xmlChunk.lastIndexOf('<Record type="HKQuantityTypeIdentifierHeartRate"');
              if (lastRecordStart !== -1) {
                xmlChunk = xmlChunk.slice(lastRecordStart);
              } else {
                xmlChunk = '';
              }
            }

            callback();
          } catch (error) {
            console.error('Error in transform:', error);
            callback(error instanceof Error ? error : new Error(String(error)));
          }
        }
      }));

    stream.on('end', () => {
      if (shouldStop) return; // Already resolved

      console.log(`Finished processing ${recordsProcessed} total records`);
      console.log(`Found ${heartRateRecordsFound} heart rate records`);
      console.log(`Total data processed: ${(bytesProcessed / 1024 / 1024).toFixed(2)} MB`);
      
      if (heartRateRecordsFound === 0) {
        console.log('No heart rate records found. Sample of last XML chunk:', xmlChunk.slice(0, 500));
        resolve([]);
        return;
      }

      resolve(heartRateData);
    });

    stream.on('error', (error) => {
      console.error('Error reading file:', error);
      reject(error);
    });
  });
}

// Run the extraction
console.log('Starting heart rate extraction script...');
extractHeartRate()
  .then(() => {
    console.log('Extraction completed successfully');
    process.exit(0);  // Ensure the process exits after completion
  })
  .catch(error => {
    console.error('Extraction failed:', error);
    process.exit(1);  // Exit with error code
  }); 