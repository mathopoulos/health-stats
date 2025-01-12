import { NextResponse } from 'next/server';
import { listDataFiles } from '@/lib/s3';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createProcessingJob } from '@/lib/processingJobs';
import { invokeLambda } from '@/lib/lambda';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // List XML files in the uploads directory for the specific user
    const xmlFiles = await listDataFiles(`uploads/${session.user.id}/`);
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

    // Create a processing job in MongoDB
    const job = await createProcessingJob({
      userId: session.user.id,
      status: 'pending',
      type: 'health-data',
      fileKey: latestXmlFile,
      startedAt: new Date()
    });

    // Invoke Lambda function to process the data
    await invokeLambda(job._id!, session.user.id, latestXmlFile);

    return NextResponse.json({ 
      success: true, 
      processingId: job._id,
      message: 'Processing started successfully'
    });
  } catch (error) {
    console.error('Error processing health data:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 