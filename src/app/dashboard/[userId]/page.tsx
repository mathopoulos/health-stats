'use client';

import { useEffect, useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Image from 'next/image';
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
import React from 'react';

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
  };
  loading: boolean;
}

type TimeFrame = 'daily' | 'weekly' | 'monthly' | 'yearly';

// New type definition for fixed time ranges
type TimeRange = 'last30days' | 'last3months' | 'last6months' | 'last1year' | 'last3years';

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
  creatineKinase: { min: 44, max: 1083, decreaseIsGood: null },
  cortisol: { min: 4, max: 22, decreaseIsGood: null }
};

const OWNER_ID = 'usr_W2LWz83EurLxZwfjqT_EL';

interface UserData {
  name: string;
  email: string;
  userId: string;
  profileImage?: string;
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
  const orderedMetricKeys = ['Duration', 'Distance', 'Pace', 'Calories', 'Avg Heart Rate'];
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
  deep: { target: 90, color: 'bg-indigo-600', label: 'Deep Sleep' }, // 1.5 hours
  core: { target: 240, color: 'bg-blue-500', label: 'Core Sleep' }, // 4 hours
  rem: { target: 90, color: 'bg-purple-500', label: 'REM Sleep' }  // 1.5 hours
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

  // Helper function to convert duration string (e.g., "1h 30m") to minutes
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
        
        return (
          <div key={stage} className="space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                  {stageData?.duration || '0min'}
                </span>
              </div>
              <div className="text-xs">
                <span className={`font-medium ${durationMinutes >= target ? 'text-green-500' : 'text-gray-500'}`}>
                  {durationMinutes}min
                </span>
                <span className="text-gray-400 dark:text-gray-500"> / {target}min target</span>
              </div>
            </div>
            <div className="relative h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div 
                className={`absolute left-0 top-0 h-full ${color} transition-all duration-500 ease-out`}
                style={{ width: `${percentageOfTarget}%` }}
              />
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
      creatineKinase: [], cortisol: []
    },
    loading: true
  });
  const [error, setError] = useState<string | null>(null);
  const [weightTimeRange, setWeightTimeRange] = useState<TimeRange>('last1year');
  const [bodyFatTimeRange, setBodyFatTimeRange] = useState<TimeRange>('last1year');
  const [hrvTimeRange, setHrvTimeRange] = useState<TimeRange>('last1year');
  const [vo2maxTimeRange, setVo2maxTimeRange] = useState<TimeRange>('last1year');
  const [dateRange, setDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });
  const [activeTab, setActiveTab] = useState<'home' | 'metrics' | 'blood'>('home');
  const [isAddResultsModalOpen, setIsAddResultsModalOpen] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);

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
            creatineKinase: [], cortisol: []
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

      const failedData = [];
      if (!heartRateData.success) failedData.push('heartRate');
      if (!weightData.success) failedData.push('weight');
      if (!bodyFatData.success) failedData.push('bodyFat');
      if (!hrvData.success) failedData.push('hrv');
      if (!vo2maxData.success) failedData.push('vo2max');
      if (!bloodMarkersData.success) failedData.push('bloodMarkers');
      if (!sleepResponse.success) failedData.push('sleep');
      if (!workoutResponse.success) failedData.push('workout');

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
        creatineKinase: [], cortisol: []
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
        'Cortisol': 'cortisol'
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

            const config = BLOOD_MARKER_CONFIG[configKey];
            
            processedBloodMarkers[key].push({
              date: entry.date,
              value: marker.value,
              unit: marker.unit,
              referenceRange: config ? {
                min: config.min,
                max: config.max
              } : marker.referenceRange || {
                min: 0,
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
          if (energyBurned) metrics['Calories'] = energyBurned;
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

      return {
        heartRate: heartRateData.data || [],
        weight: weightData.data || [],
        bodyFat: bodyFatData.data || [],
        hrv: hrvData.data || [],
        vo2max: vo2maxData.data || [],
        bloodMarkers: processedBloodMarkers,
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
          creatineKinase: [], cortisol: []
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
          creatineKinase: [], cortisol: []
        }
      }));
    }
  };

  useEffect(() => {
    if (status === 'loading') return;
    
    // Only redirect if there's no session and no userId parameter
    if (!session?.user && !userId) {
      router.push('/auth/signin');
      return;
    }

    const loadData = async () => {
      setData(prevData => ({ ...prevData, loading: true }));
      const newData = await fetchData();
      setData({ ...newData, loading: false });
    };

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

  // Add loading state
  if (status === 'loading' || data.loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your health data...</p>
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
      <main className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
        {/* Theme Toggle */}
        <div className="fixed bottom-4 right-4 z-[100]">
          <ThemeToggle />
        </div>
        
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
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
                      {userData?.name || 'Your'}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">Health Dashboard</p>
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
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Viewing user data</p>
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
            <div>
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('home')}
                  className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm ${
                    activeTab === 'home'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => setActiveTab('metrics')}
                  className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm ${
                    activeTab === 'metrics'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  Fitness Metrics
                </button>
                <button
                  onClick={() => setActiveTab('blood')}
                  className={`py-4 px-1 inline-flex items-center border-b-2 font-medium text-sm ${
                    activeTab === 'blood'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  Blood Markers
                </button>
              </nav>
            </div>
          </div>

          {activeTab === 'home' ? (
            <div className="space-y-6">
              {/* Bio Age Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Biological Age</h3>
                    <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">23.5</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Age Speed</h3>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">—</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">VO2 Max</h3>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {data.loading ? "..." : data.vo2max.length > 0 
                        ? `${Math.round(
                            data.vo2max
                              .slice(-30)
                              .reduce((sum, item) => sum + item.value, 0) / 
                            Math.min(data.vo2max.slice(-30).length, 30)
                          )}` 
                        : "—"}
                    </span>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">HRV</h3>
                    <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {data.loading ? "..." : data.hrv.length > 0 
                        ? `${Math.round(
                            data.hrv
                              .slice(-30)
                              .reduce((sum, item) => sum + item.value, 0) / 
                            Math.min(data.hrv.slice(-30).length, 30)
                          )}` 
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Activity Feed */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl px-10 py-8 shadow-sm">
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
                              <div className="mb-8">
                                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                                  {item.title}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  Time asleep
                                </div>
                              </div>

                              {/* Sleep stages */}
                              {item.sleepStages && (
                                <div>
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
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                  {Object.entries(item.metrics).map(([key, value]) => (
                                    <div key={key} className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-600">
                                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{key}</div>
                                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{value}</div>
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
            </div>
          ) : activeTab === 'metrics' ? (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Heart Rate Variability</span>
                    <div className="mt-2 flex items-baseline space-x-2">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
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
                              <TrendIndicator current={currentAvg} previous={prevAvg} isFitnessMetric={true} />
                            );
                          })()}
                        </div>
                      )}
                    </div>
                    <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">Last 30 days</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg VO2 Max</span>
                    <div className="mt-2 flex items-baseline space-x-2">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
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
                              <TrendIndicator current={currentAvg} previous={prevAvg} isFitnessMetric={true} />
                            );
                          })()}
                        </div>
                      )}
                    </div>
                    <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">Last 30 days</span>
                  </div>
                        </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Weight</span>
                    <div className="mt-2 flex items-baseline space-x-2">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
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
                              <TrendIndicator current={currentAvg} previous={prevAvg} isFitnessMetric={true} />
                            );
                          })()}
                        </div>
                      )}
                    </div>
                    <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">Last 30 days</span>
                  </div>
                          </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Body Fat</span>
                    <div className="mt-2 flex items-baseline space-x-2">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
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
                            const percentChange = prevAvg > 0
                              ? ((currentAvg - prevAvg) / prevAvg) * 100
                              : 0;
                            
                            // Only show if we have enough data
                            if (currentAvg > 0 && prevAvg > 0) {
                              return (
                                <TrendIndicator 
                                  current={currentAvg} 
                                  previous={prevAvg} 
                                  isFitnessMetric={true}
                                  isBodyFat={true}
                                />
                              );
                            }
                            return null;
                          })()}
                                </div>
                      )}
                                </div>
                    <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">Last 30 days</span>
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
                          return null;
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
                          return null;
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
                          return null;
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
                          return null;
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
          ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Blood Markers & Longevity</h2>
            </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Lipid Panel */}
                <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Lipid Panel</h3>
                  <div className="space-y-6">
                    <MarkerRow label="Total Cholesterol" data={data.bloodMarkers.totalCholesterol} />
                    <MarkerRow label="LDL Cholesterol" data={data.bloodMarkers.ldl} />
                    <MarkerRow label="HDL Cholesterol" data={data.bloodMarkers.hdl} />
                    <MarkerRow label="Triglycerides" data={data.bloodMarkers.triglycerides} />
                    <MarkerRow label="ApoB" data={data.bloodMarkers.apoB} />
                    <MarkerRow label="Lp(a)" data={data.bloodMarkers.lpA} />
          </div>
                  <LastTestedDate data={data.bloodMarkers.totalCholesterol} />
                </div>

                {/* Complete Blood Count */}
                <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Complete Blood Count</h3>
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
                <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Glucose Markers</h3>
                  <div className="space-y-6">
                    <MarkerRow label="HbA1c" data={data.bloodMarkers.hba1c} />
                    <MarkerRow label="Fasting Insulin" data={data.bloodMarkers.fastingInsulin} />
                    <MarkerRow label="Glucose" data={data.bloodMarkers.glucose} />
                  </div>
                  <LastTestedDate data={data.bloodMarkers.glucose} />
                </div>

                {/* Liver Markers */}
                <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Liver Markers</h3>
                  <div className="space-y-6">
                    <MarkerRow label="ALT" data={data.bloodMarkers.alt} />
                    <MarkerRow label="AST" data={data.bloodMarkers.ast} />
                    <MarkerRow label="GGT" data={data.bloodMarkers.ggt} />
                  </div>
                  <LastTestedDate data={data.bloodMarkers.alt} />
                </div>

                {/* Kidney Markers */}
                <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Kidney Markers</h3>
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
                <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Sex Hormones</h3>
                  <div className="space-y-6">
                    <MarkerRow label="Testosterone" data={data.bloodMarkers.testosterone} />
                    <MarkerRow label="Free Testosterone" data={data.bloodMarkers.freeTesto} />
                    <MarkerRow label="Estradiol" data={data.bloodMarkers.estradiol} />
                    <MarkerRow label="SHBG" data={data.bloodMarkers.shbg} />
                  </div>
                  <LastTestedDate data={data.bloodMarkers.testosterone} />
                </div>

                {/* Thyroid Markers */}
                <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Thyroid Markers</h3>
                  <div className="space-y-6">
                    <MarkerRow label="T3" data={data.bloodMarkers.t3} />
                    <MarkerRow label="T4" data={data.bloodMarkers.t4} />
                    <MarkerRow label="TSH" data={data.bloodMarkers.tsh} />
                  </div>
                  <LastTestedDate data={data.bloodMarkers.t3} />
                </div>

                {/* Vitamins & Inflammation */}
                <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Vitamins & Inflammation</h3>
                  <div className="space-y-6">
                    <MarkerRow label="Vitamin D3" data={data.bloodMarkers.vitaminD} />
                    <MarkerRow label="hs-CRP" data={data.bloodMarkers.crp} />
                    <MarkerRow label="Homocysteine" data={data.bloodMarkers.homocysteine} />
                    <MarkerRow label="IGF-1" data={data.bloodMarkers.igf1} />
                  </div>
                  <LastTestedDate data={data.bloodMarkers.vitaminD} />
                </div>

                {/* Iron Panel */}
                <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Iron Panel</h3>
                  <div className="space-y-6">
                    <MarkerRow label="Ferritin" data={data.bloodMarkers.ferritin} />
                    <MarkerRow label="Serum Iron" data={data.bloodMarkers.serumIron} />
                    <MarkerRow label="TIBC" data={data.bloodMarkers.tibc} />
                    <MarkerRow label="Transferrin Saturation" data={data.bloodMarkers.transferrinSaturation} />
                  </div>
                  <LastTestedDate data={data.bloodMarkers.ferritin} />
                </div>

                {/* Electrolytes */}
                <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Electrolytes</h3>
                  <div className="space-y-6">
                    <MarkerRow label="Sodium" data={data.bloodMarkers.sodium} />
                    <MarkerRow label="Potassium" data={data.bloodMarkers.potassium} />
                    <MarkerRow label="Calcium" data={data.bloodMarkers.calcium} />
                    <MarkerRow label="Phosphorus" data={data.bloodMarkers.phosphorus} />
                    <MarkerRow label="Bicarbonate" data={data.bloodMarkers.bicarbonate} />
                    <MarkerRow label="Chloride" data={data.bloodMarkers.chloride} />
                  </div>
                  <LastTestedDate data={data.bloodMarkers.sodium} />
                </div>

                {/* CBC Differentials */}
                <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">White Blood Cell Differentials</h3>
                  <div className="space-y-6">
                    <MarkerRow label="Neutrophil Count" data={data.bloodMarkers.neutrophilCount} />
                    <MarkerRow label="Neutrophil Percentage" data={data.bloodMarkers.neutrophilPercentage} />
                    <MarkerRow label="Lymphocyte Count" data={data.bloodMarkers.lymphocyteCount} />
                    <MarkerRow label="Lymphocyte Percentage" data={data.bloodMarkers.lymphocytePercentage} />
                    <MarkerRow label="Monocyte Count" data={data.bloodMarkers.monocyteCount} />
                    <MarkerRow label="Monocyte Percentage" data={data.bloodMarkers.monocytePercentage} />
                    <MarkerRow label="Eosinophil Count" data={data.bloodMarkers.eosinophilCount} />
                    <MarkerRow label="Eosinophil Percentage" data={data.bloodMarkers.eosinophilPercentage} />
                    <MarkerRow label="Basophil Count" data={data.bloodMarkers.basophilCount} />
                    <MarkerRow label="Basophil Percentage" data={data.bloodMarkers.basophilPercentage} />
                  </div>
                  <LastTestedDate data={data.bloodMarkers.neutrophilCount} />
                </div>
                
                {/* Red Blood Cell Indices */}
                <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Red Blood Cell Indices</h3>
                  <div className="space-y-6">
                    <MarkerRow label="MCV" data={data.bloodMarkers.mcv} />
                    <MarkerRow label="MCH" data={data.bloodMarkers.mch} />
                    <MarkerRow label="MCHC" data={data.bloodMarkers.mchc} />
                    <MarkerRow label="RDW" data={data.bloodMarkers.rdw} />
                    <MarkerRow label="MPV" data={data.bloodMarkers.mpv} />
                  </div>
                  <LastTestedDate data={data.bloodMarkers.mcv} />
                </div>

                {/* Vitamins & Minerals */}
                <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Vitamins & Minerals</h3>
                  <div className="space-y-6">
                    <MarkerRow label="Vitamin D" data={data.bloodMarkers.vitaminD} />
                    <MarkerRow label="Vitamin B12" data={data.bloodMarkers.vitaminB12} />
                    <MarkerRow label="Folate" data={data.bloodMarkers.folate} />
                    <MarkerRow label="Iron" data={data.bloodMarkers.iron} />
                    <MarkerRow label="Magnesium" data={data.bloodMarkers.magnesium} />
                    <MarkerRow label="RBC Magnesium" data={data.bloodMarkers.rbcMagnesium} />
                  </div>
                  <LastTestedDate data={data.bloodMarkers.vitaminD} />
                </div>

                {/* Additional Markers */}
                <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Additional Markers</h3>
                  <div className="space-y-6">
                    <MarkerRow label="Creatine Kinase" data={data.bloodMarkers.creatineKinase} />
                    <MarkerRow label="Cortisol" data={data.bloodMarkers.cortisol} />
                  </div>
                  <LastTestedDate data={data.bloodMarkers.creatineKinase} />
                </div>
            </div>
          </div>
        )}
      </div>
        <div className="fixed bottom-4 left-4 bg-indigo-500/15 hover:bg-indigo-500/25 backdrop-blur px-3 py-2.5 rounded-full shadow-lg text-sm font-medium tracking-wide text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 hover:shadow-md transition-all duration-300 flex items-center gap-1 hover:gap-2 hover:px-4 group">
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <a 
            href="https://www.revly.health"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center w-0 overflow-hidden group-hover:w-auto transition-all duration-300 ease-in-out whitespace-nowrap font-semibold"
          >
            Powered by Revly
            <svg className="w-3.5 h-3.5 ml-1.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M7 17L17 7M17 7H7M17 7V17" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
      </div>
    </main>
    </>
  );
}

// Helper Components
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
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3 border-b border-gray-100 dark:border-gray-700 pb-4">
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">{label}</span>
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {data.length > 0 && (
          <>
            <div className="group relative">
              <div 
                className={`w-2 h-2 rounded-full transition-transform duration-200 group-hover:scale-125 ${
                  getDotColor(data[0].value)
                }`}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg py-3 px-4 shadow-sm border border-gray-100 dark:border-gray-700 w-[200px] sm:w-[250px]">
                  <div className="flex flex-col gap-3">
                    <div className={`text-sm font-medium ${getStatusColor(getStatusInfo(data[0].value))}`}>
                      {getStatusInfo(data[0].value)}
                                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-red-500 font-medium">Abnormal</span>
                        <span className="text-gray-600 dark:text-gray-400">&lt;{config.min} or &gt;{config.max}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-yellow-500 font-medium">Normal</span>
                        <span className="text-gray-600 dark:text-gray-400">{config.min}-{config.max}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-green-500 font-medium">Optimal</span>
                        <span className="text-gray-600 dark:text-gray-400">{optimalMin.toFixed(1)}-{optimalMax.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-2 h-2 bg-white dark:bg-gray-800 border-r border-b border-gray-100 dark:border-gray-700 absolute -bottom-1 left-1/2 -translate-x-1/2 transform rotate-45"></div>
              </div>
            </div>
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