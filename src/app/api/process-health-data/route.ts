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
  console.log(`Starting ${scriptName}...`);
  try {
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
  } catch (error) {
    console.error(`Error running ${scriptName}:`, error);
    throw error;
  }
}

async function ensureDataFile(filename: string, cwd: string): Promise<void> {
  const filePath = path.join(cwd, 'public', 'data', filename);
  const exists = await checkFileExists(filePath);
  
  if (!exists) {
    // Create an empty array file if it doesn't exist
    await fs.writeFile(filePath, '[]', 'utf8');
    console.log(`Created empty ${filename}`);
  }
}

async function processDataFiles(cwd: string) {
  // Ensure all data files exist
  await ensureDataFile('heartRate.json', cwd);
  await ensureDataFile('weight.json', cwd);
  await ensureDataFile('bodyFat.json', cwd);

  // Run scripts sequentially
  console.log('Processing heart rate data...');
  await runScript('extractHeartRate', cwd);
  
  console.log('Processing weight data...');
  await runScript('extractWeight', cwd);
  
  console.log('Processing body fat data...');
  await runScript('extractBodyFat', cwd);
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

    // Process all data files
    await processDataFiles(cwd);

    return NextResponse.json({ 
      success: true, 
      message: 'Data processed successfully' 
    });

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