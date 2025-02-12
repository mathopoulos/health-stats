import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { promisify } from 'util';
import path from 'path';
import os from 'os';
import OpenAI from 'openai';

const execAsync = promisify(exec);

// Initialize OpenAI client
console.log('API Key present:', !!process.env.OPENAI_API_KEY);
console.log('API Key prefix:', process.env.OPENAI_API_KEY?.substring(0, 7));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Rate limiting setup
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // Minimum 1 second between requests

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000; // Start with 2 second delay

// Sleep utility
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Define supported blood markers and their units for the LLM to extract
const SUPPORTED_MARKERS = [
  { name: 'Glucose', unit: 'mg/dL', category: 'Metabolic' },
  { name: 'BUN', unit: 'mg/dL', category: 'Metabolic' },
  { name: 'Creatinine', unit: 'mg/dL', category: 'Metabolic' },
  { name: 'eGFR', unit: 'mL/min/1.73', category: 'Metabolic' },
  { name: 'Sodium', unit: 'mmol/L', category: 'Electrolytes' },
  { name: 'Potassium', unit: 'mmol/L', category: 'Electrolytes' },
  { name: 'Chloride', unit: 'mmol/L', category: 'Electrolytes' },
  { name: 'Carbon Dioxide, Total', unit: 'mmol/L', category: 'Electrolytes' },
  { name: 'Calcium', unit: 'mg/dL', category: 'Minerals' },
  { name: 'Protein, Total', unit: 'g/dL', category: 'Proteins' },
  { name: 'Albumin', unit: 'g/dL', category: 'Proteins' },
  { name: 'Bilirubin, Total', unit: 'mg/dL', category: 'Liver' },
  { name: 'Alkaline Phosphatase', unit: 'IU/L', category: 'Liver' },
  { name: 'AST (SGOT)', unit: 'IU/L', category: 'Liver' },
  { name: 'ALT (SGPT)', unit: 'IU/L', category: 'Liver' },
  { name: 'Cholesterol, Total', unit: 'mg/dL', category: 'Lipids' },
  { name: 'Triglycerides', unit: 'mg/dL', category: 'Lipids' },
  { name: 'HDL Cholesterol', unit: 'mg/dL', category: 'Lipids' },
  { name: 'LDL Chol Calc (NIH)', unit: 'mg/dL', category: 'Lipids' },
  { name: 'Lipoprotein (a)', unit: 'nmol/L', category: 'Lipids' }
];

async function waitForRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await sleep(waitTime);
  }
  
  lastRequestTime = Date.now();
}

async function extractBloodMarkersWithLLM(text) {
  let lastError;
  
  // Log the text being processed (truncated for readability)
  console.log('Processing text (first 500 chars):', text.substring(0, 500));
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      await waitForRateLimit();

      const prompt = `Extract blood test results from the following lab report text. For each marker found, return its details in a structured format.

Supported markers and their categories:
${SUPPORTED_MARKERS.map(m => `- ${m.name} (${m.category}): measured in ${m.unit}`).join('\n')}

Rules:
1. Only extract markers from the supported list above
2. Include all fields: name, value (numeric), unit, flag (High/Low/Normal), category
3. Match marker names exactly as listed
4. Convert all values to numeric format
5. If a marker is not found, do not include it

Example response format:
{
  "markers": [
    {
      "name": "Glucose",
      "value": 85,
      "unit": "mg/dL",
      "flag": null,
      "category": "Metabolic"
    }
  ]
}

Text to analyze:
${text}

Return ONLY valid JSON with a "markers" array. No other text.`;

      console.log('Sending request to OpenAI...');
      
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-0125",
        messages: [
          {
            role: "system",
            content: "You are a precise medical data extraction tool. Extract blood test markers exactly as requested, maintaining exact names and units. Return only valid JSON with a markers array."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 1000
      });

      const result = JSON.parse(response.choices[0].message.content);
      
      // Validate the response
      if (!result.markers || !Array.isArray(result.markers)) {
        console.error('Invalid response format - missing markers array:', result);
        return [];
      }

      // Log the extracted markers
      console.log('Successfully extracted markers:', result.markers);
      
      return result.markers;

    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt + 1} failed:`, {
        status: error?.status,
        code: error?.code,
        type: error?.type,
        message: error?.message,
        details: error?.error,
        headers: error?.headers
      });

      if (error?.status === 429) {
        const retryDelay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
        console.log(`Retrying in ${retryDelay}ms...`);
        await sleep(retryDelay);
        continue;
      }
      
      throw error;
    }
  }

  throw lastError;
}

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

      // Extract blood markers using LLM
      const bloodMarkers = await extractBloodMarkersWithLLM(text);
      console.log('Extracted markers:', bloodMarkers);

      return NextResponse.json({ 
        success: true,
        text: text.trim(),
        pages: parseInt(pageCount.trim(), 10),
        markers: bloodMarkers,
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