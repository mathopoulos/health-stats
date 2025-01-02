import { createReadStream } from 'fs';
import { Transform } from 'stream';
import { parseString } from 'xml2js';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const parseXML = promisify(parseString);

interface WeightRecord {
  date: string;
  value: number;
  sourceName: string;
  startTime: string;
  endTime: string;
}

async function extractWeight() {
  console.log('Starting weight data extraction...');
  
  const inputPath = path.join(process.cwd(), 'public', 'export.xml');
  const outputPath = path.join(process.cwd(), 'public', 'data', 'weight.json');

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
  let weightData: WeightRecord[] = [];
  if (fs.existsSync(outputPath)) {
    try {
      const existingData = fs.readFileSync(outputPath, 'utf8');
      weightData = JSON.parse(existingData);
      console.log(`Loaded ${weightData.length} existing records`);
    } catch (error) {
      console.error('Error reading existing data, starting fresh:', error);
    }
  }

  let xmlChunk = '';
  let recordsProcessed = 0;
  let weightRecordsFound = weightData.length;
  let bytesProcessed = 0;
  let shouldStop = false;

  return new Promise((resolve, reject) => {
    console.log('Starting to read export.xml...');
    
    const stream = createReadStream(inputPath, { 
      encoding: 'utf-8',
      highWaterMark: 64 * 1024 // Read in 64KB chunks
    })
      .pipe(new Transform({
        async transform(chunk, encoding, callback) {
          try {
            if (shouldStop) {
              callback();
              return;
            }

            bytesProcessed += chunk.length;
            xmlChunk += chunk;
            
            // Look for complete weight records
            const matches = xmlChunk.match(/<Record type="HKQuantityTypeIdentifierBodyMass"[^>]*>[\s\S]*?<\/Record>/g) || [];
            
            for (const record of matches) {
              if (shouldStop) break;
              
              recordsProcessed++;
              if (recordsProcessed % 100 === 0) {
                console.log(`Processed ${recordsProcessed} records, found ${weightRecordsFound} weight records...`);
                console.log(`Processed ${(bytesProcessed / 1024 / 1024).toFixed(2)} MB`);
              }
              
              try {
                const result = await parseXML(record);
                const recordData = (result as any).Record.$;
                
                if (recordData.type === 'HKQuantityTypeIdentifierBodyMass' && recordData.unit === 'kg') {
                  const startDate = new Date(recordData.startDate);
                  const endDate = new Date(recordData.endDate);
                  const dateStr = startDate.toISOString().split('T')[0];
                  
                  const newRecord: WeightRecord = {
                    date: dateStr,
                    value: parseFloat(recordData.value),
                    sourceName: recordData.sourceName,
                    startTime: startDate.toISOString(),
                    endTime: endDate.toISOString()
                  };
                  weightData.push(newRecord);
                  weightRecordsFound++;

                  // Save every 10 records since weight measurements are less frequent
                  if (weightRecordsFound % 10 === 0) {
                    fs.writeFileSync(outputPath, JSON.stringify(weightData, null, 2), 'utf8');
                    console.log(`Saved ${weightRecordsFound} records to file...`);
                  }
                }
              } catch (error) {
                console.error('Error processing record:', error);
                continue;
              }
            }

            // Keep only the last partial record if we're not stopping
            if (!shouldStop) {
              const lastRecordStart = xmlChunk.lastIndexOf('<Record type="HKQuantityTypeIdentifierBodyMass"');
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
      console.log(`Finished processing ${recordsProcessed} total records`);
      console.log(`Found ${weightRecordsFound} weight records`);
      console.log(`Total data processed: ${(bytesProcessed / 1024 / 1024).toFixed(2)} MB`);
      
      // Save final data
      if (weightRecordsFound > 0) {
        fs.writeFileSync(outputPath, JSON.stringify(weightData, null, 2), 'utf8');
      } else {
        console.log('No weight records found');
      }
      
      resolve(weightData);
    });

    stream.on('error', (error) => {
      console.error('Error reading file:', error);
      reject(error);
    });
  });
}

// Run the extraction
console.log('Starting weight extraction script...');
extractWeight()
  .then(() => {
    console.log('Extraction completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Extraction failed:', error);
    process.exit(1);
  }); 