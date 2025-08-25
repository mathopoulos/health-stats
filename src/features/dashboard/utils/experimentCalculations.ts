interface FitnessDataPoint {
  date: string;
  value: number;
}

interface BloodMarkerDataPoint {
  value: number;
  unit: string;
  date: string;
  referenceRange?: { min: number; max: number };
}

interface Experiment {
  startDate: string;
  endDate: string;
  status: 'active' | 'paused' | 'completed';
}

// Helper function to calculate progress percentage
export function calculateProgress(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  
  if (now >= end) return 100;
  if (now <= start) return 0;
  
  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  
  return Math.round((elapsed / total) * 100);
}

// Helper function to calculate trend indicator data (for fitness metrics)
export function calculateTrend(data: FitnessDataPoint[], metricType: string, experiment: Experiment) {
  if (!data || data.length < 4) return null; // Need at least 4 data points for meaningful comparison
  
  const halfLength = Math.floor(data.length / 2);
  
  // First half (earlier period)
  const firstHalf = data.slice(0, halfLength);
  const firstHalfAvg = firstHalf.reduce((sum, item) => sum + item.value, 0) / firstHalf.length;
  
  // Second half (later period) 
  const secondHalf = data.slice(halfLength);
  const secondHalfAvg = secondHalf.reduce((sum, item) => sum + item.value, 0) / secondHalf.length;
  
  if (firstHalfAvg === 0) return null;
  
  // Calculate experiment duration for time range label
  const startDate = new Date(experiment.startDate);
  const endDate = experiment.status === 'active' ? new Date() : new Date(experiment.endDate);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let timeRangeLabel = 'experiment period';
  if (diffDays >= 365) {
    timeRangeLabel = 'past year';
  } else if (diffDays >= 84) {
    timeRangeLabel = 'past few months';
  } else if (diffDays >= 28) {
    timeRangeLabel = 'past month';
  } else if (diffDays >= 14) {
    timeRangeLabel = 'past few weeks';
  } else {
    timeRangeLabel = 'past week';
  }
  
  return {
    current: secondHalfAvg,
    previous: firstHalfAvg,
    isBodyFat: metricType === 'Body Fat %' || metricType === 'bodyFat',
    timeRangeLabel
  };
}

// Helper function to calculate trend indicator data for blood markers
export function calculateBloodMarkerTrend(data: BloodMarkerDataPoint[], experiment: Experiment) {
  if (!data || data.length < 2) return null;
  const halfLength = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, halfLength);
  const secondHalf = data.slice(halfLength);
  const firstHalfAvg = firstHalf.reduce((sum, item) => sum + item.value, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, item) => sum + item.value, 0) / secondHalf.length;
  if (firstHalfAvg === 0) return null;
  // Determine reference range from any data point that has it
  const ref = data.find(dp => dp.referenceRange)?.referenceRange;
  const min = ref?.min ?? 0;
  const max = ref?.max ?? 100;
  return { current: secondHalfAvg, previous: firstHalfAvg, min, max };
}

// Helper function to get adaptive Y-axis domain
export function getAdaptiveYAxisDomain(data: FitnessDataPoint[], metricType: string): [number, number] {
  if (!data || data.length === 0) return [0, 100];
  
  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  
  // Add padding based on metric type
  let paddingPercent = 0.1; // 10% padding by default
  
  switch (metricType) {
    case 'weight':
    case 'Weight':
      paddingPercent = 0.05; // 5% padding for weight
      break;
    case 'bodyFat':
    case 'Body Fat %':
      paddingPercent = 0.15; // 15% padding for body fat
      break;
    case 'hrv':
    case 'HRV':
      paddingPercent = 0.2; // 20% padding for HRV
      break;
  }
  
  const padding = range * paddingPercent;
  return [Math.max(0, min - padding), max + padding];
}
