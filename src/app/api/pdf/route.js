import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { promisify } from 'util';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export async function GET() {
  return NextResponse.json({ message: 'PDF API is working' });
}

export async function POST(request) {
  console.log('=== PDF Processing Started ===');
  
  try {
    // Get the file data
    const arrayBuffer = await request.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      console.log('No file data received');
      return NextResponse.json({ 
        success: false, 
        error: 'No file data provided' 
      }, { status: 400 });
    }

    console.log('Received file data:', {
      size: arrayBuffer.byteLength,
      type: request.headers.get('content-type')
    });

    // Create temporary files
    const tempDir = os.tmpdir();
    const timestamp = Date.now();
    const pdfPath = path.join(tempDir, `temp-${timestamp}.pdf`);
    const txtPath = path.join(tempDir, `temp-${timestamp}.txt`);

    try {
      // Write PDF to temp file
      await writeFile(pdfPath, Buffer.from(arrayBuffer));

      // Convert PDF to text using pdftotext
      const { stdout, stderr } = await execAsync(`pdftotext "${pdfPath}" "${txtPath}"`);
      if (stderr) {
        console.error('pdftotext stderr:', stderr);
      }

      // Read the text file
      const { stdout: pageCount } = await execAsync(`pdfinfo "${pdfPath}" | grep Pages: | awk '{print $2}'`);
      const { stdout: text } = await execAsync(`cat "${txtPath}"`);

      return NextResponse.json({ 
        success: true,
        text: text.trim(),
        pages: parseInt(pageCount.trim(), 10),
        message: 'PDF processed successfully'
      });

    } finally {
      // Clean up temp files
      try {
        await unlink(pdfPath);
        await unlink(txtPath);
      } catch (e) {
        console.error('Error cleaning up temp files:', e);
      }
    }

  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process PDF'
    }, { status: 500 });
  }
} 