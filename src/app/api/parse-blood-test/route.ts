import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { execAsync } from '@/lib/utils';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// List of supported blood markers with their units and categories
const supportedMarkers = [
  { name: "total cholesterol", category: "Lipid Panel", unit: "mg/dL", aliases: ["Total Cholesterol", "Cholesterol, Total"] },
  { name: "ldl cholesterol", category: "Lipid Panel", unit: "mg/dL", aliases: ["LDL-C", "LDL", "Cholesterol-LDL"] },
  { name: "hdl cholesterol", category: "Lipid Panel", unit: "mg/dL", aliases: ["HDL-C", "HDL", "Cholesterol-HDL"] },
  { name: "triglycerides", category: "Lipid Panel", unit: "mg/dL", aliases: ["TG"] },
  { name: "glucose", category: "Metabolic Panel", unit: "mg/dL", aliases: ["Blood Glucose", "Fasting Glucose"] },
  { name: "alt", category: "Liver Function", unit: "U/L", aliases: ["SGPT", "Alanine Aminotransferase"] },
  { name: "ast", category: "Liver Function", unit: "U/L", aliases: ["SGOT", "Aspartate Aminotransferase"] },
  { name: "albumin", category: "Liver Function", unit: "g/dL", aliases: ["Alb"] },
  { name: "alkaline phosphatase", category: "Liver Function", unit: "U/L", aliases: ["ALP"] },
  { name: "total bilirubin", category: "Liver Function", unit: "mg/dL", aliases: ["Bilirubin"] },
  { name: "creatinine", category: "Kidney Function", unit: "mg/dL", aliases: ["Creat"] },
  { name: "bun", category: "Kidney Function", unit: "mg/dL", aliases: ["Blood Urea Nitrogen", "Urea Nitrogen"] },
  { name: "egfr", category: "Kidney Function", unit: "mL/min/1.73m²", aliases: ["Estimated GFR"] },
  { name: "sodium", category: "Electrolytes", unit: "mEq/L", aliases: ["Na"] },
  { name: "potassium", category: "Electrolytes", unit: "mEq/L", aliases: ["K"] },
  { name: "calcium", category: "Metabolic Panel", unit: "mg/dL", aliases: ["Ca"] },
  { name: "chloride", category: "Metabolic Panel", unit: "mEq/L", aliases: ["Cl"] }
];

export async function POST(request: NextRequest) {
  try {
    console.log('Starting blood test processing...');

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('Unauthorized: No valid session');
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }), 
        { status: 401 }
      );
    }
    console.log('User authenticated:', session.user.email);

    let body;
    try {
      body = await request.json();
      console.log('Request body:', body);
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return new NextResponse(
        JSON.stringify({ error: "Invalid request body" }), 
        { status: 400 }
      );
    }

    const { key } = body;
    if (!key) {
      console.log('No file key provided in request');
      return new NextResponse(
        JSON.stringify({ error: "No file key provided" }), 
        { status: 400 }
      );
    }
    console.log('Processing file with key:', key);

    // Get the signed URL for the uploaded PDF
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
    });
    const signedUrl = await getSignedUrl(s3Client, command);
    console.log('Generated signed URL for S3 file');

    // Download the PDF file
    console.log('Downloading PDF from S3...');
    const response = await fetch(signedUrl);
    if (!response.ok) {
      console.error('Failed to download PDF:', response.status, response.statusText);
      throw new Error(`Failed to download PDF: ${response.statusText}`);
    }
    const pdfBuffer = await response.arrayBuffer();
    console.log('PDF downloaded, size:', pdfBuffer.byteLength, 'bytes');

    // Create a temporary directory for processing
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'blood-test-'));
    const pdfPath = path.join(tempDir, 'blood-test.pdf');
    await fs.writeFile(pdfPath, Buffer.from(pdfBuffer));
    console.log('PDF saved to temp directory:', tempDir);

    try {
      // Extract text from PDF
      console.log('Extracting text from PDF...');
      const { stdout: pdfText } = await execAsync(`pdftotext -layout "${pdfPath}" -`);
      console.log('Extracted text from PDF:', pdfText);

      // Call OpenAI API
      console.log('Calling OpenAI API...');
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "user",
            content: `Extract blood test values from the text below. You MUST:

1. Return ONLY a JSON array containing ONLY the markers from our supported list
2. Use EXACTLY these marker names - no variations or aliases allowed:
${supportedMarkers.map(m => `- "${m.name}" (${m.unit})`).join('\n')}

3. Each marker object MUST have these exact properties:
{
  "name": "one of the exact names above",
  "value": number only (no strings, no ranges),
  "unit": "exactly matching the unit shown above",
  "category": "exactly matching one of: Lipid Panel, Liver Function, Kidney Function, Metabolic Panel, Electrolytes"
}

4. If you see variations like "HDL-C", map it to the exact name "hdl cholesterol"
5. Do not include any markers that don't exactly match our supported list
6. Do not include any explanatory text or markdown
7. Values must be numbers only, not strings or ranges

Example of CORRECT format:
[
  {
    "name": "hdl cholesterol",
    "value": 45,
    "unit": "mg/dL",
    "category": "Lipid Panel"
  }
]

Blood test text to analyze:
${pdfText}`
          }
        ],
        max_tokens: 4096,
        temperature: 0
      });
      console.log('Received response from OpenAI');

      const response_text = completion.choices[0].message.content;
      if (!response_text) {
        console.error('No content in OpenAI response');
        throw new Error("No response from OpenAI");
      }

      console.log('OpenAI Raw Response:', response_text);

      // Clean and parse the response
      const cleanedResponse = response_text
        .replace(/```json\n?|\n?```/g, '')  // Remove code blocks
        .replace(/[\u200B-\u200D\uFEFF]/g, '')  // Remove zero-width spaces
        .trim();
      
      console.log('Cleaned Response:', cleanedResponse);

      let parsed;
      try {
        parsed = JSON.parse(cleanedResponse);
        console.log('Successfully parsed JSON:', parsed);
      } catch (error) {
        console.error('JSON Parse Error:', error);
        console.error('Failed to parse response:', cleanedResponse);
        throw new Error(`Invalid JSON response: ${cleanedResponse}`);
      }

      if (!Array.isArray(parsed)) {
        console.error('Parsed response is not an array:', parsed);
        throw new Error("Response is not an array");
      }

      // Validate each marker
      console.log('Validating markers...');
      const validatedMarkers = parsed.filter(marker => {
        const supportedMarker = supportedMarkers.find(m => 
          m.name === marker.name || 
          m.aliases.includes(marker.name)
        );
        
        if (supportedMarker) {
          // Normalize the marker name to the main name
          marker.name = supportedMarker.name;
        }
        
        const isValid = supportedMarker &&
          typeof marker.value === 'number' &&
          !isNaN(marker.value) &&
          marker.unit === supportedMarker.unit &&
          marker.category === supportedMarker.category;
        
        if (!isValid) {
          console.log('Invalid marker:', marker, 'Reason:', !supportedMarker ? 'unsupported marker' :
            typeof marker.value !== 'number' ? 'invalid value type' :
            isNaN(marker.value) ? 'NaN value' :
            marker.unit !== supportedMarker.unit ? 'unit mismatch' :
            'category mismatch');
        }
        return isValid;
      });

      console.log('Validated markers:', validatedMarkers);

      if (validatedMarkers.length === 0) {
        console.error('No valid markers found after validation');
        throw new Error("No valid markers found in the blood test");
      }

      console.log('Successfully processed blood test, returning', validatedMarkers.length, 'markers');
      return new NextResponse(
        JSON.stringify({ 
          success: true,
          data: validatedMarkers 
        }), 
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );

    } finally {
      // Clean up temporary files
      console.log('Cleaning up temporary directory:', tempDir);
      await fs.rm(tempDir, { recursive: true, force: true });
    }

  } catch (error) {
    console.error("Error processing blood test:", error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    return new NextResponse(
      JSON.stringify({ 
        error: "Failed to process blood test",
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 