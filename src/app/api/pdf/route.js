import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
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
  // Lipid Panel
  { name: 'Total Cholesterol', unit: 'mg/dL', category: 'Lipid Panel' },
  { name: 'LDL-C', unit: 'mg/dL', category: 'Lipid Panel' },
  { name: 'HDL-C', unit: 'mg/dL', category: 'Lipid Panel' },
  { name: 'Triglycerides', unit: 'mg/dL', category: 'Lipid Panel' },
  { name: 'ApoB', unit: 'mg/dL', category: 'Lipid Panel' },
  { name: 'Lp(a)', unit: 'nmol/L', category: 'Lipid Panel' },
  
  // Complete Blood Count
  { name: 'White Blood Cells', unit: 'K/µL', category: 'Complete Blood Count' },
  { name: 'Red Blood Cells', unit: 'M/µL', category: 'Complete Blood Count' },
  { name: 'Hematocrit', unit: '%', category: 'Complete Blood Count' },
  { name: 'Hemoglobin', unit: 'g/dL', category: 'Complete Blood Count' },
  { name: 'Platelets', unit: 'K/µL', category: 'Complete Blood Count' },
  
  // Glucose Markers
  { name: 'HbA1c', unit: '%', category: 'Glucose Markers' },
  { name: 'Fasting Insulin', unit: 'µIU/mL', category: 'Glucose Markers' },
  { name: 'Glucose', unit: 'mg/dL', category: 'Glucose Markers' },
  
  // Liver Markers
  { name: 'ALT', unit: 'U/L', category: 'Liver Markers' },
  { name: 'AST', unit: 'U/L', category: 'Liver Markers' },
  { name: 'GGT', unit: 'U/L', category: 'Liver Markers' },
  
  // Kidney Markers
  { name: 'eGFR', unit: 'mL/min/1.73m²', category: 'Kidney Markers' },
  { name: 'Cystatin C', unit: 'mg/L', category: 'Kidney Markers' },
  { name: 'BUN', unit: 'mg/dL', category: 'Kidney Markers' },
  { name: 'Creatinine', unit: 'mg/dL', category: 'Kidney Markers' },
  { name: 'Albumin', unit: 'g/dL', category: 'Kidney Markers' },
  
  // Sex Hormones
  { name: 'Testosterone', unit: 'ng/dL', category: 'Sex Hormones' },
  { name: 'Free Testosterone', unit: 'pg/mL', category: 'Sex Hormones' },
  { name: 'Estradiol', unit: 'pg/mL', category: 'Sex Hormones' },
  { name: 'SHBG', unit: 'nmol/L', category: 'Sex Hormones' },
  
  // Thyroid Markers
  { name: 'T3', unit: 'pg/mL', category: 'Thyroid Markers' },
  { name: 'T4', unit: 'ng/dL', category: 'Thyroid Markers' },
  { name: 'TSH', unit: 'mIU/L', category: 'Thyroid Markers' },
  
  // Vitamins & Inflammation
  { name: 'Vitamin D3', unit: 'ng/mL', category: 'Vitamins & Inflammation' },
  { name: 'hs-CRP', unit: 'mg/L', category: 'Vitamins & Inflammation' },
  { name: 'Homocysteine', unit: 'µmol/L', category: 'Vitamins & Inflammation' },
  
  // Growth Factors
  { name: 'IGF-1', unit: 'ng/mL', category: 'Growth Factors' },
  
  // Iron Panel
  { name: 'Ferritin', unit: 'ng/mL', category: 'Iron Panel' },
  { name: 'Serum Iron', unit: 'µg/dL', category: 'Iron Panel' },
  { name: 'TIBC', unit: 'µg/dL', category: 'Iron Panel' },
  { name: 'Transferrin Saturation', unit: '%', category: 'Iron Panel' },
  
  // Electrolytes
  { name: 'Sodium', unit: 'mEq/L', category: 'Electrolytes' },
  { name: 'Potassium', unit: 'mEq/L', category: 'Electrolytes' },
  { name: 'Calcium', unit: 'mg/dL', category: 'Electrolytes' },
  { name: 'Phosphorus', unit: 'mg/dL', category: 'Electrolytes' },
  { name: 'Magnesium', unit: 'mg/dL', category: 'Electrolytes' },
  { name: 'Bicarbonate', unit: 'mEq/L', category: 'Electrolytes' },
  { name: 'Chloride', unit: 'mEq/L', category: 'Electrolytes' }
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
  console.log('Processing text (first 500 chars):', text.slice(0, 500));
  
  const prompt = `Extract blood test results and test date from the following text. 

For the date, thoroughly search for when the blood test was taken, looking for phrases like:
- "Received on", "Collection Date", "Test Date", "Specimen Date", "Date of Collection"
- "Report Date", "Date Reported", "Date", "Collected", "Date Collected"
- "Date of Service", "Drawn Date", "Draw Date", "Specimen Collected"
- Any date in proximity to the blood markers or at the top of the report

If multiple dates are found, prioritize the one most likely to be the specimen collection date rather than the report date.
The date in the text should be used EXACTLY as found and converted to ISO format (YYYY-MM-DD).

Return the results in this exact JSON format:
{
  "testDate": "YYYY-MM-DD", // The test/collection date in ISO format, using the EXACT date found in the text. If not found, return null
  "markers": [{
    "name": "exact marker name",
    "value": number,
    "unit": "exact unit",
    "flag": "High" | "Low" | null,
    "category": "exact category name"
  }]
}

Example date conversion:
- If text shows "Received on 08/29/2024", testDate should be "2024-08-29"
- If text shows "Collection Date: 8/5/2024", testDate should be "2024-08-05"
- If text shows "Drawn: Jan 15, 2024", testDate should be "2024-01-15"
- If text shows "SPECIMEN: 15 Apr 2024", testDate should be "2024-04-15"

Only include markers that match EXACTLY with the following supported markers, their units, and categories:

${SUPPORTED_MARKERS.map(m => `- ${m.name} (${m.unit}) [Category: ${m.category}]`).join('\n')}

Only include markers that are explicitly present in the text with clear values. Do not infer or calculate values.
If a marker from the supported list is not found in the text, do not include it in the markers array.

Text to process:
${text}`;

  console.log('Sending request to OpenAI...');
  
  let lastError;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      await waitForRateLimit();
      
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-0125",
        messages: [
          {
            role: "system",
            content: "You are a precise blood test result extractor. You must exactly match marker names, units, and categories from the supported list. No variations or substitutions allowed. Pay special attention to finding and extracting the exact test date in the proper format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
        temperature: 0
      });

      const result = JSON.parse(response.choices[0].message.content);
      
      // Validate date format
      let validatedDate = null;
      if (result.testDate) {
        try {
          // If the result.testDate is not already in ISO format, attempt to parse it
          let dateString = result.testDate;
          console.log('🧪 Raw date string from LLM:', dateString);
          console.log('🧪 Date string type:', typeof dateString);
          
          // Check if already in ISO format (YYYY-MM-DD)
          if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            console.log('🧪 Date is not in ISO format, attempting to parse...');
            // Try to parse with Date constructor
            const dateObj = new Date(dateString);
            console.log('🧪 Date object after parsing:', dateObj);
            console.log('🧪 Date object validity:', !isNaN(dateObj.getTime()) ? 'valid' : 'invalid');
            
            if (!isNaN(dateObj.getTime())) {
              // Format as ISO date string
              dateString = dateObj.toISOString().split('T')[0];
              console.log('🧪 Successfully parsed to ISO format:', dateString);
            } else {
              throw new Error(`Could not parse date: ${dateString}`);
            }
          } else {
            console.log('🧪 Date is already in ISO format:', dateString);
          }
          
          // Final validation of the ISO format
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            validatedDate = dateString;
            console.log('🧪 Successfully validated and formatted date:', validatedDate);
          } else {
            throw new Error(`Invalid ISO date format: ${dateString}`);
          }
        } catch (error) {
          console.warn('🧪 Error validating date:', error.message);
          console.warn('🧪 Original date string from LLM:', result.testDate);
        }
      } else {
        console.warn('🧪 No test date found in the PDF text');
      }

      if (!result.markers || !Array.isArray(result.markers)) {
        console.error('Invalid response format from OpenAI:', result);
        throw new Error('Invalid response format');
      }

      // Validate each marker against the supported list
      const validatedMarkers = result.markers.map(marker => {
        const supportedMarker = SUPPORTED_MARKERS.find(m => m.name === marker.name);
        if (!supportedMarker) {
          console.warn(`Marker "${marker.name}" not found in supported list`);
          return null;
        }
        if (supportedMarker.unit !== marker.unit) {
          console.warn(`Invalid unit for ${marker.name}: got ${marker.unit}, expected ${supportedMarker.unit}`);
          return null;
        }
        if (supportedMarker.category !== marker.category) {
          console.warn(`Invalid category for ${marker.name}: got ${marker.category}, expected ${supportedMarker.category}`);
          // Fix the category
          return { ...marker, category: supportedMarker.category };
        }
        return marker;
      }).filter(Boolean);
      
      console.log('Successfully extracted and validated markers:', validatedMarkers);
      return {
        testDate: validatedDate,
        markers: validatedMarkers
      };

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

      if (error?.status === 429 || error?.type === 'insufficient_quota') {
        const retryDelay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
        console.log(`Retrying in ${retryDelay}ms...`);
        await sleep(retryDelay);
        continue;
      }
      
      if (attempt === MAX_RETRIES - 1) {
        console.error('All retries failed');
        return { testDate: null, markers: [] };
      }
    }
  }

  return { testDate: null, markers: [] };
}

export async function POST(request) {
  console.log('=== Text Processing Started ===');
  
  try {
    const { text } = await request.json();
    
    if (!text) {
      return NextResponse.json({ 
        success: false, 
        error: 'No text provided' 
      }, { status: 400 });
    }

    // Extract blood markers using LLM
    const { testDate, markers: bloodMarkers } = await extractBloodMarkersWithLLM(text);
    console.log('Extracted data:', { 
      testDate, 
      markers: bloodMarkers.length,
      markerSample: bloodMarkers.length > 0 ? bloodMarkers[0] : null
    });
    
    if (testDate) {
      console.log('🧪 Sending testDate to client:', testDate);
      console.log('🧪 Date type:', typeof testDate);
      console.log('🧪 Valid ISO format check:', /^\d{4}-\d{2}-\d{2}$/.test(testDate));
      console.log('🧪 Date string length:', testDate.length);
      console.log('🧪 Date string characters:', Array.from(testDate).map(c => c.charCodeAt(0)));
    } else {
      console.log('🧪 No testDate found, sending null to client');
    }

    return NextResponse.json({ 
      success: true,
      text: text.trim(),
      markers: bloodMarkers,
      testDate,
      message: 'Text processed successfully'
    });

  } catch (error) {
    console.error('Error processing text:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process text'
    }, { status: 500 });
  }
} 