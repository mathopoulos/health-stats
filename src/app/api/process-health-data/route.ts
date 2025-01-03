import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { XMLParser } from 'fast-xml-parser/src/fxp';
import { setProcessingComplete } from '../health-data/status/processingStatus';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Maximum allowed on hobby plan

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
    parseAttributeValue: true,
    ignoreDeclaration: true,
    trimValues: true,
    isArray: (name) => {
      return name === 'Record';
    },
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

  console.log('Parsing XML data...');
  const healthData: HealthData = {
    heartRate: [],
    weight: [],
    bodyFat: []
  };

  try {
    // Validate XML content before parsing
    if (!xmlContent || typeof xmlContent !== 'string' || xmlContent.trim().length === 0) {
      throw new Error('Invalid XML content: Empty or not a string');
    }

    // Check if content looks like XML
    if (!xmlContent.trim().startsWith('<?xml') && !xmlContent.trim().startsWith('<')) {
      throw new Error('Invalid XML content: Does not appear to be XML');
    }

    // Parse in a try-catch to handle malformed XML
    const data = parser.parse(xmlContent);
    console.log('XML parsed successfully');

    // Validate the parsed data structure
    if (!data?.HealthData?.Record) {
      console.error('Invalid XML structure:', JSON.stringify(data, null, 2));
      throw new Error('Invalid XML structure - missing HealthData or Record');
    }

    const records = data.HealthData.Record;
    console.log(`Found ${records.length} records`);

    // Process records in batches to avoid memory issues
    const batchSize = 1000;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(records.length/batchSize)}`);
      
      batch.forEach((record: any) => {
        try {
          if (!record.type || !record.value) return;

          const type = record.type;
          const value = parseFloat(record.value);
          const date = new Date(record.startDate || record.creationDate).toISOString();

          if (!isNaN(value) && date) {
            if (type === 'HKQuantityTypeIdentifierHeartRate') {
              healthData.heartRate.push({ date, value });
            }
            else if (type === 'HKQuantityTypeIdentifierBodyMass') {
              healthData.weight.push({ date, value });
            }
            else if (type === 'HKQuantityTypeIdentifierBodyFatPercentage') {
              healthData.bodyFat.push({ date, value });
            }
          }
        } catch (recordError) {
          console.error('Error processing record:', record, recordError);
        }
      });
    }

    // Sort all data at once at the end
    healthData.heartRate.sort((a, b) => a.date.localeCompare(b.date));
    healthData.weight.sort((a, b) => a.date.localeCompare(b.date));
    healthData.bodyFat.sort((a, b) => a.date.localeCompare(b.date));

    console.log('Data processing complete:', {
      heartRateCount: healthData.heartRate.length,
      weightCount: healthData.weight.length,
      bodyFatCount: healthData.bodyFat.length
    });

    return healthData;
  } catch (error) {
    console.error('Error processing XML:', error);
    throw new Error(`Failed to process XML: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Reset processing status at the start
    setProcessingComplete(false);
    
    console.log('Processing health data request received');
    
    // Debug auth information
    const authHeader = request.headers.get('authorization');
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    
    console.log('Auth header present:', !!authHeader);
    console.log('Blob token present:', !!blobToken);
    console.log('Auth header format correct:', authHeader?.startsWith('Bearer '));
    
    // Validate authentication
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Authentication failed: Invalid header format');
      return NextResponse.json({ error: 'Unauthorized - Invalid header format' }, { status: 401 });
    }

    if (!blobToken) {
      console.error('Authentication failed: Missing BLOB_READ_WRITE_TOKEN');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const providedToken = authHeader.split(' ')[1];
    if (providedToken !== blobToken) {
      console.error('Authentication failed: Token mismatch');
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    const { blobUrl } = await request.json();
    console.log('Blob URL:', blobUrl);

    if (!blobUrl) {
      throw new Error('No blob URL provided');
    }

    // Download the XML content with streaming
    console.log('Downloading XML content...');
    const response = await fetch(blobUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to download file:', response.status, errorText);
      throw new Error(`Failed to download file: ${response.status} ${errorText}`);
    }

    // Process the XML content
    const xmlContent = await response.text();
    console.log('XML content length:', xmlContent.length);
    console.log('First 500 characters of XML:', xmlContent.substring(0, 500));

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

    // Set processing as complete
    setProcessingComplete(true);

    return NextResponse.json({ 
      success: true,
      stats: {
        heartRateCount: healthData.heartRate.length,
        weightCount: healthData.weight.length,
        bodyFatCount: healthData.bodyFat.length
      }
    });
  } catch (error) {
    // Ensure processing is marked as complete even on error
    setProcessingComplete(true);
    
    console.error('Error processing health data:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process health data',
      },
      { status: 400 }
    );
  }
} 