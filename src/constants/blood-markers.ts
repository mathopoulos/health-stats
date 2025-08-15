// Blood marker constants extracted from dashboard component

export interface BloodMarkerRange {
  min: number;
  max: number;
  decreaseIsGood: boolean | null;
}

export const BLOOD_MARKER_RANGES: Record<string, BloodMarkerRange> = {
  // Lipid Panel
  totalCholesterol: { min: 100, max: 200, decreaseIsGood: true },
  ldl: { min: 0, max: 100, decreaseIsGood: true },
  hdl: { min: 40, max: 100, decreaseIsGood: false },
  triglycerides: { min: 0, max: 150, decreaseIsGood: true },
  apoB: { min: 0, max: 90, decreaseIsGood: true },
  lpA: { min: 0, max: 30, decreaseIsGood: true },
  
  // Complete Blood Count
  whiteBloodCells: { min: 3.4, max: 10.8, decreaseIsGood: null },
  redBloodCells: { min: 3.77, max: 5.28, decreaseIsGood: null },
  hematocrit: { min: 35.5, max: 48.6, decreaseIsGood: null },
  hemoglobin: { min: 11.6, max: 15.5, decreaseIsGood: null },
  platelets: { min: 150, max: 379, decreaseIsGood: null },
  
  // CBC Differentials
  neutrophilCount: { min: 1.4, max: 7.0, decreaseIsGood: null },
  neutrophilPercentage: { min: 45, max: 70, decreaseIsGood: null },
  lymphocyteCount: { min: 1.2, max: 3.4, decreaseIsGood: null },
  lymphocytePercentage: { min: 20, max: 45, decreaseIsGood: null },
  monocyteCount: { min: 0.1, max: 0.9, decreaseIsGood: null },
  monocytePercentage: { min: 2, max: 10, decreaseIsGood: null },
  eosinophilCount: { min: 0.0, max: 0.4, decreaseIsGood: null },
  eosinophilPercentage: { min: 1, max: 4, decreaseIsGood: null },
  basophilCount: { min: 0.0, max: 0.2, decreaseIsGood: null },
  basophilPercentage: { min: 0.5, max: 1, decreaseIsGood: null },
  
  // Red Blood Cell Indices
  mcv: { min: 79, max: 97, decreaseIsGood: null },
  mch: { min: 26, max: 33, decreaseIsGood: null },
  mchc: { min: 31.5, max: 35.7, decreaseIsGood: null },
  rdw: { min: 12.3, max: 15.4, decreaseIsGood: null },
  mpv: { min: 7.4, max: 10.4, decreaseIsGood: null },
  
  // Glucose Markers
  hba1c: { min: 4.8, max: 5.6, decreaseIsGood: true },
  fastingInsulin: { min: 2.6, max: 24.9, decreaseIsGood: true },
  glucose: { min: 65, max: 99, decreaseIsGood: true },
  
  // Liver Markers
  alt: { min: 0, max: 44, decreaseIsGood: true },
  ast: { min: 0, max: 40, decreaseIsGood: true },
  ggt: { min: 3, max: 70, decreaseIsGood: true },
  
  // Kidney Markers
  egfr: { min: 90, max: 120, decreaseIsGood: false },
  cystatinC: { min: 0.5, max: 1.0, decreaseIsGood: true },
  bun: { min: 7, max: 20, decreaseIsGood: true },
  creatinine: { min: 0.7, max: 1.3, decreaseIsGood: true },
  albumin: { min: 3.6, max: 5.1, decreaseIsGood: null },
  
  // Sex Hormones
  testosterone: { min: 300, max: 1000, decreaseIsGood: null },
  freeTesto: { min: 8.7, max: 25.1, decreaseIsGood: null },
  estradiol: { min: 10, max: 40, decreaseIsGood: null },
  shbg: { min: 10, max: 57, decreaseIsGood: null },
  
  // Thyroid Markers
  t3: { min: 2.3, max: 4.2, decreaseIsGood: null },
  t4: { min: 0.8, max: 1.8, decreaseIsGood: null },
  tsh: { min: 0.4, max: 4.0, decreaseIsGood: null },
  
  // Vitamins & Minerals
  vitaminD: { min: 30, max: 80, decreaseIsGood: false },
  vitaminB12: { min: 200, max: 1100, decreaseIsGood: false },
  folate: { min: 3.4, max: 40, decreaseIsGood: false },
  iron: { min: 50, max: 195, decreaseIsGood: null },
  magnesium: { min: 1.5, max: 2.5, decreaseIsGood: null },
  rbcMagnesium: { min: 4, max: 6.4, decreaseIsGood: null },
  
  // Inflammation
  crp: { min: 0, max: 1.0, decreaseIsGood: true },
  homocysteine: { min: 0, max: 15, decreaseIsGood: true },
  
  // Growth Factors
  igf1: { min: 88, max: 240, decreaseIsGood: null },
  
  // Iron Panel
  ferritin: { min: 20, max: 345, decreaseIsGood: null },
  serumIron: { min: 50, max: 195, decreaseIsGood: null },
  tibc: { min: 250, max: 425, decreaseIsGood: null },
  transferrinSaturation: { min: 15, max: 60, decreaseIsGood: null },
  
  // Electrolytes
  sodium: { min: 135, max: 146, decreaseIsGood: null },
  potassium: { min: 3.5, max: 5.3, decreaseIsGood: null },
  calcium: { min: 8.6, max: 10.3, decreaseIsGood: null },
  phosphorus: { min: 2.5, max: 4.5, decreaseIsGood: null },
  bicarbonate: { min: 22, max: 30, decreaseIsGood: null },
  chloride: { min: 97, max: 107, decreaseIsGood: null },
  
  // Additional markers
  creatinekinase: { min: 44, max: 1083, decreaseIsGood: null },
  cortisol: { min: 4, max: 22, decreaseIsGood: null }
};

// Owner ID constant
export const OWNER_ID = 'usr_W2LWz83EurLxZwfjqT_EL';
