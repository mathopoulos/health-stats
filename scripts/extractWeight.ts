import fs from 'fs';
import path from 'path';
import { createReadStream } from 'fs';
import { Transform } from 'stream';

interface WeightRecord {
  date: string;
  value: number;
}

async function extractWeight() {
  const exportPath = path.join(process.cwd(), 'public', 'export.xml');
  const outputPath = path.join(process.cwd(), 'public', 'data', 'weight.json');

  if (!fs.existsSync(exportPath)) {
    console.error('export.xml not found');
    return;
  }

  console.log('Starting weight data extraction...');
  const stats = fs.statSync(exportPath);
  console.log(`Found export.xml file (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);

  // Create data directory if it doesn't exist
  const dataDir = path.join(process.cwd(), 'public', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const records: WeightRecord[] = [];
  let currentChunk = '';
  let recordCount = 0;
  let bytesProcessed = 0;
  const maxRecords = 1000;
  const chunkSize = 64 * 1024; // 64KB chunks

  const transform = new Transform({
    transform(chunk, encoding, callback) {
      try {
        bytesProcessed += chunk.length;
        if (bytesProcessed % (10 * 1024 * 1024) === 0) { // Log every 10MB
          console.log(`Processed ${(bytesProcessed / (1024 * 1024)).toFixed(2)} MB...`);
        }

        currentChunk += chunk.toString();
        
        // Look for complete Record elements
        const recordRegex = /<Record[^>]*type="HKQuantityTypeIdentifierBodyMass"[^>]*\/>/g;
        const matches = currentChunk.match(recordRegex) || [];
        
        for (const match of matches) {
          const dateMatch = match.match(/startDate="([^"]+)"/);
          const valueMatch = match.match(/value="([^"]+)"/);
          const unitMatch = match.match(/unit="([^"]+)"/);
          
          if (dateMatch && valueMatch && unitMatch && unitMatch[1] === 'kg') {
            const date = dateMatch[1].split(' ')[0]; // Get just the date part
            const value = parseFloat(valueMatch[1]);
            
            records.push({ date, value });
            recordCount++;
            
            if (recordCount % 10 === 0) {
              console.log(`Found ${recordCount} weight records...`);
              // Write records to file periodically
              fs.writeFileSync(outputPath, JSON.stringify(records, null, 2));
            }
            
            if (recordCount >= maxRecords) {
              console.log(`Reached ${maxRecords} records, stopping...`);
              fs.writeFileSync(outputPath, JSON.stringify(records, null, 2));
              this.destroy();
              return;
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
        callback(error as Error);
      }
    }
  });

  console.log('Starting to read export.xml...');
  
  try {
    const readStream = createReadStream(exportPath, { 
      encoding: 'utf8',
      highWaterMark: chunkSize // Set smaller chunk size
    });
    
    await new Promise((resolve, reject) => {
      readStream
        .pipe(transform)
        .on('finish', () => {
          if (records.length > 0) {
            fs.writeFileSync(outputPath, JSON.stringify(records, null, 2));
            console.log(`Successfully extracted ${records.length} weight records`);
            console.log(`Total data processed: ${(bytesProcessed / (1024 * 1024)).toFixed(2)} MB`);
          }
          resolve(null);
        })
        .on('error', (error) => {
          console.error('Stream error:', error);
          reject(error);
        });
    });
  } catch (error) {
    console.error('Error processing XML:', error);
  }
}

extractWeight(); 