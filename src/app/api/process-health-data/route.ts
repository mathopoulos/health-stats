import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { XMLParser } from 'fast-xml-parser/src/fxp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

interface HealthData {
  heartRate: any[];
  weight: any[];
  bodyFat: any[];
}

async function processXMLData(xmlContent: string): Promise<HealthData> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    textNodeName: "value",
  });

  console.log('Parsing XML data...');
  const data = parser.parse(xmlContent);
  
  const healthData: HealthData = {
    heartRate: [],
    weight: [],
    bodyFat: []
  };

  // Extract data from the parsed XML
  try {
    if (data.HealthData && data.HealthData.Record) {
      const records = Array.isArray(data.HealthData.Record) 
        ? data.HealthData.Record 
        : [data.HealthData.Record];

      records.forEach((record: any) => {
        const type = record.type;
        const value = parseFloat(record.value);
        const date = new Date(record.startDate || record.creationDate).toISOString();

        if (type === 'HKQuantityTypeIdentifierHeartRate' && !isNaN(value)) {
          healthData.heartRate.push({ date, value });
        }
        else if (type === 'HKQuantityTypeIdentifierBodyMass' && !isNaN(value)) {
          healthData.weight.push({ date, value });
        }
        else if (type === 'HKQuantityTypeIdentifierBodyFatPercentage' && !isNaN(value)) {
          healthData.bodyFat.push({ date, value });
        }
      });
    }
  } catch (error) {
    console.error('Error processing records:', error);
    throw new Error('Failed to process health records');
  }

  return healthData;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('Processing health data request received');
    const { blobUrl } = await request.json();
    console.log('Blob URL:', blobUrl);

    if (!blobUrl) {
      throw new Error('No blob URL provided');
    }

    // Download the XML content
    console.log('Downloading XML content...');
    const response = await fetch(blobUrl);
    if (!response.ok) {
      throw new Error('Failed to download file from blob storage');
    }

    // Process the XML content
    const xmlContent = await response.text();
    console.log('Processing XML content...');
    const healthData = await processXMLData(xmlContent);

    // Save the processed data to separate blob files
    console.log('Saving processed data...');
    const savePromises = [
      put('data/heartRate.json', JSON.stringify(healthData.heartRate), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
      }),
      put('data/weight.json', JSON.stringify(healthData.weight), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
      }),
      put('data/bodyFat.json', JSON.stringify(healthData.bodyFat), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
      })
    ];

    await Promise.all(savePromises);
    console.log('Health data processing complete');

    return NextResponse.json({ 
      success: true,
      stats: {
        heartRateCount: healthData.heartRate.length,
        weightCount: healthData.weight.length,
        bodyFatCount: healthData.bodyFat.length
      }
    });
  } catch (error) {
    console.error('Error processing health data:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process health data',
      },
      { status: 400 }
    );
  }
} 