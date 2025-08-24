import { renderHook, waitFor, act } from '@testing-library/react';
import { useExperiments, useExperimentFitnessData, useExperimentBloodMarkerData } from '../useExperimentData';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock the calculateProgress function
jest.mock('../../utils/experimentCalculations', () => ({
  calculateProgress: (startDate: string, endDate: string) => {
    // Simple mock that returns 50% progress
    return 50;
  },
  getApiParameterName: jest.fn().mockImplementation((displayName: string) => {
    const parameterMap: Record<string, string> = {
      'HRV': 'hrv',
      'VO2 Max': 'vo2max',
      'Weight': 'weight',
      'Body Fat %': 'bodyFat',
      'Heart Rate': 'heartRate'
    };
    return parameterMap[displayName] || displayName.toLowerCase();
  })
}));

describe('useExperiments', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    console.error = jest.fn();
  });

  it('should return loading state initially', () => {
    const { result } = renderHook(() => useExperiments('user123'));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.experiments).toEqual([]);
    expect(result.current.activeExperiments).toEqual([]);
    expect(result.current.pastExperiments).toEqual([]);
  });

  it('should not fetch when no userId is provided', async () => {
    const { result } = renderHook(() => useExperiments(undefined));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should fetch experiments successfully', async () => {
    const mockExperiments = [
      {
        id: '1',
        name: 'Test Experiment',
        description: 'A test experiment',
        frequency: 'Daily',
        duration: '30 days',
        fitnessMarkers: ['Weight'],
        bloodMarkers: ['Glucose'],
        startDate: '2023-01-01',
        endDate: '2023-01-31',
        status: 'active',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01'
      }
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockExperiments })
    });

    const { result } = renderHook(() => useExperiments('user123'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.experiments).toHaveLength(1);
    expect(result.current.experiments[0].progress).toBe(50);
    expect(result.current.activeExperiments).toHaveLength(1);
    expect(result.current.pastExperiments).toHaveLength(0);
  });

  it('should handle fetch error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useExperiments('user123'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.experiments).toEqual([]);
  });

  it('should handle non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404
    });

    const { result } = renderHook(() => useExperiments('user123'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch experiments');
  });

  it('should filter active and past experiments correctly', async () => {
    const mockExperiments = [
      {
        id: '1',
        name: 'Active Experiment',
        description: 'An active experiment',
        frequency: 'Daily',
        duration: '30 days',
        fitnessMarkers: ['Weight'],
        bloodMarkers: [],
        startDate: '2023-01-01',
        endDate: '2023-01-31',
        status: 'active',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01'
      },
      {
        id: '2',
        name: 'Completed Experiment',
        description: 'A completed experiment',
        frequency: 'Weekly',
        duration: '8 weeks',
        fitnessMarkers: [],
        bloodMarkers: ['Glucose'],
        startDate: '2022-01-01',
        endDate: '2022-03-01',
        status: 'completed',
        createdAt: '2022-01-01',
        updatedAt: '2022-03-01'
      }
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockExperiments })
    });

    const { result } = renderHook(() => useExperiments('user123'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.activeExperiments).toHaveLength(1);
    expect(result.current.activeExperiments[0].name).toBe('Active Experiment');
    expect(result.current.pastExperiments).toHaveLength(1);
    expect(result.current.pastExperiments[0].name).toBe('Completed Experiment');
  });
});

describe('useExperimentFitnessData', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    console.error = jest.fn();
  });

  it('should initialize with empty data', () => {
    const { result } = renderHook(() => useExperimentFitnessData('user123'));

    expect(result.current.experimentFitnessData).toEqual({});
    expect(result.current.isLoadingFitnessData).toBe(false);
    expect(typeof result.current.fetchExperimentFitnessData).toBe('function');
  });

  it('should not fetch when experiment has no fitness markers', async () => {
    const { result } = renderHook(() => useExperimentFitnessData('user123'));

    const mockExperiment = {
      id: '1',
      name: 'Test',
      description: 'Test',
      frequency: 'Daily',
      duration: '30 days',
      fitnessMarkers: [],
      bloodMarkers: ['Glucose'],
      startDate: '2023-01-01',
      endDate: '2023-01-31',
      status: 'active' as const,
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01'
    };

    await result.current.fetchExperimentFitnessData(mockExperiment);

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.isLoadingFitnessData).toBe(false);
  });

  it('should fetch fitness data successfully', async () => {
    const mockHealthData = {
      data: [
        { date: '2023-01-01', value: 150 },
        { date: '2023-01-15', value: 148 }
      ]
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockHealthData
    });

    const { result } = renderHook(() => useExperimentFitnessData('user123'));

    const mockExperiment = {
      id: '1',
      name: 'Test',
      description: 'Test',
      frequency: 'Daily',
      duration: '30 days',
      fitnessMarkers: ['Weight'],
      bloodMarkers: [],
      startDate: '2023-01-01',
      endDate: '2023-01-31',
      status: 'active' as const,
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01'
    };

    await act(async () => {
      await result.current.fetchExperimentFitnessData(mockExperiment);
    });

    await waitFor(() => {
      expect(result.current.isLoadingFitnessData).toBe(false);
    });

    expect(result.current.experimentFitnessData['Weight']).toHaveLength(2);
  });

  it('should handle fetch errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useExperimentFitnessData('user123'));

    const mockExperiment = {
      id: '1',
      name: 'Test',
      description: 'Test',
      frequency: 'Daily',
      duration: '30 days',
      fitnessMarkers: ['Weight'],
      bloodMarkers: [],
      startDate: '2023-01-01',
      endDate: '2023-01-31',
      status: 'active' as const,
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01'
    };

    await act(async () => {
      await result.current.fetchExperimentFitnessData(mockExperiment);
    });

    await waitFor(() => {
      expect(result.current.isLoadingFitnessData).toBe(false);
    });

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Error fetching Weight data:'), 
      expect.any(Error)
    );
  });
});

describe('useExperimentBloodMarkerData', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    console.error = jest.fn();
  });

  it('should initialize with empty data', () => {
    const { result } = renderHook(() => useExperimentBloodMarkerData('user123'));

    expect(result.current.experimentBloodMarkerData).toEqual({});
    expect(result.current.isLoadingBloodMarkerData).toBe(false);
    expect(typeof result.current.fetchExperimentBloodMarkerData).toBe('function');
  });

  it('should not fetch when experiment has no blood markers', async () => {
    const { result } = renderHook(() => useExperimentBloodMarkerData('user123'));

    const mockExperiment = {
      id: '1',
      name: 'Test',
      description: 'Test',
      frequency: 'Daily',
      duration: '30 days',
      fitnessMarkers: ['Weight'],
      bloodMarkers: [],
      startDate: '2023-01-01',
      endDate: '2023-01-31',
      status: 'active' as const,
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01'
    };

    await result.current.fetchExperimentBloodMarkerData(mockExperiment);

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.isLoadingBloodMarkerData).toBe(false);
  });

  it('should fetch blood marker data successfully', async () => {
    const mockBloodMarkerData = {
      data: [
        {
          date: '2023-01-01',
          markers: [
            {
              name: 'Glucose',
              value: 100,
              unit: 'mg/dL',
              referenceRange: { min: 70, max: 110 }
            }
          ]
        }
      ]
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockBloodMarkerData
    });

    const { result } = renderHook(() => useExperimentBloodMarkerData('user123'));

    const mockExperiment = {
      id: '1',
      name: 'Test',
      description: 'Test',
      frequency: 'Daily',
      duration: '30 days',
      fitnessMarkers: [],
      bloodMarkers: ['Glucose'],
      startDate: '2023-01-01',
      endDate: '2023-01-31',
      status: 'active' as const,
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01'
    };

    await act(async () => {
      await result.current.fetchExperimentBloodMarkerData(mockExperiment);
    });

    await waitFor(() => {
      expect(result.current.isLoadingBloodMarkerData).toBe(false);
    });

    expect(result.current.experimentBloodMarkerData['Glucose']).toBeDefined();
  });

  it('should handle non-ok response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404
    });

    const { result } = renderHook(() => useExperimentBloodMarkerData('user123'));

    const mockExperiment = {
      id: '1',
      name: 'Test',
      description: 'Test',
      frequency: 'Daily',
      duration: '30 days',
      fitnessMarkers: [],
      bloodMarkers: ['Glucose'],
      startDate: '2023-01-01',
      endDate: '2023-01-31',
      status: 'active' as const,
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01'
    };

    await act(async () => {
      await result.current.fetchExperimentBloodMarkerData(mockExperiment);
    });

    await waitFor(() => {
      expect(result.current.isLoadingBloodMarkerData).toBe(false);
    });

    expect(console.error).toHaveBeenCalledWith('Error fetching experiment blood marker data:', expect.any(Error));
  });
});
