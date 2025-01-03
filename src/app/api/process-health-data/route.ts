import { NextResponse } from 'next/server';
import { exec, execSync } from 'child_process';
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

async function killBackgroundProcesses() {
  try {
    // Kill any running tsx processes
    if (process.platform === 'win32') {
      execSync('taskkill /F /IM tsx.exe', { stdio: 'ignore' });
    } else {
      execSync('pkill -f tsx', { stdio: 'ignore' });
    }
  } catch (error) {
    // Ignore errors if no processes found
    console.log('No background processes found to clean up');
  }
}

export async function POST() {
  try {
    // Kill any existing background processes first
    await killBackgroundProcesses();

    const cwd = process.cwd();
    console.log('Current working directory:', cwd);

    // Check if export.xml exists
    const exportPath = path.join(cwd, 'public', 'export.xml');
    const exportExists = await checkFileExists(exportPath);
    console.log('export.xml exists:', exportExists);

    console.log('Starting health data extraction...');
    
    try {
      console.log('Running extract-health-data...');
      const { stdout: healthOut, stderr: healthErr } = await execAsync('npx tsx scripts/extractHeartRate.ts', { 
        cwd,
        timeout: 300000 // 5 minute timeout
      });
      if (healthErr) console.error('Health data extraction error:', healthErr);
      console.log('Health data extraction output:', healthOut);
      
      const heartRateFile = path.join(cwd, 'public', 'data', 'heartRate.json');
      console.log('Heart rate file exists:', await checkFileExists(heartRateFile));
    } catch (error) {
      console.error('Failed to extract heart rate data:', error);
      throw error;
    }

    try {
      console.log('Running extract-weight...');
      const { stdout: weightOut, stderr: weightErr } = await execAsync('npx tsx scripts/extractWeight.ts', { 
        cwd,
        maxBuffer: 1024 * 1024 * 100,
        timeout: 300000 // 5 minute timeout
      });
      if (weightErr) console.error('Weight data extraction error:', weightErr);
      console.log('Weight data extraction output:', weightOut);
      
      const weightFile = path.join(cwd, 'public', 'data', 'weight.json');
      console.log('Weight file exists:', await checkFileExists(weightFile));
    } catch (error) {
      console.error('Failed to extract weight data:', error);
      throw error;
    }

    try {
      console.log('Running extract-body-fat...');
      const { stdout: bodyFatOut, stderr: bodyFatErr } = await execAsync('npx tsx scripts/extractBodyFat.ts', { 
        cwd,
        maxBuffer: 1024 * 1024 * 100,
        timeout: 300000 // 5 minute timeout
      });
      if (bodyFatErr) console.error('Body fat data extraction error:', bodyFatErr);
      console.log('Body fat data extraction output:', bodyFatOut);
      
      const bodyFatFile = path.join(cwd, 'public', 'data', 'bodyFat.json');
      console.log('Body fat file exists:', await checkFileExists(bodyFatFile));
    } catch (error) {
      console.error('Failed to extract body fat data:', error);
      throw error;
    }

    // Final cleanup of any remaining processes
    await killBackgroundProcesses();

    console.log('All data extraction completed successfully');

    return NextResponse.json({ success: true });
  } catch (error) {
    // Ensure cleanup even on error
    await killBackgroundProcesses();
    
    console.error('Error processing health data:', error);
    return NextResponse.json(
      { 
        error: 'Error processing health data',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 