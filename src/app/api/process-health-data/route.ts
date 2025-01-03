import { NextRequest, NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser/src/fxp';
import { processS3XmlFile, generatePresignedUploadUrl } from '@/lib/s3';

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

    await processS3XmlFile(key, async (recordXml) => {
      try {
        if (controller.signal.aborted) {
          throw new Error('Processing timed out');
        }

        // Log the first few records for debugging
        if (recordCount < 5) {
          console.log('Processing record:', recordXml);
        }

        const data = parser.parse(recordXml);
        
        // Handle both array and single record cases
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

    // Sort all data
    console.log('Sorting data...');
    healthData.heartRate.sort((a, b) => a.date.localeCompare(b.date));
    healthData.weight.sort((a, b) => a.date.localeCompare(b.date));
    healthData.bodyFat.sort((a, b) => a.date.localeCompare(b.date));

    // Save the processed data to S3
    console.log('Saving processed data...');
    const savePromises = [
      generatePresignedUploadUrl('data/heartRate.json', 'application/json').then(async (url) => {
        await fetch(url, {
          method: 'PUT',
          body: JSON.stringify(healthData.heartRate),
          headers: { 'Content-Type': 'application/json' },
        });
      }),
      generatePresignedUploadUrl('data/weight.json', 'application/json').then(async (url) => {
        await fetch(url, {
          method: 'PUT',
          body: JSON.stringify(healthData.weight),
          headers: { 'Content-Type': 'application/json' },
        });
      }),
      generatePresignedUploadUrl('data/bodyFat.json', 'application/json').then(async (url) => {
        await fetch(url, {
          method: 'PUT',
          body: JSON.stringify(healthData.bodyFat),
          headers: { 'Content-Type': 'application/json' },
        });
      }),
    ];

    await Promise.all(savePromises);
    console.log('Health data processing complete');

    clearTimeout(timeoutId);
    return NextResponse.json({ 
      success: true,
      stats: {
        recordsProcessed: recordCount,
        heartRateCount: healthData.heartRate.length,
        weightCount: healthData.weight.length,
        bodyFatCount: healthData.bodyFat.length
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