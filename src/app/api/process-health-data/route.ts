import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { promises as fs } from 'fs';

const execAsync = promisify(exec);

async function checkFileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDataDirectory(cwd: string): Promise<void> {
  const dataDir = path.join(cwd, 'public', 'data');
  try {
    await fs.mkdir(dataDir, { recursive: true });
    console.log('Data directory created/verified at:', dataDir);
  } catch (error) {
    console.error('Error creating data directory:', error);
    throw error;
  }
}

async function runScript(scriptName: string, cwd: string): Promise<void> {
  try {
    console.log(`Running ${scriptName}...`);
    const { stdout, stderr } = await execAsync(`npx tsx scripts/${scriptName}.ts`, {
      cwd,
      maxBuffer: 1024 * 1024 * 100, // 100MB buffer
      timeout: 300000 // 5 minute timeout
    });

    if (stderr) {
      console.error(`${scriptName} stderr:`, stderr);
    }
    if (stdout) {
      console.log(`${scriptName} stdout:`, stdout);
    }

    // Wait a moment for file system operations to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (error) {
    console.error(`Error running ${scriptName}:`, error);
    throw error;
  }
}

async function verifyDataFile(filename: string, cwd: string): Promise<void> {
  const filePath = path.join(cwd, 'public', 'data', filename);
  console.log(`Verifying ${filename} at:`, filePath);
  
  let retries = 3;
  while (retries > 0) {
    try {
      const exists = await checkFileExists(filePath);
      if (!exists) {
        throw new Error(`Data file ${filename} was not created`);
      }
      console.log(`Verified ${filename} exists`);
      
      // Check if file has content
      const content = await fs.readFile(filePath, 'utf8');
      if (!content || content.trim() === '' || content === '[]') {
        throw new Error(`Data file ${filename} is empty`);
      }
      console.log(`Verified ${filename} has content`);
      return;
    } catch (error) {
      console.error(`Verification attempt ${4 - retries} failed for ${filename}:`, error);
      retries--;
      if (retries > 0) {
        console.log(`Retrying in 1 second...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        throw error;
      }
    }
  }
}

export async function POST() {
  try {
    const cwd = process.cwd();
    console.log('Current working directory:', cwd);

    // Check if export.xml exists
    const exportPath = path.join(cwd, 'public', 'export.xml');
    const exportExists = await checkFileExists(exportPath);
    console.log('export.xml exists:', exportExists);

    if (!exportExists) {
      return NextResponse.json(
        { error: 'export.xml not found' },
        { status: 400 }
      );
    }

    // Ensure data directory exists
    await ensureDataDirectory(cwd);

    // Run scripts sequentially and verify their output
    console.log('Starting health data extraction...');
    
    try {
      await runScript('extractHeartRate', cwd);
      await verifyDataFile('heartRate.json', cwd);
      console.log('Heart rate data extracted and verified');
      
      await runScript('extractWeight', cwd);
      await verifyDataFile('weight.json', cwd);
      console.log('Weight data extracted and verified');
      
      await runScript('extractBodyFat', cwd);
      await verifyDataFile('bodyFat.json', cwd);
      console.log('Body fat data extracted and verified');

      console.log('All data extraction completed successfully');

      return NextResponse.json({ success: true, message: 'Data processed successfully' });
    } catch (scriptError) {
      console.error('Script execution error:', scriptError);
      return NextResponse.json(
        { 
          error: 'Error running extraction scripts',
          details: process.env.NODE_ENV === 'development' 
            ? scriptError instanceof Error ? scriptError.message : 'Unknown script error'
            : 'Error processing health data'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing health data:', error);
    return NextResponse.json(
      { 
        error: 'Error processing health data',
        details: process.env.NODE_ENV === 'development' 
          ? error instanceof Error ? error.message : 'Unknown error'
          : 'Server error'
      },
      { status: 500 }
    );
  }
} 