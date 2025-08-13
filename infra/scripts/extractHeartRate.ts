import fs from 'fs';
import path from 'path';
import { parseString } from 'xml2js';
import { promisify } from 'util';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

const parseXML = promisify(parseString);

interface HeartRateRecord {
  date: string;
  value: number;
  sourceName: string;
  unit: string;
  startTime: string;
  endTime: string;
}

interface XMLRecord {
  Record: {
    $: {
      type: string;
      value: string;
      sourceName: string;
      unit: string;
      startDate: string;
      endDate: string;
    };
  };
}

async function extractHeartRate() {
  console.log('Starting heart rate data extraction...');
  
  const inputPath = path.join(process.cwd(), 'public', 'export.xml');
  const outputPath = path.join(process.cwd(), 'public', 'data', 'heartRate.json');

  // Check if input file exists
  if (!fs.existsSync(inputPath)) {
    throw new Error('export.xml file not found in public directory');
  }

  const stats = fs.statSync(inputPath);
  console.log(`Found export.xml file (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

  // Get the date 30 days ago
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const heartRateData: HeartRateRecord[] = [];
  let recordsProcessed = 0;
  let currentRecord = '';
  let inHeartRateRecord = false;

  return new Promise((resolve, reject) => {
    const readStream = createReadStream(inputPath, {
      encoding: 'utf-8',
      highWaterMark: 64 * 1024 // 64KB chunks
    });

    const rl = createInterface({
      input: readStream,
      crlfDelay: Infinity
    });

    rl.on('line', async (line) => {
      try {
        if (line.includes('type="HKQuantityTypeIdentifierHeartRate"')) {
          inHeartRateRecord = true;
          currentRecord = line;
        } else if (inHeartRateRecord) {
          currentRecord += line;
          if (line.includes('</Record>')) {
            inHeartRateRecord = false;
            recordsProcessed++;

            try {
              const result = await parseXML(currentRecord) as XMLRecord;
              
              if (result?.Record?.$) {
                const recordData = result.Record.$;
                const startDate = new Date(recordData.startDate);
                
                if (startDate >= thirtyDaysAgo) {
                  const endDate = new Date(recordData.endDate);
                  const dateStr = startDate.toISOString().split('T')[0];

                  heartRateData.push({
                    date: dateStr,
                    value: parseFloat(recordData.value),
                    sourceName: recordData.sourceName || 'Unknown',
                    unit: recordData.unit || 'count/min',
                    startTime: startDate.toISOString(),
                    endTime: endDate.toISOString()
                  });

                  if (heartRateData.length === 1) {
                    console.log('First heart rate record:', heartRateData[0]);
                  }
                }
              }
            } catch (error) {
              console.error('Error processing record:', error);
            }

            if (recordsProcessed % 1000 === 0) {
              console.log(`Processed ${recordsProcessed} records, found ${heartRateData.length} heart rate records...`);
            }
          }
        }
      } catch (error) {
        console.error('Error processing line:', error);
      }
    });

    rl.on('close', () => {
      console.log(`Found ${heartRateData.length} heart rate records in the last 30 days`);
      
      if (heartRateData.length > 0) {
        heartRateData.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        fs.writeFileSync(outputPath, JSON.stringify(heartRateData, null, 2));
        console.log(`Saved heart rate data to ${outputPath}`);
      } else {
        fs.writeFileSync(outputPath, '[]');
        console.log('No heart rate records found in the last 30 days. Saved empty array.');
      }
      
      resolve(heartRateData);
    });

    rl.on('error', (error) => {
      console.error('Error reading file:', error);
      reject(error);
    });

    readStream.on('error', (error) => {
      console.error('Error with read stream:', error);
      reject(error);
    });
  });
}

// Run the extraction
console.log('Starting heart rate extraction...');
extractHeartRate()
  .then(() => {
    console.log('Heart rate extraction completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Heart rate extraction failed:', error);
    process.exit(1);
  }); 