import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import OpenAI from 'openai';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { execAsync } from '@/lib/utils';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

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
  { name: 'Total Cholesterol', unit: 'mg/dL', category: 'Lipid Panel', aliases: ['Cholesterol, Total'] },
  { name: 'LDL Cholesterol', unit: 'mg/dL', category: 'Lipid Panel', aliases: ['LDL-C', 'LDL'] },
  { name: 'HDL Cholesterol', unit: 'mg/dL', category: 'Lipid Panel', aliases: ['HDL-C', 'HDL'] },
  { name: 'Triglycerides', unit: 'mg/dL', category: 'Lipid Panel', aliases: [] },
  { name: 'White Blood Cell Count', unit: 'K/uL', category: 'Complete Blood Count', aliases: ['WBC', 'White Blood Cells'] },
  { name: 'Red Blood Cell Count', unit: 'M/uL', category: 'Complete Blood Count', aliases: ['RBC', 'Red Blood Cells'] },
  { name: 'Hemoglobin', unit: 'g/dL', category: 'Complete Blood Count', aliases: ['Hgb'] },
  { name: 'Hematocrit', unit: '%', category: 'Complete Blood Count', aliases: ['Hct'] },
  { name: 'Platelet Count', unit: 'K/uL', category: 'Complete Blood Count', aliases: ['Platelets', 'PLT'] },
  { name: 'Glucose', unit: 'mg/dL', category: 'Metabolic Panel', aliases: ['Blood Glucose'] },
  { name: 'ALT (SGPT)', unit: 'U/L', category: 'Liver Function', aliases: ['ALT', 'SGPT', 'Alanine Aminotransferase'] },
  { name: 'AST (SGOT)', unit: 'U/L', category: 'Liver Function', aliases: ['AST', 'SGOT', 'Aspartate Aminotransferase'] },
  { name: 'Blood Urea Nitrogen', unit: 'mg/dL', category: 'Metabolic Panel', aliases: ['BUN'] },
  { name: 'Creatinine', unit: 'mg/dL', category: 'Metabolic Panel', aliases: [] },
  { name: 'Thyroid Stimulating Hormone (TSH)', unit: 'uIU/mL', category: 'Thyroid Function', aliases: ['TSH'] },
  { name: 'Free T4', unit: 'ng/dL', category: 'Thyroid Function', aliases: ['T4, Free', 'Thyroxine (T4), Free'] },
  { name: 'Vitamin D, 25-Hydroxy', unit: 'ng/mL', category: 'Vitamins', aliases: ['Vitamin D', '25-OH Vitamin D'] }
];

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }), 
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { key } = body;
    if (!key) {
      return new NextResponse(
        JSON.stringify({ error: "No file key provided" }), 
        { status: 400 }
      );
    }

    // Get the signed URL for the uploaded PDF
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
    });
    const signedUrl = await getSignedUrl(s3Client, command);

    // Download the PDF file
    const response = await fetch(signedUrl);
    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.statusText}`);
    }
    const pdfBuffer = await response.arrayBuffer();

    // Create a temporary directory for processing
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'blood-test-'));
    const pdfPath = path.join(tempDir, 'blood-test.pdf');
    await fs.writeFile(pdfPath, Buffer.from(pdfBuffer));

    try {
      // Extract text from PDF
      const { stdout: pdfText } = await execAsync(`pdftotext -layout "${pdfPath}" -`);

      // Call OpenAI API
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
  "category": "exactly matching one of: Complete Blood Count, White Blood Cell Differential, Metabolic Panel, Liver Function, Lipid Panel, Thyroid Function, Vitamins"
}

4. If you see variations like "HDL-C", map it to the exact name "HDL Cholesterol"
5. Do not include any markers that don't exactly match our supported list
6. Do not include any explanatory text or markdown
7. Values must be numbers only, not strings or ranges

Example of CORRECT format:
[
  {
    "name": "HDL Cholesterol",
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

      const response_text = completion.choices[0].message.content;
      if (!response_text) {
        throw new Error("No response from OpenAI");
      }

      // Clean and parse the response
      const cleanedResponse = response_text
        .replace(/```json\n?|\n?```/g, '')  // Remove code blocks
        .replace(/[\u200B-\u200D\uFEFF]/g, '')  // Remove zero-width spaces
        .trim();
      
      let parsed;
      try {
        parsed = JSON.parse(cleanedResponse);
      } catch (error) {
        console.error('Failed to parse response:', cleanedResponse);
        throw new Error(`Invalid JSON response: ${cleanedResponse}`);
      }

      if (!Array.isArray(parsed)) {
        throw new Error("Response is not an array");
      }

      // Validate each marker
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
        
        return isValid;
      });

      if (validatedMarkers.length === 0) {
        throw new Error("No valid markers found in the blood test");
      }

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
      await fs.rm(tempDir, { recursive: true, force: true });
    }

  } catch (error) {
    console.error("Error processing blood test:", error);
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