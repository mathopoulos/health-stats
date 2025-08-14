import { createReadStream } from 'fs';
import { parseString } from 'xml2js';
import { Transform } from 'stream';
import { promises as fs } from 'fs';

interface HealthData {
  steps: { date: string; value: number }[];
  weight: { date: string; value: number }[];
  sleep: { date: string; value: number }[];
  hrv: { date: string; value: number }[];
}

export async function parseHealthData(filePath: string): Promise<HealthData> {
  // Get file stats to check if it exists
  try {
    await fs.stat(filePath);
  } catch (error) {
    throw new Error('Health data file not found');
  }

  const data: HealthData = {
    steps: [],
    weight: [],
    sleep: [],
    hrv: []
  };

  // Get the date 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return new Promise((resolve, reject) => {
    let xmlChunk = '';
    const recordRegex = /<Record.*?<\/Record>/gs;

    const stream = createReadStream(filePath, { encoding: 'utf-8' })
      .pipe(new Transform({
        transform(chunk, encoding, callback) {
          xmlChunk += chunk;
          
          // Process complete Record elements
          let match;
          while ((match = recordRegex.exec(xmlChunk)) !== null) {
            const record = match[0];
            
            // Parse individual record
            parseString(record, (err, result) => {
              if (err) {
                console.error('Error parsing record:', err);
                return;
              }

              try {
                const recordData = result.Record.$;
                const type = recordData.type;
                const startDate = recordData.startDate.split(' ')[0];
                const recordDateObj = new Date(startDate);

                // Only process records from the last 7 days
                if (recordDateObj >= sevenDaysAgo) {
                  const value = parseFloat(recordData.value);

                  switch (type) {
                    case 'HKQuantityTypeIdentifierStepCount':
                      const existingStepDate = data.steps.find(d => d.date === startDate);
                      if (existingStepDate) {
                        existingStepDate.value += value;
                      } else {
                        data.steps.push({ date: startDate, value });
                      }
                      break;
                    case 'HKQuantityTypeIdentifierBodyMass':
                      data.weight.push({ date: startDate, value });
                      break;
                    case 'HKQuantityTypeIdentifierSleepAnalysis':
                      if (recordData.value === 'ASLEEP') {
                        const endDate = new Date(recordData.endDate);
                        const startDateObj = new Date(recordData.startDate);
                        const sleepHours = (endDate.getTime() - startDateObj.getTime()) / (1000 * 60 * 60);
                        data.sleep.push({ date: startDate, value: sleepHours });
                      }
                      break;
                    case 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN':
                      data.hrv.push({ date: startDate, value });
                      break;
                  }
                }
              } catch (error) {
                console.error('Error processing record:', error);
              }
            });
          }

          // Keep only the last partial record
          const lastRecordStart = xmlChunk.lastIndexOf('<Record');
          if (lastRecordStart !== -1) {
            xmlChunk = xmlChunk.slice(lastRecordStart);
          } else {
            xmlChunk = '';
          }

          callback();
        }
      }));

    stream.on('end', () => {
      // Sort and limit data to last 7 days
      ;(['steps', 'weight', 'sleep', 'hrv'] as const).forEach((metric) => {
        data[metric].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        if (data[metric].length === 0) {
          const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toISOString().split('T')[0];
          }).reverse();

          switch (metric) {
            case 'steps':
              data.steps = last7Days.map(date => ({ date, value: 0 }));
              break;
            case 'weight':
              data.weight = last7Days.map(date => ({ date, value: 70 }));
              break;
            case 'sleep':
              data.sleep = last7Days.map(date => ({ date, value: 0 }));
              break;
            case 'hrv':
              data.hrv = last7Days.map(date => ({ date, value: 0 }));
              break;
          }
        }
      });

      resolve(data);
    });

    stream.on('error', (error) => {
      reject(error);
    });
  });
}


