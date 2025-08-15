// Dashboard-specific types extracted from the monolithic component

export interface HealthData {
  date: string;
  value: number;
  meta?: {
    aggregationType?: 'weekly' | 'monthly';
    pointCount?: number;
  };
}

export interface BloodMarker {
  date: string;
  value: number;
  unit: string;
  referenceRange?: {
    min: number;
    max: number;
  };
}

export interface ChartData {
  heartRate: HealthData[];
  weight: HealthData[];
  bodyFat: HealthData[];
  hrv: HealthData[];
  vo2max: HealthData[];
  bloodMarkers: BloodMarkersCollection;
}

export interface BloodMarkersCollection {
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
  
  // CBC Differentials
  neutrophilCount: BloodMarker[];
  neutrophilPercentage: BloodMarker[];
  lymphocyteCount: BloodMarker[];
  lymphocytePercentage: BloodMarker[];
  monocyteCount: BloodMarker[];
  monocytePercentage: BloodMarker[];
  eosinophilCount: BloodMarker[];
  eosinophilPercentage: BloodMarker[];
  basophilCount: BloodMarker[];
  basophilPercentage: BloodMarker[];
  
  // Red Blood Cell Indices
  mcv: BloodMarker[];
  mch: BloodMarker[];
  mchc: BloodMarker[];
  rdw: BloodMarker[];
  mpv: BloodMarker[];
  
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
  
  // Vitamins & Minerals
  vitaminD: BloodMarker[];
  vitaminB12: BloodMarker[];
  folate: BloodMarker[];
  iron: BloodMarker[];
  magnesium: BloodMarker[];
  rbcMagnesium: BloodMarker[];
  
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
  bicarbonate: BloodMarker[];
  chloride: BloodMarker[];
  
  // Additional markers
  creatineKinase: BloodMarker[];
  cortisol: BloodMarker[];
  
  // Longevity Markers
  biologicalAge: BloodMarker[];
}

export interface UserData {
  name: string;
  email: string;
  userId: string;
  profileImage?: string;
  age?: number;
  sex?: 'male' | 'female' | 'other';
}

export interface ActivityFeedItem {
  id: string;
  type: 'sleep' | 'workout' | 'meal';
  startTime: string;
  endTime?: string;
  title: string;
  subtitle?: string;
  metrics: {
    [key: string]: string;
  };
  sleepStages?: Record<string, SleepStage>;
  activityType?: string;
}

export interface SleepStage {
  percentage: number;
  duration: string;
}

export interface WorkoutMetricsProps {
  metrics: {
    [key: string]: string;
  };
  activityType: string;
}

export interface SleepStagesBarProps {
  stageDurations: Record<string, SleepStage>;
}
