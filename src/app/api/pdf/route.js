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
const MAX_CHUNK_SIZE = 5000; // Reduced to mitigate large JSON responses

// Sleep utility
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Strip ```json fences that the model may surround the payload with
function stripJsonFence(str) {
  return str.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim();
}

// Advanced JSON repair utility
function attemptToRepairJson(jsonString) {
  // Strip any markdown code fences first
  jsonString = stripJsonFence(jsonString);
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
  
  // CBC Differentials
  { name: 'Neutrophil Count', unit: 'K/µL', category: 'CBC Differentials' },
  { name: 'Neutrophil Percentage', unit: '%', category: 'CBC Differentials' },
  { name: 'Lymphocyte Count', unit: 'K/µL', category: 'CBC Differentials' },
  { name: 'Lymphocyte Percentage', unit: '%', category: 'CBC Differentials' },
  { name: 'Monocyte Count', unit: 'K/µL', category: 'CBC Differentials' },
  { name: 'Monocyte Percentage', unit: '%', category: 'CBC Differentials' },
  { name: 'Eosinophil Count', unit: 'K/µL', category: 'CBC Differentials' },
  { name: 'Eosinophil Percentage', unit: '%', category: 'CBC Differentials' },
  { name: 'Basophil Count', unit: 'K/µL', category: 'CBC Differentials' },
  { name: 'Basophil Percentage', unit: '%', category: 'CBC Differentials' },
  
  // Red Blood Cell Indices
  { name: 'MCV', unit: 'fL', category: 'Red Blood Cell Indices' },
  { name: 'MCH', unit: 'pg', category: 'Red Blood Cell Indices' },
  { name: 'MCHC', unit: 'g/dL', category: 'Red Blood Cell Indices' },
  { name: 'RDW', unit: '%', category: 'Red Blood Cell Indices' },
  { name: 'MPV', unit: 'fL', category: 'Red Blood Cell Indices' },
  
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
  
  // Vitamins & Minerals
  { name: 'Vitamin D', unit: 'ng/mL', category: 'Vitamins & Minerals' },
  { name: 'Vitamin B12', unit: 'pg/mL', category: 'Vitamins & Minerals' },
  { name: 'Folate', unit: 'ng/mL', category: 'Vitamins & Minerals' },
  { name: 'Iron', unit: 'µg/dL', category: 'Vitamins & Minerals' },
  { name: 'Magnesium', unit: 'mg/dL', category: 'Vitamins & Minerals' },
  { name: 'RBC Magnesium', unit: 'mg/dL', category: 'Vitamins & Minerals' },
  
  // Inflammation
  { name: 'hs-CRP', unit: 'mg/L', category: 'Inflammation' },
  { name: 'Homocysteine', unit: 'µmol/L', category: 'Inflammation' },
  
  // Growth Factors
  { name: 'IGF-1', unit: 'ng/mL', category: 'Growth Factors' },
  
  // Biological Age & Longevity
  { name: 'Biological Age', unit: 'years', category: 'Longevity Markers' },
  { name: 'Epigenetic Age (DNAm)', unit: 'years', category: 'Longevity Markers' },
  { name: 'Phenotypic Age', unit: 'years', category: 'Longevity Markers' },
  { name: 'GrimAge', unit: 'years', category: 'Longevity Markers' },
  { name: 'PhenoAge', unit: 'years', category: 'Longevity Markers' },
  { name: 'Horvath Age', unit: 'years', category: 'Longevity Markers' },
  { name: 'Hannum Age', unit: 'years', category: 'Longevity Markers' },
  { name: 'Telomere Length', unit: 'kb', category: 'Longevity Markers' },
  
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
  { name: 'Chloride', unit: 'mEq/L', category: 'Electrolytes' },
  
  // Additional markers
  { name: 'Creatine Kinase', unit: 'U/L', category: 'Additional Markers' },
  { name: 'Cortisol', unit: 'µg/dL', category: 'Additional Markers' }
];

// Create normalization map for alternative marker names
const MARKER_NORMALIZATION_MAP = {
  // Lipid Panel
  'CHOLESTEROL, TOTAL': 'Total Cholesterol',
  'CHOLESTEROL,TOTAL': 'Total Cholesterol',
  'CHOLESTEROL TOTAL': 'Total Cholesterol',
  'TOTAL CHOL': 'Total Cholesterol',
  'CHOL': 'Total Cholesterol',
  'CHOLESTEROL': 'Total Cholesterol',
  
  'LDL CHOLESTEROL': 'LDL-C',
  'LDL CHOL': 'LDL-C',
  'LDL': 'LDL-C',
  'LOW DENSITY LIPOPROTEIN': 'LDL-C',
  'LDL-CHOLESTEROL': 'LDL-C',
  'LDL CHOLESTEROL CALC': 'LDL-C',
  'LDL-CHOL': 'LDL-C',
  
  'HDL CHOLESTEROL': 'HDL-C',
  'HDL CHOL': 'HDL-C',
  'HDL': 'HDL-C',
  'HIGH DENSITY LIPOPROTEIN': 'HDL-C',
  'HDL-CHOLESTEROL': 'HDL-C',
  'HDL-CHOL': 'HDL-C',
  
  'TRIG': 'Triglycerides',
  'TG': 'Triglycerides',
  'TRIGLYCERIDE': 'Triglycerides',
  
  // Complete Blood Count
  'WBC': 'White Blood Cells',
  'WHITE BLOOD CELL COUNT': 'White Blood Cells',
  'WHITE CELL COUNT': 'White Blood Cells',
  'LEUKOCYTES': 'White Blood Cells',
  
  'RBC': 'Red Blood Cells',
  'RED BLOOD CELL COUNT': 'Red Blood Cells',
  'RED CELL COUNT': 'Red Blood Cells',
  'ERYTHROCYTES': 'Red Blood Cells',
  
  'HCT': 'Hematocrit',
  
  'HGB': 'Hemoglobin',
  'HB': 'Hemoglobin',
  
  'PLT': 'Platelets',
  'PLATELET COUNT': 'Platelets',
  
  // CBC Differentials
  'NEUTROPHILS, ABSOLUTE': 'Neutrophil Count',
  'ABSOLUTE NEUTROPHILS': 'Neutrophil Count',
  'ANC': 'Neutrophil Count',
  'NEUT': 'Neutrophil Count',
  'NEUTROPHILS': 'Neutrophil Count',
  'NEUTROPHIL': 'Neutrophil Count',
  'SEGS': 'Neutrophil Count',
  
  'NEUTROPHILS %': 'Neutrophil Percentage',
  'NEUT %': 'Neutrophil Percentage',
  'NEUTROPHIL %': 'Neutrophil Percentage',
  'SEGS %': 'Neutrophil Percentage',
  
  'LYMPHOCYTES, ABSOLUTE': 'Lymphocyte Count',
  'ABSOLUTE LYMPHOCYTES': 'Lymphocyte Count',
  'LYMPHS': 'Lymphocyte Count',
  'LYMPHOCYTES': 'Lymphocyte Count',
  'LYMPHOCYTE': 'Lymphocyte Count',
  
  'LYMPHOCYTES %': 'Lymphocyte Percentage',
  'LYMPHS %': 'Lymphocyte Percentage',
  'LYMPHOCYTE %': 'Lymphocyte Percentage',
  
  'MONOCYTES, ABSOLUTE': 'Monocyte Count',
  'ABSOLUTE MONOCYTES': 'Monocyte Count',
  'MONOS': 'Monocyte Count',
  'MONOCYTES': 'Monocyte Count',
  'MONOCYTE': 'Monocyte Count',
  
  'MONOCYTES %': 'Monocyte Percentage',
  'MONOS %': 'Monocyte Percentage',
  'MONOCYTE %': 'Monocyte Percentage',
  
  'EOSINOPHILS, ABSOLUTE': 'Eosinophil Count',
  'ABSOLUTE EOSINOPHILS': 'Eosinophil Count',
  'EOS': 'Eosinophil Count',
  'EOSINOPHILS': 'Eosinophil Count',
  'EOSINOPHIL': 'Eosinophil Count',
  
  'EOSINOPHILS %': 'Eosinophil Percentage',
  'EOS %': 'Eosinophil Percentage',
  'EOSINOPHIL %': 'Eosinophil Percentage',
  
  'BASOPHILS, ABSOLUTE': 'Basophil Count',
  'ABSOLUTE BASOPHILS': 'Basophil Count',
  'BASOS': 'Basophil Count',
  'BASOPHILS': 'Basophil Count',
  'BASOPHIL': 'Basophil Count',
  
  'BASOPHILS %': 'Basophil Percentage',
  'BASOS %': 'Basophil Percentage',
  'BASOPHIL %': 'Basophil Percentage',
  
  // Red Blood Cell Indices
  'MEAN CORPUSCULAR VOLUME': 'MCV',
  
  'MEAN CORPUSCULAR HEMOGLOBIN': 'MCH',
  
  'MEAN CORPUSCULAR HEMOGLOBIN CONCENTRATION': 'MCHC',
  
  'RED CELL DISTRIBUTION WIDTH': 'RDW',
  'RDW-CV': 'RDW',
  'RDW-SD': 'RDW',
  
  'MEAN PLATELET VOLUME': 'MPV',
  
  // Glucose Markers
  'A1C': 'HbA1c',
  'HEMOGLOBIN A1C': 'HbA1c',
  'GLYCOHEMOGLOBIN': 'HbA1c',
  'GLYCATED HEMOGLOBIN': 'HbA1c',
  
  'INSULIN': 'Fasting Insulin',
  
  'GLUCOSE FASTING': 'Glucose',
  'FASTING GLUCOSE': 'Glucose',
  'BLOOD GLUCOSE': 'Glucose',
  'SUGAR': 'Glucose',
  
  // Liver Markers
  'SGPT': 'ALT',
  'ALANINE AMINOTRANSFERASE': 'ALT',
  'ALANINE TRANSAMINASE': 'ALT',
  
  'SGOT': 'AST',
  'ASPARTATE AMINOTRANSFERASE': 'AST',
  'ASPARTATE TRANSAMINASE': 'AST',
  
  'GAMMA-GLUTAMYL TRANSFERASE': 'GGT',
  'GAMMA GLUTAMYL TRANSFERASE': 'GGT',
  
  // Vitamins & Minerals
  'VITAMIN D, 25-HYDROXY': 'Vitamin D',
  'VITAMIN D 25-HYDROXY': 'Vitamin D',
  'VITAMIN D3': 'Vitamin D',
  '25-OH VITAMIN D': 'Vitamin D',
  '25(OH)D': 'Vitamin D',
  '25-HYDROXYVITAMIN D': 'Vitamin D',
  
  'VITAMIN B-12': 'Vitamin B12',
  'VITAMIN B12': 'Vitamin B12',
  'VIT B12': 'Vitamin B12',
  'B12': 'Vitamin B12',
  'COBALAMIN': 'Vitamin B12',
  
  'FOLIC ACID': 'Folate',
  'VITAMIN B9': 'Folate',
  
  'SERUM IRON': 'Iron',
  'IRON, SERUM': 'Iron',
  
  'MAGNESIUM, SERUM': 'Magnesium',
  'MAGNESIUM, RBC': 'RBC Magnesium',
  'RBC MAGNESIUM': 'RBC Magnesium',
  
  // Inflammation
  'CRP': 'hs-CRP',
  'C-REACTIVE PROTEIN': 'hs-CRP',
  'HIGH SENSITIVITY CRP': 'hs-CRP',
  'HS CRP': 'hs-CRP',
  'HSCRP': 'hs-CRP',
  
  // Additional Markers
  'CK': 'Creatine Kinase',
  'CPK': 'Creatine Kinase',
  'CREATINE PHOSPHOKINASE': 'Creatine Kinase',
  
  'CORTISOL, SERUM': 'Cortisol',
  'SERUM CORTISOL': 'Cortisol',
  
  // Sex Hormones
  'TOTAL TESTOSTERONE': 'Testosterone',
  'TEST': 'Testosterone',
  'TESTO': 'Testosterone',
  'TOTAL TEST': 'Testosterone',
  'T': 'Testosterone',
  'SERUM TESTOSTERONE': 'Testosterone',
  'TESTOSTERONE, SERUM': 'Testosterone',
  
  'FREE TESTO': 'Free Testosterone',
  'FREE TEST': 'Free Testosterone',
  'DIRECT FREE TESTOSTERONE': 'Free Testosterone',
  'FREE TESTOSTERONE DIRECT': 'Free Testosterone',
  'BIOAVAILABLE TESTOSTERONE': 'Free Testosterone',
  'FREE T': 'Free Testosterone',
  
  // Biological Age & Longevity Markers
  'BIO AGE': 'Biological Age',
  'BIOAGE': 'Biological Age',
  'BIOLOGICAL AGE': 'Biological Age',
  'EPIGENETIC AGE': 'Epigenetic Age (DNAm)',
  'DNAM AGE': 'Epigenetic Age (DNAm)',
  'DNA METHYLATION AGE': 'Epigenetic Age (DNAm)',
  'PHENOAGE': 'Phenotypic Age',
  'PHENO AGE': 'Phenotypic Age',
  'PHENOTYPIC AGE': 'Phenotypic Age',
  'GRIM AGE': 'GrimAge',
  'GRIMM AGE': 'GrimAge',
  'HORVATH AGE': 'Horvath Age',
  'HANNUM AGE': 'Hannum Age',
  'TELOMERE LENGTH': 'Telomere Length',
  'TELOMERES': 'Telomere Length',
  'TL': 'Telomere Length',
  
  // Common unit normalizations
  'mg/dl': 'mg/dL',
  'MG/DL': 'mg/dL',
  'ng/dl': 'ng/dL',
  'NG/DL': 'ng/dL',
  'pg/ml': 'pg/mL',
  'PG/ML': 'pg/mL',
  'uIU/ml': 'µIU/mL',
  'uIU/mL': 'µIU/mL',
  'UIU/ML': 'µIU/mL',
  'K/uL': 'K/µL',
  'K/ul': 'K/µL',
  'M/uL': 'M/µL',
  'M/ul': 'M/µL',
  'g/dl': 'g/dL',
  'G/DL': 'g/dL',
  'meq/L': 'mEq/L',
  'MEQ/L': 'mEq/L',
  'umol/L': 'µmol/L',
  'UMOL/L': 'µmol/L',
  'ug/dL': 'µg/dL',
  'UG/DL': 'µg/dL',
  'ml/min/1.73m2': 'mL/min/1.73m²',
  'ML/MIN/1.73M2': 'mL/min/1.73m²',
  'fl': 'fL',
  'FL': 'fL',
  'U/l': 'U/L',
  'u/L': 'U/L',
};

// Add function to normalize marker names and units
function normalizeMarker(marker) {
  // Normalize marker name
  const normalizedName = MARKER_NORMALIZATION_MAP[marker.name.toUpperCase()] || marker.name;
  
  // Normalize unit
  const normalizedUnit = MARKER_NORMALIZATION_MAP[marker.unit] || marker.unit;
  
  return {
    ...marker,
    name: normalizedName,
    unit: normalizedUnit
  };
}

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

DO AN EXTREMELY THOROUGH CHECK FOR EACH OF THE FOLLOWING MARKERS. 
For each marker, try MULTIPLE different search patterns including abbreviations, variations in spacing, and common alternative phrasings.

Only include markers that match EXACTLY with the following supported markers, their units, and categories:

${SUPPORTED_MARKERS.map(m => `- ${m.name} (${m.unit}) [Category: ${m.category}]`).join('\n')}

For each marker, check for ALTERNATIVE NAMES AND FORMATS, for example:
- "Total Cholesterol" might appear as "Cholesterol, Total", "Total CHOL", "CHOL", or "Cholesterol"
- "LDL-C" might appear as "LDL Cholesterol", "LDL", "Low Density Lipoprotein", or "LDL-Cholesterol"
- "HDL-C" might appear as "HDL Cholesterol", "HDL", "High Density Lipoprotein", or "HDL-Cholesterol"
- "Triglycerides" might appear as "TRIG", "TG", or "Triglyceride"

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
        model: "gpt-4o", // Upgraded from gpt-3.5-turbo for better accuracy
        messages: [
          {
            role: "system",
            content: "You are a precise blood test result extractor that always produces valid JSON. You must exactly match marker names, units, and categories from the supported list. No variations or substitutions allowed. Pay special attention to finding multiple test dates and associating the correct marker values with each date. Always verify your JSON is valid with properly quoted property names and string values before responding. BE EXTREMELY THOROUGH AND CONSISTENT in searching for all supported markers, checking multiple variations and formats of each marker name."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 4000, // Increased from 2500 to handle more complex PDFs
        temperature: 0
      });

      let result;
      try {
        // Store the raw content for debugging
        let rawContent = response.choices[0].message.content;
        console.log('Raw content from OpenAI (first 300 chars):', rawContent.slice(0, 300) + '...');
        
        // Remove possible markdown fences
        rawContent = stripJsonFence(rawContent);
      
      // Quick integrity check: if JSON is obviously truncated, trigger a retry
      const trimmedContent = rawContent.trim();
      if (!trimmedContent.startsWith('{') || !trimmedContent.endsWith('}')) {
        throw new Error('Incomplete JSON response received from OpenAI');
      }
      
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
          // First normalize the marker
          const normalizedMarker = normalizeMarker(marker);
          
          const supportedMarker = SUPPORTED_MARKERS.find(m => m.name === normalizedMarker.name);
          if (!supportedMarker) {
            console.warn(`Marker "${normalizedMarker.name}" not found in supported list`);
            return null;
          }
          
          // Check if the unit matches after normalization
          if (supportedMarker.unit !== normalizedMarker.unit) {
            console.warn(`Invalid unit for ${normalizedMarker.name}: got ${normalizedMarker.unit}, expected ${supportedMarker.unit}`);
            // Try to fix the unit
            return {
              ...normalizedMarker,
              unit: supportedMarker.unit
            };
          }
          
          if (supportedMarker.category !== normalizedMarker.category) {
            console.warn(`Invalid category for ${normalizedMarker.name}: got ${normalizedMarker.category}, expected ${supportedMarker.category}`);
            // Fix the category
            return {
              ...normalizedMarker,
              category: supportedMarker.category
            };
          }
          
          return normalizedMarker;
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

// Add a function to process large PDFs in chunks
async function processLargeText(text) {
  // If text is small enough, process it directly
  if (text.length <= MAX_CHUNK_SIZE) {
    return await extractBloodMarkersWithLLM(text);
  }
  
  console.log(`Text is large (${text.length} chars), processing in chunks...`);
  
  // Split text into chunks with some overlap
  const overlap = 200;  // Characters of overlap between chunks
  let chunks = [];
  
  for (let i = 0; i < text.length; i += MAX_CHUNK_SIZE - overlap) {
    const end = Math.min(i + MAX_CHUNK_SIZE, text.length);
    chunks.push(text.substring(i, end));
  }
  
  console.log(`Split text into ${chunks.length} chunks`);
  
  // Process each chunk
  const chunkResults = [];
  
  for (let i = 0; i < chunks.length; i++) {
    console.log(`Processing chunk ${i + 1}/${chunks.length}...`);
    try {
      const result = await extractBloodMarkersWithLLM(chunks[i]);
      chunkResults.push(result);
    } catch (error) {
      console.error(`Error processing chunk ${i + 1}:`, error);
      // Continue with other chunks even if one fails
    }
  }
  
  // Merge the results
  let allDateGroups = [];
  
  // Collect all date groups from all chunks
  chunkResults.forEach(result => {
    if (result.dateGroups && Array.isArray(result.dateGroups)) {
      allDateGroups = [...allDateGroups, ...result.dateGroups];
    }
  });
  
  // Consolidate date groups just like in the original function
  // (reusing this code to maintain consistency)
  const consolidatedDateGroups = [];
  const dateMap = new Map();
  
  // First, group all markers by date
  for (const dateGroup of allDateGroups) {
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
  console.log('Consolidated date groups from all chunks:', 
    consolidatedDateGroups.map(g => ({
      testDate: g.testDate,
      markerCount: g.markers.length
    }))
  );
  
  // For backward compatibility, also return the most recent test date and its markers
  if (consolidatedDateGroups.length > 0) {
    // Sort by date descending (newest first)
    consolidatedDateGroups.sort((a, b) => 
      new Date(b.testDate).getTime() - new Date(a.testDate).getTime()
    );
    
    return {
      testDate: consolidatedDateGroups[0].testDate,
      markers: consolidatedDateGroups[0].markers,
      dateGroups: consolidatedDateGroups
    };
  }
  
  return { testDate: null, markers: [], dateGroups: [] };
}

// Update the POST handler to use the new processLargeText function
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

    // Process text with chunking for large PDFs
    const { testDate, markers: bloodMarkers, dateGroups } = await processLargeText(text);
    
    console.log('Extraction summary:', {
      dateGroupsCount: dateGroups?.length || 0,
      mainDate: testDate,
      mainMarkersCount: bloodMarkers?.length || 0
    });
    
    // Don't return the full text in the response (it can be large)
    return NextResponse.json({ 
      success: true,
      textLength: text.length, // Just return the length for debugging
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