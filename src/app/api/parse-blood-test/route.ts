import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import OpenAI from "openai";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

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

export async function POST(request: NextRequest) {
  try {
    console.log('Starting blood test processing...');

    // Skip authentication for now as we're in Edge Runtime
    // We'll need to implement a different auth strategy for Edge
    
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

    return new NextResponse(
      JSON.stringify({ 
        success: true,
        message: "PDF file retrieved successfully",
        size: pdfBuffer.byteLength
      }), 
      { status: 200 }
    );

  } catch (error) {
    console.error("Error processing blood test:", error);
    return new NextResponse(
      JSON.stringify({ 
        error: "Failed to process blood test",
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { status: 500 }
    );
  }
}