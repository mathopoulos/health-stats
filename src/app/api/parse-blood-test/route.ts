import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import * as pdfjsLib from 'pdfjs-dist';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Ensure the worker is available
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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

const supportedMarkers = [
  // Lipid Panel
  { name: "totalcholesterol", category: "Lipid Panel", unit: "mg/dL", aliases: ["Total Cholesterol", "TC"] },
  { name: "ldlc", category: "Lipid Panel", unit: "mg/dL", aliases: ["LDL Cholesterol", "LDL-C", "LDL"] },
  { name: "hdlc", category: "Lipid Panel", unit: "mg/dL", aliases: ["HDL Cholesterol", "HDL-C", "HDL"] },
  { name: "triglycerides", category: "Lipid Panel", unit: "mg/dL", aliases: ["TG", "Trigs"] },
  { name: "apob", category: "Lipid Panel", unit: "mg/dL", aliases: ["Apolipoprotein B", "ApoB"] },
  { name: "lpa", category: "Lipid Panel", unit: "mg/dL", aliases: ["Lipoprotein(a)", "Lp(a)"] },

  // Complete Blood Count
  { name: "whitebloodcells", category: "Complete Blood Count", unit: "K/µL", aliases: ["WBC", "Leukocytes"] },
  { name: "redbloodcells", category: "Complete Blood Count", unit: "M/µL", aliases: ["RBC", "Erythrocytes"] },
  { name: "hematocrit", category: "Complete Blood Count", unit: "%", aliases: ["Hct"] },
  { name: "hemoglobin", category: "Complete Blood Count", unit: "g/dL", aliases: ["Hgb"] },
  { name: "platelets", category: "Complete Blood Count", unit: "K/µL", aliases: ["PLT"] },

  // Glucose Markers
  { name: "hba1c", category: "Metabolic Panel", unit: "%", aliases: ["Hemoglobin A1c", "A1C"] },
  { name: "glucose", category: "Metabolic Panel", unit: "mg/dL", aliases: ["Blood Glucose", "Gluc"] },

  // Liver Markers
  { name: "alt", category: "Liver Function", unit: "U/L", aliases: ["ALT (SGPT)", "SGPT"] },
  { name: "ast", category: "Liver Function", unit: "U/L", aliases: ["AST (SGOT)", "SGOT"] },
  { name: "ggt", category: "Liver Function", unit: "U/L", aliases: ["Gamma GT", "γ-GT"] },

  // Kidney Markers
  { name: "bun", category: "Metabolic Panel", unit: "mg/dL", aliases: ["Blood Urea Nitrogen"] },
  { name: "creatinine", category: "Metabolic Panel", unit: "mg/dL", aliases: ["Creat"] },
  { name: "albumin", category: "Metabolic Panel", unit: "g/dL", aliases: ["Alb"] },

  // Thyroid Markers
  { name: "t3", category: "Thyroid Function", unit: "pg/mL", aliases: ["Free T3", "FT3"] },
  { name: "t4", category: "Thyroid Function", unit: "ng/dL", aliases: ["Free T4", "FT4"] },
  { name: "tsh", category: "Thyroid Function", unit: "mIU/L", aliases: ["Thyroid Stimulating Hormone"] },

  // Vitamins
  { name: "vitaminD", category: "Vitamins", unit: "ng/mL", aliases: ["25-OH Vitamin D", "Vitamin D, 25-Hydroxy"] },

  // Electrolytes
  { name: "sodium", category: "Metabolic Panel", unit: "mEq/L", aliases: ["Na"] },
  { name: "potassium", category: "Metabolic Panel", unit: "mEq/L", aliases: ["K"] },
  { name: "calcium", category: "Metabolic Panel", unit: "mg/dL", aliases: ["Ca"] },
  { name: "chloride", category: "Metabolic Panel", unit: "mEq/L", aliases: ["Cl"] }
];

async function extractTextFromPDF(pdfBuffer: ArrayBuffer): Promise<string> {
  try {
    console.log('Loading PDF document...');
    const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
    const pdf = await loadingTask.promise;
    console.log('PDF loaded, pages:', pdf.numPages);

    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    console.log('Extracted text length:', fullText.length);
    return fullText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Starting blood test processing...');

    // Check authentication from session cookie
    const sessionToken = request.cookies.get('next-auth.session-token')?.value || 
                        request.cookies.get('__Secure-next-auth.session-token')?.value;
                        
    if (!sessionToken) {
      console.log('Unauthorized: No session token');
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    console.log('Session token found');

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

    // Extract text from PDF
    const pdfText = await extractTextFromPDF(pdfBuffer);
    console.log('Extracted text from PDF');

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
  "category": "exactly matching one of: Complete Blood Count, White Blood Cell Differential, Metabolic Panel, Liver Function, Lipid Panel, Thyroid Function, Vitamins"
}

4. If you see variations like "HDL-C", map it to the exact name "hdlc"
5. Do not include any markers that don't exactly match our supported list
6. Do not include any explanatory text or markdown
7. Values must be numbers only, not strings or ranges

Example of CORRECT format:
[
  {
    "name": "hdlc",
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

  } catch (error) {
    console.error("Error processing blood test:", error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return new NextResponse(
        JSON.stringify({ 
          error: "Unauthorized",
          details: "Please sign in to access this API"
        }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    return new NextResponse(
      JSON.stringify({ 
        error: "Failed to process blood test",
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { status: 500 }
    );
  }
}