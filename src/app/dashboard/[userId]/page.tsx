'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Image from 'next/image';
import Link from 'next/link';
import AddResultsModal from '@/app/components/AddResultsModal';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import toast, { Toaster } from 'react-hot-toast';
import ThemeToggle from '@/app/components/ThemeToggle';
import { useTheme } from '@/app/context/ThemeContext';
import TrendIndicator from '@/components/TrendIndicator';
import WorkoutHeatMap from '@/app/components/WorkoutHeatMap';
import { WeeklyWorkoutProvider, useWeeklyWorkout } from '@/app/context/WeeklyWorkoutContext';
import ActiveExperiments from '@/app/components/ActiveExperiments';
import BloodMarkerDetailModal from '@/app/components/BloodMarkerDetailModal';
import { getReferenceRanges, getBloodMarkerStatus, BLOOD_MARKER_STATUS_COLORS } from '@/lib/bloodMarkerRanges';
import { Skeleton } from '@/components/ui/skeleton'

interface HealthData {
  date: string;
  value: number;
  meta?: {
    aggregationType?: 'weekly' | 'monthly';
    pointCount?: number;
  };
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
  };
  loading: boolean;
}

type TimeFrame = 'daily' | 'weekly' | 'monthly' | 'yearly';

// New type definition for fixed time ranges
type TimeRange = 'last30days' | 'last3months' | 'last6months' | 'last1year' | 'last3years';

// Add this before the component definitions
const BLOOD_MARKER_CONFIG = {
  // Lipid Panel
  totalcholesterol: { min: 125, max: 199, decreaseIsGood: true },
  ldlcholesterol: { min: 1, max: 100, decreaseIsGood: true },
  hdlcholesterol: { min: 46, max: 100, decreaseIsGood: false },
  triglycerides: { min: 0, max: 150, decreaseIsGood: true },
  apob: { min: 0, max: 119, decreaseIsGood: true },
  lpa: { min: 0, max: 75, decreaseIsGood: true },
  
  // Complete Blood Count
  whitebloodcells: { min: 3.8, max: 10.8, decreaseIsGood: null },
  redbloodcells: { min: 3.8, max: 5.8, decreaseIsGood: null },
  hematocrit: { min: 38, max: 50, decreaseIsGood: null },
  hemoglobin: { min: 13.2, max: 17.1, decreaseIsGood: null },
  platelets: { min: 140, max: 400, decreaseIsGood: null },
  
  // CBC Differentials
  neutrophilcount: { min: 1500, max: 7800, decreaseIsGood: null },
  neutrophilpercentage: { min: 39, max: 75, decreaseIsGood: null },
  lymphocytecount: { min: 850, max: 3900, decreaseIsGood: null },
  lymphocytepercentage: { min: 16, max: 47, decreaseIsGood: null },
  monocytecount: { min: 200, max: 950, decreaseIsGood: null },
  monocytepercentage: { min: 4, max: 12, decreaseIsGood: null },
  eosinophilcount: { min: 15, max: 500, decreaseIsGood: null },
  eosinophilpercentage: { min: 0, max: 7, decreaseIsGood: null },
  basophilcount: { min: 0, max: 200, decreaseIsGood: null },
  basophilpercentage: { min: 0, max: 2, decreaseIsGood: null },
  
  // Red Blood Cell Indices
  mcv: { min: 80, max: 100, decreaseIsGood: null },
  mch: { min: 27, max: 33, decreaseIsGood: null },
  mchc: { min: 32, max: 36, decreaseIsGood: null },
  rdw: { min: 11, max: 15, decreaseIsGood: true },
  mpv: { min: 7.5, max: 12.5, decreaseIsGood: null },
  
  // Glucose Markers
  hba1c: { min: 3, max: 5.7, decreaseIsGood: true },
  fastinginsulin: { min: 2.6, max: 18.4, decreaseIsGood: true },
  glucose: { min: 65, max: 99, decreaseIsGood: true },
  
  // Liver Markers
  alt: { min: 9, max: 46, decreaseIsGood: true },
  ast: { min: 10, max: 40, decreaseIsGood: true },
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

const OWNER_ID = 'usr_W2LWz83EurLxZwfjqT_EL';

interface UserData {
  name: string;
  email: string;
  userId: string;
  profileImage?: string;
  age?: number;
  sex?: 'male' | 'female' | 'other';
}

interface ActivityFeedItem {
  id: string;
  type: 'sleep' | 'workout' | 'meal';
  startTime: string;
  endTime?: string;
  title: string;
  subtitle?: string;
  metrics: {
    [key: string]: string;
  };
  sleepStages?: Record<string, {
    percentage: number;
    duration: string;
  }>;
  activityType?: string; // Add this for workout type
}

interface SleepStage {
  percentage: number;
  duration: string;
}

interface SleepStagesBarProps {
  stageDurations: Record<string, SleepStage>;
}

// Component to display workout metrics with icons
interface WorkoutMetricsProps {
  metrics: {
    [key: string]: string;
  };
  activityType: string;
}

function WorkoutMetrics({ metrics, activityType }: WorkoutMetricsProps) {
  const activityIcons: Record<string, React.ReactNode> = {
    'running': <RunIcon className="h-5 w-5 text-green-500" />,
    'walking': <WalkIcon className="h-5 w-5 text-green-500" />,
    'cycling': <BicycleIcon className="h-5 w-5 text-green-500" />,
    'strength_training': <DumbbellIcon className="h-5 w-5 text-green-500" />,
    'swimming': <SwimIcon className="h-5 w-5 text-green-500" />,
    'hiit': <ActivityIcon className="h-5 w-5 text-green-500" />,
    'default': <ActivityIcon className="h-5 w-5 text-green-500" />
  };

  // Get the appropriate icon or default
  const icon = activityIcons[activityType] || activityIcons.default;
  
  // Order metrics in a specific way
  const orderedMetricKeys = ['Duration', 'Distance', 'Pace', 'Avg Heart Rate'];
  const orderedMetrics = orderedMetricKeys
    .filter(key => metrics[key])
    .map(key => ({ key, value: metrics[key] }));
  
  // Add any remaining metrics that aren't in our predefined order
  Object.entries(metrics)
    .filter(([key]) => !orderedMetricKeys.includes(key))
    .forEach(([key, value]) => orderedMetrics.push({ key, value }));

  return (
    <div className="space-y-5">
      <div className="flex items-center space-x-2 mb-2">
        {icon}
        <span className="text-gray-700 dark:text-gray-300 font-medium capitalize">
          {activityType.replace(/_/g, ' ')}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        {orderedMetrics.map(({ key, value }) => (
          <div key={key} className="flex flex-col">
            <div className="text-xs text-gray-500 dark:text-gray-400">{key}</div>
            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const SLEEP_STAGE_TARGETS = {
  deep: { 
    target: 90, 
    color: 'bg-indigo-500 dark:bg-indigo-400', 
    label: 'Deep Sleep'
  },
  core: { 
    target: 240, 
    color: 'bg-blue-500 dark:bg-blue-400', 
    label: 'Core Sleep'
  },
  rem: { 
    target: 90, 
    color: 'bg-purple-500 dark:bg-purple-400', 
    label: 'REM Sleep'
  }
} as const;

// SVG icons for workout types
function ActivityIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
  );
}

function RunIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="17" cy="5" r="3"></circle>
      <path d="M10 17l2-4 4-1 3 3-4 4"></path>
      <path d="M7 20l.9-2.8c.3-.8.8-1.5 1.5-1.9l2.6-1.3"></path>
      <path d="M13 9l-1.8-1.8c-.6-.6-1.5-1-2.4-.8L5 7"></path>
    </svg>
  );
}

function WalkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="13" cy="4" r="2"></circle>
      <path d="M15 7v11"></path>
      <path d="M9 7v11"></path>
      <path d="M9 11h6"></path>
      <path d="M9 18h6"></path>
    </svg>
  );
}

function BicycleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="5.5" cy="17.5" r="3.5"></circle>
      <circle cx="18.5" cy="17.5" r="3.5"></circle>
      <path d="M15 6a1 1 0 100-2 1 1 0 000 2z"></path>
      <path d="M12 17.5V14l-3-3 4-3 2 3h2"></path>
    </svg>
  );
}

function SwimIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 12h20"></path>
      <path d="M5 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path>
      <path d="M3 16c.8.8 2.2 1 3 1 1.8 0 3.2-1 5-1 1.8 0 3.2 1 5 1 1.8 0 3.2-1 5-1"></path>
      <path d="M3 20c.8.8 2.2 1 3 1 1.8 0 3.2-1 5-1 1.8 0 3.2 1 5 1 1.8 0 3.2-1 5-1"></path>
    </svg>
  );
}

function DumbbellIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 6h12v12H6z"></path>
      <path d="M3 9h3"></path>
      <path d="M3 15h3"></path>
      <path d="M18 9h3"></path>
      <path d="M18 15h3"></path>
    </svg>
  );
}

function SleepStagesBar({ stageDurations }: SleepStagesBarProps) {
  if (!stageDurations) {
    return <div className="text-sm text-gray-500">No sleep data available</div>;
  }

  const durationToMinutes = (duration: string): number => {
    const hours = duration.match(/(\d+)h/)?.[1] || '0';
    const minutes = duration.match(/(\d+)m/)?.[1] || '0';
    return parseInt(hours) * 60 + parseInt(minutes);
  };

  return (
    <div className="space-y-4">
      {Object.entries(SLEEP_STAGE_TARGETS).map(([stage, { target, color, label }]) => {
        const stageData = stageDurations[stage];
        const durationMinutes = stageData ? durationToMinutes(stageData.duration) : 0;
        const percentageOfTarget = Math.min(100, (durationMinutes / target) * 100);
        const isOverTarget = durationMinutes >= target;
        
        return (
          <div key={stage} className="relative">
            {/* Stage Label and Duration */}
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="text-base font-medium text-gray-900 dark:text-white">
                {label}
              </span>
              <div className="text-sm">
                <span className={`font-semibold ${isOverTarget ? 'text-green-500' : 'text-gray-600 dark:text-gray-300'}`}>
                  {stageData?.duration || '0min'}
                </span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="relative h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div 
                className={`absolute left-0 top-0 h-full ${color} transition-all duration-500 ease-out`}
                style={{ width: `${percentageOfTarget}%` }}
              />
            </div>
            
            {/* Target Info */}
            <div className="flex justify-end mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Target: {target}min
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Helper function to format pace (time per mile)
const formatPace = (paceInSecondsPerKm: number): string => {
  if (!paceInSecondsPerKm || isNaN(paceInSecondsPerKm)) return '';
  
  // Convert seconds per km to seconds per mile (1 mile = 1.60934 km)
  const paceInSecondsPerMile = paceInSecondsPerKm * 1.60934;
  
  const minutes = Math.floor(paceInSecondsPerMile / 60);
  const seconds = Math.floor(paceInSecondsPerMile % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}/mi`;
};

// Add this component before the main Home component
function WeeklyWorkoutCount() {
  const { workoutCount } = useWeeklyWorkout();
  
  return (
    <>
      <span className="hidden sm:inline">{workoutCount}/7 days this week</span>
      <span className="sm:hidden">{workoutCount}/7 days</span>
    </>
  );
}

interface HealthProtocol {
  _id?: string; // Assuming ObjectId is stringified
  userId: string;
  protocolType: 'diet' | 'supplement' | 'exercise' | 'sleep' | 'meditation' | 'cold-therapy' | 'sauna';
  protocol: string;
  startDate: string; // Dates are often stringified in API responses
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Helper to create an object with all blood-marker arrays empty
function createEmptyBloodMarkers(): ChartData['bloodMarkers'] {
  return {
    // Lipid Panel
    totalCholesterol: [], ldl: [], hdl: [], triglycerides: [], apoB: [], lpA: [],
    // Complete Blood Count
    whiteBloodCells: [], redBloodCells: [], hematocrit: [], hemoglobin: [], platelets: [],
    // CBC Differentials
    neutrophilCount: [], neutrophilPercentage: [], lymphocyteCount: [], lymphocytePercentage: [],
    monocyteCount: [], monocytePercentage: [], eosinophilCount: [], eosinophilPercentage: [],
    basophilCount: [], basophilPercentage: [],
    // Red Blood Cell Indices
    mcv: [], mch: [], mchc: [], rdw: [], mpv: [],
    // Glucose Markers
    hba1c: [], fastingInsulin: [], glucose: [],
    // Liver Markers
    alt: [], ast: [], ggt: [],
    // Kidney Markers
    egfr: [], cystatinC: [], bun: [], creatinine: [], albumin: [],
    // Sex Hormones
    testosterone: [], freeTesto: [], estradiol: [], shbg: [],
    // Thyroid Markers
    t3: [], t4: [], tsh: [],
    // Vitamins & Minerals
    vitaminD: [], vitaminB12: [], folate: [], iron: [], magnesium: [], rbcMagnesium: [],
    // Inflammation
    crp: [], homocysteine: [],
    // Growth Factors
    igf1: [],
    // Iron Panel
    ferritin: [], serumIron: [], tibc: [], transferrinSaturation: [],
    // Electrolytes
    sodium: [], potassium: [], calcium: [], phosphorus: [], bicarbonate: [], chloride: [],
    // Additional markers
    creatineKinase: [], cortisol: [],
    // Longevity Markers
    biologicalAge: []
  };
}

// Lightweight fetch – only the data required for Home tab
async function fetchHomeData(userId: string) {
  try {
    const timestamp = Date.now();
    const [heartRateRes, weightRes, bodyFatRes, hrvRes, vo2maxRes, sleepRes, workoutRes] = await Promise.all([
      fetch(`/api/health-data?type=heartRate&userId=${userId}&t=${timestamp}`),
      fetch(`/api/health-data?type=weight&userId=${userId}&t=${timestamp}`),
      fetch(`/api/health-data?type=bodyFat&userId=${userId}&t=${timestamp}`),
      fetch(`/api/health-data?type=hrv&userId=${userId}&t=${timestamp}`),
      fetch(`/api/health-data?type=vo2max&userId=${userId}&t=${timestamp}`),
      fetch(`/api/health-data?type=sleep&userId=${userId}&t=${timestamp}`),
      fetch(`/api/health-data?type=workout&userId=${userId}&t=${timestamp}`),
    ]);

    const responses = await Promise.all([
      heartRateRes.json(),
      weightRes.json(),
      bodyFatRes.json(),
      hrvRes.json(),
      vo2maxRes.json(),
      sleepRes.json(),
      workoutRes.json(),
    ]);

    const [heartRateData, weightData, bodyFatData, hrvData, vo2maxData, sleepData, workoutData] = responses;

    return {
      heartRate: heartRateData.data || [],
      weight: weightData.data || [],
      bodyFat: bodyFatData.data || [],
      hrv: hrvData.data || [],
      vo2max: vo2maxData.data || [],
      bloodMarkers: createEmptyBloodMarkers(),
      loading: false,
      // extra data handled outside
      _sleep: sleepData,
      _workout: workoutData,
    } as any;
  } catch (err) {
    console.error('Error fetching home data', err);
    return {
      heartRate: [],
      weight: [],
      bodyFat: [],
      hrv: [],
      vo2max: [],
      bloodMarkers: createEmptyBloodMarkers(),
      loading: false,
    } as ChartData;
  }
}

// Heavy fetch – blood markers & protocols. Mutates state when complete.
async function fetchBloodMarkers(userId: string, update: (bm: ChartData['bloodMarkers']) => void) {
  function toCamel(str: string) {
    return str
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .split(' ')
      .map((w,i)=> i===0 ? w.toLowerCase() : w.charAt(0).toUpperCase()+w.slice(1).toLowerCase())
      .join('');
  }
  try {
    const timestamp = Date.now();
    const bloodRes = await fetch(`/api/health-data?type=bloodMarkers&userId=${userId}&t=${timestamp}`);
    if (!bloodRes.ok) return;
    const bloodData = await bloodRes.json();
    if (!bloodData.success) return;

    const processed: ChartData['bloodMarkers'] = createEmptyBloodMarkers();

    const markerNameToKey: Record<string, keyof ChartData['bloodMarkers']> = {
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
      // add other explicit if needed
    } as any;

    bloodData.data.forEach((entry: any) => {
      const entryDate = entry.date || entry.testDate || entry.createdAt;
      if (Array.isArray(entry.markers)) {
        entry.markers.forEach((marker: any) => {
          let key = markerNameToKey[marker.name];
          if (!key) {
            const camel = toCamel(marker.name);
            if (camel in processed) key = camel as keyof ChartData['bloodMarkers'];
          }
          if (key) {
            processed[key].push({
              date: entryDate,
              value: marker.value,
              unit: marker.unit,
              referenceRange: marker.referenceRange,
            });
          }
        });
      }
    });

    update(processed);
  } catch (err) {
    console.error('Error fetching blood markers', err);
  }
}

// Fetch protocols helper
async function fetchProtocols(userId: string, update: (diet: any, workout: any, supplement: any) => void){
  try{
    const timestamp = Date.now();
    const [dietRes, workoutRes, suppRes] = await Promise.all([
      fetch(`/api/health-protocols?protocolType=diet&activeOnly=true&userId=${userId}&t=${timestamp}`),
      fetch(`/api/health-protocols?protocolType=exercise&activeOnly=true&userId=${userId}&t=${timestamp}`),
      fetch(`/api/health-protocols?protocolType=supplement&activeOnly=true&userId=${userId}&t=${timestamp}`)
    ]);
    const [dietData, workoutData, suppData] = await Promise.all([dietRes.json(), workoutRes.json(), suppRes.json()]);
    update(dietData, workoutData, suppData);
  }catch(err){console.error('Error fetching protocols',err);} 
}

// Lightweight fetch – only the data required for Home tab
async function fetchMetrics(userId: string){
  const timestamp = Date.now();
  const [heartRateRes, weightRes, bodyFatRes, hrvRes, vo2maxRes] = await Promise.all([
    fetch(`/api/health-data?type=heartRate&userId=${userId}&t=${timestamp}`),
    fetch(`/api/health-data?type=weight&userId=${userId}&t=${timestamp}`),
    fetch(`/api/health-data?type=bodyFat&userId=${userId}&t=${timestamp}`),
    fetch(`/api/health-data?type=hrv&userId=${userId}&t=${timestamp}`),
    fetch(`/api/health-data?type=vo2max&userId=${userId}&t=${timestamp}`)
  ]);
  const [heartRateData, weightData, bodyFatData, hrvData, vo2maxData] = await Promise.all([
    heartRateRes.json(), weightRes.json(), bodyFatRes.json(), hrvRes.json(), vo2maxRes.json()
  ]);
  return {
    heartRate: heartRateData.data||[], weight: weightData.data||[], bodyFat: bodyFatData.data||[], hrv: hrvData.data||[], vo2max: vo2maxData.data||[]
  };
}

async function fetchActivity(userId: string){
  const timestamp = Date.now();
  const [sleepRes, workoutRes] = await Promise.all([
    fetch(`/api/health-data?type=sleep&userId=${userId}&t=${timestamp}`),
    fetch(`/api/health-data?type=workout&userId=${userId}&t=${timestamp}`)
  ]);
  return Promise.all([sleepRes.json(), workoutRes.json()]);
}

export default function Home() {
  const { data: session, status } = useSession();
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  // Get userId from path parameter or search parameter or session
  const routeUserId = params?.userId;
  const queryUserId = searchParams?.get('userId');
  
  // Check if routeUserId starts with "userId=" and extract the actual ID if needed
  const extractedUserId = routeUserId?.startsWith('userId=') 
    ? routeUserId.substring(7) 
    : routeUserId;
  
  // Use the first available ID source
  const userId = queryUserId || extractedUserId || session?.user?.id;
  
  const [data, setData] = useState<ChartData>({
    heartRate: [],
    weight: [],
    bodyFat: [],
    hrv: [],
    vo2max: [],
    bloodMarkers: {
      // Initialize all marker arrays
      totalCholesterol: [], ldl: [], hdl: [], triglycerides: [], apoB: [], lpA: [],
      whiteBloodCells: [], redBloodCells: [], hematocrit: [], hemoglobin: [], platelets: [],
      neutrophilCount: [], neutrophilPercentage: [], lymphocyteCount: [], lymphocytePercentage: [],
      monocyteCount: [], monocytePercentage: [], eosinophilCount: [], eosinophilPercentage: [],
      basophilCount: [], basophilPercentage: [], mcv: [], mch: [], mchc: [], rdw: [], mpv: [],
      hba1c: [], fastingInsulin: [], glucose: [],
      alt: [], ast: [], ggt: [],
      egfr: [], cystatinC: [], bun: [], creatinine: [], albumin: [],
      testosterone: [], freeTesto: [], estradiol: [], shbg: [],
      t3: [], t4: [], tsh: [],
      vitaminD: [], vitaminB12: [], folate: [], iron: [],
      magnesium: [], rbcMagnesium: [],
      crp: [], homocysteine: [],
      igf1: [],
      ferritin: [], serumIron: [], tibc: [], transferrinSaturation: [],
      sodium: [], potassium: [], calcium: [], phosphorus: [],
      bicarbonate: [], chloride: [],
      creatineKinase: [], cortisol: [],
      biologicalAge: []
    },
    loading: true
  });
  const [error, setError] = useState<string | null>(null);
  const [isRevlyExpanded, setIsRevlyExpanded] = useState(false);
  const [weightTimeRange, setWeightTimeRange] = useState<TimeRange>('last1year');
  const [bodyFatTimeRange, setBodyFatTimeRange] = useState<TimeRange>('last1year');
  const [hrvTimeRange, setHrvTimeRange] = useState<TimeRange>('last1year');
  const [vo2maxTimeRange, setVo2maxTimeRange] = useState<TimeRange>('last1year');
  const [dateRange, setDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });
  const [activeTab, setActiveTab] = useState<'home' | 'metrics' | 'blood' | 'protocols'>('home');
  const [isAddResultsModalOpen, setIsAddResultsModalOpen] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [currentDietProtocol, setCurrentDietProtocol] = useState<HealthProtocol | null>(null);
  const [currentWorkoutProtocol, setCurrentWorkoutProtocol] = useState<HealthProtocol | null>(null);
  const [currentSupplementProtocol, setCurrentSupplementProtocol] = useState<HealthProtocol | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<{ name: string; data: BloodMarker[] } | null>(null);
  const [showMarkerDetailModal, setShowMarkerDetailModal] = useState(false);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [metricsLoaded, setMetricsLoaded] = useState(false);
  const [activityLoaded, setActivityLoaded] = useState(false);
  const [protocolsLoaded, setProtocolsLoaded] = useState(false);

  // Handle blood marker click
  const handleMarkerClick = (markerName: string, markerData: BloodMarker[]) => {
    if (markerData.length > 0) {
      setSelectedMarker({ name: markerName, data: markerData });
      setShowMarkerDetailModal(true);
    }
  };

  // Add useEffect for title update
  useEffect(() => {
    if (userData?.name) {
      document.title = `${userData.name}'s Health Stats`;
    } else {
      document.title = 'Health Stats';
    }
  }, [userData?.name]);

  // Listen for health data deletion events
  useEffect(() => {
    if (!session?.user?.id) return;
    
    const handleHealthDataDeleted = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.type) {
        const deletedMetricType = customEvent.detail.type as string;
        console.log(`Health data deletion detected for: ${deletedMetricType}`);
        
        // Clear the specific metric data in state
        setData(prevData => {
          const updatedData = { ...prevData };
          
          // Clear the deleted metric type data
          if (Object.hasOwnProperty.call(updatedData, deletedMetricType)) {
            (updatedData as any)[deletedMetricType] = [];
          }
          
          return updatedData;
        });
      }
    };
    
    window.addEventListener('healthDataDeleted', handleHealthDataDeleted);
    
    return () => {
      window.removeEventListener('healthDataDeleted', handleHealthDataDeleted);
    };
  }, [session?.user?.id]);

  // Auto-expand Revly component on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100 && !isRevlyExpanded) {
        setIsRevlyExpanded(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isRevlyExpanded]);

  const fetchData = async () => {
    try {
      setError(null);
      if (!userId) {
        console.error('No userId available');
        setError('User ID is required to view health data');
        return {
          heartRate: [],
          weight: [],
          bodyFat: [],
          hrv: [],
          vo2max: [],
          bloodMarkers: {
            // Initialize all marker arrays
            totalCholesterol: [], ldl: [], hdl: [], triglycerides: [], apoB: [], lpA: [],
            whiteBloodCells: [], redBloodCells: [], hematocrit: [], hemoglobin: [], platelets: [],
            neutrophilCount: [], neutrophilPercentage: [], lymphocyteCount: [], lymphocytePercentage: [],
            monocyteCount: [], monocytePercentage: [], eosinophilCount: [], eosinophilPercentage: [],
            basophilCount: [], basophilPercentage: [], mcv: [], mch: [], mchc: [], rdw: [], mpv: [],
            hba1c: [], fastingInsulin: [], glucose: [],
            alt: [], ast: [], ggt: [],
            egfr: [], cystatinC: [], bun: [], creatinine: [], albumin: [],
            testosterone: [], freeTesto: [], estradiol: [], shbg: [],
            t3: [], t4: [], tsh: [],
            vitaminD: [], vitaminB12: [], folate: [], iron: [],
            magnesium: [], rbcMagnesium: [],
            crp: [], homocysteine: [],
            igf1: [],
            ferritin: [], serumIron: [], tibc: [], transferrinSaturation: [],
            sodium: [], potassium: [], calcium: [], phosphorus: [],
            bicarbonate: [], chloride: [],
            creatineKinase: [], cortisol: [],
            biologicalAge: []
          }
        };
      }

      // Add timestamp to each request to prevent caching
      const timestamp = Date.now();
      
      // Fetch health data
      const [
        heartRateRes,
        weightRes,
        bodyFatRes,
        hrvRes,
        vo2maxRes,
        bloodMarkersRes
      ] = await Promise.all([
        fetch(`/api/health-data?type=heartRate&userId=${userId}&t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }),
        fetch(`/api/health-data?type=weight&userId=${userId}&t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }),
        fetch(`/api/health-data?type=bodyFat&userId=${userId}&t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }),
        fetch(`/api/health-data?type=hrv&userId=${userId}&t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }),
        fetch(`/api/health-data?type=vo2max&userId=${userId}&t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }),
        fetch(`/api/health-data?type=bloodMarkers&userId=${userId}&t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
      ]);

      // Fetch sleep data separately
      const sleepRes = await fetch(`/api/health-data?type=sleep&userId=${userId}&t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      // Fetch workout data separately
      const workoutRes = await fetch(`/api/health-data?type=workout&userId=${userId}&t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      // Fetch current diet protocol
      const dietProtocolRes = await fetch(`/api/health-protocols?protocolType=diet&activeOnly=true&userId=${userId}&t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      // Fetch current workout protocol
      const workoutProtocolRes = await fetch(`/api/health-protocols?protocolType=exercise&activeOnly=true&userId=${userId}&t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      // Fetch current supplement protocol
      const supplementProtocolRes = await fetch(`/api/health-protocols?protocolType=supplement&activeOnly=true&userId=${userId}&t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      // Check if any request failed
      const failedRequests = [];
      if (!heartRateRes.ok) failedRequests.push('heartRate');
      if (!weightRes.ok) failedRequests.push('weight');
      if (!bodyFatRes.ok) failedRequests.push('bodyFat');
      if (!hrvRes.ok) failedRequests.push('hrv');
      if (!vo2maxRes.ok) failedRequests.push('vo2max');
      if (!bloodMarkersRes.ok) failedRequests.push('bloodMarkers');
      if (!sleepRes.ok) failedRequests.push('sleep');
      if (!workoutRes.ok) failedRequests.push('workout');
      if (!dietProtocolRes.ok) failedRequests.push('dietProtocol');
      if (!workoutProtocolRes.ok) failedRequests.push('workoutProtocol');
      if (!supplementProtocolRes.ok) failedRequests.push('supplementProtocol');

      if (failedRequests.length > 0) {
        console.error('Failed requests:', failedRequests);
        throw new Error(`Failed to fetch: ${failedRequests.join(', ')}`);
      }

      const responses = await Promise.all([
        heartRateRes.json(),
        weightRes.json(),
        bodyFatRes.json(),
        hrvRes.json(),
        vo2maxRes.json(),
        bloodMarkersRes.json(),
        sleepRes.json(),
        workoutRes.json()
      ]);

      const [heartRateData, weightData, bodyFatData, hrvData, vo2maxData, bloodMarkersData, sleepResponse, workoutResponse] = responses;

      // Parse diet protocol response
      const dietProtocolResponse = await dietProtocolRes.json();

      // Parse workout protocol response
      const workoutProtocolResponse = await workoutProtocolRes.json();

      // Parse supplement protocol response
      const supplementProtocolResponse = await supplementProtocolRes.json();

      const failedData = [];
      if (!heartRateData.success) failedData.push('heartRate');
      if (!weightData.success) failedData.push('weight');
      if (!bodyFatData.success) failedData.push('bodyFat');
      if (!hrvData.success) failedData.push('hrv');
      if (!vo2maxData.success) failedData.push('vo2max');
      if (!bloodMarkersData.success) failedData.push('bloodMarkers');
      if (!sleepResponse.success) failedData.push('sleep');
      if (!workoutResponse.success) failedData.push('workout');
      if (!dietProtocolResponse.success) failedData.push('dietProtocol');
      if (!workoutProtocolResponse.success) failedData.push('workoutProtocol');
      if (!supplementProtocolResponse.success) failedData.push('supplementProtocol');

      if (failedData.length > 0) {
        console.error('Failed data:', failedData);
        throw new Error(`Failed to process: ${failedData.join(', ')}`);
      }

      // Process blood markers data
      const processedBloodMarkers: ChartData['bloodMarkers'] = {
        // Initialize all marker arrays
        totalCholesterol: [], ldl: [], hdl: [], triglycerides: [], apoB: [], lpA: [],
        whiteBloodCells: [], redBloodCells: [], hematocrit: [], hemoglobin: [], platelets: [],
        neutrophilCount: [], neutrophilPercentage: [], lymphocyteCount: [], lymphocytePercentage: [],
        monocyteCount: [], monocytePercentage: [], eosinophilCount: [], eosinophilPercentage: [],
        basophilCount: [], basophilPercentage: [], mcv: [], mch: [], mchc: [], rdw: [], mpv: [],
        hba1c: [], fastingInsulin: [], glucose: [],
        alt: [], ast: [], ggt: [],
        egfr: [], cystatinC: [], bun: [], creatinine: [], albumin: [],
        testosterone: [], freeTesto: [], estradiol: [], shbg: [],
        t3: [], t4: [], tsh: [],
        vitaminD: [], vitaminB12: [], folate: [], iron: [],
        magnesium: [], rbcMagnesium: [],
        crp: [], homocysteine: [],
        igf1: [],
        ferritin: [], serumIron: [], tibc: [], transferrinSaturation: [],
        sodium: [], potassium: [], calcium: [], phosphorus: [],
        bicarbonate: [], chloride: [],
        creatineKinase: [], cortisol: [],
        biologicalAge: []
      };

      // Map marker names from API to chart data keys
      const markerNameToKey: Record<string, keyof ChartData['bloodMarkers']> = {
        'Total Cholesterol': 'totalCholesterol',
        'LDL Cholesterol': 'ldl',
        'LDL-C': 'ldl',          // Added hyphenated version
        'HDL Cholesterol': 'hdl',
        'HDL-C': 'hdl',          // Added hyphenated version
        'Triglycerides': 'triglycerides',
        'ApoB': 'apoB',
        'Lp(a)': 'lpA',
        'White Blood Cell Count': 'whiteBloodCells',
        'White Blood Cells': 'whiteBloodCells', // Alternative naming
        'WBC': 'whiteBloodCells', // Alternative naming
        'Red Blood Cell Count': 'redBloodCells',
        'Red Blood Cells': 'redBloodCells', // Alternative naming
        'RBC': 'redBloodCells', // Alternative naming
        'Hematocrit': 'hematocrit',
        'HCT': 'hematocrit', // Alternative naming
        'Hemoglobin': 'hemoglobin',
        'HGB': 'hemoglobin', // Alternative naming
        'Platelet Count': 'platelets',
        'Platelets': 'platelets', // Alternative naming
        
        // CBC Differentials
        'Neutrophil Count': 'neutrophilCount',
        'Neutrophils Count': 'neutrophilCount',
        'Neutrophil Percentage': 'neutrophilPercentage',
        'Neutrophils Percentage': 'neutrophilPercentage',
        'Neutrophil %': 'neutrophilPercentage',
        'Neutrophils %': 'neutrophilPercentage',
        'Lymphocyte Count': 'lymphocyteCount',
        'Lymphocytes Count': 'lymphocyteCount',
        'Lymphocyte Percentage': 'lymphocytePercentage',
        'Lymphocytes Percentage': 'lymphocytePercentage',
        'Lymphocyte %': 'lymphocytePercentage',
        'Lymphocytes %': 'lymphocytePercentage',
        'Monocyte Count': 'monocyteCount',
        'Monocytes Count': 'monocyteCount',
        'Monocyte Percentage': 'monocytePercentage',
        'Monocytes Percentage': 'monocytePercentage',
        'Monocyte %': 'monocytePercentage',
        'Monocytes %': 'monocytePercentage',
        'Eosinophil Count': 'eosinophilCount',
        'Eosinophils Count': 'eosinophilCount',
        'Eosinophil Percentage': 'eosinophilPercentage',
        'Eosinophils Percentage': 'eosinophilPercentage',
        'Eosinophil %': 'eosinophilPercentage',
        'Eosinophils %': 'eosinophilPercentage',
        'Basophil Count': 'basophilCount',
        'Basophils Count': 'basophilCount',
        'Basophil Percentage': 'basophilPercentage',
        'Basophils Percentage': 'basophilPercentage',
        'Basophil %': 'basophilPercentage',
        'Basophils %': 'basophilPercentage',
        
        // Red Blood Cell Indices
        'MCV': 'mcv',
        'Mean Corpuscular Volume': 'mcv',
        'MCH': 'mch',
        'Mean Corpuscular Hemoglobin': 'mch',
        'MCHC': 'mchc',
        'Mean Corpuscular Hemoglobin Concentration': 'mchc',
        'RDW': 'rdw',
        'Red Cell Distribution Width': 'rdw',
        'MPV': 'mpv',
        'Mean Platelet Volume': 'mpv',
        
        'HbA1c': 'hba1c',
        'A1C': 'hba1c', // Alternative naming
        'Hemoglobin A1C': 'hba1c', // Alternative naming
        'Fasting Insulin': 'fastingInsulin',
        'Insulin': 'fastingInsulin', // Alternative naming
        'Glucose': 'glucose',
        'Fasting Glucose': 'glucose', // Alternative naming
        'ALT (SGPT)': 'alt',
        'ALT': 'alt', // Alternative naming
        'SGPT': 'alt', // Alternative naming
        'AST (SGOT)': 'ast',
        'AST': 'ast', // Alternative naming
        'SGOT': 'ast', // Alternative naming
        'GGT': 'ggt',
        'eGFR': 'egfr',
        'Cystatin C': 'cystatinC',
        'Blood Urea Nitrogen': 'bun',
        'BUN': 'bun', // Alternative naming
        'Creatinine': 'creatinine',
        'Albumin': 'albumin',
        'Testosterone': 'testosterone',
        'Free Testosterone': 'freeTesto',
        'Free testosterone': 'freeTesto', // Alternative with lowercase 't'
        'Estradiol': 'estradiol',
        'SHBG': 'shbg',
        'Free T3': 't3',
        'T3': 't3', // Alternative naming
        'Free T4': 't4',
        'T4': 't4', // Alternative naming
        'Thyroid Stimulating Hormone (TSH)': 'tsh',
        'TSH': 'tsh', // Alternative naming
        
        // Vitamins & Minerals
        'Vitamin D, 25-Hydroxy': 'vitaminD',
        'Vitamin D': 'vitaminD', // Alternative naming
        'Vitamin D3': 'vitaminD', // Alternative naming
        'Vitamin B12': 'vitaminB12',
        'B12': 'vitaminB12',
        'Folate': 'folate',
        'Folic Acid': 'folate',
        'Iron': 'iron',
        'Serum Iron': 'serumIron',
        'Iron, Serum': 'serumIron',
        'Magnesium': 'magnesium',
        'RBC Magnesium': 'rbcMagnesium',
        
        'hs-CRP': 'crp',
        'CRP': 'crp', // Alternative naming
        'hsCRP': 'crp', // Alternative naming without hyphen
        'Homocysteine': 'homocysteine',
        'IGF-1': 'igf1',
        'Ferritin': 'ferritin',
        'TIBC': 'tibc',
        'Total Iron Binding Capacity': 'tibc',
        'Transferrin Saturation': 'transferrinSaturation',
        'Transferrin Sat': 'transferrinSaturation',
        'Transferrin Sat.': 'transferrinSaturation',
        'Transferrin saturation': 'transferrinSaturation',
        
        'Sodium': 'sodium',
        'Potassium': 'potassium',
        'Calcium': 'calcium',
        'Phosphorus': 'phosphorus',
        'Carbon Dioxide': 'bicarbonate',
        'Bicarbonate': 'bicarbonate', // Alternative naming
        'Chloride': 'chloride',
        
        // Additional markers
        'Creatine Kinase': 'creatineKinase',
        'Creatine kinase': 'creatineKinase',
        'CK': 'creatineKinase',
        'Cortisol': 'cortisol',
        
        // Longevity Markers
        'Biological Age': 'biologicalAge'
      };

      // Process each blood marker entry
      bloodMarkersData.data.forEach((entry: any) => {
        entry.markers.forEach((marker: any) => {
          const key = markerNameToKey[marker.name];
          if (key) {
            // Convert key to config key format
            const configKey = marker.name.toLowerCase()
              .replace(/-/g, '')
              .replace(/[()]/g, '')
              .replace(/\s+/g, '') as keyof typeof BLOOD_MARKER_CONFIG;

            // Use centralized reference ranges
            const centralizedRanges = getReferenceRanges(marker.name);
            
            processedBloodMarkers[key].push({
              date: entry.date,
              value: marker.value,
              unit: marker.unit,
              referenceRange: {
                min: centralizedRanges.optimalMin,
                max: centralizedRanges.optimalMax
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
        
        // Initialize time ranges with default values
        setWeightTimeRange('last1year');
        setBodyFatTimeRange('last1year');
        setHrvTimeRange('last1year');
        setVo2maxTimeRange('last1year');
      }

      // Process sleep and workout data for activity feed
      console.log('Sleep response:', sleepResponse);
      console.log('Workout response:', workoutResponse);
      
      let activityFeedItems: ActivityFeedItem[] = [];
      
      // Process sleep data if available
      if (sleepResponse.success && sleepResponse.data) {
        console.log('Raw sleep data:', sleepResponse.data);
        const sleepEntries = sleepResponse.data.map((entry: any) => {
          console.log('Processing sleep entry:', entry);
          
          // Ensure stageDurations exists with default values
          const stageDurations = entry.data.stageDurations || {
            deep: 0,
            core: 0,
            rem: 0,
            awake: 0
          };
          
          // Calculate total sleep time (excluding awake time)
          const totalSleepMinutes = 
            (stageDurations.deep || 0) +
            (stageDurations.core || 0) +
            (stageDurations.rem || 0);
          
          const totalSleepHours = totalSleepMinutes / 60;
          
          // Calculate percentages for each stage
          const totalTime = totalSleepMinutes + (stageDurations.awake || 0);
          const sleepStages = Object.entries(stageDurations).reduce((acc, [stage, duration]) => {
            const hours = Math.floor((duration as number) / 60);
            const minutes = Math.round((duration as number) % 60);
            const percentage = totalTime > 0 ? Math.round(((duration as number) / totalTime) * 100) : 0;
            
            acc[stage] = {
              percentage,
              duration: `${hours}h ${minutes}m`
            };
            return acc;
          }, {} as Record<string, { percentage: number; duration: string }>);

          const sleepEntry = {
            id: entry.timestamp || new Date(entry.data.startDate).toISOString(),
            type: 'sleep' as const,
            startTime: entry.data.startDate,
            endTime: entry.data.endDate,
            title: `${Math.floor(totalSleepHours)}h ${Math.round((totalSleepHours % 1) * 60)}m`,
            subtitle: 'Time asleep',
            metrics: {
              'Deep sleep': sleepStages.deep.duration,
              'Core sleep': sleepStages.core.duration,
              'REM sleep': sleepStages.rem.duration,
              'Awake': sleepStages.awake.duration
            },
            sleepStages
          };
          
          return sleepEntry;
        });
        
        activityFeedItems = [...sleepEntries];
      } else {
        console.log('No sleep data available or failed to fetch');
      }
      
      // Add workout entries if available
      if (workoutResponse.success && workoutResponse.data) {
        console.log('Raw workout data:', workoutResponse.data);
        
        const workoutEntries = workoutResponse.data.map((entry: any) => {
          console.log('Processing workout entry:', entry);
          
          // Format duration in minutes
          const durationInSeconds = entry.data.metrics?.duration || 0;
          const durationInMinutes = Math.floor(durationInSeconds / 60);
          const hours = Math.floor(durationInMinutes / 60);
          const minutes = durationInMinutes % 60;
          const formattedDuration = hours > 0 
            ? `${hours}h ${minutes}m`
            : `${minutes}m`;
            
          // Format distance in miles with 1 decimal place
          const distanceInKm = entry.data.metrics?.distance;
          const distanceInMiles = distanceInKm 
            ? `${(distanceInKm * 0.621371).toFixed(1)} mi`
            : undefined;
            
          // Format energy burned
          const energyBurned = entry.data.metrics?.energyBurned
            ? `${Math.round(entry.data.metrics.energyBurned)} cal`
            : undefined;
            
          // Format heart rate
          const avgHeartRate = entry.data.metrics?.avgHeartRate
            ? `${Math.round(entry.data.metrics.avgHeartRate)} bpm`
            : undefined;
            
          // Format pace if available
          const avgPace = entry.data.metrics?.avgPace
            ? formatPace(entry.data.metrics.avgPace)
            : undefined;
            
          // Format activity type for title
          const activityName = entry.data.activityType
            .replace(/_/g, ' ')
            .split(' ')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          // Collect metrics
          const metrics: Record<string, string> = {};
          if (formattedDuration) metrics['Duration'] = formattedDuration;
          if (distanceInMiles) metrics['Distance'] = distanceInMiles;
          if (avgHeartRate) metrics['Avg Heart Rate'] = avgHeartRate;
          if (avgPace) metrics['Pace'] = avgPace;

          // Create workout activity feed item
          const workoutEntry: ActivityFeedItem = {
            id: entry.timestamp || new Date(entry.data.startDate).toISOString(),
            type: 'workout',
            startTime: entry.data.startDate,
            endTime: entry.data.endDate,
            title: activityName,
            subtitle: formattedDuration,
            metrics,
            activityType: entry.data.activityType
          };
          
          return workoutEntry;
        });
        
        activityFeedItems = [...activityFeedItems, ...workoutEntries];
      }
      
      // Sort all activity feed items by date (newest first)
      activityFeedItems.sort((a, b) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
      
      setActivityFeed(activityFeedItems);
      setCurrentDietProtocol(dietProtocolResponse.data && dietProtocolResponse.data.length > 0 ? dietProtocolResponse.data[0] : null);
      setCurrentWorkoutProtocol(workoutProtocolResponse.data && workoutProtocolResponse.data.length > 0 ? workoutProtocolResponse.data[0] : null);
      setCurrentSupplementProtocol(supplementProtocolResponse.data && supplementProtocolResponse.data.length > 0 ? supplementProtocolResponse.data[0] : null);

      return {
        heartRate: heartRateData.data || [],
        weight: weightData.data || [],
        bodyFat: bodyFatData.data || [],
        hrv: hrvData.data || [],
        vo2max: vo2maxData.data || [],
        bloodMarkers: {
          ...processedBloodMarkers,
          biologicalAge: processedBloodMarkers.biologicalAge || []
        },
        loading: false
      };
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch health data');
      return {
        heartRate: [],
        weight: [],
        bodyFat: [],
        hrv: [],
        vo2max: [],
        bloodMarkers: {
          totalCholesterol: [], ldl: [], hdl: [], triglycerides: [], apoB: [], lpA: [],
          whiteBloodCells: [], redBloodCells: [], hematocrit: [], hemoglobin: [], platelets: [],
          neutrophilCount: [], neutrophilPercentage: [], lymphocyteCount: [], lymphocytePercentage: [],
          monocyteCount: [], monocytePercentage: [], eosinophilCount: [], eosinophilPercentage: [],
          basophilCount: [], basophilPercentage: [], mcv: [], mch: [], mchc: [], rdw: [], mpv: [],
          hba1c: [], fastingInsulin: [], glucose: [],
          alt: [], ast: [], ggt: [],
          egfr: [], cystatinC: [], bun: [], creatinine: [], albumin: [],
          testosterone: [], freeTesto: [], estradiol: [], shbg: [],
          t3: [], t4: [], tsh: [],
          vitaminD: [], vitaminB12: [], folate: [], iron: [],
          magnesium: [], rbcMagnesium: [],
          crp: [], homocysteine: [],
          igf1: [],
          ferritin: [], serumIron: [], tibc: [], transferrinSaturation: [],
          sodium: [], potassium: [], calcium: [], phosphorus: [],
          bicarbonate: [], chloride: [],
          creatineKinase: [], cortisol: [],
          biologicalAge: []
        }
      };
    }
  };

  const loadData = async () => {
    if (!userId) return;
    setMetricsLoaded(false);
    setActivityLoaded(false);
    setData(prev=>({...prev, loading:true}));
    try{
      // fetch metrics first
      const metricRes = await fetchMetrics(userId);
      setData(prev=>({
        ...prev,
        ...metricRes,
        loading:false
      }));
      setMetricsLoaded(true);

      // activity in background
      const [sleepResponse, workoutResponse] = await fetchActivity(userId);
      // reuse existing activity processing code by creating helper processActivity
      const activityFeedArr = buildActivityFeed(sleepResponse, workoutResponse);
      setActivityFeed(activityFeedArr);
      setActivityLoaded(true);
      // after this test
      setHasLoadedData(true);
      // blood markers and protocols already triggered earlier
      fetchBloodMarkers(userId,bm=> setData(prev=>({...prev, bloodMarkers: bm})));
      fetchProtocols(userId,(diet,workout,supp)=>{
        if(diet?.success){
          setCurrentDietProtocol(diet.data?.[0]||null);
        }
        if(workout?.success){
          setCurrentWorkoutProtocol(workout.data?.[0]||null);
        }
        if(supp?.success){
          setCurrentSupplementProtocol(supp.data?.[0]||null);
        }
        setProtocolsLoaded(true);
      });
    } catch(err){console.error(err); setHasLoadedData(true);}  
  };

  useEffect(() => {
    if (status === 'loading') return;
    
    // Only redirect if there's no session and no userId parameter
    if (!session?.user && !userId) {
      router.push('/auth/signin');
      return;
    }

    loadData();
  }, [session?.user, status, userId, router]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (userId) {
        try {
          // Fetch user data from API
          const response = await fetch(`/api/users/${userId}`);
          const data = await response.json();
          
          if (data.success) {
            // Validate profileImage URL before setting in state
            if (data.user.profileImage) {
              try {
                // Test if the URL is valid
                new URL(data.user.profileImage);
              } catch (error) {
                // If URL is invalid, remove it
                console.error('Invalid profile image URL:', data.user.profileImage);
                data.user.profileImage = null;
              }
            }
            
            setUserData(data.user);
          } else {
            console.error('Failed to fetch user data:', data.error);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, [userId]);

  // Add this useEffect after the existing useEffect declarations
  useEffect(() => {
    // Refresh user data (including presigned URL) every 45 minutes
    const interval = setInterval(() => {
      if (userId) {
        fetch(`/api/users/${userId}`)
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              setUserData(data.user);
            }
          })
          .catch(console.error);
      }
    }, 45 * 60 * 1000); // 45 minutes

    return () => clearInterval(interval);
  }, [userId]);

  // ... existing code ...
  useEffect(() => {
    // Set initial state based on data range
    if (dateRange.start && dateRange.end) {
      // Initialize with default time ranges
      setWeightTimeRange('last1year');
      setBodyFatTimeRange('last1year');
      setHrvTimeRange('last1year');
      setVo2maxTimeRange('last1year');
      
      // No longer setting date variables as they have been removed
    }
  }, [dateRange.start, dateRange.end]);
  // ... existing code ...

  // Add the getTimeRangeData function inside the component, e.g., after dateRange is defined
  const getTimeRangeData = (data: HealthData[], timeRange: TimeRange) => {
    if (!data.length) return [];
    
    // Sort data by date in ascending order
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Current date for comparison
    const now = new Date();
    let startDate: Date;
    let aggregationType: 'daily' | 'weekly' | 'monthly' = 'daily';
    
    // Calculate start date based on selected time range
    switch (timeRange) {
      case 'last30days':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        aggregationType = 'daily';
        break;
      case 'last3months':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 3);
        aggregationType = 'weekly';
        break;
      case 'last6months':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 6);
        aggregationType = 'weekly';
        break;
      case 'last1year':
        startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 1);
        aggregationType = 'monthly';
        break;
      case 'last3years':
        startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 3);
        aggregationType = 'monthly';
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        aggregationType = 'daily';
    }
    
    // Filter data based on start date
    const filteredData = sortedData.filter(item => new Date(item.date) >= startDate);
    
    // If no data points in the range, return empty array
    if (filteredData.length === 0) return [];
    
    // For daily view (30 days), return the raw data points
    if (aggregationType === 'daily') {
      // Ensure we have at most one data point per day
      const dailyData = new Map<string, { data: HealthData; count: number }>();
      
      filteredData.forEach(item => {
        const dateKey = new Date(item.date).toISOString().split('T')[0];
        if (!dailyData.has(dateKey)) {
          dailyData.set(dateKey, { 
            data: { ...item, value: Number(item.value.toFixed(2)) }, 
            count: 1 
          });
        } else {
          const existing = dailyData.get(dateKey)!;
          // Average the values and round to 2 decimal places
          const newValue = (existing.data.value * existing.count + item.value) / (existing.count + 1);
          existing.data.value = Number(newValue.toFixed(2));
          existing.count += 1;
        }
      });
      
      return Array.from(dailyData.entries()).map(([date, { data, count }]) => ({
        ...data,
        meta: {
          pointCount: count
        }
      })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    
    // For weekly or monthly views, use aggregation
    return aggregateData(filteredData, aggregationType);
  };
  
  // Helper function to aggregate data by week or month
  const aggregateData = (data: HealthData[], aggregationType: 'weekly' | 'monthly'): HealthData[] => {
    const groupedData = new Map<string, HealthData[]>();
    
    data.forEach(item => {
      const date = new Date(item.date);
      let key: string;
      
      if (aggregationType === 'weekly') {
        // Convert to UTC to avoid timezone issues
        const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
        // Get the week start date (Sunday) in UTC
        const dayOfWeek = utcDate.getUTCDay();
        const weekStart = new Date(utcDate);
        weekStart.setUTCDate(utcDate.getUTCDate() - dayOfWeek);
        // Use UTC date string for consistent grouping
        key = weekStart.toISOString().split('T')[0];
      } else {
        // Monthly aggregation - use YYYY-MM as key
        key = date.toISOString().slice(0, 7); // YYYY-MM format
      }
      
      if (!groupedData.has(key)) {
        groupedData.set(key, []);
      }
      
      groupedData.get(key)?.push(item);
    });
    
    // Aggregate each group to a single data point (average value)
    const aggregatedData: HealthData[] = [];
    
    groupedData.forEach((items, key) => {
      // Calculate average value for the group
      const sum = items.reduce((acc, curr) => acc + curr.value, 0);
      const avgValue = sum / items.length;
      
      // Use the middle item's date for a more representative point in time
      const middleIndex = Math.floor(items.length / 2);
      
      const aggregatedItem: HealthData = {
        date: items[middleIndex]?.date || items[0].date,
        value: Number(avgValue.toFixed(2)), // Round to 2 decimal places
        // Add metadata for tooltip
        meta: {
          aggregationType: aggregationType,
          pointCount: items.length
        }
      };
      
      aggregatedData.push(aggregatedItem);
    });
    
    // Sort aggregated data by date
    return aggregatedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };
  
  // Add the handler functions inside the component, right after the timeRange state variables
  const handleWeightTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as TimeRange;
    setWeightTimeRange(value);
  };
  
  const handleBodyFatTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as TimeRange;
    setBodyFatTimeRange(value);
  };
  
  const handleHRVTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as TimeRange;
    setHrvTimeRange(value);
  };
  
  const handleVO2MaxTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as TimeRange;
    setVo2maxTimeRange(value);
  };
  
  // Helper to convert timeRange to human-readable label
  const getTimeRangeLabel = (timeRange: TimeRange): string => {
    switch (timeRange) {
      case 'last30days':
        return 'Last 30 days';
      case 'last3months':
        return 'Last 3 months';
      case 'last6months':
        return 'Last 6 months';
      case 'last1year':
        return 'Last year';
      case 'last3years':
        return 'Last 3 years';
      default:
        return 'Last 3 months';
    }
  };
  
  // Update the data variables to use the new function
  const currentHeartRateData = getTimeRangeData(data.heartRate, weightTimeRange);
  const currentWeightData = getTimeRangeData(data.weight, weightTimeRange);
  const currentBodyFatData = getTimeRangeData(data.bodyFat, bodyFatTimeRange);
  const currentHRVData = getTimeRangeData(data.hrv, hrvTimeRange);
  const currentVO2MaxData = getTimeRangeData(data.vo2max, vo2maxTimeRange);
  
  // Helper formatter for tick labels based on time range
  const getTickFormatter = (timeRange: TimeRange) => (date: string) => {
    const d = new Date(date);
    
    switch (timeRange) {
      case 'last30days':
        return d.toLocaleString('default', { day: 'numeric' });
      case 'last3months':
      case 'last6months':
        return d.toLocaleString('default', { month: 'short', day: 'numeric' });
      case 'last1year':
      case 'last3years':
        return d.toLocaleString('default', { month: 'short', year: '2-digit' });
      default:
        return d.toLocaleString('default', { month: 'short', day: 'numeric' });
    }
  };
  
  // Helper formatter for tooltip labels based on time range
  const getTooltipFormatter = (timeRange: TimeRange) => (value: string) => {
    const d = new Date(value);
    
    switch (timeRange) {
      case 'last30days':
        return d.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });
      case 'last3months':
      case 'last6months':
        return d.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });
      case 'last1year':
      case 'last3years':
        return d.toLocaleString('default', { month: 'long', year: 'numeric' });
      default:
        return d.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' });
    }
  };

  // Custom tooltip formatter to show aggregation info
  const renderCustomTooltip = ({ active, payload, label, timeRange }: { 
    active?: boolean; 
    payload?: any[]; 
    label?: string; 
    timeRange: TimeRange;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const dateFormatter = getTooltipFormatter(timeRange);
      const formattedDate = dateFormatter(data.date);
      
      // Show aggregation info if present
      const aggregationInfo = data.meta?.aggregationType ? 
        `(${data.meta.aggregationType === 'weekly' ? 'Weekly' : 'Monthly'} average of ${data.meta.pointCount} readings)` :
        data.meta?.pointCount ? `(Daily average of ${data.meta.pointCount} readings)` : '';
      
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded shadow-md border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-300 mb-1">{formattedDate}</p>
          <p className="font-medium text-gray-900 dark:text-white">
            {payload[0].value} {payload[0].unit || ''}
          </p>
          {aggregationInfo && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {aggregationInfo}
            </p>
          )}
        </div>
      );
    }
    
    return null;
  };

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

  // Only show full skeleton if we don't have session data yet
  if (status === 'loading' && !session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto space-y-8 px-4">
          {/* Profile header skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 sm:px-6 py-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full flex-shrink-0" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="flex-shrink-0">
                <Skeleton className="h-9 w-20 rounded-md" />
              </div>
            </div>
          </div>

          {/* Metric cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>

          {/* Activity feed skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Add error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          {error === 'Please sign in to view your health data' && (
            <button
              onClick={() => redirect('/auth/signin')}
              className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    );
  }

  // Add this helper function before the render function or with other utilities
  const getAdaptiveYAxisDomain = (data: HealthData[], metricType: 'weight' | 'hrv' | 'vo2max' | 'bodyFat'): [number, number] => {
    if (!data || data.length <= 1) {
      return [0, 100]; // Default domain if no data
    }
    
    // Get min and max values
    const values = data.map(item => item.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    
    // Calculate standard deviation to understand data variation
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Set min/max padding based on data variation
    // If variation is very small, increase the padding to make changes more visible
    let minPadding, maxPadding;
    
    // Different metrics need different scaling approaches
    if (metricType === 'bodyFat') {
      // Body fat typically has small percentage variations that are significant
      minPadding = range < 2 ? Math.max(0.5, stdDev * 2) : range * 0.1;
      maxPadding = range < 2 ? Math.max(0.5, stdDev * 2) : range * 0.1;
    } else if (metricType === 'weight') {
      // Weight typically has small variations that are significant
      minPadding = range < 5 ? Math.max(1, stdDev * 2) : range * 0.1;
      maxPadding = range < 5 ? Math.max(1, stdDev * 2) : range * 0.1;
    } else if (metricType === 'vo2max') {
      // VO2 Max typically has small variations that are significant
      minPadding = range < 3 ? Math.max(0.5, stdDev * 2) : range * 0.1;
      maxPadding = range < 3 ? Math.max(0.5, stdDev * 2) : range * 0.1;
    } else if (metricType === 'hrv') {
      // HRV can have larger variations
      minPadding = range < 10 ? Math.max(2, stdDev) : range * 0.1;
      maxPadding = range < 10 ? Math.max(2, stdDev) : range * 0.1;
    } else {
      // Default approach
      minPadding = range * 0.1;
      maxPadding = range * 0.1;
    }
    
    // Ensure we don't go below zero for metrics that can't be negative
    const lowerBound = metricType === 'bodyFat' || metricType === 'weight' || metricType === 'vo2max' 
      ? Math.max(0, min - minPadding)
      : min - minPadding;
    
    return [lowerBound, max + maxPadding];
  };

  return (
    <>
      <Head>
        <title>{userData?.name ? `${userData.name}'s Health Stats` : 'Health Stats'}</title>
      </Head>
      <Toaster position="bottom-left" />
      <main className="min-h-screen px-4 sm:px-8 py-8 bg-gray-50 dark:bg-gray-900">
        {/* Theme Toggle */}
        <div className="fixed bottom-4 right-4 z-[100]">
          <ThemeToggle />
        </div>
        
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 sm:px-6 py-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              {userId === session?.user?.id ? (
                <>
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                    {userData?.profileImage ? (
                      <Image
                        src={userData.profileImage}
                        alt="Profile"
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement?.classList.add('profile-image-error');
                          console.error('Failed to load profile image');
                        }}
                      />
                    ) :
                      <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                      {userData?.name || ''}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">Health Dashboard</p>
                  </div>
                  <div className="flex-shrink-0">
                    <Link
                      href="/upload"
                      className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors duration-200"
                    >
                      Manage
                    </Link>
                  </div>
                </>
              ) : (
                <div className="flex flex-wrap items-center gap-4 w-full">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                    {userData?.profileImage ? (
                      <Image
                        src={userData.profileImage}
                        alt="Profile"
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement?.classList.add('profile-image-error');
                          console.error('Failed to load profile image');
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                      {userData?.name || ''}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Health Dashboard</p>
                      <button
                        onClick={() => {
                          const url = window.location.href;
                          navigator.clipboard.writeText(url).then(() => {
                            toast.success('Dashboard link copied to clipboard!', {
                              duration: 2000,
                              style: {
                                background: '#333',
                                color: '#fff',
                              },
                            });
                          }).catch(() => {
                            toast.error('Failed to copy link', {
                              duration: 2000,
                              style: {
                                background: '#333',
                                color: '#fff',
                              },
                            });
                          });
                        }}
                        className="inline-flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <div className="relative">
              <div className="overflow-x-auto scrollbar-hide">
                <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 min-w-max" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('home')}
                    className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === 'home'
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                    }`}
                  >
                    Home
                  </button>
                  <button
                    onClick={() => setActiveTab('metrics')}
                    className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === 'metrics'
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                    }`}
                  >
                    Fitness Metrics
                  </button>
                  <button
                    onClick={() => setActiveTab('blood')}
                    className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === 'blood'
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                    }`}
                  >
                    Blood Markers
                  </button>
                  <button
                    onClick={() => setActiveTab('protocols')}
                    className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === 'protocols'
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                    }`}
                  >
                    Protocols & Experiments
                  </button>
                </nav>
              </div>
              {/* Fade effect on the right */}
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-gray-800 to-transparent pointer-events-none rounded-r-2xl"></div>
            </div>
          </div>

          {activeTab === 'home' ? (
            <div className="space-y-6">
              {!hasLoadedData ? (
                <>
                  {/* Metric cards skeleton */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 sm:h-28 w-full" />
                    ))}
                  </div>

                  {/* Activity feed skeleton */}
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-64 w-full" />
                  </div>

                  {/* Recent activity skeleton */}
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-40" />
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                </>
              ) : (
                <>
              {/* Bio Age Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 sm:px-6 py-4 sm:py-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                    <h3 className="text-sm sm:text-lg font-medium text-gray-900 dark:text-white">Biological Age</h3>
                    <span className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {data.loading ? "..." : (() => {
                        const bioAgeData = data.bloodMarkers.biologicalAge;
                        return bioAgeData && bioAgeData.length > 0
                          ? `${bioAgeData[0].value}`
                          : "—";
                      })()}
                    </span>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 sm:px-6 py-4 sm:py-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                    <h3 className="text-sm sm:text-lg font-medium text-gray-900 dark:text-white">Age Speed</h3>
                    <span className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">—</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 sm:px-6 py-4 sm:py-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                    <h3 className="text-sm sm:text-lg font-medium text-gray-900 dark:text-white">VO2 Max</h3>
                    <span className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {data.loading ? "..." : (() => {
                        const last30DaysData = getTimeRangeData(data.vo2max, 'last30days');
                        return last30DaysData.length > 0
                          ? `${Math.round(
                              last30DaysData.reduce((sum, item) => sum + item.value, 0) /
                              last30DaysData.length
                            )}`
                          : "—";
                      })()}
                    </span>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 sm:px-6 py-4 sm:py-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                    <h3 className="text-sm sm:text-lg font-medium text-gray-900 dark:text-white">HRV</h3>
                    <span className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {data.loading ? "..." : (() => {
                        const last30DaysData = getTimeRangeData(data.hrv, 'last30days');
                        return last30DaysData.length > 0
                          ? `${Math.round(
                              last30DaysData.reduce((sum, item) => sum + item.value, 0) /
                              last30DaysData.length
                            )} ms`
                          : "—";
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Activity Feed */}
              {/* Workout Heat Map */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 sm:px-6 py-6 sm:py-8 shadow-sm mb-8">
                <WeeklyWorkoutProvider>
                  {/* Header: Title and Workout Count Pill - always in a row */}
                  <div className="flex flex-row items-center justify-between mb-8">
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white whitespace-nowrap">Workout Activity</h2>
                    <div className="flex-shrink-0">
                      <div className="flex items-center px-3 py-1.5 bg-emerald-50/50 dark:bg-emerald-900/30 rounded-full">
                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                          <WeeklyWorkoutCount />
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Heat map container */}
                  <div className="-mx-4 sm:-mx-6">
                    <div className="px-4 sm:px-6">
                      <WorkoutHeatMap workouts={activityFeed
                        .filter(item => item.type === 'workout')
                        .map(item => ({
                          data: {
                            startDate: item.startTime,
                            activityType: item.activityType || 'other',
                            metrics: {
                              duration: parseInt(item.metrics.Duration?.replace(/[^0-9]/g, '') || '0') * 60,
                              energyBurned: parseInt(item.metrics['Calories']?.replace(/[^0-9]/g, '') || '0')
                            }
                          }
                        }))}
                      />
                    </div>
                  </div>
                </WeeklyWorkoutProvider>
              </div>

              {/* Recent Activity */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl px-5 sm:px-10 py-8 shadow-sm">
                <div className="flex items-center gap-3 mb-10">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Recent activity</h2>
                </div>
                {/* Timeline container */}
                <div className="space-y-12 relative px-2">
                  {/* Timeline vertical line */}
                  <div className="absolute left-[7px] inset-y-0 w-[2px] bg-gray-200 dark:bg-gray-700" />
                  
                  {activityFeed.map((item, index) => (
                    <div key={item.id} className="flex">
                      {/* Timeline dot container */}
                      <div className="relative flex-shrink-0 w-4 mr-6">
                        <div className={`absolute -left-[5px] w-4 h-4 rounded-full z-10 ${
                          item.type === 'sleep' ? 'bg-blue-100 ring-4 ring-blue-500' :
                          item.type === 'workout' ? 'bg-green-100 ring-4 ring-green-500' :
                          'bg-orange-100 ring-4 ring-orange-500'
                        }`} />
                      </div>
                      
                      {/* Activity content */}
                      <div className="flex-grow mb-8">
                        {/* Date and Time range */}
                        <div className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                          {item.startTime && (
                            <>
                              <div className="font-medium mb-1">
                                {new Date(item.startTime).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </div>
                              <div>
                                {new Date(item.startTime).toLocaleString('en-US', { 
                                    hour: 'numeric', 
                                    minute: '2-digit',
                                    hour12: true 
                                  })} until {new Date(item.endTime || item.startTime).toLocaleString('en-US', { 
                                    hour: 'numeric', 
                                    minute: '2-digit',
                                    hour12: true 
                                  })}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Activity card */}
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-8">
                          {item.type === 'sleep' && (
                            <>
                              {/* Time asleep */}
                              <div className="mb-6">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                  <div>
                                    <div className="text-3xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                                      {item.title}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                      Time asleep
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Sleep stages */}
                              {item.sleepStages && (
                                <div className="space-y-6">
                                  <SleepStagesBar stageDurations={item.sleepStages} />
                                </div>
                              )}
                            </>
                          )}

                          {item.type === 'workout' && (
                            <div>
                              <div className="mb-5">
                                <div className="flex items-center gap-3">
                                  {(() => {
                                    // Render emoji based on activity type
                                    const activityType = item.activityType || 'default';
                                    const emojiMap: Record<string, string> = {
                                      'running': '🏃',
                                      'walking': '🚶',
                                      'cycling': '🚴',
                                      'strength_training': '🏋️',
                                      'swimming': '🏊',
                                      'hiit': '🔥',
                                      'yoga': '🧘',
                                      'pilates': '🤸',
                                      'dance': '💃',
                                      'elliptical': '⚙️',
                                      'rowing': '🚣',
                                      'stair_climbing': '🧗',
                                      'hiking': '🥾',
                                      'basketball': '🏀',
                                      'soccer': '⚽',
                                      'tennis': '🎾',
                                      'golf': '🏌️',
                                      'default': '💪'
                                    };
                                    return <span className="text-5xl mr-2">{emojiMap[activityType] || emojiMap.default}</span>;
                                  })()}
                                  <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                                      {item.title}
                                    </h3>
                                    {item.subtitle && (
                                      <div className="text-base font-medium text-gray-700 dark:text-gray-300 mt-1">
                                        {item.subtitle}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Workout details */}
                              <div className="mt-4">
                                <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
                                  {Object.entries(item.metrics).map(([key, value]) => (
                                    <div key={key} className="bg-white dark:bg-gray-700 rounded-lg p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-600">
                                      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1 truncate">{key}</div>
                                      <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{value}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {item.type === 'meal' && item.metrics && (
                            <div className="mt-4">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg text-gray-900 dark:text-white">{item.title}</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(item.metrics).map(([food, amount]) => (
                                  <span key={food} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                                    {food} ({amount})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
                </>
              )}
            </div>
          ) : activeTab === 'metrics' ? (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-6 shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">Heart Rate Variability</span>
                    <div className="mt-1.5 md:mt-2 flex flex-col md:flex-row md:items-baseline gap-1 md:gap-2">
                      <span className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                        {data.loading ? (
                          "..."
                        ) : (() => {
                          const last30DaysData = getTimeRangeData(data.hrv, 'last30days');
                          return last30DaysData.length > 0 ? (
                            `${Math.round(
                              last30DaysData.reduce((sum, item) => sum + item.value, 0) /
                              last30DaysData.length
                            )} ms`
                          ) : (
                            "No data"
                          );
                        })()}
                      </span>
                      {!data.loading && getTimeRangeData(data.hrv, 'last30days').length > 0 && (
                        <div className="flex items-center">
                          {(() => {
                            const currentPeriodData = getTimeRangeData(data.hrv, 'last30days');
                            const previousPeriodStartDate = new Date();
                            previousPeriodStartDate.setDate(previousPeriodStartDate.getDate() - 60);
                            const previousPeriodEndDate = new Date();
                            previousPeriodEndDate.setDate(previousPeriodEndDate.getDate() - 30);

                            const previousPeriodData = data.hrv.filter(item => {
                              const itemDate = new Date(item.date);
                              return itemDate >= previousPeriodStartDate && itemDate < previousPeriodEndDate;
                            });

                            if (currentPeriodData.length > 0 && previousPeriodData.length > 0) {
                              const currentAvg = currentPeriodData.reduce((sum, item) => sum + item.value, 0) / currentPeriodData.length;
                              const prevAvg = previousPeriodData.reduce((sum, item) => sum + item.value, 0) / previousPeriodData.length;
                              return (
                                <TrendIndicator current={currentAvg} previous={prevAvg} isFitnessMetric={true} />
                              );
                            }
                            return <></>; // Changed from return null
                          })()}
                        </div>
                      )}
                    </div>
                    <span className="mt-1 text-[10px] md:text-xs text-gray-500 dark:text-gray-400">Last 30 days</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-6 shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">VO2 Max</span>
                    <div className="mt-1.5 md:mt-2 flex flex-col md:flex-row md:items-baseline gap-1 md:gap-2">
                      <span className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                        {data.loading ? (
                          "..."
                        ) : (() => {
                          const last30DaysData = getTimeRangeData(data.vo2max, 'last30days');
                          return last30DaysData.length > 0 ? (
                            `${Math.round(
                              last30DaysData.reduce((sum, item) => sum + item.value, 0) /
                              last30DaysData.length
                            )}`
                          ) : (
                            "No data"
                          );
                        })()}
                      </span>
                      {!data.loading && getTimeRangeData(data.vo2max, 'last30days').length > 0 && (
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">mL/kg·min</span>
                          {(() => {
                            // Trend indicator logic might need adjustment if it also relied on slice(-30) vs slice(-60, -30)
                            // For now, this part focuses on the average display.
                            // The trend indicator below might show trend for all data if not also updated.
                            // To make trend also based on true 30-day periods:
                            const currentPeriodData = getTimeRangeData(data.vo2max, 'last30days');
                            const previousPeriodStartDate = new Date();
                            previousPeriodStartDate.setDate(previousPeriodStartDate.getDate() - 60);
                            const previousPeriodEndDate = new Date();
                            previousPeriodEndDate.setDate(previousPeriodEndDate.getDate() - 30);
                            
                            const previousPeriodData = data.vo2max.filter(item => {
                              const itemDate = new Date(item.date);
                              return itemDate >= previousPeriodStartDate && itemDate < previousPeriodEndDate;
                            });

                            if (currentPeriodData.length > 0 && previousPeriodData.length > 0) {
                              const currentAvg = currentPeriodData.reduce((sum, item) => sum + item.value, 0) / currentPeriodData.length;
                              const prevAvg = previousPeriodData.reduce((sum, item) => sum + item.value, 0) / previousPeriodData.length;
                              return (
                                <TrendIndicator current={currentAvg} previous={prevAvg} isFitnessMetric={true} />
                              );
                            }
                            return <></>; // Changed from return null
                          })()}
                        </div>
                      )}
                    </div>
                    <span className="mt-1 text-[10px] md:text-xs text-gray-500 dark:text-gray-400">Last 30 days</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-6 shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">Weight</span>
                    <div className="mt-1.5 md:mt-2 flex flex-col md:flex-row md:items-baseline gap-1 md:gap-2">
                      <span className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                        {data.loading ? (
                          "..."
                        ) : (() => {
                          const last30DaysData = getTimeRangeData(data.weight, 'last30days');
                          return last30DaysData.length > 0 ? (
                            `${(
                              last30DaysData.reduce((sum, item) => sum + item.value, 0) /
                              last30DaysData.length
                            ).toFixed(1)}`
                          ) : (
                            "No data"
                          );
                        })()}
                      </span>
                      {!data.loading && getTimeRangeData(data.weight, 'last30days').length > 0 && (
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">lb</span>
                          {(() => {
                            const currentPeriodData = getTimeRangeData(data.weight, 'last30days');
                            const previousPeriodStartDate = new Date();
                            previousPeriodStartDate.setDate(previousPeriodStartDate.getDate() - 60);
                            const previousPeriodEndDate = new Date();
                            previousPeriodEndDate.setDate(previousPeriodEndDate.getDate() - 30);

                            const previousPeriodData = data.weight.filter(item => {
                              const itemDate = new Date(item.date);
                              return itemDate >= previousPeriodStartDate && itemDate < previousPeriodEndDate;
                            });

                            if (currentPeriodData.length > 0 && previousPeriodData.length > 0) {
                              const currentAvg = currentPeriodData.reduce((sum, item) => sum + item.value, 0) / currentPeriodData.length;
                              const prevAvg = previousPeriodData.reduce((sum, item) => sum + item.value, 0) / previousPeriodData.length;
                              return (
                                <TrendIndicator current={currentAvg} previous={prevAvg} isFitnessMetric={true} />
                              );
                            }
                            return <></>;
                          })()}
                        </div>
                      )}
                    </div>
                    <span className="mt-1 text-[10px] md:text-xs text-gray-500 dark:text-gray-400">Last 30 days</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-6 shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">Body Fat</span>
                    <div className="mt-1.5 md:mt-2 flex flex-col md:flex-row md:items-baseline gap-1 md:gap-2">
                      <span className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                        {data.loading ? (
                          "..."
                        ) : (() => {
                          const last30DaysData = getTimeRangeData(data.bodyFat, 'last30days');
                          return last30DaysData.length > 0 ? (
                            `${(
                              last30DaysData.reduce((sum, item) => sum + item.value, 0) /
                              last30DaysData.length
                            ).toFixed(1)}`
                          ) : (
                            "No data"
                          );
                        })()}
                      </span>
                      {!data.loading && getTimeRangeData(data.bodyFat, 'last30days').length > 0 && (
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">%</span>
                          {(() => {
                            const currentPeriodData = getTimeRangeData(data.bodyFat, 'last30days');
                            const previousPeriodStartDate = new Date();
                            previousPeriodStartDate.setDate(previousPeriodStartDate.getDate() - 60);
                            const previousPeriodEndDate = new Date();
                            previousPeriodEndDate.setDate(previousPeriodEndDate.getDate() - 30);

                            const previousPeriodData = data.bodyFat.filter(item => {
                              const itemDate = new Date(item.date);
                              return itemDate >= previousPeriodStartDate && itemDate < previousPeriodEndDate;
                            });

                            if (currentPeriodData.length > 0 && previousPeriodData.length > 0) {
                              const currentAvg = currentPeriodData.reduce((sum, item) => sum + item.value, 0) / currentPeriodData.length;
                              const prevAvg = previousPeriodData.reduce((sum, item) => sum + item.value, 0) / previousPeriodData.length;
                              
                              // Only show if we have enough data and positive averages (specific to BodyFat)
                              if (currentAvg > 0 && prevAvg > 0) {
                                return (
                                  <TrendIndicator
                                    current={currentAvg}
                                    previous={prevAvg}
                                    isFitnessMetric={true}
                                    isBodyFat={true}
                                  />
                                );
                              } else {
                                return <></>; // Add explicit return for the inner 'else' case
                              }
                            }
                            return <></>; // This is for the outer 'if' case
                          })()}
                        </div>
                      )}
                    </div>
                    <span className="mt-1 text-[10px] md:text-xs text-gray-500 dark:text-gray-400">Last 30 days</span>
                  </div>
                </div>
              </div>

              {/* HRV Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Heart Rate Variability</h2>
                    {hasHRVData && !data.loading && (
                      <>
                        {(() => {
                          // Calculate time range based on the selected option
                          const timeRangeInDays = (() => {
                            switch(hrvTimeRange) {
                              case 'last30days': return 30;
                              case 'last3months': return 90;
                              case 'last6months': return 180;
                              case 'last1year': return 365;
                              case 'last3years': return 1095;
                              default: return 30;
                            }
                          })();
                          
                          // Get filtered data based on selected time range
                          const rangeData = currentHRVData;
                          
                          // Calculate averages for current and previous periods
                          const periodLength = Math.min(timeRangeInDays, rangeData.length);
                          const halfPeriod = Math.floor(periodLength / 2);
                          
                          // Current period (most recent half of the data)
                          const currentPeriodData = rangeData.slice(-halfPeriod);
                          const currentAvg = currentPeriodData.length > 0 
                            ? currentPeriodData.reduce((sum, item) => sum + item.value, 0) / currentPeriodData.length 
                            : 0;
                          
                          // Previous period (older half of the data)
                          const previousPeriodData = rangeData.slice(-periodLength, -halfPeriod);
                          const previousAvg = previousPeriodData.length > 0 
                            ? previousPeriodData.reduce((sum, item) => sum + item.value, 0) / previousPeriodData.length 
                            : 0;
                          
                          // Only show if we have enough data
                          if (currentPeriodData.length > 0 && previousPeriodData.length > 0) {
                            // Use HRV chart colors (indigo/purple)
                            return (
                              <TrendIndicator 
                                current={currentAvg} 
                                previous={previousAvg} 
                                isFitnessMetric={true}
                                showTimeRange={true}
                                timeRangeLabel={getTimeRangeLabel(hrvTimeRange)}
                                customColors={{
                                  bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
                                  textColor: 'text-indigo-600 dark:text-indigo-400',
                                  iconColor: 'text-indigo-500'
                                }}
                                className="ml-0 sm:ml-3"
                              />
                            );
                          }
                          return <></>; // Changed from return null
                        })()}
                      </>
                    )}
                  </div>
                  <div className="flex items-center">
                    <select
                      value={hrvTimeRange}
                      onChange={handleHRVTimeRangeChange}
                      className="w-full sm:w-auto text-sm font-medium border border-gray-200 rounded-md px-3 py-2 pr-9 bg-white/90 text-gray-900 dark:border-gray-700 dark:bg-gray-800/90 dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm hover:bg-white dark:hover:bg-gray-800"
                      style={{
                        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg width='16' height='16' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M4.94 5.72a.75.75 0 0 0-1.06 1.06l3.83 3.83a.75.75 0 0 0 1.06 0l3.83-3.83a.75.75 0 0 0-1.06-1.06L8 9.28 4.94 5.72z' fill='%236b7280'/%3e%3c/svg%3e")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.5rem center',
                        backgroundSize: '1.5em 1.5em'
                      }}
                    >
                      <option value="last30days">Last 30 days</option>
                      <option value="last3months">Last 3 months</option>
                      <option value="last6months">Last 6 months</option>
                      <option value="last1year">Last year</option>
                      <option value="last3years">Last 3 years</option>
                    </select>
                  </div>
                </div>
            <div className="h-[340px]">
                  {data.loading && (
                    <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                      Loading data...
                    </div>
                  )}
                  {!hasHRVData && !data.loading && (
                    <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                      No HRV data available for the {getTimeRangeLabel(hrvTimeRange)}
                    </div>
                  )}
                  {hasHRVData && !data.loading && (
              <ResponsiveContainer width="100%" height="100%">
                      <LineChart 
                        data={currentHRVData}
                        margin={{ top: 30, right: 10, left: 10, bottom: 20 }}
                      >
                        <CartesianGrid 
                          stroke={isDarkMode ? "rgba(75, 85, 99, 0.3)" : "rgba(156, 163, 175, 0.35)"}
                          strokeWidth={0.75}
                          strokeDasharray="0" 
                          vertical={false}
                        />
                        <YAxis 
                          domain={getAdaptiveYAxisDomain(currentHRVData, 'hrv')}
                          hide={true}
                        />
                  <XAxis 
                    dataKey="date" 
                          tickFormatter={getTickFormatter(hrvTimeRange)}
                          stroke="#9CA3AF"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          dy={12}
                          interval="preserveStart"
                          minTickGap={40}
                          allowDuplicatedCategory={false}
                        />
                  <Tooltip 
                          content={(props) => renderCustomTooltip({ ...props, timeRange: hrvTimeRange })}
                        />
                        <Line 
                          type="monotone"
                          dataKey="value" 
                          stroke={isDarkMode ? "#818cf8" : "#4f46e5"} 
                          activeDot={{ r: 6, stroke: isDarkMode ? "#818cf8" : "#4f46e5", strokeWidth: 1, fill: isDarkMode ? "#1f2937" : "#ffffff" }} 
                          dot={(props: any) => { 
                            const { cx, cy, index } = props; 
                            const lineColor = isDarkMode ? "#818cf8" : "#4f46e5";
                            const bgColor = isDarkMode ? "#1f2937" : "#ffffff";
                            if (index === currentHRVData.length - 1 && currentHRVData.length > 0) { 
                              return (
                                <g>
                                  <circle cx={cx} cy={cy} r={12} fill={lineColor} fillOpacity={0.15} stroke="none" />
                                  <circle cx={cx} cy={cy} r={8} fill={lineColor} fillOpacity={0.3} stroke="none" />
                                  <circle cx={cx} cy={cy} r={4} fill={lineColor} stroke={bgColor} strokeWidth={2} />
                                </g>
                              );
                            } 
                            return <React.Fragment key={index} />; 
                          }}
                          strokeWidth={2}
                          unit="ms"
                        />
                </LineChart>
              </ResponsiveContainer>
                  )}
            </div>
            
            {/* Remove the trend summary section from the bottom */}
          </div>

              {/* VO2 Max Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">VO2 Max</h2>
                    {hasVO2MaxData && !data.loading && (
                      <>
                        {(() => {
                          // Calculate time range based on the selected option
                          const timeRangeInDays = (() => {
                            switch(vo2maxTimeRange) {
                              case 'last30days': return 30;
                              case 'last3months': return 90;
                              case 'last6months': return 180;
                              case 'last1year': return 365;
                              case 'last3years': return 1095;
                              default: return 30;
                            }
                          })();
                          
                          // Get filtered data based on selected time range
                          const rangeData = currentVO2MaxData;
                          
                          // Calculate averages for current and previous periods
                          const periodLength = Math.min(timeRangeInDays, rangeData.length);
                          const halfPeriod = Math.floor(periodLength / 2);
                          
                          // Current period (most recent half of the data)
                          const currentPeriodData = rangeData.slice(-halfPeriod);
                          const currentAvg = currentPeriodData.length > 0 
                            ? currentPeriodData.reduce((sum, item) => sum + item.value, 0) / currentPeriodData.length 
                            : 0;
                          
                          // Previous period (older half of the data)
                          const previousPeriodData = rangeData.slice(-periodLength, -halfPeriod);
                          const prevAvg = previousPeriodData.length > 0
                            ? previousPeriodData.reduce((sum, item) => sum + item.value, 0) / previousPeriodData.length
                            : 0;
                          
                          // Only show if we have enough data
                          if (currentPeriodData.length > 0 && previousPeriodData.length > 0 && prevAvg > 0) {
                            // Use VO2Max chart colors (red)
                            return (
                              <TrendIndicator 
                                current={currentAvg} 
                                previous={prevAvg} 
                                isFitnessMetric={true}
                                showTimeRange={true}
                                timeRangeLabel={getTimeRangeLabel(vo2maxTimeRange)}
                                customColors={{
                                  bgColor: 'bg-rose-50 dark:bg-rose-900/20',
                                  textColor: 'text-rose-600 dark:text-rose-400',
                                  iconColor: 'text-rose-500'
                                }}
                                className="ml-0 sm:ml-3"
                              />
                            );
                          }
                          return <></>; // Changed from return null
                        })()}
                      </>
                    )}
                  </div>
                  <div className="flex items-center">
                    <select
                      value={vo2maxTimeRange}
                      onChange={handleVO2MaxTimeRangeChange}
                      className="w-full sm:w-auto text-sm font-medium border border-gray-200 rounded-md px-3 py-2 pr-9 bg-white/90 text-gray-900 dark:border-gray-700 dark:bg-gray-800/90 dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm hover:bg-white dark:hover:bg-gray-800"
                      style={{
                        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg width='16' height='16' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M4.94 5.72a.75.75 0 0 0-1.06 1.06l3.83 3.83a.75.75 0 0 0 1.06 0l3.83-3.83a.75.75 0 0 0-1.06-1.06L8 9.28 4.94 5.72z' fill='%236b7280'/%3e%3c/svg%3e")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.5rem center',
                        backgroundSize: '1.5em 1.5em'
                      }}
                    >
                      <option value="last30days">Last 30 days</option>
                      <option value="last3months">Last 3 months</option>
                      <option value="last6months">Last 6 months</option>
                      <option value="last1year">Last year</option>
                      <option value="last3years">Last 3 years</option>
                    </select>
                  </div>
                </div>
            <div className="h-[340px]">
                  {data.loading && (
                    <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                      Loading data...
                    </div>
                  )}
                  {!hasVO2MaxData && !data.loading && (
                    <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                      No VO2 max data available for the {getTimeRangeLabel(vo2maxTimeRange)}
                    </div>
                  )}
                  {hasVO2MaxData && !data.loading && (
              <ResponsiveContainer width="100%" height="100%">
                      <LineChart 
                        data={currentVO2MaxData}
                        margin={{ top: 30, right: 10, left: 10, bottom: 20 }}
                      >
                        <CartesianGrid 
                          stroke={isDarkMode ? "rgba(75, 85, 99, 0.3)" : "rgba(156, 163, 175, 0.35)"}
                          strokeWidth={0.75}
                          strokeDasharray="0" 
                          vertical={false}
                        />
                        <YAxis 
                          domain={getAdaptiveYAxisDomain(currentVO2MaxData, 'vo2max')}
                          hide={true}
                        />
                  <XAxis 
                    dataKey="date" 
                          tickFormatter={getTickFormatter(vo2maxTimeRange)}
                          stroke="#9CA3AF"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          dy={12}
                          interval="preserveStart"
                          minTickGap={40}
                          allowDuplicatedCategory={false}
                        />
                  <Tooltip 
                          content={(props) => renderCustomTooltip({ ...props, timeRange: vo2maxTimeRange })}
                        />
                        <Line 
                          type="monotone"
                          dataKey="value" 
                          stroke={isDarkMode ? "#f87171" : "#dc2626"} 
                          activeDot={{ r: 6, stroke: isDarkMode ? "#f87171" : "#dc2626", strokeWidth: 1, fill: isDarkMode ? "#1f2937" : "#ffffff" }} 
                          dot={(props: any) => { 
                            const { cx, cy, index } = props; 
                            const lineColor = isDarkMode ? "#f87171" : "#dc2626";
                            const bgColor = isDarkMode ? "#1f2937" : "#ffffff";
                            if (index === currentVO2MaxData.length - 1 && currentVO2MaxData.length > 0) { 
                              return (
                                <g>
                                  <circle cx={cx} cy={cy} r={12} fill={lineColor} fillOpacity={0.15} stroke="none" />
                                  <circle cx={cx} cy={cy} r={8} fill={lineColor} fillOpacity={0.3} stroke="none" />
                                  <circle cx={cx} cy={cy} r={4} fill={lineColor} stroke={bgColor} strokeWidth={2} />
                                </g>
                              );
                            } 
                            return <React.Fragment key={index} />; 
                          }}
                          strokeWidth={2}
                          unit="ml/kg/min"
                        />
                </LineChart>
              </ResponsiveContainer>
                  )}
            </div>
          </div>

              {/* Weight Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Weight</h2>
                    {hasWeightData && !data.loading && (
                      <>
                        {(() => {
                          // Calculate time range based on the selected option
                          const timeRangeInDays = (() => {
                            switch(weightTimeRange) {
                              case 'last30days': return 30;
                              case 'last3months': return 90;
                              case 'last6months': return 180;
                              case 'last1year': return 365;
                              case 'last3years': return 1095;
                              default: return 30;
                            }
                          })();
                          
                          // Get filtered data based on selected time range
                          const rangeData = currentWeightData;
                          
                          // Calculate averages for current and previous periods
                          const periodLength = Math.min(timeRangeInDays, rangeData.length);
                          const halfPeriod = Math.floor(periodLength / 2);
                          
                          // Current period (most recent half of the data)
                          const currentPeriodData = rangeData.slice(-halfPeriod);
                          const currentAvg = currentPeriodData.length > 0 
                            ? currentPeriodData.reduce((sum, item) => sum + item.value, 0) / currentPeriodData.length 
                            : 0;
                          
                          // Previous period (older half of the data)
                          const previousPeriodData = rangeData.slice(-periodLength, -halfPeriod);
                          const previousAvg = previousPeriodData.length > 0
                            ? previousPeriodData.reduce((sum, item) => sum + item.value, 0) / previousPeriodData.length
                            : 0;
                          
                          // Only show if we have enough data
                          if (currentPeriodData.length > 0 && previousPeriodData.length > 0) {
                            // Use weight chart colors (green)
                            return (
                              <TrendIndicator 
                                current={currentAvg} 
                                previous={previousAvg} 
                                isFitnessMetric={true}
                                showTimeRange={true}
                                timeRangeLabel={getTimeRangeLabel(weightTimeRange)}
                                customColors={{
                                  bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
                                  textColor: 'text-emerald-600 dark:text-emerald-400',
                                  iconColor: 'text-emerald-500'
                                }}
                                className="ml-0 sm:ml-3"
                              />
                            );
                          }
                          return <></>; // Changed from return null
                        })()}
                      </>
                    )}
                  </div>
                  <div className="flex items-center">
                    <select
                      value={weightTimeRange}
                      onChange={handleWeightTimeRangeChange}
                      className="w-full sm:w-auto text-sm font-medium border border-gray-200 rounded-md px-3 py-2 pr-9 bg-white/90 text-gray-900 dark:border-gray-700 dark:bg-gray-800/90 dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm hover:bg-white dark:hover:bg-gray-800"
                      style={{
                        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg width='16' height='16' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M4.94 5.72a.75.75 0 0 0-1.06 1.06l3.83 3.83a.75.75 0 0 0 1.06 0l3.83-3.83a.75.75 0 0 0-1.06-1.06L8 9.28 4.94 5.72z' fill='%236b7280'/%3e%3c/svg%3e")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.5rem center',
                        backgroundSize: '1.5em 1.5em'
                      }}
                    >
                      <option value="last30days">Last 30 days</option>
                      <option value="last3months">Last 3 months</option>
                      <option value="last6months">Last 6 months</option>
                      <option value="last1year">Last year</option>
                      <option value="last3years">Last 3 years</option>
                    </select>
                  </div>
                </div>
            <div className="h-[340px]">
                  {data.loading && (
                    <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                      Loading data...
                    </div>
                  )}
                  {!hasWeightData && !data.loading && (
                    <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                      No weight data available for the {getTimeRangeLabel(weightTimeRange)}
                    </div>
                  )}
                  {hasWeightData && !data.loading && (
              <ResponsiveContainer width="100%" height="100%">
                      <LineChart 
                        data={currentWeightData}
                        margin={{ top: 30, right: 10, left: 10, bottom: 20 }}
                      >
                        <CartesianGrid 
                          stroke={isDarkMode ? "rgba(75, 85, 99, 0.3)" : "rgba(156, 163, 175, 0.35)"}
                          strokeWidth={0.75}
                          strokeDasharray="0" 
                          vertical={false}
                        />
                        <YAxis 
                          domain={getAdaptiveYAxisDomain(currentWeightData, 'weight')}
                          hide={true}
                        />
                  <XAxis 
                    dataKey="date" 
                          tickFormatter={getTickFormatter(weightTimeRange)}
                          stroke="#9CA3AF"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          dy={12}
                          interval="preserveStart"
                          minTickGap={40}
                          allowDuplicatedCategory={false}
                        />
                  <Tooltip 
                          content={(props) => renderCustomTooltip({ ...props, timeRange: weightTimeRange })}
                        />
                        <Line 
                          type="monotone"
                          dataKey="value" 
                          stroke={isDarkMode ? "#34d399" : "#10b981"} 
                          activeDot={{ r: 6, stroke: isDarkMode ? "#34d399" : "#10b981", strokeWidth: 1, fill: isDarkMode ? "#1f2937" : "#ffffff" }} 
                          dot={(props: any) => { 
                            const { cx, cy, index } = props; 
                            const lineColor = isDarkMode ? "#34d399" : "#10b981";
                            const bgColor = isDarkMode ? "#1f2937" : "#ffffff";
                            if (index === currentWeightData.length - 1 && currentWeightData.length > 0) { 
                              return (
                                <g>
                                  <circle cx={cx} cy={cy} r={12} fill={lineColor} fillOpacity={0.15} stroke="none" />
                                  <circle cx={cx} cy={cy} r={8} fill={lineColor} fillOpacity={0.3} stroke="none" />
                                  <circle cx={cx} cy={cy} r={4} fill={lineColor} stroke={bgColor} strokeWidth={2} />
                                </g>
                              );
                            } 
                            return <React.Fragment key={index} />; 
                          }}
                          strokeWidth={2}
                          unit=""
                        />
                </LineChart>
              </ResponsiveContainer>
                  )}
            </div>
          </div>

              {/* Body Fat Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Body Fat</h2>
                    {hasBodyFatData && !data.loading && (
                      <>
                        {(() => {
                          // Calculate time range based on the selected option
                          const timeRangeInDays = (() => {
                            switch(bodyFatTimeRange) {
                              case 'last30days': return 30;
                              case 'last3months': return 90;
                              case 'last6months': return 180;
                              case 'last1year': return 365;
                              case 'last3years': return 1095;
                              default: return 30;
                            }
                          })();
                          
                          // Get filtered data based on selected time range
                          const rangeData = currentBodyFatData;
                          
                          // Calculate averages for current and previous periods
                          const periodLength = Math.min(timeRangeInDays, rangeData.length);
                          const halfPeriod = Math.floor(periodLength / 2);
                          
                          // Current period (most recent half of the data)
                          const currentPeriodData = rangeData.slice(-halfPeriod);
                          const currentAvg = currentPeriodData.length > 0 
                            ? currentPeriodData.reduce((sum, item) => sum + item.value, 0) / currentPeriodData.length 
                            : 0;
                          
                          // Previous period (older half of the data)
                          const previousPeriodData = rangeData.slice(-periodLength, -halfPeriod);
                          const previousAvg = previousPeriodData.length > 0
                            ? previousPeriodData.reduce((sum, item) => sum + item.value, 0) / previousPeriodData.length
                            : 0;
                          
                          // Only show if we have enough data
                          if (currentPeriodData.length > 0 && previousPeriodData.length > 0 && previousAvg > 0) {
                            // For body fat, a decrease is typically considered positive
                            const isPositiveTrend = currentAvg < previousAvg;
                            
                            return (
                              <TrendIndicator 
                                current={currentAvg} 
                                previous={previousAvg} 
                                isFitnessMetric={true}
                                isBodyFat={true}
                                showTimeRange={true}
                                timeRangeLabel={getTimeRangeLabel(bodyFatTimeRange)}
                                customColors={{
                                  bgColor: 'bg-green-50 dark:bg-green-900/20',
                                  textColor: 'text-green-600 dark:text-green-400',
                                  iconColor: 'text-green-500'
                                }}
                                className="ml-0 sm:ml-3"
                              />
                            );
                          }
                          return <></>; // Changed from return null
                        })()}
                      </>
                    )}
                  </div>
                  <div className="flex items-center">
                    <select
                      value={bodyFatTimeRange}
                      onChange={handleBodyFatTimeRangeChange}
                      className="w-full sm:w-auto text-sm font-medium border border-gray-200 rounded-md px-3 py-2 pr-9 bg-white/90 text-gray-900 dark:border-gray-700 dark:bg-gray-800/90 dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm hover:bg-white dark:hover:bg-gray-800"
                      style={{
                        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg width='16' height='16' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M4.94 5.72a.75.75 0 0 0-1.06 1.06l3.83 3.83a.75.75 0 0 0 1.06 0l3.83-3.83a.75.75 0 0 0-1.06-1.06L8 9.28 4.94 5.72z' fill='%236b7280'/%3e%3c/svg%3e")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.5rem center',
                        backgroundSize: '1.5em 1.5em'
                      }}
                    >
                      <option value="last30days">Last 30 days</option>
                      <option value="last3months">Last 3 months</option>
                      <option value="last6months">Last 6 months</option>
                      <option value="last1year">Last year</option>
                      <option value="last3years">Last 3 years</option>
                    </select>
                  </div>
                </div>
            <div className="h-[340px]">
                  {data.loading && (
                    <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                      Loading data...
                    </div>
                  )}
                  {!hasBodyFatData && !data.loading && (
                    <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                      No body fat data available for the {getTimeRangeLabel(bodyFatTimeRange)}
                    </div>
                  )}
                  {hasBodyFatData && !data.loading && (
              <ResponsiveContainer width="100%" height="100%">
                      <LineChart 
                        data={currentBodyFatData}
                        margin={{ top: 30, right: 10, left: 10, bottom: 20 }}
                      >
                        <CartesianGrid 
                          stroke={isDarkMode ? "rgba(75, 85, 99, 0.3)" : "rgba(156, 163, 175, 0.35)"}
                          strokeWidth={0.75}
                          strokeDasharray="0" 
                          vertical={false}
                        />
                        <YAxis 
                          domain={getAdaptiveYAxisDomain(currentBodyFatData, 'bodyFat')}
                          hide={true}
                        />
                  <XAxis 
                    dataKey="date" 
                          tickFormatter={getTickFormatter(bodyFatTimeRange)}
                          stroke="#9CA3AF"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          dy={12}
                          interval="preserveStart"
                          minTickGap={40}
                          allowDuplicatedCategory={false}
                        />
                  <Tooltip 
                          content={(props) => renderCustomTooltip({ ...props, timeRange: bodyFatTimeRange })}
                        />
                        <Line 
                          type="monotone"
                          dataKey="value" 
                          stroke={isDarkMode ? "#fbbf24" : "#d97706"} 
                          activeDot={{ r: 6, stroke: isDarkMode ? "#fbbf24" : "#d97706", strokeWidth: 1, fill: isDarkMode ? "#1f2937" : "#ffffff" }} 
                          dot={(props: any) => { 
                            const { cx, cy, index } = props; 
                            const lineColor = isDarkMode ? "#fbbf24" : "#d97706";
                            const bgColor = isDarkMode ? "#1f2937" : "#ffffff";
                            if (index === currentBodyFatData.length - 1 && currentBodyFatData.length > 0) { 
                              return (
                                <g>
                                  <circle cx={cx} cy={cy} r={12} fill={lineColor} fillOpacity={0.15} stroke="none" />
                                  <circle cx={cx} cy={cy} r={8} fill={lineColor} fillOpacity={0.3} stroke="none" />
                                  <circle cx={cx} cy={cy} r={4} fill={lineColor} stroke={bgColor} strokeWidth={2} />
                                </g>
                              );
                            } 
                            return <React.Fragment key={index} />; 
                          }}
                          strokeWidth={2}
                          unit="%"
                        />
                </LineChart>
              </ResponsiveContainer>
                  )}
            </div>
          </div>
            </>
          ) : activeTab === 'protocols' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                {/* Diet Protocol */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-6 shadow-sm min-h-[200px] flex flex-col">
                  <div className="flex flex-col">
                    <span className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">Diet Protocol</span>
                    <div className="mt-1.5 md:mt-2 flex flex-col md:flex-row md:items-baseline gap-1 md:gap-2">
                      <span className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                        {data.loading ? (
                          "..."
                        ) : currentDietProtocol ? (
                          currentDietProtocol.protocol.replace(/-/g, ' ').split(' ').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')
                        ) : (
                          "None"
                        )}
                      </span>
                    </div>
                    {currentDietProtocol && (
                      <span className="mt-1 text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
                        Started {new Date(currentDietProtocol.startDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

              {/* Workout Protocol */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-6 shadow-sm min-h-[200px] flex flex-col">
                <div className="flex flex-col h-full">
                  <span className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">Workout Protocol</span>
                  {data.loading ? (
                    <div className="mt-3">
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                      </div>
                    </div>
                  ) : currentWorkoutProtocol ? (
                    (() => {
                      try {
                        const protocolData = JSON.parse(currentWorkoutProtocol.protocol);
                        const workouts = protocolData.workouts || [];
                        const totalSessions = workouts.reduce((sum: number, w: any) => sum + w.frequency, 0);
                        
                        // Function to format workout type names
                        const formatWorkoutName = (type: string) => {
                          return type
                            .split('-')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ');
                        };
                        
                        return (
                          <div className="mt-3 flex-1 flex flex-col">
                            {/* Individual Workouts */}
                            <div className="flex flex-wrap gap-3 mb-4">
                              {workouts.map((workout: any, index: number) => {
                                // Function to get workout icon and unified purple styling
                                const getWorkoutStyle = (type: string) => {
                                  const lowerType = type.toLowerCase();
                                  
                                  // Common purple styling for all workout types
                                  const commonStyle = {
                                    bg: 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20',
                                    text: 'text-indigo-700 dark:text-indigo-300',
                                    freqBg: 'bg-indigo-100 dark:bg-indigo-800/30',
                                    freqText: 'text-indigo-800 dark:text-indigo-200',
                                    border: 'border-indigo-200 dark:border-indigo-800'
                                  };
                                  
                                  if (lowerType.includes('strength') || lowerType.includes('weight') || lowerType.includes('lifting') || lowerType.includes('resistance')) {
                                    return {
                                      icon: (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29l-1.43-1.43z"/>
                                        </svg>
                                      ),
                                      ...commonStyle
                                    };
                                  } else if (lowerType.includes('run') || lowerType.includes('cardio') || lowerType.includes('endurance')) {
                                    return {
                                      icon: (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z"/>
                                        </svg>
                                      ),
                                      ...commonStyle
                                    };
                                  } else if (lowerType.includes('yoga') || lowerType.includes('pilates') || lowerType.includes('stretch') || lowerType.includes('flexibility')) {
                                    return {
                                      icon: (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M5 17h14v2H5zm4.5-4.2c.3-.7.4-1.5.4-2.3s-.1-1.6-.4-2.3L12 5l2.5 3.2c-.3.7-.4 1.5-.4 2.3s.1 1.6.4 2.3L12 16l-2.5-3.2zM12 1L6.5 9c-.6 1.1-.6 2.5 0 3.6L12 21l5.5-8.4c.6-1.1.6-2.5 0-3.6L12 1z"/>
                                        </svg>
                                      ),
                                      ...commonStyle
                                    };
                                  } else if (lowerType.includes('swim') || lowerType.includes('water')) {
                                    return {
                                      icon: (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M22 21c-1.11 0-1.73-.37-2.18-.64-.37-.22-.6-.36-1.15-.36s-.78.14-1.15.36c-.45.27-1.07.64-2.18.64s-1.73-.37-2.18-.64c-.37-.22-.6-.36-1.15-.36s-.78.14-1.15.36c-.45.27-1.07.64-2.18.64s-1.73-.37-2.18-.64c-.37-.22-.6-.36-1.15-.36s-.78.14-1.15.36c-.45.27-1.07.64-2.18.64v-2c.55 0 .78-.14 1.15-.36.45-.27 1.07-.64 2.18-.64s1.73.37 2.18.64c.37.22.6.36 1.15.36s.78-.14 1.15-.36c.45-.27 1.07-.64 2.18-.64s1.73.37 2.18.64c.37.22.6.36 1.15.36s.78-.14 1.15-.36c.45-.27 1.07-.64 2.18-.64s1.73.37 2.18.64c.37.22.6.36 1.15.36v2zm0-4.5c-1.11 0-1.73-.37-2.18-.64-.37-.22-.6-.36-1.15-.36s-.78.14-1.15.36c-.45.27-1.07.64-2.18.64s-1.73-.37-2.18-.64c-.37-.22-.6-.36-1.15-.36s-.78.14-1.15.36c-.45.27-1.07.64-2.18.64s-1.73-.37-2.18-.64c-.37-.22-.6-.36-1.15-.36s-.78.14-1.15.36c-.45.27-1.07.64-2.18.64v-2c.55 0 .78-.14 1.15-.36.45-.27 1.07-.64 2.18-.64s1.73.37 2.18.64c.37.22.6.36 1.15.36s.78-.14 1.15-.36c.45-.27 1.07-.64 2.18-.64s1.73.37 2.18.64c.37.22.6.36 1.15.36s.78-.14 1.15-.36c.45-.27 1.07-.64 2.18-.64s1.73.37 2.18.64c.37.22.6.36 1.15.36v2zM11 8.5l1.5 2H14l-2-3h-1.5l-.75 1.5H11v-.5zm6.5 2H18l1.5-3H18l-.75 1.5H16l1.5-1.5h-1.5l-1 2z"/>
                                        </svg>
                                      ),
                                      ...commonStyle
                                    };
                                  } else {
                                    // Default style for other workouts
                                    return {
                                      icon: (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                        </svg>
                                      ),
                                      ...commonStyle
                                    };
                                  }
                                };
                                
                                const style = getWorkoutStyle(workout.type);
                                
                                return (
                                  <div
                                    key={index}
                                    className={`group relative inline-flex items-center gap-3 px-4 py-3 ${style.bg} ${style.text} rounded-xl border ${style.border} shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]`}
                                  >
                                    {/* Workout Icon */}
                                    <div className="flex-shrink-0">
                                      {style.icon}
                                    </div>
                                    
                                    {/* Workout Name */}
                                    <span className="font-medium text-sm">
                                      {formatWorkoutName(workout.type)}
                                    </span>
                                    
                                    {/* Frequency Badge */}
                                    <div className={`flex-shrink-0 inline-flex items-center justify-center w-8 h-6 ${style.freqBg} ${style.freqText} text-xs font-bold rounded-full`}>
                                      {workout.frequency}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            
                            {/* Start Date with enhanced styling */}
                            <div className="flex items-center gap-2 mt-auto">
                              <svg className="w-3 h-3 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                              </svg>
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                Started {new Date(currentWorkoutProtocol.startDate).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric' 
                                })}
                              </span>
                            </div>
                          </div>
                        );
                      } catch {
                        return (
                          <div className="mt-2">
                            <span className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                              Active
                            </span>
                            <span className="mt-1 block text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
                              Started {new Date(currentWorkoutProtocol.startDate).toLocaleDateString()}
                            </span>
                          </div>
                        );
                      }
                    })()
                  ) : (
                    <div className="mt-2">
                      <span className="text-xl md:text-2xl font-bold text-gray-500 dark:text-gray-400">
                        None
                      </span>
                      <span className="mt-1 block text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
                        No workout protocol set
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Supplement Protocol - with constrained height and scrolling */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-6 shadow-sm min-h-[200px] max-h-[400px] flex flex-col">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">Supplement Protocol</span>
                    {currentSupplementProtocol && (() => {
                      try {
                        const protocolData = JSON.parse(currentSupplementProtocol.protocol);
                        const supplements = protocolData.supplements || [];
                        return supplements.length > 0 ? (
                          <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full font-medium">
                            {supplements.length} supplement{supplements.length !== 1 ? 's' : ''}
                          </span>
                        ) : null;
                      } catch {
                        return null;
                      }
                    })()}
                  </div>
                  
                  {data.loading ? (
                    <div className="mt-3">
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                      </div>
                    </div>
                  ) : currentSupplementProtocol ? (
                    (() => {
                      try {
                        const protocolData = JSON.parse(currentSupplementProtocol.protocol);
                        const supplements = protocolData.supplements || [];
                        
                        // Function to format supplement type names
                        const formatSupplementName = (type: string) => {
                          return type
                            .split('-')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ');
                        };
                        
                        return (
                          <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Scrollable Supplements Container */}
                            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar" style={{ scrollbarWidth: 'thin' }}>
                              <div className="space-y-2">
                                {supplements.map((supplement: any, index: number) => {
                                                                     // Function to get supplement icon and unified green styling
                                   const getSupplementStyle = () => {
                                     // Common green styling and pill icon for all supplement types
                                     return {
                                       icon: (
                                         <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                           <path d="M4.22 11.29l6.36-6.36c1.77-1.77 4.64-1.77 6.41 0l.71.71c1.77 1.77 1.77 4.64 0 6.41l-6.36 6.36c-1.77 1.77-4.64 1.77-6.41 0l-.71-.71c-1.77-1.77-1.77-4.64 0-6.41zm.71 5.7l.71.71c1.17 1.17 3.07 1.17 4.24 0l6.36-6.36c1.17-1.17 1.17-3.07 0-4.24l-.71-.71c-1.17-1.17-3.07-1.17-4.24 0l-6.36 6.36c-1.17 1.17-1.17 3.07 0 4.24z"/>
                                         </svg>
                                       ),
                                       bg: 'bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20',
                                       text: 'text-emerald-700 dark:text-emerald-300',
                                       freqBg: 'bg-emerald-100 dark:bg-emerald-800/30',
                                       freqText: 'text-emerald-800 dark:text-emerald-200',
                                       border: 'border-emerald-200 dark:border-emerald-800'
                                     };
                                   };
                                  
                                                                     const style = getSupplementStyle();
                                  
                                  return (
                                                                         <div
                                       key={index}
                                       className={`group relative flex items-center gap-3 px-3 py-2.5 ${style.bg} ${style.text} rounded-lg border ${style.border} shadow-sm hover:shadow-lg transition-all duration-200 hover:bg-gradient-to-r hover:from-emerald-100 hover:to-green-100 dark:hover:from-emerald-800/40 dark:hover:to-green-800/40`}
                                     >
                                      {/* Supplement Icon */}
                                      <div className="flex-shrink-0">
                                        {style.icon}
                                      </div>
                                      
                                      {/* Supplement Info */}
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-xs truncate">
                                          {formatSupplementName(supplement.type)}
                                        </div>
                                        <div className="text-xs opacity-75 truncate">
                                          {supplement.dosage} {supplement.unit} • {supplement.frequency.replace('-', ' ')}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            
                            {/* Start Date with enhanced styling - Fixed at bottom */}
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                              <svg className="w-3 h-3 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                              </svg>
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                Started {new Date(currentSupplementProtocol.startDate).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric' 
                                })}
                              </span>
                            </div>
                          </div>
                        );
                      } catch {
                        return (
                          <div className="mt-2">
                            <span className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                              Active
                            </span>
                            <span className="mt-1 block text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
                              Started {new Date(currentSupplementProtocol.startDate).toLocaleDateString()}
                            </span>
                          </div>
                        );
                      }
                    })()
                  ) : (
                    <div className="mt-2">
                      <span className="text-xl md:text-2xl font-bold text-gray-500 dark:text-gray-400">
                        None
                      </span>
                      <span className="mt-1 block text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
                        No supplement protocol set
                      </span>
                    </div>
                  )}
                </div>
              </div>

              </div>

              {/* Active Experiments Section */}
              <div className="mt-8">
                <ActiveExperiments userId={userId} />
              </div>
            </>
          ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 sm:px-6 py-6 shadow-sm">
              {/* Title removed from here
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Blood Markers & Longevity</h2>
              </div>
              */}
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Lipid Panel */}
                <div className="border border-gray-100 dark:border-gray-700 rounded-xl px-4 sm:px-6 py-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Lipid Panel</h3>
                  <div className="space-y-6">
                    <MarkerRow label="Total Cholesterol" data={data.bloodMarkers.totalCholesterol} userData={userData} onClick={() => handleMarkerClick('Total Cholesterol', data.bloodMarkers.totalCholesterol)} />
                    <MarkerRow label="LDL Cholesterol" data={data.bloodMarkers.ldl} userData={userData} onClick={() => handleMarkerClick('LDL Cholesterol', data.bloodMarkers.ldl)} />
                    <MarkerRow label="HDL Cholesterol" data={data.bloodMarkers.hdl} userData={userData} onClick={() => handleMarkerClick('HDL Cholesterol', data.bloodMarkers.hdl)} />
                    <MarkerRow label="Triglycerides" data={data.bloodMarkers.triglycerides} userData={userData} onClick={() => handleMarkerClick('Triglycerides', data.bloodMarkers.triglycerides)} />
                    <MarkerRow label="ApoB" data={data.bloodMarkers.apoB} userData={userData} onClick={() => handleMarkerClick('ApoB', data.bloodMarkers.apoB)} />
                    <MarkerRow label="Lp(a)" data={data.bloodMarkers.lpA} userData={userData} onClick={() => handleMarkerClick('Lp(a)', data.bloodMarkers.lpA)} />
          </div>
                  <LastTestedDate data={data.bloodMarkers.totalCholesterol} />
                </div>

                {/* Complete Blood Count */}
                <div className="border border-gray-100 dark:border-gray-700 rounded-xl px-4 sm:px-6 py-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Complete Blood Count</h3>
                  <div className="space-y-6">
                    <MarkerRow label="White Blood Cells" data={data.bloodMarkers.whiteBloodCells} userData={userData} onClick={() => handleMarkerClick('White Blood Cells', data.bloodMarkers.whiteBloodCells)} />
                    <MarkerRow label="Red Blood Cells" data={data.bloodMarkers.redBloodCells} userData={userData} onClick={() => handleMarkerClick('Red Blood Cells', data.bloodMarkers.redBloodCells)} />
                    <MarkerRow label="Hematocrit" data={data.bloodMarkers.hematocrit} userData={userData} onClick={() => handleMarkerClick('Hematocrit', data.bloodMarkers.hematocrit)} />
                    <MarkerRow label="Hemoglobin" data={data.bloodMarkers.hemoglobin} userData={userData} onClick={() => handleMarkerClick('Hemoglobin', data.bloodMarkers.hemoglobin)} />
                    <MarkerRow label="Platelets" data={data.bloodMarkers.platelets} userData={userData} onClick={() => handleMarkerClick('Platelets', data.bloodMarkers.platelets)} />
                  </div>
                  <LastTestedDate data={data.bloodMarkers.whiteBloodCells} />
                </div>

                {/* Glucose Markers */}
                <div className="border border-gray-100 dark:border-gray-700 rounded-xl px-4 sm:px-6 py-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Glucose Markers</h3>
                  <div className="space-y-6">
                    <MarkerRow label="HbA1c" data={data.bloodMarkers.hba1c} userData={userData} onClick={() => handleMarkerClick('HbA1c', data.bloodMarkers.hba1c)} />
                    <MarkerRow label="Fasting Insulin" data={data.bloodMarkers.fastingInsulin} userData={userData} onClick={() => handleMarkerClick('Fasting Insulin', data.bloodMarkers.fastingInsulin)} />
                    <MarkerRow label="Glucose" data={data.bloodMarkers.glucose} userData={userData} onClick={() => handleMarkerClick('Glucose', data.bloodMarkers.glucose)} />
                  </div>
                  <LastTestedDate data={data.bloodMarkers.glucose} />
                </div>

                {/* Liver Markers */}
                <div className="border border-gray-100 dark:border-gray-700 rounded-xl px-4 sm:px-6 py-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Liver Markers</h3>
                  <div className="space-y-6">
                    <MarkerRow label="ALT" data={data.bloodMarkers.alt} userData={userData} onClick={() => handleMarkerClick('ALT', data.bloodMarkers.alt)} />
                    <MarkerRow label="AST" data={data.bloodMarkers.ast} userData={userData} onClick={() => handleMarkerClick('AST', data.bloodMarkers.ast)} />
                    <MarkerRow label="GGT" data={data.bloodMarkers.ggt} userData={userData} onClick={() => handleMarkerClick('GGT', data.bloodMarkers.ggt)} />
                  </div>
                  <LastTestedDate data={data.bloodMarkers.alt} />
                </div>

                {/* Kidney Markers */}
                <div className="border border-gray-100 dark:border-gray-700 rounded-xl px-4 sm:px-6 py-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Kidney Markers</h3>
                  <div className="space-y-6">
                    <MarkerRow label="eGFR" data={data.bloodMarkers.egfr} userData={userData} onClick={() => handleMarkerClick('eGFR', data.bloodMarkers.egfr)} />
                    <MarkerRow label="Cystatin C" data={data.bloodMarkers.cystatinC} userData={userData} onClick={() => handleMarkerClick('Cystatin C', data.bloodMarkers.cystatinC)} />
                    <MarkerRow label="BUN" data={data.bloodMarkers.bun} userData={userData} onClick={() => handleMarkerClick('BUN', data.bloodMarkers.bun)} />
                    <MarkerRow label="Creatinine" data={data.bloodMarkers.creatinine} userData={userData} onClick={() => handleMarkerClick('Creatinine', data.bloodMarkers.creatinine)} />
                    <MarkerRow label="Albumin" data={data.bloodMarkers.albumin} userData={userData} onClick={() => handleMarkerClick('Albumin', data.bloodMarkers.albumin)} />
                  </div>
                  <LastTestedDate data={data.bloodMarkers.egfr} />
                </div>

                {/* Sex Hormones */}
                <div className="border border-gray-100 dark:border-gray-700 rounded-xl px-4 sm:px-6 py-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Sex Hormones</h3>
                  <div className="space-y-6">
                    <MarkerRow label="Testosterone" data={data.bloodMarkers.testosterone} userData={userData} onClick={() => handleMarkerClick('Testosterone', data.bloodMarkers.testosterone)} />
                    <MarkerRow label="Free Testosterone" data={data.bloodMarkers.freeTesto} userData={userData} onClick={() => handleMarkerClick('Free Testosterone', data.bloodMarkers.freeTesto)} />
                    <MarkerRow label="Estradiol" data={data.bloodMarkers.estradiol} userData={userData} onClick={() => handleMarkerClick('Estradiol', data.bloodMarkers.estradiol)} />
                    <MarkerRow label="SHBG" data={data.bloodMarkers.shbg} userData={userData} onClick={() => handleMarkerClick('SHBG', data.bloodMarkers.shbg)} />
                  </div>
                  <LastTestedDate data={data.bloodMarkers.testosterone} />
                </div>

                {/* Thyroid Markers */}
                <div className="border border-gray-100 dark:border-gray-700 rounded-xl px-4 sm:px-6 py-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Thyroid Markers</h3>
                  <div className="space-y-6">
                    <MarkerRow label="T3" data={data.bloodMarkers.t3} userData={userData} onClick={() => handleMarkerClick('T3', data.bloodMarkers.t3)} />
                    <MarkerRow label="T4" data={data.bloodMarkers.t4} userData={userData} onClick={() => handleMarkerClick('T4', data.bloodMarkers.t4)} />
                    <MarkerRow label="TSH" data={data.bloodMarkers.tsh} userData={userData} onClick={() => handleMarkerClick('TSH', data.bloodMarkers.tsh)} />
                  </div>
                  <LastTestedDate data={data.bloodMarkers.t3} />
                </div>

                {/* Vitamins & Inflammation */}
                <div className="border border-gray-100 dark:border-gray-700 rounded-xl px-4 sm:px-6 py-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Vitamins & Inflammation</h3>
                  <div className="space-y-6">
                    <MarkerRow label="Vitamin D3" data={data.bloodMarkers.vitaminD} userData={userData} onClick={() => handleMarkerClick('Vitamin D3', data.bloodMarkers.vitaminD)} />
                    <MarkerRow label="hs-CRP" data={data.bloodMarkers.crp} userData={userData} onClick={() => handleMarkerClick('hs-CRP', data.bloodMarkers.crp)} />
                    <MarkerRow label="Homocysteine" data={data.bloodMarkers.homocysteine} userData={userData} onClick={() => handleMarkerClick('Homocysteine', data.bloodMarkers.homocysteine)} />
                    <MarkerRow label="IGF-1" data={data.bloodMarkers.igf1} userData={userData} onClick={() => handleMarkerClick('IGF-1', data.bloodMarkers.igf1)} />
                  </div>
                  <LastTestedDate data={data.bloodMarkers.vitaminD} />
                </div>

                {/* Iron Panel */}
                <div className="border border-gray-100 dark:border-gray-700 rounded-xl px-4 sm:px-6 py-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Iron Panel</h3>
                  <div className="space-y-6">
                    <MarkerRow label="Ferritin" data={data.bloodMarkers.ferritin} userData={userData} onClick={() => handleMarkerClick('Ferritin', data.bloodMarkers.ferritin)} />
                    <MarkerRow label="Serum Iron" data={data.bloodMarkers.serumIron} userData={userData} onClick={() => handleMarkerClick('Serum Iron', data.bloodMarkers.serumIron)} />
                    <MarkerRow label="TIBC" data={data.bloodMarkers.tibc} userData={userData} onClick={() => handleMarkerClick('TIBC', data.bloodMarkers.tibc)} />
                    <MarkerRow label="Transferrin Saturation" data={data.bloodMarkers.transferrinSaturation} userData={userData} onClick={() => handleMarkerClick('Transferrin Saturation', data.bloodMarkers.transferrinSaturation)} />
                  </div>
                  <LastTestedDate data={data.bloodMarkers.ferritin} />
                </div>

                {/* Electrolytes */}
                <div className="border border-gray-100 dark:border-gray-700 rounded-xl px-4 sm:px-6 py-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Electrolytes</h3>
                  <div className="space-y-6">
                    <MarkerRow label="Sodium" data={data.bloodMarkers.sodium} userData={userData} onClick={() => handleMarkerClick('Sodium', data.bloodMarkers.sodium)} />
                    <MarkerRow label="Potassium" data={data.bloodMarkers.potassium} userData={userData} onClick={() => handleMarkerClick('Potassium', data.bloodMarkers.potassium)} />
                    <MarkerRow label="Calcium" data={data.bloodMarkers.calcium} userData={userData} onClick={() => handleMarkerClick('Calcium', data.bloodMarkers.calcium)} />
                    <MarkerRow label="Phosphorus" data={data.bloodMarkers.phosphorus} userData={userData} onClick={() => handleMarkerClick('Phosphorus', data.bloodMarkers.phosphorus)} />
                    <MarkerRow label="Bicarbonate" data={data.bloodMarkers.bicarbonate} userData={userData} onClick={() => handleMarkerClick('Bicarbonate', data.bloodMarkers.bicarbonate)} />
                    <MarkerRow label="Chloride" data={data.bloodMarkers.chloride} userData={userData} onClick={() => handleMarkerClick('Chloride', data.bloodMarkers.chloride)} />
                  </div>
                  <LastTestedDate data={data.bloodMarkers.sodium} />
                </div>

                {/* CBC Differentials */}
                <div className="border border-gray-100 dark:border-gray-700 rounded-xl px-4 sm:px-6 py-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">White Blood Cell Differentials</h3>
                  <div className="space-y-6">
                    <MarkerRow label="Neutrophil Count" data={data.bloodMarkers.neutrophilCount} userData={userData} onClick={() => handleMarkerClick('Neutrophil Count', data.bloodMarkers.neutrophilCount)} />
                    <MarkerRow label="Neutrophil Percentage" data={data.bloodMarkers.neutrophilPercentage} userData={userData} onClick={() => handleMarkerClick('Neutrophil Percentage', data.bloodMarkers.neutrophilPercentage)} />
                    <MarkerRow label="Lymphocyte Count" data={data.bloodMarkers.lymphocyteCount} userData={userData} onClick={() => handleMarkerClick('Lymphocyte Count', data.bloodMarkers.lymphocyteCount)} />
                    <MarkerRow label="Lymphocyte Percentage" data={data.bloodMarkers.lymphocytePercentage} userData={userData} onClick={() => handleMarkerClick('Lymphocyte Percentage', data.bloodMarkers.lymphocytePercentage)} />
                    <MarkerRow label="Monocyte Count" data={data.bloodMarkers.monocyteCount} userData={userData} onClick={() => handleMarkerClick('Monocyte Count', data.bloodMarkers.monocyteCount)} />
                    <MarkerRow label="Monocyte Percentage" data={data.bloodMarkers.monocytePercentage} userData={userData} onClick={() => handleMarkerClick('Monocyte Percentage', data.bloodMarkers.monocytePercentage)} />
                    <MarkerRow label="Eosinophil Count" data={data.bloodMarkers.eosinophilCount} userData={userData} onClick={() => handleMarkerClick('Eosinophil Count', data.bloodMarkers.eosinophilCount)} />
                    <MarkerRow label="Eosinophil Percentage" data={data.bloodMarkers.eosinophilPercentage} userData={userData} onClick={() => handleMarkerClick('Eosinophil Percentage', data.bloodMarkers.eosinophilPercentage)} />
                    <MarkerRow label="Basophil Count" data={data.bloodMarkers.basophilCount} userData={userData} onClick={() => handleMarkerClick('Basophil Count', data.bloodMarkers.basophilCount)} />
                    <MarkerRow label="Basophil Percentage" data={data.bloodMarkers.basophilPercentage} userData={userData} onClick={() => handleMarkerClick('Basophil Percentage', data.bloodMarkers.basophilPercentage)} />
                  </div>
                  <LastTestedDate data={data.bloodMarkers.neutrophilCount} />
                </div>
                
                {/* Red Blood Cell Indices */}
                <div className="border border-gray-100 dark:border-gray-700 rounded-xl px-4 sm:px-6 py-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Red Blood Cell Indices</h3>
                  <div className="space-y-6">
                    <MarkerRow label="MCV" data={data.bloodMarkers.mcv} userData={userData} onClick={() => handleMarkerClick('MCV', data.bloodMarkers.mcv)} />
                    <MarkerRow label="MCH" data={data.bloodMarkers.mch} userData={userData} onClick={() => handleMarkerClick('MCH', data.bloodMarkers.mch)} />
                    <MarkerRow label="MCHC" data={data.bloodMarkers.mchc} userData={userData} onClick={() => handleMarkerClick('MCHC', data.bloodMarkers.mchc)} />
                    <MarkerRow label="RDW" data={data.bloodMarkers.rdw} userData={userData} onClick={() => handleMarkerClick('RDW', data.bloodMarkers.rdw)} />
                    <MarkerRow label="MPV" data={data.bloodMarkers.mpv} userData={userData} onClick={() => handleMarkerClick('MPV', data.bloodMarkers.mpv)} />
                  </div>
                  <LastTestedDate data={data.bloodMarkers.mcv} />
                </div>

                {/* Vitamins & Minerals */}
                <div className="border border-gray-100 dark:border-gray-700 rounded-xl px-4 sm:px-6 py-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Vitamins & Minerals</h3>
                  <div className="space-y-6">
                    <MarkerRow label="Vitamin D" data={data.bloodMarkers.vitaminD} userData={userData} onClick={() => handleMarkerClick('Vitamin D', data.bloodMarkers.vitaminD)} />
                    <MarkerRow label="Vitamin B12" data={data.bloodMarkers.vitaminB12} userData={userData} onClick={() => handleMarkerClick('Vitamin B12', data.bloodMarkers.vitaminB12)} />
                    <MarkerRow label="Folate" data={data.bloodMarkers.folate} userData={userData} onClick={() => handleMarkerClick('Folate', data.bloodMarkers.folate)} />
                    <MarkerRow label="Iron" data={data.bloodMarkers.iron} userData={userData} onClick={() => handleMarkerClick('Iron', data.bloodMarkers.iron)} />
                    <MarkerRow label="Magnesium" data={data.bloodMarkers.magnesium} userData={userData} onClick={() => handleMarkerClick('Magnesium', data.bloodMarkers.magnesium)} />
                    <MarkerRow label="RBC Magnesium" data={data.bloodMarkers.rbcMagnesium} userData={userData} onClick={() => handleMarkerClick('RBC Magnesium', data.bloodMarkers.rbcMagnesium)} />
                  </div>
                  <LastTestedDate data={data.bloodMarkers.vitaminD} />
                </div>

                {/* Additional Markers */}
                <div className="border border-gray-100 dark:border-gray-700 rounded-xl px-4 sm:px-6 py-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Additional Markers</h3>
                  <div className="space-y-6">
                                          <MarkerRow label="Creatine Kinase" data={data.bloodMarkers.creatineKinase} userData={userData} onClick={() => handleMarkerClick('Creatine Kinase', data.bloodMarkers.creatineKinase)} />
                    <MarkerRow label="Cortisol" data={data.bloodMarkers.cortisol} userData={userData} onClick={() => handleMarkerClick('Cortisol', data.bloodMarkers.cortisol)} />
                  </div>
                  <LastTestedDate data={data.bloodMarkers.creatineKinase} />
                </div>
            </div>
          </div>
        )}
      </div>

      {/* Blood Marker Detail Modal */}
      {showMarkerDetailModal && selectedMarker && (
        <BloodMarkerDetailModal
          isOpen={showMarkerDetailModal}
          onClose={() => setShowMarkerDetailModal(false)}
          markerName={selectedMarker.name}
          data={selectedMarker.data}
          userId={userId || ''}
        />
      )}

        <div className={`fixed bottom-4 left-4 bg-indigo-500/15 backdrop-blur py-2.5 rounded-full shadow-lg text-sm font-medium tracking-wide text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 transition-all duration-500 ease-out flex items-center ${
          isRevlyExpanded 
            ? 'bg-indigo-500/25 shadow-md gap-2 px-4' 
            : 'gap-1 px-3 group'
        }${!isRevlyExpanded ? ' hover:bg-indigo-500/25 hover:shadow-md hover:gap-2 hover:px-4' : ''}`}>
          <svg className="w-4 h-4 flex-shrink-0 transition-transform duration-500 ease-out" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <a 
            href="https://www.revly.health"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center overflow-hidden whitespace-nowrap font-semibold transition-all duration-500 ease-out ${
              isRevlyExpanded 
                ? 'w-auto opacity-100 transform translate-x-0' 
                : 'w-0 opacity-0 transform -translate-x-2'
            }${!isRevlyExpanded ? ' group-hover:w-auto group-hover:opacity-100 group-hover:translate-x-0' : ''}`}
          >
            <span className="transition-all duration-500 ease-out">Powered by Revly</span>
            <svg className="w-3.5 h-3.5 ml-1.5 flex-shrink-0 transition-all duration-500 ease-out" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M7 17L17 7M17 7H7M17 7V17" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
      </div>
    </main>
    </>
  );
}

// Helper Components
const MarkerRow = ({ label, data, userData, onClick }: { 
  label: string; 
  data: BloodMarker[]; 
  userData?: UserData | null;
  onClick?: () => void;
}) => {
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
    const status = getBloodMarkerStatus(value, label, userData || undefined);
    return status.charAt(0).toUpperCase() + status.slice(1);

  };

  const getStatusPillClasses = (status: string) => {
    switch (status) {
      case 'Abnormal': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'Normal': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Optimal': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Get reference ranges from centralized source
  const referenceRanges = getReferenceRanges(label, undefined, userData || undefined);
  const { optimalMin, optimalMax, normalMin, normalMax, abnormalText, normalText, optimalText } = referenceRanges;

  return (
    <div 
      className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3 border-b border-gray-100 dark:border-gray-700 pb-4 ${
        data.length > 0 && onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-none px-2 -mx-2 py-2 transition-colors' : ''
      }`}
      onClick={data.length > 0 && onClick ? onClick : undefined}
    >
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">{label}</span>
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {data.length > 0 && (
          <>
            <div className="group relative">
              {/* Updated Pill */}
              <div 
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-transform duration-200 group-hover:scale-105 ${
                  getStatusPillClasses(getStatusInfo(data[0].value))
                }`}
              >
                {getStatusInfo(data[0].value)}
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg py-3 px-4 shadow-sm border border-gray-100 dark:border-gray-700 w-[200px] sm:w-[250px]">
                  <div className="flex flex-col gap-3">
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-red-500 font-medium">Abnormal</span>
                        <span className="text-gray-600 dark:text-gray-400">{abnormalText}</span>
                      </div>
                      {normalText && (
                        <div className="flex items-center justify-between">
                          <span className="text-yellow-500 font-medium">Normal</span>
                          <span className="text-gray-600 dark:text-gray-400">{normalText}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-green-500 font-medium">Optimal</span>
                        <span className="text-gray-600 dark:text-gray-400">{optimalText}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-2 h-2 bg-white dark:bg-gray-800 border-r border-b border-gray-100 dark:border-gray-700 absolute -bottom-1 left-1/2 -translate-x-1/2 transform rotate-45"></div>
              </div>
            </div>
            {/* The TrendIndicator component rendering has been removed from here. Previously it was:
            {data.length > 1 && (
              <TrendIndicator 
                current={data[0].value}
                previous={data[1].value}
                decreaseIsGood={config.decreaseIsGood}
                min={config.min}
                max={config.max}
                className="min-w-[60px] justify-end"
              />
            )}
            */}
          </>
        )}
        <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white whitespace-nowrap">
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
    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-4 sm:mt-6">
      Last tested: {new Date(data[0].date).toLocaleDateString()}
    </p>
  )
);

// after fetchActivity helper
function buildActivityFeed(sleepResponse:any, workoutResponse:any): ActivityFeedItem[]{
  const feed: ActivityFeedItem[] = [];
  if(sleepResponse?.success && Array.isArray(sleepResponse.data)){
    sleepResponse.data.forEach((entry:any)=>{
      const stageDurations= entry.data?.stageDurations||{deep:0,core:0,rem:0,awake:0};
      const tot = stageDurations.deep+stageDurations.core+stageDurations.rem+stageDurations.awake;
      const pct=(d:number)=> tot? Math.round(d/tot*100):0;
      const fmtDur=(m:number)=>`${Math.floor(m/60)}h ${Math.round(m%60)}m`;
      feed.push({
        id: entry.timestamp||entry._id||crypto.randomUUID(),
        type:'sleep',
        startTime: entry.data.startDate,
        endTime: entry.data.endDate,
        title: fmtDur(stageDurations.deep+stageDurations.core+stageDurations.rem),
        subtitle:'Time asleep',
        metrics:{ 'Deep sleep':fmtDur(stageDurations.deep), 'Core sleep':fmtDur(stageDurations.core), 'REM sleep':fmtDur(stageDurations.rem), 'Awake':fmtDur(stageDurations.awake)},
        sleepStages:{
          deep:{percentage:pct(stageDurations.deep),duration:fmtDur(stageDurations.deep)},
          core:{percentage:pct(stageDurations.core),duration:fmtDur(stageDurations.core)},
          rem:{percentage:pct(stageDurations.rem),duration:fmtDur(stageDurations.rem)},
          awake:{percentage:pct(stageDurations.awake),duration:fmtDur(stageDurations.awake)}
        }
      });
    });
  }
  if(workoutResponse?.success && Array.isArray(workoutResponse.data)){
    workoutResponse.data.forEach((entry:any)=>{
      const durSec= entry.data.metrics?.duration||0;
      const min=Math.floor(durSec/60); const hrs=Math.floor(min/60); const mins=min%60;
      const durStr= hrs>0?`${hrs}h ${mins}m`:`${mins}m`;
      const dist= entry.data.metrics?.distance? `${(entry.data.metrics.distance*0.621371).toFixed(1)} mi`:undefined;
      const cal= entry.data.metrics?.energyBurned? `${Math.round(entry.data.metrics.energyBurned)} cal`:undefined;
      const hr= entry.data.metrics?.avgHeartRate? `${Math.round(entry.data.metrics.avgHeartRate)} bpm`:undefined;
      const metrics: Record<string,string>={}; if(durStr)metrics.Duration=durStr; if(dist)metrics.Distance=dist;if(cal)metrics.Calories=cal;if(hr)metrics['Avg Heart Rate']=hr;
      const actName= entry.data.activityType.replace(/_/g,' ').replace(/\b\w/g,(c:string)=>c.toUpperCase());
      feed.push({
        id: entry.timestamp||entry._id||crypto.randomUUID(),
        type:'workout',
        startTime: entry.data.startDate,
        endTime: entry.data.endDate,
        title:actName,
        subtitle:durStr,
        metrics,
        activityType:entry.data.activityType
      });
    });
  }
  feed.sort((a,b)=> new Date(b.startTime).getTime()-new Date(a.startTime).getTime());
  return feed;
}