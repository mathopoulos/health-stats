import * as fs from 'fs';
import * as path from 'path';
import { Transform } from 'stream';

interface BodyFatRecord {
  date: string;
  value: number;
  sourceName: string;
  unit: string;
}

async function extractBodyFat() {
  const exportPath = path.join(process.cwd(), 'public', 'export.xml');
  const dataDir = path.join(process.cwd(), 'public', 'data');
  const outputPath = path.join(dataDir, 'bodyFat.json');

  // Create data directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(exportPath)) {
    console.error('export.xml not found');
    return;
  }

  console.log('Starting body fat data extraction...');
  const stats = fs.statSync(exportPath);
  console.log(`Found export.xml file (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);

  const records: BodyFatRecord[] = [];
  let currentChunk = '';
  let recordCount = 0;
  let bytesProcessed = 0;
  const maxRecords = 100000;
  const chunkSize = 64 * 1024; // 64KB chunks

  // Calculate the date four years ago from today
  const fourYearsAgo = new Date();
  fourYearsAgo.setFullYear(fourYearsAgo.getFullYear() - 4);
  console.log(`Filtering records from ${fourYearsAgo.toISOString().split('T')[0]} onwards`);

  const transform = new Transform({
    transform(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null, data?: any) => void) {
      try {
        bytesProcessed += chunk.length;
        if (bytesProcessed % (10 * 1024 * 1024) === 0) { // Log every 10MB
          console.log(`Processed ${(bytesProcessed / (1024 * 1024)).toFixed(2)} MB...`);
        }

        currentChunk += chunk.toString();
        
        // Look for complete Record elements with the exact format
        const recordRegex = /<Record type="HKQuantityTypeIdentifierBodyFatPercentage"[^>]*sourceName="[^"]*"[^>]*unit="[^"]*"[^>]*startDate="[^"]*"[^>]*value="[^"]*"[^>]*>/g;
        const matches = currentChunk.match(recordRegex) || [];
        
        console.log(`Found ${matches.length} potential body fat records in current chunk`);
        
        for (const match of matches) {
          const sourceNameMatch = match.match(/sourceName="([^"]*)"/);
          const dateMatch = match.match(/startDate="([^"]*)"/);
          const valueMatch = match.match(/value="([^"]*)"/);
          const unitMatch = match.match(/unit="([^"]*)"/);
          
          if (dateMatch && valueMatch && sourceNameMatch && unitMatch) {
            const date = dateMatch[1].split(' ')[0]; // Get just the date part
            const recordDate = new Date(date);
            
            // Only include records from the last 4 years
            if (recordDate >= fourYearsAgo) {
              const value = parseFloat(valueMatch[1]) * 100; // Convert to percentage
              const sourceName = sourceNameMatch[1];
              const unit = unitMatch[1];
              
              if (!isNaN(value)) {
                records.push({ date, value, sourceName, unit });
                recordCount++;
                
                if (recordCount % 10 === 0) {
                  console.log(`Found ${recordCount} body fat records from the last 4 years...`);
                }
              }
            }
          }
        }
        
        // Keep only the last potential incomplete record
        const lastRecordStart = currentChunk.lastIndexOf('<Record');
        if (lastRecordStart !== -1) {
          currentChunk = currentChunk.slice(lastRecordStart);
        } else {
          currentChunk = '';
        }
        
        callback();
      } catch (error) {
        console.error('Error processing chunk:', error);
        callback(error instanceof Error ? error : new Error(String(error)));
      }
    }
  });

  console.log('Starting to read export.xml...');
  
  try {
    const readStream = fs.createReadStream(exportPath, { 
      encoding: 'utf8',
      highWaterMark: chunkSize // Set smaller chunk size
    });
    
    await new Promise((resolve, reject) => {
      readStream
        .pipe(transform)
        .on('finish', () => {
          if (records.length > 0) {
            // Sort records by date
            records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            // Write records to file
            fs.writeFileSync(outputPath, JSON.stringify(records, null, 2));
            console.log(`Successfully extracted ${records.length} body fat records from the last 4 years to data/bodyFat.json`);
            console.log(`Total data processed: ${(bytesProcessed / (1024 * 1024)).toFixed(2)} MB`);
          }
          resolve(null);
        })
        .on('error', (error: Error) => {
          console.error('Stream error:', error);
          reject(error);
        });
    });
  } catch (error) {
    console.error('Error processing XML:', error);
  }
}

extractBodyFat(); 