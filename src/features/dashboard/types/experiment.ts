export interface FitnessDataPoint {
  date: string;
  value: number;
}

export interface BloodMarkerDataPoint {
  value: number;
  unit: string;
  date: string;
  referenceRange?: { min: number; max: number };
}

export interface ExperimentFitnessData {
  [metricType: string]: FitnessDataPoint[];
}

export interface ExperimentBloodMarkerData {
  [markerName: string]: BloodMarkerDataPoint[];
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  frequency: string;
  duration: string;
  fitnessMarkers: string[];
  bloodMarkers: string[];
  startDate: string;
  endDate: string;
  status: 'active' | 'paused' | 'completed';
  progress?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExperimentDetailsModalProps {
  experiment: Experiment | null;
  experimentFitnessData: ExperimentFitnessData;
  experimentBloodMarkerData: ExperimentBloodMarkerData;
  isLoadingFitnessData: boolean;
  isLoadingBloodMarkerData: boolean;
  onClose: () => void;
}
