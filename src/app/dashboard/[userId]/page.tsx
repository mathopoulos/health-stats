'use client';

import { useEffect, useState } from 'react';
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

const OWNER_ID = 'usr_W2LWz83EurLxZwfjqT_EL';

interface UserData {
  name: string;
  email: string;
  userId: string;
  profileImage?: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId') || session?.user?.id;
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
    },
    loading: true
  });
  const [error, setError] = useState<string | null>(null);
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
  const [userData, setUserData] = useState<UserData | null>(null);

  // Add useEffect for title update
  useEffect(() => {
    if (userData?.name) {
      document.title = `${userData.name}'s Health Stats`;
    } else {
      document.title = 'Health Stats';
    }
  }, [userData?.name]);

  const fetchData = async () => {
    try {
        setError(null);
      if (!session?.user) {
        console.error('No user session available');
        setError('Please sign in to view your health data');
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

      const [heartRateRes, weightRes, bodyFatRes, hrvRes, vo2maxRes, bloodMarkersRes] = await Promise.all([
        fetch(`/api/health-data?type=heartRate&userId=${userId}`),
        fetch(`/api/health-data?type=weight&userId=${userId}`),
        fetch(`/api/health-data?type=bodyFat&userId=${userId}`),
        fetch(`/api/health-data?type=hrv&userId=${userId}`),
        fetch(`/api/health-data?type=vo2max&userId=${userId}`),
        fetch(`/api/blood-markers?userId=${userId}`)
      ]);

      // Check if any request failed
      if (!heartRateRes.ok || !weightRes.ok || !bodyFatRes.ok || !hrvRes.ok || !vo2maxRes.ok || !bloodMarkersRes.ok) {
        throw new Error('Failed to fetch some health data');
      }

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
        'LDL Cholesterol': 'ldl',
        'HDL Cholesterol': 'hdl',
        'Triglycerides': 'triglycerides',
        'ApoB': 'apoB',
        'Lp(a)': 'lpA',
        'White Blood Cell Count': 'whiteBloodCells',
        'Red Blood Cell Count': 'redBloodCells',
        'Hematocrit': 'hematocrit',
        'Hemoglobin': 'hemoglobin',
        'Platelet Count': 'platelets',
        'HbA1c': 'hba1c',
        'Fasting Insulin': 'fastingInsulin',
        'Glucose': 'glucose',
        'ALT (SGPT)': 'alt',
        'AST (SGOT)': 'ast',
        'GGT': 'ggt',
        'eGFR': 'egfr',
        'Cystatin C': 'cystatinC',
        'Blood Urea Nitrogen': 'bun',
        'Creatinine': 'creatinine',
        'Albumin': 'albumin',
        'Testosterone': 'testosterone',
        'Free Testosterone': 'freeTesto',
        'Estradiol': 'estradiol',
        'SHBG': 'shbg',
        'Free T3': 't3',
        'Free T4': 't4',
        'Thyroid Stimulating Hormone (TSH)': 'tsh',
        'Vitamin D, 25-Hydroxy': 'vitaminD',
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
        'Carbon Dioxide': 'bicarbonate',
        'Chloride': 'chloride'
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
      if (!userId) return;
      
      try {
        const response = await fetch(`/api/users/${userId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUserData(data.user);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
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

  // Add loading state
  if (status === 'loading' || data.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your health data...</p>
        </div>
      </div>
    );
  }

  // Add error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-gray-600">{error}</p>
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

  return (
    <>
      <Head>
        <title>{userData?.name ? `${userData.name}'s Health Stats` : 'Health Stats'}</title>
      </Head>
      <Toaster position="bottom-right" />
      <main className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
        {/* Fixed position theme toggle */}
        <div className="fixed bottom-16 right-4 z-[100]">
          <div className="bg-white/10 dark:bg-gray-900/30 backdrop-blur-lg rounded-full p-3 shadow-lg hover:shadow-xl transition-all scale-110 hover:scale-125">
            <ThemeToggle />
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              {userId === session?.user?.id ? (
                <>
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                    {userData?.profileImage ? (
                      <Image
                        src={userData.profileImage}
                        alt="Profile"
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {userData?.name || 'Your'}
                    </h1>
                    <div className="flex items-center gap-2">
                      <p className="text-gray-600 dark:text-gray-400">Health Dashboard</p>
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
                </>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {userData?.name ? `${userData.name}'s` : ''} Health Dashboard
                    </h1>
                    <div className="flex items-center gap-2">
                      <p className="text-gray-600 dark:text-gray-400">Viewing user data</p>
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

          {activeTab === 'metrics' ? (
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
                            const percentChange = ((currentAvg - prevAvg) / prevAvg) * 100;
                            const isIncrease = percentChange > 0;
                            return (
                              <TrendIndicator current={currentAvg} previous={prevAvg} isBodyFat={true} isFitnessMetric={true} />
                            );
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
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Heart Rate Variability</h2>
                  <div className="flex items-center">
                    <select
                      value={hrvTimeframe}
                      onChange={(e) => setHrvTimeframe(e.target.value as TimeFrame)}
                      className="mr-6 h-9 pl-3 pr-8 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-600 focus:border-indigo-400 dark:focus:border-indigo-500 appearance-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
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
                    <div className="flex items-center h-9 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <button
                        onClick={() => handleTimeframeNavigation('prev', hrvDate, setHrvDate, hrvTimeframe)}
                        disabled={isNavigationDisabled('prev', hrvDate, hrvTimeframe)}
                        className={`h-full px-2 rounded-l-lg hover:bg-white dark:hover:bg-gray-600 hover:shadow-sm transition-all ${
                          isNavigationDisabled('prev', hrvDate, hrvTimeframe) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mx-4 min-w-[100px] text-center">
                        {getTimeframeLabel(hrvDate, hrvTimeframe)}
                      </span>
                      <button
                        onClick={() => handleTimeframeNavigation('next', hrvDate, setHrvDate, hrvTimeframe)}
                        disabled={isNavigationDisabled('next', hrvDate, hrvTimeframe)}
                        className={`h-full px-2 rounded-r-lg hover:bg-white dark:hover:bg-gray-600 hover:shadow-sm transition-all ${
                          isNavigationDisabled('next', hrvDate, hrvTimeframe) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
            <div className="h-[300px]">
                  {data.loading && (
                    <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                      Loading data...
                    </div>
                  )}
                  {!hasHRVData && !data.loading && (
                    <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
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
                            backgroundColor: 'var(--tooltip-bg)',
                            border: 'none',
                            borderRadius: '4px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            fontSize: '12px',
                            padding: '8px',
                            color: 'var(--tooltip-text)'
                          }}
                          labelStyle={{ color: 'var(--tooltip-label)', marginBottom: '4px' }}
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">VO2 Max</h2>
                  <div className="flex items-center">
                    <select
                      value={vo2maxTimeframe}
                      onChange={(e) => setVo2maxTimeframe(e.target.value as TimeFrame)}
                      className="mr-6 h-9 pl-3 pr-8 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-600 focus:border-indigo-400 dark:focus:border-indigo-500 appearance-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
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
                    <div className="flex items-center h-9 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <button
                        onClick={() => handleTimeframeNavigation('prev', vo2maxDate, setVo2maxDate, vo2maxTimeframe)}
                        disabled={isNavigationDisabled('prev', vo2maxDate, vo2maxTimeframe)}
                        className={`h-full px-2 rounded-l-lg hover:bg-white dark:hover:bg-gray-600 hover:shadow-sm transition-all ${
                          isNavigationDisabled('prev', vo2maxDate, vo2maxTimeframe) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mx-4 min-w-[100px] text-center">
                        {getTimeframeLabel(vo2maxDate, vo2maxTimeframe)}
                      </span>
                      <button
                        onClick={() => handleTimeframeNavigation('next', vo2maxDate, setVo2maxDate, vo2maxTimeframe)}
                        disabled={isNavigationDisabled('next', vo2maxDate, vo2maxTimeframe)}
                        className={`h-full px-2 rounded-r-lg hover:bg-white dark:hover:bg-gray-600 hover:shadow-sm transition-all ${
                          isNavigationDisabled('next', vo2maxDate, vo2maxTimeframe) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Weight</h2>
                  <div className="flex items-center">
                    <select
                      value={weightTimeframe}
                      onChange={(e) => setWeightTimeframe(e.target.value as TimeFrame)}
                      className="mr-6 h-9 pl-3 pr-8 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-600 focus:border-indigo-400 dark:focus:border-indigo-500 appearance-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
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
                    <div className="flex items-center h-9 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <button
                        onClick={() => handleTimeframeNavigation('prev', weightDate, setWeightDate, weightTimeframe)}
                        disabled={isNavigationDisabled('prev', weightDate, weightTimeframe)}
                        className={`h-full px-2 rounded-l-lg hover:bg-white dark:hover:bg-gray-600 hover:shadow-sm transition-all ${
                          isNavigationDisabled('prev', weightDate, weightTimeframe) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mx-4 min-w-[100px] text-center">
                        {getTimeframeLabel(weightDate, weightTimeframe)}
                      </span>
                      <button
                        onClick={() => handleTimeframeNavigation('next', weightDate, setWeightDate, weightTimeframe)}
                        disabled={isNavigationDisabled('next', weightDate, weightTimeframe)}
                        className={`h-full px-2 rounded-r-lg hover:bg-white dark:hover:bg-gray-600 hover:shadow-sm transition-all ${
                          isNavigationDisabled('next', weightDate, weightTimeframe) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Body Fat</h2>
                  <div className="flex items-center">
                    <select
                      value={bodyFatTimeframe}
                      onChange={(e) => setBodyFatTimeframe(e.target.value as TimeFrame)}
                      className="mr-6 h-9 pl-3 pr-8 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-600 focus:border-indigo-400 dark:focus:border-indigo-500 appearance-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
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
                    <div className="flex items-center h-9 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <button
                        onClick={() => handleTimeframeNavigation('prev', bodyFatDate, setBodyFatDate, bodyFatTimeframe)}
                        disabled={isNavigationDisabled('prev', bodyFatDate, bodyFatTimeframe)}
                        className={`h-full px-2 rounded-l-lg hover:bg-white dark:hover:bg-gray-600 hover:shadow-sm transition-all ${
                          isNavigationDisabled('prev', bodyFatDate, bodyFatTimeframe) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mx-4 min-w-[100px] text-center">
                        {getTimeframeLabel(bodyFatDate, bodyFatTimeframe)}
                      </span>
                      <button
                        onClick={() => handleTimeframeNavigation('next', bodyFatDate, setBodyFatDate, bodyFatTimeframe)}
                        disabled={isNavigationDisabled('next', bodyFatDate, bodyFatTimeframe)}
                        className={`h-full px-2 rounded-r-lg hover:bg-white dark:hover:bg-gray-600 hover:shadow-sm transition-all ${
                          isNavigationDisabled('next', bodyFatDate, bodyFatTimeframe) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    </>
  );
}

// Helper Components
const TrendIndicator = ({ 
  current, 
  previous, 
  isBodyFat = false,
  decreaseIsGood = null,
  min = 0,
  max = 100,
  isFitnessMetric = false
}: { 
  current: number, 
  previous: number, 
  isBodyFat?: boolean,
  decreaseIsGood?: boolean | null,
  min?: number,
  max?: number,
  isFitnessMetric?: boolean
}) => {
  const percentChange = ((current - previous) / previous) * 100;
  const isIncrease = percentChange > 0;

  // Handle fitness metrics differently
  if (isFitnessMetric) {
    let color = 'text-gray-500';
    if (isBodyFat) {
      // For body fat, decrease is good
      color = !isIncrease ? 'text-green-500' : 'text-red-500';
    } else {
      // For HRV, VO2 max, and weight, increase is good
      color = isIncrease ? 'text-green-500' : 'text-red-500';
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
  }
  
  // Blood marker logic
  const range = max - min;
  const optimalMin = min + (range * 0.25);
  const optimalMax = max - (range * 0.25);

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

  let color = 'text-gray-500';
  if (isMovingTowardsOptimal()) {
    color = 'text-green-500';
  } else if (isMovingFromOptimalToNormal() || isMovingTowardsAbnormal()) {
    color = 'text-red-500';
  } else if (decreaseIsGood !== null) {
    color = (isIncrease !== decreaseIsGood) ? 'text-green-500' : 'text-red-500';
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
    <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-4">
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</span>
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
                <div className="bg-white dark:bg-gray-800 rounded-lg py-3 px-4 shadow-sm border border-gray-100 dark:border-gray-700 min-w-[200px]">
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
              />
            )}
          </>
        )}
        <span className="text-lg font-semibold text-gray-900 dark:text-white">
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
    <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
      Last tested: {new Date(data[0].date).toLocaleDateString()}
    </p>
  )
);