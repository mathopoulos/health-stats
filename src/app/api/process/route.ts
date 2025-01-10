import { NextResponse } from 'next/server';
import { processHealthData } from '@/lib/processHealthData';
import { listDataFiles } from '@/lib/s3';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const OWNER_ID = 'usr_W2LWz83EurLxZwfjqT_EL';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // List XML files in the uploads directory
    const xmlFiles = await listDataFiles('uploads/');
    console.log('Found XML files:', xmlFiles);
    
    if (!xmlFiles || xmlFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No XML files found in uploads directory' },
        { status: 404 }
      );
    }

    // Filter for XML files and sort by name to get the latest one
    const xmlFilesOnly = xmlFiles.filter(file => file.toLowerCase().endsWith('.xml'));
    if (xmlFilesOnly.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No XML files found in uploads directory' },
        { status: 404 }
      );
    }

    // Sort by name to get the latest one (assuming files are named with timestamps)
    const latestXmlFile = xmlFilesOnly.sort().pop();
    if (!latestXmlFile) {
      return NextResponse.json(
        { success: false, error: 'Could not determine latest XML file' },
        { status: 404 }
      );
    }

    console.log('Processing XML file:', latestXmlFile);
    const status = await processHealthData(latestXmlFile, OWNER_ID);
    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('Error processing health data:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 