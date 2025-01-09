'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Image from 'next/image';
import AddResultsModal from './components/AddResultsModal';

interface HealthData {
  date: string;
  value: number;
}

interface BloodMarker {
  date: string;
  value: number;
  unit: string;
  referenceRange?: {
    min: number;
    max: number;
  };
}

interface ChartData {
  heartRate: HealthData[];
  weight: HealthData[];
  bodyFat: HealthData[];
  hrv: HealthData[];
  vo2max: HealthData[];
  bloodMarkers: {
    // Lipid Panel
    totalCholesterol: BloodMarker[];
    ldl: BloodMarker[];
    hdl: BloodMarker[];
    triglycerides: BloodMarker[];
    apoB: BloodMarker[];
    lpA: BloodMarker[];
    
    // Complete Blood Count
    whiteBloodCells: BloodMarker[];
    redBloodCells: BloodMarker[];
    hematocrit: BloodMarker[];
    hemoglobin: BloodMarker[];
    platelets: BloodMarker[];
    
    // Glucose Markers
    hba1c: BloodMarker[];
    fastingInsulin: BloodMarker[];
    glucose: BloodMarker[];
    
    // Liver Markers
    alt: BloodMarker[];
    ast: BloodMarker[];
    ggt: BloodMarker[];
    
    // Kidney Markers
    egfr: BloodMarker[];
    cystatinC: BloodMarker[];
    bun: BloodMarker[];
    creatinine: BloodMarker[];
    albumin: BloodMarker[];
    
    // Sex Hormones
    testosterone: BloodMarker[];
    freeTesto: BloodMarker[];
    estradiol: BloodMarker[];
    shbg: BloodMarker[];
    
    // Thyroid Markers
    t3: BloodMarker[];
    t4: BloodMarker[];
    tsh: BloodMarker[];
    
    // Vitamins
    vitaminD: BloodMarker[];
    
    // Inflammation
    crp: BloodMarker[];
    homocysteine: BloodMarker[];
    
    // Growth Factors
    igf1: BloodMarker[];
    
    // Iron Panel
    ferritin: BloodMarker[];
    serumIron: BloodMarker[];
    tibc: BloodMarker[];
    transferrinSaturation: BloodMarker[];
    
    // Electrolytes
    sodium: BloodMarker[];
    potassium: BloodMarker[];
    calcium: BloodMarker[];
    phosphorus: BloodMarker[];
    magnesium: BloodMarker[];
    bicarbonate: BloodMarker[];
    chloride: BloodMarker[];
  };
  loading: boolean;
}

type TimeFrame = 'daily' | 'weekly' | 'monthly' | 'yearly';

// Add this before the component definitions
const BLOOD_MARKER_CONFIG = {
  // Lipid Panel
  totalcholesterol: { min: 125, max: 200, decreaseIsGood: true },
  ldlc: { min: 0, max: 100, decreaseIsGood: true },
  hdlc: { min: 40, max: 90, decreaseIsGood: false },
  triglycerides: { min: 0, max: 150, decreaseIsGood: true },
  apob: { min: 40, max: 100, decreaseIsGood: true },
  lpa: { min: 0, max: 50, decreaseIsGood: true },
  
  // Complete Blood Count
  whitebloodcells: { min: 4.5, max: 11.0, decreaseIsGood: null },
  redbloodcells: { min: 4.5, max: 5.9, decreaseIsGood: null },
  hematocrit: { min: 41, max: 50, decreaseIsGood: null },
  hemoglobin: { min: 13.5, max: 17.5, decreaseIsGood: null },
  platelets: { min: 150, max: 450, decreaseIsGood: null },
  
  // Glucose Markers
  hba1c: { min: 4.0, max: 5.6, decreaseIsGood: true },
  fastingInsulin: { min: 2.6, max: 5.0, decreaseIsGood: true },
  glucose: { min: 70, max: 90, decreaseIsGood: true },
  
  // Liver Markers
  alt: { min: 0, max: 30, decreaseIsGood: true },
  ast: { min: 5, max: 30, decreaseIsGood: true },
  ggt: { min: 9, max: 40, decreaseIsGood: true },
  
  // Kidney Markers
  egfr: { min: 90, max: 120, decreaseIsGood: false },
  cystatinC: { min: 0.5, max: 1.0, decreaseIsGood: true },
  bun: { min: 7, max: 20, decreaseIsGood: true },
  creatinine: { min: 0.7, max: 1.3, decreaseIsGood: true },
  albumin: { min: 3.8, max: 5.0, decreaseIsGood: null },
  
  // Sex Hormones
  testosterone: { min: 300, max: 1000, decreaseIsGood: null },
  freeTesto: { min: 8.7, max: 25.1, decreaseIsGood: null },
  estradiol: { min: 10, max: 40, decreaseIsGood: null },
  shbg: { min: 10, max: 57, decreaseIsGood: null },
  
  // Thyroid Markers
  t3: { min: 2.3, max: 4.2, decreaseIsGood: null },
  t4: { min: 0.8, max: 1.8, decreaseIsGood: null },
  tsh: { min: 0.4, max: 4.0, decreaseIsGood: null },
  
  // Vitamins
  vitaminD: { min: 40, max: 80, decreaseIsGood: false },
  
  // Inflammation
  crp: { min: 0, max: 1.0, decreaseIsGood: true },
  homocysteine: { min: 4, max: 10, decreaseIsGood: true },
  
  // Growth Factors
  igf1: { min: 115, max: 355, decreaseIsGood: null },
  
  // Iron Panel
  ferritin: { min: 30, max: 300, decreaseIsGood: null },
  serumIron: { min: 65, max: 175, decreaseIsGood: null },
  tibc: { min: 250, max: 450, decreaseIsGood: null },
  transferrinSaturation: { min: 20, max: 50, decreaseIsGood: null },
  
  // Electrolytes
  sodium: { min: 135, max: 145, decreaseIsGood: null },
  potassium: { min: 3.5, max: 5.0, decreaseIsGood: null },
  calcium: { min: 8.5, max: 10.5, decreaseIsGood: null },
  phosphorus: { min: 2.5, max: 4.5, decreaseIsGood: null },
  magnesium: { min: 1.7, max: 2.4, decreaseIsGood: null },
  bicarbonate: { min: 22, max: 29, decreaseIsGood: null },
  chloride: { min: 96, max: 106, decreaseIsGood: null }
} as const;

export default function Home() {
  const [data, setData] = useState<ChartData>({
    heartRate: [],
    weight: [],
    bodyFat: [],
    hrv: [],
    vo2max: [],
    bloodMarkers: {
      // Lipid Panel
      totalCholesterol: [
        { date: '2024-01-15', value: 185, unit: 'mg/dL', referenceRange: { min: 125, max: 200 } },
        { date: '2023-12-15', value: 195, unit: 'mg/dL', referenceRange: { min: 125, max: 200 } },
        { date: '2023-11-15', value: 205, unit: 'mg/dL', referenceRange: { min: 125, max: 200 } }
      ],
      ldl: [
        { date: '2024-01-15', value: 110, unit: 'mg/dL', referenceRange: { min: 0, max: 130 } },
        { date: '2023-12-15', value: 115, unit: 'mg/dL', referenceRange: { min: 0, max: 130 } },
        { date: '2023-11-15', value: 120, unit: 'mg/dL', referenceRange: { min: 0, max: 130 } }
      ],
      hdl: [
        { date: '2024-01-15', value: 65, unit: 'mg/dL', referenceRange: { min: 40, max: 60 } },
        { date: '2023-12-15', value: 62, unit: 'mg/dL', referenceRange: { min: 40, max: 60 } },
        { date: '2023-11-15', value: 58, unit: 'mg/dL', referenceRange: { min: 40, max: 60 } }
      ],
      triglycerides: [
        { date: '2024-01-15', value: 120, unit: 'mg/dL', referenceRange: { min: 0, max: 150 } },
        { date: '2023-12-15', value: 135, unit: 'mg/dL', referenceRange: { min: 0, max: 150 } },
        { date: '2023-11-15', value: 145, unit: 'mg/dL', referenceRange: { min: 0, max: 150 } }
      ],
      apoB: [
        { date: '2024-01-15', value: 85, unit: 'mg/dL', referenceRange: { min: 40, max: 125 } },
        { date: '2023-12-15', value: 90, unit: 'mg/dL', referenceRange: { min: 40, max: 125 } },
        { date: '2023-11-15', value: 95, unit: 'mg/dL', referenceRange: { min: 40, max: 125 } }
      ],
      lpA: [
        { date: '2024-01-15', value: 25, unit: 'nmol/L', referenceRange: { min: 0, max: 75 } },
        { date: '2023-12-15', value: 28, unit: 'nmol/L', referenceRange: { min: 0, max: 75 } },
        { date: '2023-11-15', value: 30, unit: 'nmol/L', referenceRange: { min: 0, max: 75 } }
      ],
      
      // Complete Blood Count
      whiteBloodCells: [
        { date: '2024-01-15', value: 6.5, unit: 'K/µL', referenceRange: { min: 4.5, max: 11.0 } },
        { date: '2023-12-15', value: 6.8, unit: 'K/µL', referenceRange: { min: 4.5, max: 11.0 } },
        { date: '2023-11-15', value: 7.0, unit: 'K/µL', referenceRange: { min: 4.5, max: 11.0 } }
      ],
      redBloodCells: [
        { date: '2024-01-15', value: 5.2, unit: 'M/µL', referenceRange: { min: 4.5, max: 5.9 } },
        { date: '2023-12-15', value: 5.1, unit: 'M/µL', referenceRange: { min: 4.5, max: 5.9 } },
        { date: '2023-11-15', value: 5.0, unit: 'M/µL', referenceRange: { min: 4.5, max: 5.9 } }
      ],
      hematocrit: [
        { date: '2024-01-15', value: 45, unit: '%', referenceRange: { min: 41, max: 50 } },
        { date: '2023-12-15', value: 44, unit: '%', referenceRange: { min: 41, max: 50 } },
        { date: '2023-11-15', value: 43, unit: '%', referenceRange: { min: 41, max: 50 } }
      ],
      hemoglobin: [
        { date: '2024-01-15', value: 15.2, unit: 'g/dL', referenceRange: { min: 13.5, max: 17.5 } },
        { date: '2023-12-15', value: 15.0, unit: 'g/dL', referenceRange: { min: 13.5, max: 17.5 } },
        { date: '2023-11-15', value: 14.8, unit: 'g/dL', referenceRange: { min: 13.5, max: 17.5 } }
      ],
      platelets: [
        { date: '2024-01-15', value: 250, unit: 'K/µL', referenceRange: { min: 150, max: 450 } },
        { date: '2023-12-15', value: 245, unit: 'K/µL', referenceRange: { min: 150, max: 450 } },
        { date: '2023-11-15', value: 240, unit: 'K/µL', referenceRange: { min: 150, max: 450 } }
      ],
      
      // Glucose Markers
      hba1c: [
        { date: '2024-01-15', value: 5.2, unit: '%', referenceRange: { min: 4.0, max: 5.6 } },
        { date: '2023-12-15', value: 5.3, unit: '%', referenceRange: { min: 4.0, max: 5.6 } },
        { date: '2023-11-15', value: 5.4, unit: '%', referenceRange: { min: 4.0, max: 5.6 } }
      ],
      fastingInsulin: [
        { date: '2024-01-15', value: 4.5, unit: 'µIU/mL', referenceRange: { min: 2.6, max: 24.9 } },
        { date: '2023-12-15', value: 4.8, unit: 'µIU/mL', referenceRange: { min: 2.6, max: 24.9 } },
        { date: '2023-11-15', value: 5.0, unit: 'µIU/mL', referenceRange: { min: 2.6, max: 24.9 } }
      ],
      glucose: [
        { date: '2024-01-15', value: 85, unit: 'mg/dL', referenceRange: { min: 70, max: 100 } },
        { date: '2023-12-15', value: 88, unit: 'mg/dL', referenceRange: { min: 70, max: 100 } },
        { date: '2023-11-15', value: 92, unit: 'mg/dL', referenceRange: { min: 70, max: 100 } }
      ],
      
      // Liver Markers
      alt: [
        { date: '2024-01-15', value: 25, unit: 'U/L', referenceRange: { min: 0, max: 55 } },
        { date: '2023-12-15', value: 28, unit: 'U/L', referenceRange: { min: 0, max: 55 } },
        { date: '2023-11-15', value: 30, unit: 'U/L', referenceRange: { min: 0, max: 55 } }
      ],
      ast: [
        { date: '2024-01-15', value: 22, unit: 'U/L', referenceRange: { min: 5, max: 34 } },
        { date: '2023-12-15', value: 24, unit: 'U/L', referenceRange: { min: 5, max: 34 } },
        { date: '2023-11-15', value: 26, unit: 'U/L', referenceRange: { min: 5, max: 34 } }
      ],
      ggt: [
        { date: '2024-01-15', value: 20, unit: 'U/L', referenceRange: { min: 9, max: 64 } },
        { date: '2023-12-15', value: 22, unit: 'U/L', referenceRange: { min: 9, max: 64 } },
        { date: '2023-11-15', value: 24, unit: 'U/L', referenceRange: { min: 9, max: 64 } }
      ],
      
      // Kidney Markers
      egfr: [
        { date: '2024-01-15', value: 95, unit: 'mL/min/1.73m²', referenceRange: { min: 90, max: 120 } },
        { date: '2023-12-15', value: 93, unit: 'mL/min/1.73m²', referenceRange: { min: 90, max: 120 } },
        { date: '2023-11-15', value: 92, unit: 'mL/min/1.73m²', referenceRange: { min: 90, max: 120 } }
      ],
      cystatinC: [
        { date: '2024-01-15', value: 0.9, unit: 'mg/L', referenceRange: { min: 0.5, max: 1.2 } },
        { date: '2023-12-15', value: 0.92, unit: 'mg/L', referenceRange: { min: 0.5, max: 1.2 } },
        { date: '2023-11-15', value: 0.94, unit: 'mg/L', referenceRange: { min: 0.5, max: 1.2 } }
      ],
      bun: [
        { date: '2024-01-15', value: 15, unit: 'mg/dL', referenceRange: { min: 7, max: 20 } },
        { date: '2023-12-15', value: 16, unit: 'mg/dL', referenceRange: { min: 7, max: 20 } },
        { date: '2023-11-15', value: 17, unit: 'mg/dL', referenceRange: { min: 7, max: 20 } }
      ],
      creatinine: [
        { date: '2024-01-15', value: 0.9, unit: 'mg/dL', referenceRange: { min: 0.7, max: 1.3 } },
        { date: '2023-12-15', value: 0.92, unit: 'mg/dL', referenceRange: { min: 0.7, max: 1.3 } },
        { date: '2023-11-15', value: 0.94, unit: 'mg/dL', referenceRange: { min: 0.7, max: 1.3 } }
      ],
      albumin: [
        { date: '2024-01-15', value: 4.5, unit: 'g/dL', referenceRange: { min: 3.4, max: 5.4 } },
        { date: '2023-12-15', value: 4.4, unit: 'g/dL', referenceRange: { min: 3.4, max: 5.4 } },
        { date: '2023-11-15', value: 4.3, unit: 'g/dL', referenceRange: { min: 3.4, max: 5.4 } }
      ],
      
      // Sex Hormones
      testosterone: [
        { date: '2024-01-15', value: 750, unit: 'ng/dL', referenceRange: { min: 300, max: 1000 } },
        { date: '2023-12-15', value: 680, unit: 'ng/dL', referenceRange: { min: 300, max: 1000 } },
        { date: '2023-11-15', value: 620, unit: 'ng/dL', referenceRange: { min: 300, max: 1000 } }
      ],
      freeTesto: [
        { date: '2024-01-15', value: 15.5, unit: 'pg/mL', referenceRange: { min: 8.7, max: 25.1 } },
        { date: '2023-12-15', value: 14.2, unit: 'pg/mL', referenceRange: { min: 8.7, max: 25.1 } },
        { date: '2023-11-15', value: 13.8, unit: 'pg/mL', referenceRange: { min: 8.7, max: 25.1 } }
      ],
      estradiol: [
        { date: '2024-01-15', value: 25, unit: 'pg/mL', referenceRange: { min: 10, max: 40 } },
        { date: '2023-12-15', value: 28, unit: 'pg/mL', referenceRange: { min: 10, max: 40 } },
        { date: '2023-11-15', value: 30, unit: 'pg/mL', referenceRange: { min: 10, max: 40 } }
      ],
      shbg: [
        { date: '2024-01-15', value: 35, unit: 'nmol/L', referenceRange: { min: 10, max: 57 } },
        { date: '2023-12-15', value: 38, unit: 'nmol/L', referenceRange: { min: 10, max: 57 } },
        { date: '2023-11-15', value: 40, unit: 'nmol/L', referenceRange: { min: 10, max: 57 } }
      ],
      
      // Thyroid Markers
      t3: [
        { date: '2024-01-15', value: 3.2, unit: 'pg/mL', referenceRange: { min: 2.3, max: 4.2 } },
        { date: '2023-12-15', value: 3.3, unit: 'pg/mL', referenceRange: { min: 2.3, max: 4.2 } },
        { date: '2023-11-15', value: 3.4, unit: 'pg/mL', referenceRange: { min: 2.3, max: 4.2 } }
      ],
      t4: [
        { date: '2024-01-15', value: 1.3, unit: 'ng/dL', referenceRange: { min: 0.8, max: 1.8 } },
        { date: '2023-12-15', value: 1.4, unit: 'ng/dL', referenceRange: { min: 0.8, max: 1.8 } },
        { date: '2023-11-15', value: 1.5, unit: 'ng/dL', referenceRange: { min: 0.8, max: 1.8 } }
      ],
      tsh: [
        { date: '2024-01-15', value: 2.1, unit: 'mIU/L', referenceRange: { min: 0.4, max: 4.0 } },
        { date: '2023-12-15', value: 2.3, unit: 'mIU/L', referenceRange: { min: 0.4, max: 4.0 } },
        { date: '2023-11-15', value: 2.5, unit: 'mIU/L', referenceRange: { min: 0.4, max: 4.0 } }
      ],
      
      // Vitamins
      vitaminD: [
        { date: '2024-01-15', value: 45, unit: 'ng/mL', referenceRange: { min: 30, max: 100 } },
        { date: '2023-12-15', value: 42, unit: 'ng/mL', referenceRange: { min: 30, max: 100 } },
        { date: '2023-11-15', value: 38, unit: 'ng/mL', referenceRange: { min: 30, max: 100 } }
      ],
      
      // Inflammation
      crp: [
        { date: '2024-01-15', value: 0.8, unit: 'mg/L', referenceRange: { min: 0, max: 3 } },
        { date: '2023-12-15', value: 1.2, unit: 'mg/L', referenceRange: { min: 0, max: 3 } },
        { date: '2023-11-15', value: 1.5, unit: 'mg/L', referenceRange: { min: 0, max: 3 } }
      ],
      homocysteine: [
        { date: '2024-01-15', value: 8.5, unit: 'µmol/L', referenceRange: { min: 4, max: 15 } },
        { date: '2023-12-15', value: 9.2, unit: 'µmol/L', referenceRange: { min: 4, max: 15 } },
        { date: '2023-11-15', value: 9.8, unit: 'µmol/L', referenceRange: { min: 4, max: 15 } }
      ],
      
      // Growth Factors
      igf1: [
        { date: '2024-01-15', value: 185, unit: 'ng/mL', referenceRange: { min: 115, max: 355 } },
        { date: '2023-12-15', value: 175, unit: 'ng/mL', referenceRange: { min: 115, max: 355 } },
        { date: '2023-11-15', value: 165, unit: 'ng/mL', referenceRange: { min: 115, max: 355 } }
      ],
      
      // Iron Panel
      ferritin: [
        { date: '2024-01-15', value: 150, unit: 'ng/mL', referenceRange: { min: 30, max: 400 } },
        { date: '2023-12-15', value: 145, unit: 'ng/mL', referenceRange: { min: 30, max: 400 } },
        { date: '2023-11-15', value: 140, unit: 'ng/mL', referenceRange: { min: 30, max: 400 } }
      ],
      serumIron: [
        { date: '2024-01-15', value: 95, unit: 'µg/dL', referenceRange: { min: 65, max: 175 } },
        { date: '2023-12-15', value: 90, unit: 'µg/dL', referenceRange: { min: 65, max: 175 } },
        { date: '2023-11-15', value: 85, unit: 'µg/dL', referenceRange: { min: 65, max: 175 } }
      ],
      tibc: [
        { date: '2024-01-15', value: 320, unit: 'µg/dL', referenceRange: { min: 250, max: 450 } },
        { date: '2023-12-15', value: 325, unit: 'µg/dL', referenceRange: { min: 250, max: 450 } },
        { date: '2023-11-15', value: 330, unit: 'µg/dL', referenceRange: { min: 250, max: 450 } }
      ],
      transferrinSaturation: [
        { date: '2024-01-15', value: 30, unit: '%', referenceRange: { min: 20, max: 50 } },
        { date: '2023-12-15', value: 28, unit: '%', referenceRange: { min: 20, max: 50 } },
        { date: '2023-11-15', value: 26, unit: '%', referenceRange: { min: 20, max: 50 } }
      ],
      
      // Electrolytes
      sodium: [
        { date: '2024-01-15', value: 140, unit: 'mEq/L', referenceRange: { min: 135, max: 145 } },
        { date: '2023-12-15', value: 139, unit: 'mEq/L', referenceRange: { min: 135, max: 145 } },
        { date: '2023-11-15', value: 138, unit: 'mEq/L', referenceRange: { min: 135, max: 145 } }
      ],
      potassium: [
        { date: '2024-01-15', value: 4.2, unit: 'mEq/L', referenceRange: { min: 3.5, max: 5.0 } },
        { date: '2023-12-15', value: 4.1, unit: 'mEq/L', referenceRange: { min: 3.5, max: 5.0 } },
        { date: '2023-11-15', value: 4.0, unit: 'mEq/L', referenceRange: { min: 3.5, max: 5.0 } }
      ],
      calcium: [
        { date: '2024-01-15', value: 9.5, unit: 'mg/dL', referenceRange: { min: 8.5, max: 10.5 } },
        { date: '2023-12-15', value: 9.4, unit: 'mg/dL', referenceRange: { min: 8.5, max: 10.5 } },
        { date: '2023-11-15', value: 9.3, unit: 'mg/dL', referenceRange: { min: 8.5, max: 10.5 } }
      ],
      phosphorus: [
        { date: '2024-01-15', value: 3.5, unit: 'mg/dL', referenceRange: { min: 2.5, max: 4.5 } },
        { date: '2023-12-15', value: 3.4, unit: 'mg/dL', referenceRange: { min: 2.5, max: 4.5 } },
        { date: '2023-11-15', value: 3.3, unit: 'mg/dL', referenceRange: { min: 2.5, max: 4.5 } }
      ],
      magnesium: [
        { date: '2024-01-15', value: 2.1, unit: 'mg/dL', referenceRange: { min: 1.7, max: 2.4 } },
        { date: '2023-12-15', value: 2.0, unit: 'mg/dL', referenceRange: { min: 1.7, max: 2.4 } },
        { date: '2023-11-15', value: 1.9, unit: 'mg/dL', referenceRange: { min: 1.7, max: 2.4 } }
      ],
      bicarbonate: [
        { date: '2024-01-15', value: 24, unit: 'mEq/L', referenceRange: { min: 22, max: 29 } },
        { date: '2023-12-15', value: 25, unit: 'mEq/L', referenceRange: { min: 22, max: 29 } },
        { date: '2023-11-15', value: 26, unit: 'mEq/L', referenceRange: { min: 22, max: 29 } }
      ],
      chloride: [
        { date: '2024-01-15', value: 102, unit: 'mEq/L', referenceRange: { min: 96, max: 106 } },
        { date: '2023-12-15', value: 101, unit: 'mEq/L', referenceRange: { min: 96, max: 106 } },
        { date: '2023-11-15', value: 100, unit: 'mEq/L', referenceRange: { min: 96, max: 106 } }
      ]
    },
    loading: true
  });
  const [weightTimeframe, setWeightTimeframe] = useState<TimeFrame>('weekly');
  const [weightDate, setWeightDate] = useState<Date | null>(null);
  const [bodyFatTimeframe, setBodyFatTimeframe] = useState<TimeFrame>('weekly');
  const [bodyFatDate, setBodyFatDate] = useState<Date | null>(null);
  const [hrvTimeframe, setHrvTimeframe] = useState<TimeFrame>('weekly');
  const [hrvDate, setHrvDate] = useState<Date | null>(null);
  const [vo2maxTimeframe, setVo2maxTimeframe] = useState<TimeFrame>('weekly');
  const [vo2maxDate, setVo2maxDate] = useState<Date | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  });
  const [activeTab, setActiveTab] = useState<'metrics' | 'blood'>('metrics');
  const [isAddResultsModalOpen, setIsAddResultsModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [heartRateRes, weightRes, bodyFatRes, hrvRes, vo2maxRes, bloodMarkersRes] = await Promise.all([
        fetch('/api/health-data?type=heartRate'),
        fetch('/api/health-data?type=weight'),
        fetch('/api/health-data?type=bodyFat'),
        fetch('/api/health-data?type=hrv'),
        fetch('/api/health-data?type=vo2max'),
        fetch('/api/blood-markers')
      ]);

      const responses = await Promise.all([
        heartRateRes.json(),
        weightRes.json(),
        bodyFatRes.json(),
        hrvRes.json(),
        vo2maxRes.json(),
        bloodMarkersRes.json()
      ]);

      const [heartRateData, weightData, bodyFatData, hrvData, vo2maxData, bloodMarkersData] = responses;

      if (!heartRateData.success || !weightData.success || !bodyFatData.success || !hrvData.success || !vo2maxData.success || !bloodMarkersData.success) {
        console.error('One or more data fetches failed:', responses);
        throw new Error('Failed to fetch some data');
      }

      // Process blood markers data
      const processedBloodMarkers: ChartData['bloodMarkers'] = {
        // Initialize all marker arrays
        totalCholesterol: [], ldl: [], hdl: [], triglycerides: [], apoB: [], lpA: [],
        whiteBloodCells: [], redBloodCells: [], hematocrit: [], hemoglobin: [], platelets: [],
        hba1c: [], fastingInsulin: [], glucose: [],
        alt: [], ast: [], ggt: [],
        egfr: [], cystatinC: [], bun: [], creatinine: [], albumin: [],
        testosterone: [], freeTesto: [], estradiol: [], shbg: [],
        t3: [], t4: [], tsh: [],
        vitaminD: [],
        crp: [], homocysteine: [],
        igf1: [],
        ferritin: [], serumIron: [], tibc: [], transferrinSaturation: [],
        sodium: [], potassium: [], calcium: [], phosphorus: [], magnesium: [], bicarbonate: [], chloride: []
      };

      // Map marker names from API to chart data keys
      const markerNameToKey: Record<string, keyof ChartData['bloodMarkers']> = {
        'Total Cholesterol': 'totalCholesterol',
        'LDL-C': 'ldl',
        'HDL-C': 'hdl',
        'Triglycerides': 'triglycerides',
        'ApoB': 'apoB',
        'Lp(a)': 'lpA',
        'White Blood Cells': 'whiteBloodCells',
        'Red Blood Cells': 'redBloodCells',
        'Hematocrit': 'hematocrit',
        'Hemoglobin': 'hemoglobin',
        'Platelets': 'platelets',
        'HbA1c': 'hba1c',
        'Fasting Insulin': 'fastingInsulin',
        'Glucose': 'glucose',
        'ALT': 'alt',
        'AST': 'ast',
        'GGT': 'ggt',
        'eGFR': 'egfr',
        'Cystatin C': 'cystatinC',
        'BUN': 'bun',
        'Creatinine': 'creatinine',
        'Albumin': 'albumin',
        'Testosterone': 'testosterone',
        'Free Testosterone': 'freeTesto',
        'Estradiol': 'estradiol',
        'SHBG': 'shbg',
        'T3': 't3',
        'T4': 't4',
        'TSH': 'tsh',
        'Vitamin D3': 'vitaminD',
        'hs-CRP': 'crp',
        'Homocysteine': 'homocysteine',
        'IGF-1': 'igf1',
        'Ferritin': 'ferritin',
        'Serum Iron': 'serumIron',
        'TIBC': 'tibc',
        'Transferrin Saturation': 'transferrinSaturation',
        'Sodium': 'sodium',
        'Potassium': 'potassium',
        'Calcium': 'calcium',
        'Phosphorus': 'phosphorus',
        'Magnesium': 'magnesium',
        'Bicarbonate': 'bicarbonate',
        'Chloride': 'chloride'
      };

      // Process each blood marker entry
      bloodMarkersData.data.forEach((entry: any) => {
        entry.markers.forEach((marker: any) => {
          const key = markerNameToKey[marker.name];
          if (key) {
            processedBloodMarkers[key].push({
              date: entry.date,
              value: marker.value,
              unit: marker.unit,
              referenceRange: {
                min: 0, // TODO: Add proper reference ranges
                max: 100
              }
            });
          }
        });
      });

      // Sort each marker's data by date in descending order (newest first)
      Object.keys(processedBloodMarkers).forEach((key) => {
        processedBloodMarkers[key as keyof ChartData['bloodMarkers']].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      });

      const allDates = [
        ...(heartRateData.data || []),
        ...(weightData.data || []),
        ...(bodyFatData.data || []),
        ...(hrvData.data || []),
        ...(vo2maxData.data || [])
      ].map(item => new Date(item.date));

      if (allDates.length > 0) {
        const start = new Date(Math.min(...allDates.map(d => d.getTime())));
        const end = new Date(Math.max(...allDates.map(d => d.getTime())));
        setDateRange({ start, end });
        
        const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
        
        if (!weightDate) {
          setWeightDate(endMonth);
        }
        if (!bodyFatDate) {
          setBodyFatDate(endMonth);
        }
        if (!hrvDate) {
          setHrvDate(endMonth);
        }
        if (!vo2maxDate) {
          setVo2maxDate(endMonth);
        }
      }

      return {
        heartRate: heartRateData.data || [],
        weight: weightData.data || [],
        bodyFat: bodyFatData.data || [],
        hrv: hrvData.data || [],
        vo2max: vo2maxData.data || [],
        bloodMarkers: processedBloodMarkers
      };
    } catch (error) {
      console.error('Error fetching data:', error);
      return {
        heartRate: [],
        weight: [],
        bodyFat: [],
        hrv: [],
        vo2max: [],
        bloodMarkers: {
          totalCholesterol: [], ldl: [], hdl: [], triglycerides: [], apoB: [], lpA: [],
          whiteBloodCells: [], redBloodCells: [], hematocrit: [], hemoglobin: [], platelets: [],
          hba1c: [], fastingInsulin: [], glucose: [],
          alt: [], ast: [], ggt: [],
          egfr: [], cystatinC: [], bun: [], creatinine: [], albumin: [],
          testosterone: [], freeTesto: [], estradiol: [], shbg: [],
          t3: [], t4: [], tsh: [],
          vitaminD: [],
          crp: [], homocysteine: [],
          igf1: [],
          ferritin: [], serumIron: [], tibc: [], transferrinSaturation: [],
          sodium: [], potassium: [], calcium: [], phosphorus: [], magnesium: [], bicarbonate: [], chloride: []
        }
      };
    }
  };

  const loadData = async () => {
    setData(prev => ({ ...prev, loading: true }));
    try {
      const newData = await fetchData();
      setData({
        ...newData,
        loading: false
      });
    } catch (error) {
      console.error('Error loading data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        heartRate: [],
        weight: [],
        bodyFat: [],
        hrv: [],
        vo2max: [],
        bloodMarkers: {
          totalCholesterol: [], ldl: [], hdl: [], triglycerides: [], apoB: [], lpA: [],
          whiteBloodCells: [], redBloodCells: [], hematocrit: [], hemoglobin: [], platelets: [],
          hba1c: [], fastingInsulin: [], glucose: [],
          alt: [], ast: [], ggt: [],
          egfr: [], cystatinC: [], bun: [], creatinine: [], albumin: [],
          testosterone: [], freeTesto: [], estradiol: [], shbg: [],
          t3: [], t4: [], tsh: [],
          vitaminD: [],
          crp: [], homocysteine: [],
          igf1: [],
          ferritin: [], serumIron: [], tibc: [], transferrinSaturation: [],
          sodium: [], potassium: [], calcium: [], phosphorus: [], magnesium: [], bicarbonate: [], chloride: []
        }
      }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const goToPreviousMonth = (setter: React.Dispatch<React.SetStateAction<Date | null>>) => {
    setter((prev: Date | null) => {
      if (!prev) return null;
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = (setter: React.Dispatch<React.SetStateAction<Date | null>>) => {
    setter((prev: Date | null) => {
      if (!prev) return null;
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const isNextMonthDisabled = (currentDate: Date | null) => {
    if (!dateRange.end) return true;
    if (!currentDate) return true;
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(currentDate.getMonth() + 1);
    return nextMonth > dateRange.end;
  };

  const isPrevMonthDisabled = (currentDate: Date | null) => {
    if (!dateRange.start) return true;
    if (!currentDate) return true;
    const prevMonth = new Date(currentDate);
    prevMonth.setMonth(currentDate.getMonth() - 1);
    return prevMonth < dateRange.start;
  };

  const goToPreviousYear = (setter: React.Dispatch<React.SetStateAction<Date | null>>) => {
    setter((prev: Date | null) => {
      if (!prev) return null;
      const newDate = new Date(prev);
      newDate.setFullYear(prev.getFullYear() - 1);
      return newDate;
    });
  };

  const goToNextYear = (setter: React.Dispatch<React.SetStateAction<Date | null>>) => {
    setter((prev: Date | null) => {
      if (!prev) return null;
      const newDate = new Date(prev);
      newDate.setFullYear(prev.getFullYear() + 1);
      return newDate;
    });
  };

  const isNextYearDisabled = (currentDate: Date | null) => {
    if (!dateRange.end) return true;
    if (!currentDate) return true;
    const nextYear = new Date(currentDate);
    nextYear.setFullYear(currentDate.getFullYear() + 1);
    return nextYear > dateRange.end;
  };

  const isPrevYearDisabled = (currentDate: Date | null) => {
    if (!dateRange.start) return true;
    if (!currentDate) return true;
    const prevYear = new Date(currentDate);
    prevYear.setFullYear(currentDate.getFullYear() - 1);
    return prevYear < dateRange.start;
  };

  const getMonthData = (data: HealthData[], month: Date | null) => {
    if (!month) return [];
    
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const filteredData = data.filter(item => {
      const date = new Date(item.date);
      return date >= monthStart && date <= monthEnd;
    });

    const dailyData = filteredData.reduce((acc: { [key: string]: { sum: number; count: number } }, item) => {
      const date = new Date(item.date);
      const dayKey = date.toISOString().split('T')[0];
      
      if (!acc[dayKey]) {
        acc[dayKey] = { sum: 0, count: 0 };
      }
      
      acc[dayKey].sum += item.value;
      acc[dayKey].count += 1;
      
      return acc;
    }, {});

    const aggregatedData = Object.entries(dailyData).map(([date, { sum, count }]) => ({
      date: `${date}T12:00:00.000Z`,
      value: Math.round(sum / count)
    }));

    aggregatedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return aggregatedData;
  };

  const getYearlyHRVData = (data: HealthData[], year: Date | null) => {
    if (!year) return [];
    
    const yearStart = new Date(year.getFullYear(), 0, 1);
    const yearEnd = new Date(year.getFullYear(), 11, 31, 23, 59, 59, 999);
    
    const filteredData = data.filter(item => {
      const date = new Date(item.date);
      return date >= yearStart && date <= yearEnd;
    });

    // Group by month and calculate averages
    const monthlyData = filteredData.reduce((acc: { [key: string]: { sum: number; count: number } }, item) => {
      const date = new Date(item.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = { sum: 0, count: 0 };
      }
      
      acc[monthKey].sum += item.value;
      acc[monthKey].count += 1;
      
      return acc;
    }, {});

    const aggregatedData = Object.entries(monthlyData).map(([monthKey, { sum, count }]) => {
      const [year, month] = monthKey.split('-');
      return {
        date: `${year}-${month}-15T12:00:00.000Z`, // Use middle of month for consistent display
        value: Math.round(sum / count)
      };
    });

    aggregatedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return aggregatedData;
  };

  const getHRVData = (data: HealthData[], date: Date | null, timeframe: TimeFrame) => {
    if (!date) return [];
    
    let startDate: Date;
    let endDate: Date;
    let groupingFunction: (date: Date) => string;
    let displayDate: (key: string) => string;
    
    switch (timeframe) {
      case 'daily':
        // Show one month of daily data
        startDate = new Date(date.getFullYear(), date.getMonth(), 1);
        endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
        groupingFunction = (date: Date) => date.toISOString().split('T')[0];
        displayDate = (key: string) => `${key}T12:00:00.000Z`;
        break;
        
      case 'weekly':
        // Show 12 weeks of weekly data
        startDate = new Date(date.getTime());
        startDate.setDate(startDate.getDate() - 84); // 12 weeks back
        endDate = new Date(date.getTime());
        groupingFunction = (date: Date) => {
          const week = new Date(date.getTime());
          week.setDate(week.getDate() - week.getDay());
          return week.toISOString().split('T')[0];
        };
        displayDate = (key: string) => `${key}T12:00:00.000Z`;
        break;
        
      case 'monthly':
        // Show one year of monthly data
        startDate = new Date(date.getFullYear(), 0, 1);
        endDate = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
        groupingFunction = (date: Date) => 
          `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        displayDate = (key: string) => {
          const [year, month] = key.split('-');
          return `${year}-${month}-15T12:00:00.000Z`;
        };
        break;

      case 'yearly':
        // Show 5 years of yearly data
        startDate = new Date(date.getFullYear() - 4, 0, 1);
        endDate = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
        groupingFunction = (date: Date) => date.getFullYear().toString();
        displayDate = (key: string) => `${key}-06-15T12:00:00.000Z`; // Middle of the year
        break;
    }
    
    const filteredData = data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate && itemDate <= endDate;
    });

    const groupedData = filteredData.reduce((acc: { [key: string]: { sum: number; count: number } }, item) => {
      const date = new Date(item.date);
      const key = groupingFunction(date);
      
      if (!acc[key]) {
        acc[key] = { sum: 0, count: 0 };
      }
      
      acc[key].sum += item.value;
      acc[key].count += 1;
      
      return acc;
    }, {});

    const aggregatedData = Object.entries(groupedData).map(([key, { sum, count }]) => ({
      date: displayDate(key),
      value: Math.round(sum / count)
    }));

    aggregatedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return aggregatedData;
  };

  const getTimeframeLabel = (date: Date | null, timeframe: TimeFrame) => {
    if (!date) return '';
    
    switch (timeframe) {
      case 'daily':
        return date.toLocaleString('default', { month: 'long', year: 'numeric' });
      case 'weekly':
        const endDate = new Date(date);
        const startDate = new Date(date);
        startDate.setDate(startDate.getDate() - 84);
        return `${startDate.toLocaleString('default', { month: 'short' })} - ${endDate.toLocaleString('default', { month: 'short' })} ${endDate.getFullYear()}`;
      case 'monthly':
        return date.getFullYear().toString();
      case 'yearly':
        const startYear = date.getFullYear() - 4;
        return `${startYear} - ${date.getFullYear()}`;
    }
  };

  const handleTimeframeNavigation = (
    direction: 'prev' | 'next',
    date: Date | null,
    setDate: React.Dispatch<React.SetStateAction<Date | null>>,
    timeframe: TimeFrame
  ) => {
    setDate((prev: Date | null) => {
      if (!prev) return null;
      const newDate = new Date(prev);
      
      switch (timeframe) {
        case 'daily':
          direction === 'prev' ? newDate.setMonth(prev.getMonth() - 1) : newDate.setMonth(prev.getMonth() + 1);
          break;
        case 'weekly':
          direction === 'prev' ? newDate.setDate(prev.getDate() - 84) : newDate.setDate(prev.getDate() + 84);
          break;
        case 'monthly':
          direction === 'prev' ? newDate.setFullYear(prev.getFullYear() - 1) : newDate.setFullYear(prev.getFullYear() + 1);
          break;
        case 'yearly':
          direction === 'prev' ? newDate.setFullYear(prev.getFullYear() - 5) : newDate.setFullYear(prev.getFullYear() + 5);
          break;
      }
      
      return newDate;
    });
  };

  const isNavigationDisabled = (direction: 'prev' | 'next', date: Date | null, timeframe: TimeFrame) => {
    if (!dateRange.start || !dateRange.end || !date) return true;
    
    const newDate = new Date(date);
    
    switch (timeframe) {
      case 'daily':
        direction === 'prev' ? newDate.setMonth(newDate.getMonth() - 1) : newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'weekly':
        direction === 'prev' ? newDate.setDate(newDate.getDate() - 84) : newDate.setDate(newDate.getDate() + 84);
        break;
      case 'monthly':
        direction === 'prev' ? newDate.setFullYear(newDate.getFullYear() - 1) : newDate.setFullYear(newDate.getFullYear() + 1);
        break;
      case 'yearly':
        direction === 'prev' ? newDate.setFullYear(newDate.getFullYear() - 5) : newDate.setFullYear(newDate.getFullYear() + 5);
        break;
    }
    
    return direction === 'prev' ? newDate < dateRange.start : newDate > dateRange.end;
  };

  const currentHeartRateData = getMonthData(data.heartRate, weightDate);
  const currentWeightData = getHRVData(data.weight, weightDate, weightTimeframe);
  const currentBodyFatData = getHRVData(data.bodyFat, bodyFatDate, bodyFatTimeframe);
  const currentHRVData = getHRVData(data.hrv, hrvDate, hrvTimeframe);
  const currentVO2MaxData = getHRVData(data.vo2max, vo2maxDate, vo2maxTimeframe);
  
  const hasHeartRateData = currentHeartRateData.length > 0;
  const hasWeightData = currentWeightData.length > 0;
  const hasBodyFatData = currentBodyFatData.length > 0;
  const hasHRVData = currentHRVData.length > 0;
  const hasVO2MaxData = currentVO2MaxData.length > 0;

  const MiniChart = ({ data, color }: { data: BloodMarker[], color: string }) => {
    if (data.length < 2) return null;
    
    return (
      <div className="w-[120px] h-[35px] bg-gray-50 rounded-md border border-gray-100 px-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.slice(-3)} margin={{ top: 3, right: 3, bottom: 3, left: 3 }}>
            <Line
              type="natural"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ r: 2.5, fill: color, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const handleAddResults = (newResults: any) => {
    // TODO: Implement adding results to the data
    console.log('New results:', newResults);
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <Image
              src="/images/profile.jpg"
              alt="Profile"
              width={80}
              height={80}
              className="rounded-full"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lex Mathopoulos</h1>
              <p className="text-gray-600">Health Dashboard</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-sm">
          <div>
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('metrics')}
                className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm ${
                  activeTab === 'metrics'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Fitness Metrics
              </button>
              <button
                onClick={() => setActiveTab('blood')}
                className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm ${
                  activeTab === 'blood'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Blood Markers
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'metrics' ? (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-500">Avg Heart Rate Variability</span>
                  <div className="mt-2 flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {data.loading ? (
                        "..."
                      ) : data.hrv.length > 0 ? (
                        `${Math.round(
                          data.hrv
                            .slice(-30)
                            .reduce((sum, item) => sum + item.value, 0) / 
                          Math.min(data.hrv.slice(-30).length, 30)
                        )} ms`
                      ) : (
                        "No data"
                      )}
                    </span>
                    {!data.loading && data.hrv.length > 30 && (
                      <div className="flex items-center">
                        {(() => {
                          const currentAvg = data.hrv
                            .slice(-30)
                            .reduce((sum, item) => sum + item.value, 0) / 
                            Math.min(data.hrv.slice(-30).length, 30);
                          const prevAvg = data.hrv
                            .slice(-60, -30)
                            .reduce((sum, item) => sum + item.value, 0) / 
                            Math.min(data.hrv.slice(-60, -30).length, 30);
                          const percentChange = ((currentAvg - prevAvg) / prevAvg) * 100;
                          const isIncrease = percentChange > 0;
                          return (
                            <TrendIndicator current={currentAvg} previous={prevAvg} />
                          );
                        })()}
                      </div>
                    )}
                  </div>
                  <span className="mt-1 text-xs text-gray-500">Last 30 days</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-500">Avg VO2 Max</span>
                  <div className="mt-2 flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {data.loading ? (
                        "..."
                      ) : data.vo2max.length > 0 ? (
                        `${Math.round(
                          data.vo2max
                            .slice(-30)
                            .reduce((sum, item) => sum + item.value, 0) / 
                          Math.min(data.vo2max.slice(-30).length, 30)
                        )} mL/kg·min`
                      ) : (
                        "No data"
                      )}
                    </span>
                    {!data.loading && data.vo2max.length > 30 && (
                      <div className="flex items-center">
                        {(() => {
                          const currentAvg = data.vo2max
                            .slice(-30)
                            .reduce((sum, item) => sum + item.value, 0) / 
                            Math.min(data.vo2max.slice(-30).length, 30);
                          const prevAvg = data.vo2max
                            .slice(-60, -30)
                            .reduce((sum, item) => sum + item.value, 0) / 
                            Math.min(data.vo2max.slice(-60, -30).length, 30);
                          const percentChange = ((currentAvg - prevAvg) / prevAvg) * 100;
                          const isIncrease = percentChange > 0;
                            return (
                            <TrendIndicator current={currentAvg} previous={prevAvg} />
                          );
                        })()}
                      </div>
                    )}
                  </div>
                  <span className="mt-1 text-xs text-gray-500">Last 30 days</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-500">Avg Weight</span>
                  <div className="mt-2 flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {data.loading ? (
                        "..."
                      ) : data.weight.length > 0 ? (
                        `${(
                          data.weight
                            .slice(-30)
                            .reduce((sum, item) => sum + item.value, 0) / 
                          Math.min(data.weight.slice(-30).length, 30)
                        ).toFixed(1)} lb`
                      ) : (
                        "No data"
                      )}
                    </span>
                    {!data.loading && data.weight.length > 30 && (
                      <div className="flex items-center">
                        {(() => {
                          const currentAvg = data.weight
                            .slice(-30)
                            .reduce((sum, item) => sum + item.value, 0) / 
                            Math.min(data.weight.slice(-30).length, 30);
                          const prevAvg = data.weight
                            .slice(-60, -30)
                            .reduce((sum, item) => sum + item.value, 0) / 
                            Math.min(data.weight.slice(-60, -30).length, 30);
                          const percentChange = ((currentAvg - prevAvg) / prevAvg) * 100;
                          const isIncrease = percentChange > 0;
                          return (
                            <TrendIndicator current={currentAvg} previous={prevAvg} />
                          );
                        })()}
                      </div>
                    )}
                  </div>
                  <span className="mt-1 text-xs text-gray-500">Last 30 days</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-500">Avg Body Fat</span>
                  <div className="mt-2 flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {data.loading ? (
                        "..."
                      ) : data.bodyFat.length > 0 ? (
                        `${(
                          data.bodyFat
                            .slice(-30)
                            .reduce((sum, item) => sum + item.value, 0) / 
                          Math.min(data.bodyFat.slice(-30).length, 30)
                        ).toFixed(1)}%`
                      ) : (
                        "No data"
                      )}
                    </span>
                    {!data.loading && data.bodyFat.length > 30 && (
                      <div className="flex items-center">
                        {(() => {
                          const currentAvg = data.bodyFat
                            .slice(-30)
                            .reduce((sum, item) => sum + item.value, 0) / 
                            Math.min(data.bodyFat.slice(-30).length, 30);
                          const prevAvg = data.bodyFat
                            .slice(-60, -30)
                            .reduce((sum, item) => sum + item.value, 0) / 
                            Math.min(data.bodyFat.slice(-60, -30).length, 30);
                          const percentChange = ((currentAvg - prevAvg) / prevAvg) * 100;
                          const isIncrease = percentChange > 0;
                          return (
                            <TrendIndicator current={currentAvg} previous={prevAvg} isBodyFat={true} />
                          );
                        })()}
                      </div>
                    )}
                  </div>
                  <span className="mt-1 text-xs text-gray-500">Last 30 days</span>
                </div>
              </div>
            </div>

            {/* HRV Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Heart Rate Variability</h2>
                <div className="flex items-center">
                  <select
                    value={hrvTimeframe}
                    onChange={(e) => setHrvTimeframe(e.target.value as TimeFrame)}
                    className="mr-6 h-9 pl-3 pr-8 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 appearance-none cursor-pointer hover:bg-gray-100 transition-colors"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                    }}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                  <div className="flex items-center h-9 bg-gray-50 border border-gray-200 rounded-lg">
                    <button
                      onClick={() => handleTimeframeNavigation('prev', hrvDate, setHrvDate, hrvTimeframe)}
                      disabled={isNavigationDisabled('prev', hrvDate, hrvTimeframe)}
                      className={`h-full px-2 rounded-l-lg hover:bg-white hover:shadow-sm transition-all ${
                        isNavigationDisabled('prev', hrvDate, hrvTimeframe) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="text-sm font-medium text-gray-700 mx-4 min-w-[100px] text-center">
                      {getTimeframeLabel(hrvDate, hrvTimeframe)}
                    </span>
                    <button
                      onClick={() => handleTimeframeNavigation('next', hrvDate, setHrvDate, hrvTimeframe)}
                      disabled={isNavigationDisabled('next', hrvDate, hrvTimeframe)}
                      className={`h-full px-2 rounded-r-lg hover:bg-white hover:shadow-sm transition-all ${
                        isNavigationDisabled('next', hrvDate, hrvTimeframe) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div className="h-[300px]">
                {data.loading && (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    Loading data...
                  </div>
                )}
                {!hasHRVData && !data.loading && (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    No HRV data available for this {hrvTimeframe === 'yearly' ? '5 years' : hrvTimeframe === 'monthly' ? 'year' : hrvTimeframe === 'weekly' ? '12 weeks' : 'month'}
                  </div>
                )}
                {hasHRVData && !data.loading && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={currentHRVData}
                      margin={{ top: 20, right: 10, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid stroke="#E5E7EB" strokeDasharray="1 4" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => {
                          const d = new Date(date);
                          switch (hrvTimeframe) {
                            case 'daily':
                              return d.getDate().toString();
                            case 'weekly':
                              return d.toLocaleString('default', { month: 'short', day: 'numeric' });
                            case 'monthly':
                              return d.toLocaleString('default', { month: 'short' });
                            case 'yearly':
                              return d.getFullYear().toString();
                          }
                        }}
                        stroke="#9CA3AF"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        dy={12}
                      />
                      <YAxis 
                        stroke="#9CA3AF"
                        fontSize={12}
                        tickCount={8}
                        domain={['dataMin - 2', 'dataMax + 2']}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          fontSize: '12px',
                          padding: '8px'
                        }}
                        labelStyle={{ color: '#6B7280', marginBottom: '4px' }}
                        labelFormatter={(value) => {
                          const d = new Date(value);
                          switch (hrvTimeframe) {
                            case 'daily':
                              return d.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });
                            case 'weekly':
                              const weekEnd = new Date(d);
                              weekEnd.setDate(d.getDate() + 6);
                              return `Week of ${d.toLocaleString('default', { month: 'long', day: 'numeric' })} - ${weekEnd.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' })}`;
                            case 'monthly':
                              return d.toLocaleString('default', { month: 'long', year: 'numeric' });
                            case 'yearly':
                              return d.getFullYear().toString();
                          }
                        }}
                        formatter={(value: number) => [`${value} ms`]}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#6366F1"
                        strokeWidth={1.5}
                        dot={{ r: 2, fill: '#6366F1' }}
                        activeDot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* VO2 Max Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">VO2 Max</h2>
                <div className="flex items-center">
                  <select
                    value={vo2maxTimeframe}
                    onChange={(e) => setVo2maxTimeframe(e.target.value as TimeFrame)}
                    className="mr-6 h-9 pl-3 pr-8 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 appearance-none cursor-pointer hover:bg-gray-100 transition-colors"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                    }}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                  <div className="flex items-center h-9 bg-gray-50 border border-gray-200 rounded-lg">
                    <button
                      onClick={() => handleTimeframeNavigation('prev', vo2maxDate, setVo2maxDate, vo2maxTimeframe)}
                      disabled={isNavigationDisabled('prev', vo2maxDate, vo2maxTimeframe)}
                      className={`h-full px-2 rounded-l-lg hover:bg-white hover:shadow-sm transition-all ${
                        isNavigationDisabled('prev', vo2maxDate, vo2maxTimeframe) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="text-sm font-medium text-gray-700 mx-4 min-w-[100px] text-center">
                      {getTimeframeLabel(vo2maxDate, vo2maxTimeframe)}
                    </span>
                    <button
                      onClick={() => handleTimeframeNavigation('next', vo2maxDate, setVo2maxDate, vo2maxTimeframe)}
                      disabled={isNavigationDisabled('next', vo2maxDate, vo2maxTimeframe)}
                      className={`h-full px-2 rounded-r-lg hover:bg-white hover:shadow-sm transition-all ${
                        isNavigationDisabled('next', vo2maxDate, vo2maxTimeframe) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div className="h-[300px]">
                {data.loading && (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    Loading data...
                  </div>
                )}
                {!hasVO2MaxData && !data.loading && (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    No VO2 max data available for this {vo2maxTimeframe === 'yearly' ? '5 years' : vo2maxTimeframe === 'monthly' ? 'year' : vo2maxTimeframe === 'weekly' ? '12 weeks' : 'month'}
                  </div>
                )}
                {hasVO2MaxData && !data.loading && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={currentVO2MaxData}
                      margin={{ top: 20, right: 10, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid stroke="#E5E7EB" strokeDasharray="1 4" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => {
                          const d = new Date(date);
                          switch (vo2maxTimeframe) {
                            case 'daily':
                              return d.getDate().toString();
                            case 'weekly':
                              return d.toLocaleString('default', { month: 'short', day: 'numeric' });
                            case 'monthly':
                              return d.toLocaleString('default', { month: 'short' });
                            case 'yearly':
                              return d.getFullYear().toString();
                          }
                        }}
                        stroke="#9CA3AF"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        dy={12}
                      />
                      <YAxis 
                        stroke="#9CA3AF"
                        fontSize={12}
                        tickCount={8}
                        domain={['dataMin - 2', 'dataMax + 2']}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          fontSize: '12px',
                          padding: '8px'
                        }}
                        labelStyle={{ color: '#6B7280', marginBottom: '4px' }}
                        labelFormatter={(value) => {
                          const d = new Date(value);
                          switch (vo2maxTimeframe) {
                            case 'daily':
                              return d.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });
                            case 'weekly':
                              const weekEnd = new Date(d);
                              weekEnd.setDate(d.getDate() + 6);
                              return `Week of ${d.toLocaleString('default', { month: 'long', day: 'numeric' })} - ${weekEnd.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' })}`;
                            case 'monthly':
                              return d.toLocaleString('default', { month: 'long', year: 'numeric' });
                            case 'yearly':
                              return d.getFullYear().toString();
                          }
                        }}
                        formatter={(value: number) => [`${value} mL/kg·min`]}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#8B5CF6"
                        strokeWidth={1.5}
                        dot={{ r: 2, fill: '#8B5CF6' }}
                        activeDot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Weight Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Weight</h2>
                <div className="flex items-center">
                  <select
                    value={weightTimeframe}
                    onChange={(e) => setWeightTimeframe(e.target.value as TimeFrame)}
                    className="mr-6 h-9 pl-3 pr-8 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 appearance-none cursor-pointer hover:bg-gray-100 transition-colors"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                    }}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                  <div className="flex items-center h-9 bg-gray-50 border border-gray-200 rounded-lg">
                    <button
                      onClick={() => handleTimeframeNavigation('prev', weightDate, setWeightDate, weightTimeframe)}
                      disabled={isNavigationDisabled('prev', weightDate, weightTimeframe)}
                      className={`h-full px-2 rounded-l-lg hover:bg-white hover:shadow-sm transition-all ${
                        isNavigationDisabled('prev', weightDate, weightTimeframe) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="text-sm font-medium text-gray-700 mx-4 min-w-[100px] text-center">
                      {getTimeframeLabel(weightDate, weightTimeframe)}
                    </span>
                    <button
                      onClick={() => handleTimeframeNavigation('next', weightDate, setWeightDate, weightTimeframe)}
                      disabled={isNavigationDisabled('next', weightDate, weightTimeframe)}
                      className={`h-full px-2 rounded-r-lg hover:bg-white hover:shadow-sm transition-all ${
                        isNavigationDisabled('next', weightDate, weightTimeframe) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div className="h-[300px]">
                {data.loading && (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    Loading data...
                  </div>
                )}
                {!hasWeightData && !data.loading && (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    No weight data available for this {weightTimeframe === 'yearly' ? '5 years' : weightTimeframe === 'monthly' ? 'year' : weightTimeframe === 'weekly' ? '12 weeks' : 'month'}
                  </div>
                )}
                {hasWeightData && !data.loading && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={currentWeightData}
                      margin={{ top: 20, right: 10, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid stroke="#E5E7EB" strokeDasharray="1 4" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => {
                          const d = new Date(date);
                          switch (weightTimeframe) {
                            case 'daily':
                              return d.getDate().toString();
                            case 'weekly':
                              return d.toLocaleString('default', { month: 'short', day: 'numeric' });
                            case 'monthly':
                              return d.toLocaleString('default', { month: 'short' });
                            case 'yearly':
                              return d.getFullYear().toString();
                          }
                        }}
                        stroke="#9CA3AF"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        dy={12}
                      />
                      <YAxis 
                        stroke="#9CA3AF"
                        fontSize={12}
                        tickCount={8}
                        domain={['dataMin - 2', 'dataMax + 2']}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          fontSize: '12px',
                          padding: '8px'
                        }}
                        labelStyle={{ color: '#6B7280', marginBottom: '4px' }}
                        labelFormatter={(value) => {
                          const d = new Date(value);
                          switch (weightTimeframe) {
                            case 'daily':
                              return d.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });
                            case 'weekly':
                              const weekEnd = new Date(d);
                              weekEnd.setDate(d.getDate() + 6);
                              return `Week of ${d.toLocaleString('default', { month: 'long', day: 'numeric' })} - ${weekEnd.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' })}`;
                            case 'monthly':
                              return d.toLocaleString('default', { month: 'long', year: 'numeric' });
                            case 'yearly':
                              return d.getFullYear().toString();
                          }
                        }}
                        formatter={(value: number) => [`${value} lb`]}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#10B981"
                        strokeWidth={1.5}
                        dot={{ r: 2, fill: '#10B981' }}
                        activeDot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Body Fat Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Body Fat</h2>
                <div className="flex items-center">
                  <select
                    value={bodyFatTimeframe}
                    onChange={(e) => setBodyFatTimeframe(e.target.value as TimeFrame)}
                    className="mr-6 h-9 pl-3 pr-8 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 appearance-none cursor-pointer hover:bg-gray-100 transition-colors"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                    }}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                  <div className="flex items-center h-9 bg-gray-50 border border-gray-200 rounded-lg">
                    <button
                      onClick={() => handleTimeframeNavigation('prev', bodyFatDate, setBodyFatDate, bodyFatTimeframe)}
                      disabled={isNavigationDisabled('prev', bodyFatDate, bodyFatTimeframe)}
                      className={`h-full px-2 rounded-l-lg hover:bg-white hover:shadow-sm transition-all ${
                        isNavigationDisabled('prev', bodyFatDate, bodyFatTimeframe) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="text-sm font-medium text-gray-700 mx-4 min-w-[100px] text-center">
                      {getTimeframeLabel(bodyFatDate, bodyFatTimeframe)}
                    </span>
                    <button
                      onClick={() => handleTimeframeNavigation('next', bodyFatDate, setBodyFatDate, bodyFatTimeframe)}
                      disabled={isNavigationDisabled('next', bodyFatDate, bodyFatTimeframe)}
                      className={`h-full px-2 rounded-r-lg hover:bg-white hover:shadow-sm transition-all ${
                        isNavigationDisabled('next', bodyFatDate, bodyFatTimeframe) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div className="h-[300px]">
                {data.loading && (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    Loading data...
                  </div>
                )}
                {!hasBodyFatData && !data.loading && (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    No body fat data available for this {bodyFatTimeframe === 'yearly' ? '5 years' : bodyFatTimeframe === 'monthly' ? 'year' : bodyFatTimeframe === 'weekly' ? '12 weeks' : 'month'}
                  </div>
                )}
                {hasBodyFatData && !data.loading && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={currentBodyFatData}
                      margin={{ top: 20, right: 10, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid stroke="#E5E7EB" strokeDasharray="1 4" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => {
                          const d = new Date(date);
                          switch (bodyFatTimeframe) {
                            case 'daily':
                              return d.getDate().toString();
                            case 'weekly':
                              return d.toLocaleString('default', { month: 'short', day: 'numeric' });
                            case 'monthly':
                              return d.toLocaleString('default', { month: 'short' });
                            case 'yearly':
                              return d.getFullYear().toString();
                          }
                        }}
                        stroke="#9CA3AF"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        dy={12}
                      />
                      <YAxis 
                        stroke="#9CA3AF"
                        fontSize={12}
                        tickCount={8}
                        domain={['dataMin - 2', 'dataMax + 2']}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{ 
                          backgroundColor: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          fontSize: '12px',
                          padding: '8px'
                        }}
                        labelStyle={{ color: '#6B7280', marginBottom: '4px' }}
                        labelFormatter={(value) => {
                          const d = new Date(value);
                          switch (bodyFatTimeframe) {
                            case 'daily':
                              return d.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });
                            case 'weekly':
                              const weekEnd = new Date(d);
                              weekEnd.setDate(d.getDate() + 6);
                              return `Week of ${d.toLocaleString('default', { month: 'long', day: 'numeric' })} - ${weekEnd.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' })}`;
                            case 'monthly':
                              return d.toLocaleString('default', { month: 'long', year: 'numeric' });
                            case 'yearly':
                              return d.getFullYear().toString();
                          }
                        }}
                        formatter={(value: number) => [`${value}%`]}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#F59E0B"
                        strokeWidth={1.5}
                        dot={{ r: 2, fill: '#F59E0B' }}
                        activeDot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-800">Blood Markers & Longevity</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Lipid Panel */}
              <div className="border border-gray-100 rounded-xl p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Lipid Panel</h3>
                <div className="space-y-6">
                  <MarkerRow label="Total Cholesterol" data={data.bloodMarkers.totalCholesterol} />
                  <MarkerRow label="LDL-C" data={data.bloodMarkers.ldl} />
                  <MarkerRow label="HDL-C" data={data.bloodMarkers.hdl} />
                  <MarkerRow label="Triglycerides" data={data.bloodMarkers.triglycerides} />
                  <MarkerRow label="ApoB" data={data.bloodMarkers.apoB} />
                  <MarkerRow label="Lp(a)" data={data.bloodMarkers.lpA} />
                </div>
                <LastTestedDate data={data.bloodMarkers.totalCholesterol} />
              </div>

              {/* Complete Blood Count */}
              <div className="border border-gray-100 rounded-xl p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Complete Blood Count</h3>
                <div className="space-y-6">
                  <MarkerRow label="White Blood Cells" data={data.bloodMarkers.whiteBloodCells} />
                  <MarkerRow label="Red Blood Cells" data={data.bloodMarkers.redBloodCells} />
                  <MarkerRow label="Hematocrit" data={data.bloodMarkers.hematocrit} />
                  <MarkerRow label="Hemoglobin" data={data.bloodMarkers.hemoglobin} />
                  <MarkerRow label="Platelets" data={data.bloodMarkers.platelets} />
                </div>
                <LastTestedDate data={data.bloodMarkers.whiteBloodCells} />
              </div>

              {/* Glucose Markers */}
              <div className="border border-gray-100 rounded-xl p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Glucose Markers</h3>
                <div className="space-y-6">
                  <MarkerRow label="HbA1c" data={data.bloodMarkers.hba1c} />
                  <MarkerRow label="Fasting Insulin" data={data.bloodMarkers.fastingInsulin} />
                  <MarkerRow label="Glucose" data={data.bloodMarkers.glucose} />
                </div>
                <LastTestedDate data={data.bloodMarkers.glucose} />
              </div>

              {/* Liver Markers */}
              <div className="border border-gray-100 rounded-xl p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Liver Markers</h3>
                <div className="space-y-6">
                  <MarkerRow label="ALT" data={data.bloodMarkers.alt} />
                  <MarkerRow label="AST" data={data.bloodMarkers.ast} />
                  <MarkerRow label="GGT" data={data.bloodMarkers.ggt} />
                </div>
                <LastTestedDate data={data.bloodMarkers.alt} />
              </div>

              {/* Kidney Markers */}
              <div className="border border-gray-100 rounded-xl p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Kidney Markers</h3>
                <div className="space-y-6">
                  <MarkerRow label="eGFR" data={data.bloodMarkers.egfr} />
                  <MarkerRow label="Cystatin C" data={data.bloodMarkers.cystatinC} />
                  <MarkerRow label="BUN" data={data.bloodMarkers.bun} />
                  <MarkerRow label="Creatinine" data={data.bloodMarkers.creatinine} />
                  <MarkerRow label="Albumin" data={data.bloodMarkers.albumin} />
                </div>
                <LastTestedDate data={data.bloodMarkers.egfr} />
              </div>

              {/* Sex Hormones */}
              <div className="border border-gray-100 rounded-xl p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Sex Hormones</h3>
                <div className="space-y-6">
                  <MarkerRow label="Testosterone" data={data.bloodMarkers.testosterone} />
                  <MarkerRow label="Free Testosterone" data={data.bloodMarkers.freeTesto} />
                  <MarkerRow label="Estradiol" data={data.bloodMarkers.estradiol} />
                  <MarkerRow label="SHBG" data={data.bloodMarkers.shbg} />
                </div>
                <LastTestedDate data={data.bloodMarkers.testosterone} />
              </div>

              {/* Thyroid Markers */}
              <div className="border border-gray-100 rounded-xl p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Thyroid Markers</h3>
                <div className="space-y-6">
                  <MarkerRow label="T3" data={data.bloodMarkers.t3} />
                  <MarkerRow label="T4" data={data.bloodMarkers.t4} />
                  <MarkerRow label="TSH" data={data.bloodMarkers.tsh} />
                </div>
                <LastTestedDate data={data.bloodMarkers.t3} />
              </div>

              {/* Vitamins & Inflammation */}
              <div className="border border-gray-100 rounded-xl p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Vitamins & Inflammation</h3>
                <div className="space-y-6">
                  <MarkerRow label="Vitamin D3" data={data.bloodMarkers.vitaminD} />
                  <MarkerRow label="hs-CRP" data={data.bloodMarkers.crp} />
                  <MarkerRow label="Homocysteine" data={data.bloodMarkers.homocysteine} />
                  <MarkerRow label="IGF-1" data={data.bloodMarkers.igf1} />
                </div>
                <LastTestedDate data={data.bloodMarkers.vitaminD} />
              </div>

              {/* Iron Panel */}
              <div className="border border-gray-100 rounded-xl p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Iron Panel</h3>
                <div className="space-y-6">
                  <MarkerRow label="Ferritin" data={data.bloodMarkers.ferritin} />
                  <MarkerRow label="Serum Iron" data={data.bloodMarkers.serumIron} />
                  <MarkerRow label="TIBC" data={data.bloodMarkers.tibc} />
                  <MarkerRow label="Transferrin Saturation" data={data.bloodMarkers.transferrinSaturation} />
                </div>
                <LastTestedDate data={data.bloodMarkers.ferritin} />
              </div>

              {/* Electrolytes */}
              <div className="border border-gray-100 rounded-xl p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Electrolytes</h3>
                <div className="space-y-6">
                  <MarkerRow label="Sodium" data={data.bloodMarkers.sodium} />
                  <MarkerRow label="Potassium" data={data.bloodMarkers.potassium} />
                  <MarkerRow label="Calcium" data={data.bloodMarkers.calcium} />
                  <MarkerRow label="Phosphorus" data={data.bloodMarkers.phosphorus} />
                  <MarkerRow label="Magnesium" data={data.bloodMarkers.magnesium} />
                  <MarkerRow label="Bicarbonate" data={data.bloodMarkers.bicarbonate} />
                  <MarkerRow label="Chloride" data={data.bloodMarkers.chloride} />
                </div>
                <LastTestedDate data={data.bloodMarkers.sodium} />
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="fixed bottom-4 left-4 bg-indigo-500/10 hover:bg-indigo-500/20 backdrop-blur px-3 py-2 rounded-full shadow-lg text-sm font-medium tracking-wide text-indigo-600 border border-indigo-500/20 hover:shadow-md transition-all duration-300 flex items-center gap-0 hover:gap-2 hover:px-4 group">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="w-0 overflow-hidden group-hover:w-auto transition-all duration-300 ease-in-out whitespace-nowrap">
          Powered by OpenHealth
        </span>
      </div>
    </main>
  );
}

// Helper Components
const TrendIndicator = ({ 
  current, 
  previous, 
  isBodyFat = false,
  decreaseIsGood = null,
  min = 0,
  max = 100
}: { 
  current: number, 
  previous: number, 
  isBodyFat?: boolean,
  decreaseIsGood?: boolean | null,
  min?: number,
  max?: number
}) => {
  const percentChange = ((current - previous) / previous) * 100;
  const isIncrease = percentChange > 0;
  
  // Calculate optimal range (middle 50% of normal range)
  const range = max - min;
  const optimalMin = min + (range * 0.25);
  const optimalMax = max - (range * 0.25);

  // Helper functions to determine value positions
  const isInOptimalRange = (value: number) => value >= optimalMin && value <= optimalMax;
  const isInNormalRange = (value: number) => value >= min && value <= max;
  const isMovingTowardsOptimal = () => {
    if (isInOptimalRange(current)) return true;
    if (current > optimalMax && previous > current) return true;
    if (current < optimalMin && previous < current) return true;
    return false;
  };
  const isMovingFromOptimalToNormal = () => {
    return isInOptimalRange(previous) && !isInOptimalRange(current) && isInNormalRange(current);
  };
  const isMovingTowardsAbnormal = () => {
    return (current > max && previous < current) || (current < min && previous > current);
  };

  // Determine color based on movement and ranges
  let color = 'text-gray-500'; // Default color
  if (isMovingTowardsOptimal()) {
    color = 'text-green-500';
  } else if (isMovingFromOptimalToNormal() || isMovingTowardsAbnormal()) {
    // Show red for both moving away from optimal and towards abnormal
    color = 'text-red-500';
  } else if (decreaseIsGood !== null) {
    // Fall back to simple decrease/increase logic if specified
    color = (isIncrease !== decreaseIsGood) ? 'text-green-500' : 'text-red-500';
  } else if (isBodyFat) {
    // Special case for body fat
    color = !isIncrease ? 'text-green-500' : 'text-red-500';
  }

  return (
    <span className={`text-sm flex items-center ${color}`}>
      {isIncrease ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
        </svg>
      )}
      <span className="ml-1">{Math.abs(percentChange).toFixed(1)}%</span>
    </span>
  );
};

const MarkerRow = ({ label, data }: { label: string, data: BloodMarker[] }) => {
  // Convert label to config key
  const configKey = label.toLowerCase()
    .replace(/-/g, '')
    .replace(/[()]/g, '')
    .replace(/\s+/g, '') as keyof typeof BLOOD_MARKER_CONFIG;
  
  const config = BLOOD_MARKER_CONFIG[configKey] || {
    min: data[0]?.referenceRange?.min || 0,
    max: data[0]?.referenceRange?.max || 100,
    decreaseIsGood: null
  };

  const getStatusInfo = (value: number) => {
    // Define optimal range as middle 50% of normal range
    const range = config.max - config.min;
    const optimalMin = config.min + (range * 0.25);
    const optimalMax = config.max - (range * 0.25);

    if (value < config.min || value > config.max) {
      return 'Abnormal';
    } else if (value >= optimalMin && value <= optimalMax) {
      return 'Optimal';
    } else {
      return 'Normal';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Abnormal': return 'text-red-500';
      case 'Normal': return 'text-yellow-500';
      case 'Optimal': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getDotColor = (value: number) => {
    const status = getStatusInfo(value);
    switch (status) {
      case 'Abnormal': return 'bg-red-500';
      case 'Normal': return 'bg-yellow-500';
      case 'Optimal': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Define optimal range as middle 50% of normal range
  const range = config.max - config.min;
  const optimalMin = config.min + (range * 0.25);
  const optimalMax = config.max - (range * 0.25);

  return (
    <div className="flex justify-between items-center border-b border-gray-100 pb-4">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <div className="flex items-center gap-3">
        {data.length > 0 && (
          <>
            <div className="group relative">
              <div 
                className={`w-2 h-2 rounded-full transition-transform duration-200 group-hover:scale-125 ${
                  getDotColor(data[0].value)
                }`}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50">
                <div className="bg-white rounded-lg py-3 px-4 shadow-sm border border-gray-100 min-w-[200px]">
                  <div className="flex flex-col gap-3">
                    <div className={`text-sm font-medium ${getStatusColor(getStatusInfo(data[0].value))}`}>
                      {getStatusInfo(data[0].value)}
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-red-500 font-medium">Abnormal</span>
                        <span className="text-gray-600">&lt;{config.min} or &gt;{config.max}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-yellow-500 font-medium">Normal</span>
                        <span className="text-gray-600">{config.min}-{config.max}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-green-500 font-medium">Optimal</span>
                        <span className="text-gray-600">{optimalMin.toFixed(1)}-{optimalMax.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-2 h-2 bg-white border-r border-b border-gray-100 absolute -bottom-1 left-1/2 -translate-x-1/2 transform rotate-45"></div>
              </div>
            </div>
            {data.length > 1 && (
              <TrendIndicator 
                current={data[0].value}
                previous={data[1].value}
                decreaseIsGood={config.decreaseIsGood}
                min={config.min}
                max={config.max}
              />
            )}
          </>
        )}
        <span className="text-lg font-semibold text-gray-900">
          {data.length > 0 ?
           `${data[0].value} ${data[0].unit}` :
           "No data"}
        </span>
      </div>
    </div>
  );
};

const LastTestedDate = ({ data }: { data: BloodMarker[] }) => (
  data.length > 0 && (
    <p className="text-sm text-gray-500 mt-6">
      Last tested: {new Date(data[0].date).toLocaleDateString()}
    </p>
  )
);
