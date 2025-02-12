import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import pdfParse from 'pdf-parse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Add proper error handling for module imports
try {
  // Verify modules are loaded
  if (!getServerSession) throw new Error('next-auth not loaded');
  if (!pdfParse) throw new Error('pdf-parse not loaded');
} catch (error) {
  console.error('Module loading error:', error);
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'PDF API is working' });
}

export async function POST(request: NextRequest) {
  console.log('=== PDF Processing API Start ===');
  console.log('Request method:', request.method);
  console.log('Request headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('No valid session found');
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // Get the file data
    const arrayBuffer = await request.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      console.log('No file data provided');
      return NextResponse.json({ 
        success: false, 
        error: 'No file data provided' 
      }, { status: 400 });
    }

    // Check file size (10MB limit)
    if (arrayBuffer.byteLength > 10 * 1024 * 1024) {
      console.log('File too large:', arrayBuffer.byteLength, 'bytes');
      return NextResponse.json({ 
        success: false, 
        error: 'File too large' 
      }, { status: 400 });
    }

    console.log('Processing PDF, size:', arrayBuffer.byteLength, 'bytes');

    // Convert ArrayBuffer to Buffer for pdf-parse
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF text
    const data = await pdfParse(buffer);
    console.log('PDF parsed successfully, text length:', data.text.length);

    // Return the extracted text
    return NextResponse.json({
      success: true,
      text: data.text,
      message: 'PDF processed successfully',
      pages: data.numpages
    });

  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
} 