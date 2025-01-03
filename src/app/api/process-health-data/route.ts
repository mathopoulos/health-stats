import { NextRequest, NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser/src/fxp';
import { processS3XmlFile, generatePresignedUploadUrl, fetchAllHealthData } from '@/lib/s3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

interface HealthData {
  heartRate: any[];
  weight: any[];
  bodyFat: any[];
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  textNodeName: "value",
  parseAttributeValue: true,
  ignoreDeclaration: true,
  trimValues: true,
  isArray: (name) => name === "Record",
  allowBooleanAttributes: true,
  parseTagValue: true,
  cdataPropName: "value",
  stopNodes: ["*.value"],
  tagValueProcessor: (tagName: string, tagValue: string) => {
    return tagValue?.trim();
  },
  attributeValueProcessor: (attrName: string, attrValue: string) => {
    return attrValue?.trim();
  }
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 290000); // Abort after 4m50s
  const BATCH_SIZE = 10000; // Save every 10,000 records

  try {
    console.log('Processing health data request received');
    const { key } = await request.json();

    if (!key) {
      return NextResponse.json({ error: 'No file key provided' }, { status: 400 });
    }

    const healthData: HealthData = {
      heartRate: [],
      weight: [],
      bodyFat: []
    };

    // Process the XML content in chunks
    console.log('Processing XML content...');
    let recordCount = 0;
    let errorCount = 0;
    let lastSaveCount = 0;

    // Function to save current batch of data
    const saveBatch = async () => {
      console.log('Saving batch of data...');
      const batchPromises = [];

      // For each data type, fetch existing data, merge with new data, and save back
      if (healthData.heartRate.length > 0) {
        try {
          const existingData = await fetchAllHealthData('heartRate');
          const mergedData = [...existingData, ...healthData.heartRate];
          mergedData.sort((a, b) => a.date.localeCompare(b.date));

          batchPromises.push(
            generatePresignedUploadUrl('data/heartRate.json', 'application/json').then(async (url) => {
              await fetch(url, {
                method: 'PUT',
                body: JSON.stringify(mergedData),
                headers: { 'Content-Type': 'application/json' },
              });
            })
          );
          healthData.heartRate = []; // Clear after saving
        } catch (error) {
          console.error('Error merging heart rate data:', error);
        }
      }

      if (healthData.weight.length > 0) {
        try {
          const existingData = await fetchAllHealthData('weight');
          const mergedData = [...existingData, ...healthData.weight];
          mergedData.sort((a, b) => a.date.localeCompare(b.date));

          batchPromises.push(
            generatePresignedUploadUrl('data/weight.json', 'application/json').then(async (url) => {
              await fetch(url, {
                method: 'PUT',
                body: JSON.stringify(mergedData),
                headers: { 'Content-Type': 'application/json' },
              });
            })
          );
          healthData.weight = []; // Clear after saving
        } catch (error) {
          console.error('Error merging weight data:', error);
        }
      }

      if (healthData.bodyFat.length > 0) {
        try {
          const existingData = await fetchAllHealthData('bodyFat');
          const mergedData = [...existingData, ...healthData.bodyFat];
          mergedData.sort((a, b) => a.date.localeCompare(b.date));

          batchPromises.push(
            generatePresignedUploadUrl('data/bodyFat.json', 'application/json').then(async (url) => {
              await fetch(url, {
                method: 'PUT',
                body: JSON.stringify(mergedData),
                headers: { 'Content-Type': 'application/json' },
              });
            })
          );
          healthData.bodyFat = []; // Clear after saving
        } catch (error) {
          console.error('Error merging body fat data:', error);
        }
      }

      await Promise.all(batchPromises);
      console.log('Batch saved successfully');
    };

    await processS3XmlFile(key, async (recordXml) => {
      try {
        if (controller.signal.aborted) {
          throw new Error('Processing timed out');
        }

        const data = parser.parse(recordXml);
        
        const records = data?.HealthData?.Record 
          ? (Array.isArray(data.HealthData.Record) 
              ? data.HealthData.Record 
              : [data.HealthData.Record])
          : [];

        for (const record of records) {
          if (controller.signal.aborted) {
            throw new Error('Processing timed out');
          }

          if (!record || typeof record !== 'object') {
            console.log('Invalid record format:', record);
            continue;
          }

          const type = record.type;
          const value = parseFloat(record.value);
          const date = new Date(record.startDate || record.creationDate || record.endDate);

          if (!type || isNaN(value) || !date) {
            console.log('Missing required fields:', { type, value, date, record });
            continue;
          }

          const isoDate = date.toISOString();

          if (type === 'HKQuantityTypeIdentifierHeartRate') {
            healthData.heartRate.push({ date: isoDate, value });
          }
          else if (type === 'HKQuantityTypeIdentifierBodyMass') {
            healthData.weight.push({ date: isoDate, value });
          }
          else if (type === 'HKQuantityTypeIdentifierBodyFatPercentage') {
            healthData.bodyFat.push({ date: isoDate, value });
          }
        }

        recordCount++;
        
        // Save batch if we've processed enough new records
        if (recordCount - lastSaveCount >= BATCH_SIZE) {
          await saveBatch();
          lastSaveCount = recordCount;
        }

        if (recordCount % 1000 === 0) {
          console.log(`Processed ${recordCount} records (${errorCount} errors)`);
        }
      } catch (recordError) {
        if (controller.signal.aborted) {
          throw recordError;
        }
        errorCount++;
        console.error('Error processing record:', recordError);
        if (errorCount <= 5) {
          console.log('Problem record XML:', recordXml);
        }
      }
    });

    // Save any remaining data
    if (recordCount > lastSaveCount) {
      await saveBatch();
    }

    console.log('Health data processing complete');

    clearTimeout(timeoutId);
    return NextResponse.json({ 
      success: true,
      stats: {
        recordsProcessed: recordCount,
        batchesSaved: Math.ceil(recordCount / BATCH_SIZE)
      }
    }, {
      headers: {
        'Connection': 'keep-alive',
        'Keep-Alive': 'timeout=300'
      }
    });
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Error processing health data:', error);
    
    if (controller.signal.aborted) {
      return NextResponse.json(
        { error: 'Processing timed out - please try again' },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process health data',
      },
      { status: 400 }
    );
  }
} 