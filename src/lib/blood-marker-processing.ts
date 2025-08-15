/**
 * Blood marker data processing utilities
 * 
 * This module contains shared logic for processing blood marker data from the API,
 * including comprehensive name mapping and camelCase fallback conversion.
 */

import type { BloodMarkersCollection, BloodMarker } from '@/types/dashboard';

/**
 * Creates an empty blood markers collection with all marker arrays initialized
 */
export function createEmptyBloodMarkers(): BloodMarkersCollection {
  return {
    // Lipid Panel
    totalCholesterol: [],
    ldl: [],
    hdl: [],
    triglycerides: [],
    apoB: [],
    lpA: [],
    
    // Complete Blood Count
    whiteBloodCells: [],
    redBloodCells: [],
    hematocrit: [],
    hemoglobin: [],
    platelets: [],
    
    // CBC Differentials
    neutrophilCount: [],
    neutrophilPercentage: [],
    lymphocyteCount: [],
    lymphocytePercentage: [],
    monocyteCount: [],
    monocytePercentage: [],
    eosinophilCount: [],
    eosinophilPercentage: [],
    basophilCount: [],
    basophilPercentage: [],
    
    // Red Blood Cell Indices
    mcv: [],
    mch: [],
    mchc: [],
    rdw: [],
    mpv: [],
    
    // Glucose Markers
    hba1c: [],
    fastingInsulin: [],
    glucose: [],
    
    // Liver Markers
    alt: [],
    ast: [],
    ggt: [],
    
    // Kidney Markers
    egfr: [],
    cystatinC: [],
    bun: [],
    creatinine: [],
    albumin: [],
    
    // Sex Hormones
    testosterone: [],
    freeTesto: [],
    estradiol: [],
    shbg: [],
    
    // Thyroid Markers
    t3: [],
    t4: [],
    tsh: [],
    
    // Vitamins & Minerals
    vitaminD: [],
    vitaminB12: [],
    folate: [],
    iron: [],
    magnesium: [],
    rbcMagnesium: [],
    
    // Inflammation
    crp: [],
    homocysteine: [],
    
    // Growth Factors
    igf1: [],
    
    // Iron Panel
    ferritin: [],
    serumIron: [],
    tibc: [],
    transferrinSaturation: [],
    
    // Electrolytes
    sodium: [],
    potassium: [],
    calcium: [],
    phosphorus: [],
    bicarbonate: [],
    chloride: [],
    
    // Additional markers
    creatineKinase: [],
    cortisol: [],
    
    // Longevity Markers
    biologicalAge: []
  };
}

/**
 * Helper function to convert marker names to camelCase (from original code)
 */
function toCamel(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(' ')
    .map((w,i)=> i===0 ? w.toLowerCase() : w.charAt(0).toUpperCase()+w.slice(1).toLowerCase())
    .join('');
}

/**
 * Comprehensive marker name mapping from API names to internal property names
 * Includes common variations and alternative naming conventions
 */
const MARKER_NAME_TO_KEY: Record<string, keyof BloodMarkersCollection> = {
  'Biological Age': 'biologicalAge',
  'Total Cholesterol': 'totalCholesterol',
  'LDL Cholesterol': 'ldl', 'LDL-C': 'ldl',
  'HDL Cholesterol': 'hdl', 'HDL-C': 'hdl',
  'Triglycerides': 'triglycerides',
  'ApoB': 'apoB',
  'Lp(a)': 'lpA',
  // CBC
  'White Blood Cell Count':'whiteBloodCells','White Blood Cells':'whiteBloodCells','WBC':'whiteBloodCells',
  'Red Blood Cell Count':'redBloodCells','RBC':'redBloodCells','Red Blood Cells':'redBloodCells',
  'Hematocrit':'hematocrit','HCT':'hematocrit','Hemoglobin':'hemoglobin','HGB':'hemoglobin',
  'Platelet Count':'platelets','Platelets':'platelets',
  // CBC Differentials
  'Neutrophil Count':'neutrophilCount','Neutrophils':'neutrophilCount',
  'Neutrophil Percentage':'neutrophilPercentage','Neutrophils %':'neutrophilPercentage',
  'Lymphocyte Count':'lymphocyteCount','Lymphocytes':'lymphocyteCount',
  'Lymphocyte Percentage':'lymphocytePercentage','Lymphocytes %':'lymphocytePercentage',
  'Monocyte Count':'monocyteCount','Monocytes':'monocyteCount',
  'Monocyte Percentage':'monocytePercentage','Monocytes %':'monocytePercentage',
  'Eosinophil Count':'eosinophilCount','Eosinophils':'eosinophilCount',
  'Eosinophil Percentage':'eosinophilPercentage','Eosinophils %':'eosinophilPercentage',
  'Basophil Count':'basophilCount','Basophils':'basophilCount',
  'Basophil Percentage':'basophilPercentage','Basophils %':'basophilPercentage',
  // RBC Indices
  'MCV':'mcv','Mean Corpuscular Volume':'mcv',
  'MCH':'mch','Mean Corpuscular Hemoglobin':'mch',
  'MCHC':'mchc','Mean Corpuscular Hemoglobin Concentration':'mchc',
  'RDW':'rdw','Red Cell Distribution Width':'rdw',
  'MPV':'mpv','Mean Platelet Volume':'mpv',
  // Metabolic
  'HbA1c':'hba1c','Hemoglobin A1c':'hba1c','Glycated Hemoglobin':'hba1c',
  'Fasting Insulin':'fastingInsulin','Insulin':'fastingInsulin',
  'Glucose':'glucose','Fasting Glucose':'glucose','Blood Glucose':'glucose',
  // Liver
  'ALT':'alt','Alanine Aminotransferase':'alt',
  'AST':'ast','Aspartate Aminotransferase':'ast',
  'GGT':'ggt','Gamma Glutamyl Transferase':'ggt',
  // Kidney
  'eGFR':'egfr','Estimated GFR':'egfr',
  'Cystatin C':'cystatinC',
  'BUN':'bun','Blood Urea Nitrogen':'bun',
  'Creatinine':'creatinine','Serum Creatinine':'creatinine',
  'Albumin':'albumin','Serum Albumin':'albumin',
  // Hormones
  'Testosterone':'testosterone','Total Testosterone':'testosterone',
  'Free Testosterone':'freeTesto',
  'Estradiol':'estradiol','E2':'estradiol',
  'SHBG':'shbg','Sex Hormone Binding Globulin':'shbg',
  // Thyroid
  'T3':'t3','Triiodothyronine':'t3','Free T3':'t3',
  'T4':'t4','Thyroxine':'t4','Free T4':'t4',
  'TSH':'tsh','Thyroid Stimulating Hormone':'tsh',
  // Vitamins & Minerals
  'Vitamin D':'vitaminD','25-OH Vitamin D':'vitaminD','Vitamin D3':'vitaminD',
  'Vitamin B12':'vitaminB12','B12':'vitaminB12','Cobalamin':'vitaminB12',
  'Folate':'folate','Folic Acid':'folate',
  'Iron':'iron','Serum Iron':'serumIron',
  'Magnesium':'magnesium','Serum Magnesium':'magnesium',
  'RBC Magnesium':'rbcMagnesium',
  // Inflammation
  'CRP':'crp','C-Reactive Protein':'crp',
  'Homocysteine':'homocysteine',
  // Growth Factors
  'IGF-1':'igf1','Insulin-like Growth Factor 1':'igf1',
  // Iron Panel
  'Ferritin':'ferritin','Serum Ferritin':'ferritin',
  'TIBC':'tibc','Total Iron Binding Capacity':'tibc',
  'Transferrin Saturation':'transferrinSaturation','TSAT':'transferrinSaturation',
  // Electrolytes
  'Sodium':'sodium','Na':'sodium',
  'Potassium':'potassium','K':'potassium',
  'Calcium':'calcium','Ca':'calcium',
  'Phosphorus':'phosphorus','P':'phosphorus',
  'Bicarbonate':'bicarbonate','CO2':'bicarbonate',
  'Chloride':'chloride','Cl':'chloride',
  // Additional markers
  'Creatine Kinase':'creatineKinase','CK':'creatineKinase',
  'Cortisol':'cortisol',
};

/**
 * Processes raw blood marker data from the API and maps it to the internal structure
 * @param apiData - Raw blood marker data from API
 * @returns Processed blood markers collection with sorted data
 */
export function processBloodMarkersData(apiData: any): BloodMarkersCollection {
  const processedBloodMarkers = createEmptyBloodMarkers();
  
  if (!apiData?.success || !apiData?.data) {
    return processedBloodMarkers;
  }

  apiData.data.forEach((entry: any) => {
    entry.markers?.forEach((marker: any) => {
      let key = MARKER_NAME_TO_KEY[marker.name];
      
      // Fallback mechanism - try camelCase conversion
      if (!key) {
        const camel = toCamel(marker.name);
        if (camel in processedBloodMarkers) {
          key = camel as keyof BloodMarkersCollection;
        }
      }
      
      if (key) {
        processedBloodMarkers[key].push({
          date: entry.date,
          value: marker.value,
          unit: marker.unit,
          referenceRange: marker.referenceRange,
        });
      }
    });
  });

  // Sort each marker's data by date in descending order (newest first)
  Object.keys(processedBloodMarkers).forEach((key) => {
    processedBloodMarkers[key as keyof BloodMarkersCollection].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  });

  return processedBloodMarkers;
}
