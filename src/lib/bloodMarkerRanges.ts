export interface ReferenceRanges {
  optimalMin: number;
  optimalMax: number;
  normalMin?: number;
  normalMax?: number;
  abnormalText: string;
  normalText?: string;
  optimalText: string;
}

// Centralized blood marker reference ranges based on ODX optimal ranges
// Source: https://www.optimaldx.com/odx-blood-biomarker-guide
export const BLOOD_MARKER_REFERENCE_RANGES: Record<string, ReferenceRanges> = {
  // Lipid Panel - ODX Optimal Ranges
  totalcholesterol: {
    optimalMin: 160,
    optimalMax: 200,
    normalMin: 125,
    normalMax: 160,
    abnormalText: '<125 or >200',
    normalText: '125-160',
    optimalText: '160-200'
  },
  ldlcholesterol: {
    optimalMin: 81,
    optimalMax: 100,
    normalMin: 1,
    normalMax: 81,
    abnormalText: '<1 or >100',
    normalText: '1-81',
    optimalText: '81-100'
  },
  hdlcholesterol: {
    optimalMin: 55,
    optimalMax: 100,
    normalMin: 46,
    normalMax: 55,
    abnormalText: '<46 or >100',
    normalText: '46-55',
    optimalText: '55-100'
  },
  triglycerides: {
    optimalMin: 70,
    optimalMax: 99,
    normalMin: 0,
    normalMax: 70,
    abnormalText: '>99',
    normalText: '0-70, 99-150',
    optimalText: '70-99'
  },
  apob: {
    optimalMin: 60,
    optimalMax: 80,
    normalMin: 52,
    normalMax: 60,
    abnormalText: '<52 or >80',
    normalText: '52-60',
    optimalText: '60-80'
  },
  lpa: {
    optimalMin: 0,
    optimalMax: 18,
    normalMin: 18,
    normalMax: 75,
    abnormalText: '>75',
    normalText: '18-75',
    optimalText: '0-18'
  },

  // Complete Blood Count - ODX Optimal Ranges
  whitebloodcells: {
    optimalMin: 3.8,
    optimalMax: 6.0,
    normalMin: 6.0,
    normalMax: 10.8,
    abnormalText: '<3.8 or >10.8',
    normalText: '6.0-10.8',
    optimalText: '3.8-6.0'
  },
  redbloodcells: {
    // Default combined optimal range (sex-specific handling in components)
    optimalMin: 4.3,
    optimalMax: 5.1,
    normalMin: 3.8,
    normalMax: 5.8,
    abnormalText: '<3.8 or >5.8',
    normalText: '3.8-4.3, 5.1-5.8',
    optimalText: '4.3-5.1'
  },
  hematocrit: {
    optimalMin: 38,
    optimalMax: 50,
    abnormalText: '<38 or >50',
    optimalText: '38-50'
  },
  hemoglobin: {
    optimalMin: 13.8,
    optimalMax: 15.5,
    normalMin: 13.2,
    normalMax: 17.1,
    abnormalText: '<13.2 or >17.1',
    normalText: '13.2-13.8, 15.5-17.1',
    optimalText: '13.8-15.5'
  },
  platelets: {
    optimalMin: 175,
    optimalMax: 399,
    normalMin: 140,
    normalMax: 175,
    abnormalText: '<140 or >399',
    normalText: '140-175',
    optimalText: '175-399'
  },

  // Glucose Markers - ODX Optimal Ranges
  hba1c: {
    optimalMin: 4.0,
    optimalMax: 5.1,
    normalMin: 5.1,
    normalMax: 5.7,
    abnormalText: '<4.0 or >5.7',
    normalText: '5.1-5.7',
    optimalText: '4.0-5.1'
  },
  fastinginsulin: {
    optimalMin: 3.0,
    optimalMax: 8.5,
    normalMin: 8.5,
    normalMax: 18.4,
    abnormalText: '<3.0 or >18.4',
    normalText: '8.5-18.4',
    optimalText: '3.0-8.5'
  },
  glucose: {
    optimalMin: 82,
    optimalMax: 88,
    normalMin: 65,
    normalMax: 99,
    abnormalText: '<65 or >99',
    normalText: '65-82, 88-99',
    optimalText: '82-88'
  },

  // Liver Markers - ODX Optimal Ranges
  alt: {
    optimalMin: 10,
    optimalMax: 17,
    normalMin: 17,
    normalMax: 46,
    abnormalText: '<10 or >46',
    normalText: '17-46',
    optimalText: '10-17'
  },
  ast: {
    optimalMin: 15,
    optimalMax: 23,
    normalMin: 10,
    normalMax: 40,
    abnormalText: '<10 or >40',
    normalText: '10-15, 23-40',
    optimalText: '15-23'
  },
  ggt: {
    optimalMin: 10,
    optimalMax: 17,
    normalMin: 3,
    normalMax: 70,
    abnormalText: '<3 or >70',
    normalText: '3-10, 17-70',
    optimalText: '10-17'
  },

  // Kidney Markers - ODX Optimal Ranges
  egfr: {
    optimalMin: 90,
    optimalMax: 120,
    normalMin: 60,
    normalMax: 90,
    abnormalText: '<60',
    normalText: '60-90',
    optimalText: '90-120'
  },
  cystatinc: {
    optimalMin: 0.7,
    optimalMax: 0.9,
    normalMin: 0.5,
    normalMax: 1.0,
    abnormalText: '<0.5 or >1.0',
    normalText: '0.5-0.7, 0.9-1.0',
    optimalText: '0.7-0.9'
  },
  bun: {
    optimalMin: 10,
    optimalMax: 15,
    normalMin: 7,
    normalMax: 20,
    abnormalText: '<7 or >20',
    normalText: '7-10, 15-20',
    optimalText: '10-15'
  },
  creatinine: {
    optimalMin: 0.8,
    optimalMax: 1.1,
    normalMin: 0.7,
    normalMax: 1.3,
    abnormalText: '<0.7 or >1.3',
    normalText: '0.7-0.8, 1.1-1.3',
    optimalText: '0.8-1.1'
  },
  albumin: {
    optimalMin: 4.0,
    optimalMax: 5.0,
    normalMin: 3.6,
    normalMax: 5.1,
    abnormalText: '<3.6 or >5.1',
    normalText: '3.6-4.0, 5.0-5.1',
    optimalText: '4.0-5.0'
  },

  // Thyroid Markers - ODX Optimal Ranges  
  tsh: {
    optimalMin: 1.0,
    optimalMax: 2.5,
    normalMin: 0.4,
    normalMax: 4.0,
    abnormalText: '<0.4 or >4.0',
    normalText: '0.4-1.0, 2.5-4.0',
    optimalText: '1.0-2.5'
  },
  t4: {
    optimalMin: 1.0,
    optimalMax: 1.5,
    normalMin: 0.8,
    normalMax: 1.8,
    abnormalText: '<0.8 or >1.8',
    normalText: '0.8-1.0, 1.5-1.8',
    optimalText: '1.0-1.5'
  },
  t3: {
    optimalMin: 3.0,
    optimalMax: 3.5,
    normalMin: 2.3,
    normalMax: 4.2,
    abnormalText: '<2.3 or >4.2',
    normalText: '2.3-3.0, 3.5-4.2',
    optimalText: '3.0-3.5'
  },

  // Vitamins & Minerals - ODX Optimal Ranges
  vitaminD: {
    optimalMin: 50,
    optimalMax: 80,
    normalMin: 30,
    normalMax: 50,
    abnormalText: '<30 or >80',
    normalText: '30-50',
    optimalText: '50-80'
  },
  vitaminB12: {
    optimalMin: 550,
    optimalMax: 1100,
    normalMin: 200,
    normalMax: 550,
    abnormalText: '<200 or >1100',
    normalText: '200-550',
    optimalText: '550-1100'
  },
  folate: {
    optimalMin: 12,
    optimalMax: 25,
    normalMin: 3.4,
    normalMax: 40,
    abnormalText: '<3.4 or >40',
    normalText: '3.4-12, 25-40',
    optimalText: '12-25'
  },

  // Inflammation Markers - ODX Optimal Ranges
  crp: {
    optimalMin: 0,
    optimalMax: 1.0,
    normalMin: 1.0,
    normalMax: 3.0,
    abnormalText: '>3.0',
    normalText: '1.0-3.0',
    optimalText: '0-1.0'
  },
  homocysteine: {
    optimalMin: 6,
    optimalMax: 8,
    normalMin: 0,
    normalMax: 15,
    abnormalText: '>15',
    normalText: '0-6, 8-15',
    optimalText: '6-8'
  },

  // Iron Panel - ODX Optimal Ranges
  ferritin: {
    optimalMin: 50,
    optimalMax: 150,
    normalMin: 20,
    normalMax: 345,
    abnormalText: '<20 or >345',
    normalText: '20-50, 150-345',
    optimalText: '50-150'
  },
  serumiron: {
    optimalMin: 85,
    optimalMax: 130,
    normalMin: 50,
    normalMax: 195,
    abnormalText: '<50 or >195',
    normalText: '50-85, 130-195',
    optimalText: '85-130'
  },
  tibc: {
    optimalMin: 300,
    optimalMax: 360,
    normalMin: 250,
    normalMax: 425,
    abnormalText: '<250 or >425',
    normalText: '250-300, 360-425',
    optimalText: '300-360'
  },
  transferrinsaturation: {
    optimalMin: 25,
    optimalMax: 35,
    normalMin: 15,
    normalMax: 60,
    abnormalText: '<15 or >60',
    normalText: '15-25, 35-60',
    optimalText: '25-35'
  }
};

// Helper function to get reference ranges for a marker
export function getReferenceRanges(
  markerKey: string,
  fallbackRange?: { min?: number; max?: number },
  userData?: { sex?: 'male' | 'female' | 'other' }
): ReferenceRanges {
  const key = markerKey.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
  
  // Handle sex-specific ranges for red blood cells
  if (key === 'redbloodcells' && userData?.sex) {
    if (userData.sex === 'male') {
      return {
        optimalMin: 4.8,
        optimalMax: 5.5,
        normalMin: 4.2,
        normalMax: 5.8,
        abnormalText: '<4.2 or >5.8',
        normalText: '4.2-4.8, 5.5-5.8',
        optimalText: '4.8-5.5'
      };
    } else if (userData.sex === 'female') {
      return {
        optimalMin: 4.3,
        optimalMax: 4.8,
        normalMin: 3.8,
        normalMax: 5.1,
        abnormalText: '<3.8 or >5.1',
        normalText: '3.8-4.3, 4.8-5.1',
        optimalText: '4.3-4.8'
      };
    }
  }
  
  // Return the predefined range if it exists
  if (BLOOD_MARKER_REFERENCE_RANGES[key]) {
    return BLOOD_MARKER_REFERENCE_RANGES[key];
  }
  
  // Fallback: use provided referenceRange if available
  const min = fallbackRange?.min ?? 0;
  const max = fallbackRange?.max ?? 100;
  return {
    optimalMin: min,
    optimalMax: max,
    abnormalText: `<${min} or >${max}`,
    optimalText: `${min}-${max}`
  };
}

// Helper function to get status based on value
export function getBloodMarkerStatus(
  value: number,
  markerKey: string,
  userData?: { sex?: 'male' | 'female' | 'other' }
): 'optimal' | 'normal' | 'abnormal' {
  const ranges = getReferenceRanges(markerKey, undefined, userData);
  
  if (value >= ranges.optimalMin && value <= ranges.optimalMax) {
    return 'optimal';
  } else if (ranges.normalMin !== undefined && ranges.normalMax !== undefined &&
             value >= ranges.normalMin && value <= ranges.normalMax) {
    return 'normal';
  } else {
    return 'abnormal';
  }
}

// Color constants for consistent styling
export const BLOOD_MARKER_STATUS_COLORS = {
  optimal: '#047857', // green-700
  normal: '#a16207',  // yellow-700
  abnormal: '#b91c1c', // red-700
} as const; 