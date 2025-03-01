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

// Advanced JSON repair utility
function attemptToRepairJson(jsonString) {
  console.log('Attempting advanced JSON repair...');
  
  // Try standard JSON.parse first
  try {
    return JSON.parse(jsonString);
  } catch (initialError) {
    console.log('Initial JSON parse failed, attempting repairs');
  }

  let repaired = jsonString;
  
  // Replace single quotes with double quotes (but not in already quoted strings)
  repaired = repaired.replace(/(\{|\,)\s*\'([^\']+)\'\s*\:/g, '$1"$2":');
  
  // Fix unquoted property names
  repaired = repaired.replace(/(\{|\,)\s*([a-zA-Z0-9_]+)\s*\:/g, '$1"$2":');
  
  // Fix trailing commas in objects and arrays
  repaired = repaired.replace(/,\s*\}/g, '}').replace(/,\s*\]/g, ']');
  
  // Fix missing quotes around string values
  repaired = repaired.replace(/:\s*([a-zA-Z][a-zA-Z0-9_\s]+)(\s*[,\}])/g, ':"$1"$2');
  
  // Balance brackets and braces
  const bracketStack = [];
  let balancedString = '';
  
  for (let i = 0; i < repaired.length; i++) {
    const char = repaired[i];
    
    if (char === '{' || char === '[') {
      bracketStack.push(char);
      balancedString += char;
    } else if (char === '}') {
      if (bracketStack.length > 0 && bracketStack[bracketStack.length - 1] === '{') {
        bracketStack.pop();
        balancedString += char;
      }
    } else if (char === ']') {
      if (bracketStack.length > 0 && bracketStack[bracketStack.length - 1] === '[') {
        bracketStack.pop();
        balancedString += char;
      }
    } else {
      balancedString += char;
    }
  }
  
  // Add missing closing brackets/braces if needed
  while (bracketStack.length > 0) {
    const lastOpen = bracketStack.pop();
    balancedString += lastOpen === '{' ? '}' : ']';
  }
  
  // Try to parse the repaired JSON
  try {
    console.log('Attempting to parse repaired JSON...');
    return JSON.parse(balancedString);
  } catch (repairError) {
    console.error('Advanced JSON repair failed:', repairError.message);
    console.log('Falling back to minimal JSON structure');
    
    // Return a minimal valid structure as fallback
    return { dateGroups: [] };
  }
}

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
  
  const prompt = `Extract blood test results from the following text, paying attention to multiple test dates.

This text may contain multiple test dates with different values for the same markers on different dates.
For each identified test date, extract the associated marker values.

For the dates, thoroughly search for when blood tests were taken, looking for phrases like:
- "Received on", "Collection Date", "Test Date", "Specimen Date", "Date of Collection"
- "Report Date", "Date Reported", "Date", "Collected", "Date Collected"
- "Date of Service", "Drawn Date", "Draw Date", "Specimen Collected"
- Any date in proximity to blood markers

Return the results in this exact JSON format:
{
  "dateGroups": [
    {
      "testDate": "YYYY-MM-DD", // The test date in ISO format (YYYY-MM-DD)
      "markers": [
        {
          "name": "exact marker name",
          "value": number,
          "unit": "exact unit",
          "flag": "High" | "Low" | null,
          "category": "exact category name"
        }
      ]
    }
  ]
}

Example date conversion:
- If text shows "Received on 08/29/2024", testDate should be "2024-08-29"
- If text shows "Collection Date: 8/5/2024", testDate should be "2024-08-05"
- If text shows "Drawn: Jan 15, 2024", testDate should be "2024-01-15"
- If text shows "SPECIMEN: 15 Apr 2024", testDate should be "2024-04-15"

Group markers by their test date. If the date association is unclear for some markers, 
place them with the most likely date based on context.

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
            content: "You are a precise blood test result extractor that always produces valid JSON. You must exactly match marker names, units, and categories from the supported list. No variations or substitutions allowed. Pay special attention to finding multiple test dates and associating the correct marker values with each date. Always verify your JSON is valid with properly quoted property names and string values before responding."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 2500, // Increased from 1500 to handle more complex PDFs
        temperature: 0
      });

      let result;
      try {
        // Store the raw content for debugging
        const rawContent = response.choices[0].message.content;
        console.log('Raw content from OpenAI (first 300 chars):', rawContent.slice(0, 300) + '...');
        
        // Try to parse the JSON response
        result = JSON.parse(rawContent);
      } catch (parseError) {
        console.error('JSON parsing error:', parseError.message);
        console.log('Attempting to fix malformed JSON...');
        
        // Get the raw content
        const rawContent = response.choices[0].message.content;
        
        // Use the advanced JSON repair utility
        result = attemptToRepairJson(rawContent);
        
        // If repair returned an empty structure, throw an error to trigger a retry
        if (!result.dateGroups || result.dateGroups.length === 0) {
          throw new Error(`Failed to parse or repair JSON: ${parseError.message}`);
        }
      }
      
      console.log('Raw LLM response:', JSON.stringify(result).slice(0, 300) + '...');
      
      // Validate the response structure
      if (!result.dateGroups || !Array.isArray(result.dateGroups)) {
        console.error('Invalid response format from OpenAI - missing dateGroups array:', result);
        throw new Error('Invalid response format: missing dateGroups array');
      }
      
      // Process and validate each date group
      const validatedDateGroups = [];
      
      for (const dateGroup of result.dateGroups) {
        // Validate test date
        let validatedDate = null;
        if (dateGroup.testDate) {
          try {
            // If the date is not already in ISO format, attempt to parse it
            let dateString = dateGroup.testDate;
            console.log('🧪 Raw date string from LLM:', dateString);
            
            // Check if already in ISO format (YYYY-MM-DD)
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
              console.log('🧪 Date is not in ISO format, attempting to parse...');
              // Try to parse with Date constructor
              const dateObj = new Date(dateString);
              
              if (!isNaN(dateObj.getTime())) {
                // Format as ISO date string
                dateString = dateObj.toISOString().split('T')[0];
                console.log('🧪 Successfully parsed to ISO format:', dateString);
              } else {
                throw new Error(`Could not parse date: ${dateString}`);
              }
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
            console.warn('🧪 Original date string from LLM:', dateGroup.testDate);
          }
        }

        // Validate markers
        if (!dateGroup.markers || !Array.isArray(dateGroup.markers)) {
          console.warn('Invalid markers array for date group:', dateGroup);
          continue; // Skip this date group
        }
        
        // Validate each marker against the supported list
        const validatedMarkers = dateGroup.markers.map(marker => {
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
        
        // Only add date groups with a valid date and at least one valid marker
        if (validatedDate && validatedMarkers.length > 0) {
          validatedDateGroups.push({
            testDate: validatedDate,
            markers: validatedMarkers
          });
        }
      }
      
      console.log('Successfully extracted and validated date groups:', 
        validatedDateGroups.map(g => ({
          testDate: g.testDate,
          markerCount: g.markers.length
        }))
      );
      
      // Consolidate date groups with the same date
      const consolidatedDateGroups = [];
      const dateMap = new Map();
      
      // First, group all markers by date
      for (const dateGroup of validatedDateGroups) {
        const date = dateGroup.testDate;
        if (!dateMap.has(date)) {
          dateMap.set(date, []);
        }
        dateMap.get(date).push(...dateGroup.markers);
      }
      
      // Create consolidated date groups with unique markers
      for (const [date, markers] of dateMap.entries()) {
        // Deduplicate markers by name (keeping the first occurrence)
        const uniqueMarkers = [];
        const markerNames = new Set();
        
        for (const marker of markers) {
          if (!markerNames.has(marker.name)) {
            markerNames.add(marker.name);
            uniqueMarkers.push(marker);
          }
        }
        
        // Add the consolidated group
        consolidatedDateGroups.push({
          testDate: date,
          markers: uniqueMarkers
        });
      }
      
      // Log the consolidation results
      console.log('Consolidated date groups:', 
        consolidatedDateGroups.map(g => ({
          testDate: g.testDate,
          markerCount: g.markers.length
        }))
      );
      
      // For backward compatibility, also return the most recent test date and its markers
      // as top-level properties if we found any valid date groups
      if (consolidatedDateGroups.length > 0) {
        // Sort by date descending (newest first)
        consolidatedDateGroups.sort((a, b) => 
          new Date(b.testDate).getTime() - new Date(a.testDate).getTime()
        );
        
        return {
          // Most recent test date and markers for backward compatibility
          testDate: consolidatedDateGroups[0].testDate,
          markers: consolidatedDateGroups[0].markers,
          // New multi-date structure
          dateGroups: consolidatedDateGroups
        };
      }
      
      return { testDate: null, markers: [], dateGroups: [] };

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

      // Retry on API rate limits, quota issues, or JSON parsing errors
      if (
        error?.status === 429 || 
        error?.type === 'insufficient_quota' ||
        error?.message?.includes('JSON') || 
        error?.message?.includes('parse')
      ) {
        const retryDelay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
        console.log(`Retrying in ${retryDelay}ms...`);
        await sleep(retryDelay);
        continue;
      }
      
      if (attempt === MAX_RETRIES - 1) {
        console.error('All retries failed');
        return { testDate: null, markers: [], dateGroups: [] };
      }
    }
  }

  return { testDate: null, markers: [], dateGroups: [] };
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
    const { testDate, markers: bloodMarkers, dateGroups } = await extractBloodMarkersWithLLM(text);
    
    console.log('Extraction summary:', {
      dateGroupsCount: dateGroups?.length || 0,
      mainDate: testDate,
      mainMarkersCount: bloodMarkers?.length || 0
    });
    
    return NextResponse.json({ 
      success: true,
      text: text.trim(),
      markers: bloodMarkers,
      testDate,
      dateGroups: dateGroups || [],
      message: 'Text processed successfully',
      hasMultipleDates: (dateGroups?.length || 0) > 1
    });

  } catch (error) {
    console.error('Error processing text:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process text'
    }, { status: 500 });
  }
} 