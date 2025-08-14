import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import { join } from 'path';
import { deleteOldXmlFiles } from '@/server/aws/s3';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Maximum allowed on hobby plan

const execAsync = promisify(exec);

async function checkFileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDataFile(filename: string, cwd: string): Promise<void> {
  const filePath = join(cwd, 'public', 'data', filename);
  const exists = await checkFileExists(filePath);
  
  if (!exists) {
    // Create an empty array file if it doesn't exist
    await fs.writeFile(filePath, '[]', 'utf8');
    console.log(`Created empty ${filename}`);
  }
}

async function runScript(scriptName: string, cwd: string): Promise<void> {
  console.log(`Starting ${scriptName}...`);
  try {
    const { stdout, stderr } = await execAsync(`npx tsx scripts/${scriptName}.ts`, {
      cwd,
      maxBuffer: 1024 * 1024 * 100, // 100MB buffer
      timeout: 55000 // 55 seconds to leave buffer for other operations
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const cwd = process.cwd();
    console.log('Current working directory:', cwd);

    // Check if export.xml exists
    const exportPath = join(cwd, 'export.xml');
    const exportExists = await checkFileExists(exportPath);
    console.log('export.xml exists:', exportExists);

    if (!exportExists) {
      return NextResponse.json(
        { error: 'export.xml not found' },
        { status: 400 }
      );
    }

    // Process all data files
    await processDataFiles(cwd);

    // Delete old XML files for this user
    await deleteOldXmlFiles(session.user.id);

    return NextResponse.json({ 
      success: true, 
      message: 'Data processed successfully' 
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