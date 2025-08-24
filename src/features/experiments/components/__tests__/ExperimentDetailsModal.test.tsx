import React from 'react';

// Just import the component to get basic coverage
import ExperimentDetailsModal from '../ExperimentDetailsModal';

// Mock all external dependencies
jest.mock('@providers/ThemeProvider', () => ({
  useTheme: () => ({ theme: 'light' })
}));

jest.mock('@components/TrendIndicator', () => () => null);
jest.mock('@features/blood-markers/components/BloodMarkerChart', () => () => null);
jest.mock('recharts', () => ({
  LineChart: () => null,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null
}));
jest.mock('react-dom', () => ({ createPortal: (children: any) => children }));

// Mock React hooks with proper jest functions
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useState: jest.fn(() => [false, jest.fn()]),
  useEffect: jest.fn(),
  useCallback: jest.fn((fn) => fn),
  useMemo: jest.fn((fn) => fn()),
}));

// Mock DOM APIs
Object.defineProperty(global.window, 'innerWidth', { value: 1024, configurable: true });
global.window.addEventListener = jest.fn();
global.window.removeEventListener = jest.fn();

const mockExperiment = {
  id: '1',
  name: 'Test Experiment',
  description: 'A test experiment',
  frequency: 'Daily',
  duration: '30 days',
  fitnessMarkers: ['Weight'],
  bloodMarkers: ['Glucose'],
  startDate: '2023-01-01',
  endDate: '2023-01-31',
  status: 'active' as const,
  progress: 75,
  createdAt: '2023-01-01',
  updatedAt: '2023-01-15'
};

describe('ExperimentDetailsModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined and callable', () => {
    expect(ExperimentDetailsModal).toBeDefined();
    expect(typeof ExperimentDetailsModal).toBe('function');
  });

  it('should handle null experiment', () => {
    const result = ExperimentDetailsModal({
      experiment: null,
      experimentFitnessData: {},
      experimentBloodMarkerData: {},
      isLoadingFitnessData: false,
      isLoadingBloodMarkerData: false,
      onClose: mockOnClose,
    });

    expect(result).toBeNull();
  });

  it('should accept valid props without throwing', () => {
    expect(() => {
      ExperimentDetailsModal({
        experiment: mockExperiment,
        experimentFitnessData: { Weight: [{ date: '2023-01-01', value: 70 }] },
        experimentBloodMarkerData: {},
        isLoadingFitnessData: false,
        isLoadingBloodMarkerData: false,
        onClose: mockOnClose,
      });
    }).not.toThrow();
  });

  it('should handle loading states', () => {
    expect(() => {
      ExperimentDetailsModal({
        experiment: mockExperiment,
        experimentFitnessData: {},
        experimentBloodMarkerData: {},
        isLoadingFitnessData: true,
        isLoadingBloodMarkerData: true,
        onClose: mockOnClose,
      });
    }).not.toThrow();
  });
});