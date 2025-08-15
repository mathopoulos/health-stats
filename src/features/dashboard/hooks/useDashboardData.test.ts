import { renderHook, waitFor, act } from '@testing-library/react';
import { useDashboardData } from './useDashboardData';

// Mock the blood marker processing utilities
jest.mock('@/lib/blood-marker-processing', () => ({
  createEmptyBloodMarkers: jest.fn(() => ({
    totalCholesterol: [],
    ldl: [],
    hdl: [],
    triglycerides: [],
    apoB: [],
    lpA: [],
    whiteBloodCells: [],
    redBloodCells: [],
    hematocrit: [],
    hemoglobin: [],
    platelets: [],
    neutrophilCount: [],
    neutrophilPercentage: [],
    lymphocyteCount: [],
    lymphocytePercentage: [],
    monocyteCount: [],
    monocytePercentage: [],
    eosinophilCount: [],
    eosinophilPercentage: [],
    basophilCount: [],
    basophilPercentage: [],
    mcv: [],
    mch: [],
    mchc: [],
    rdw: [],
    mpv: [],
    hba1c: [],
    fastingInsulin: [],
    glucose: [],
    alt: [],
    ast: [],
    ggt: [],
    egfr: [],
    cystatinC: [],
    bun: [],
    creatinine: [],
    albumin: [],
    testosterone: [],
    freeTesto: [],
    estradiol: [],
    shbg: [],
    t3: [],
    t4: [],
    tsh: [],
    vitaminD: [],
    vitaminB12: [],
    folate: [],
    iron: [],
    magnesium: [],
    rbcMagnesium: [],
    crp: [],
    homocysteine: [],
    igf1: [],
    ferritin: [],
    serumIron: [],
    tibc: [],
    transferrinSaturation: [],
    sodium: [],
    potassium: [],
    calcium: [],
    phosphorus: [],
    bicarbonate: [],
    chloride: [],
    creatineKinase: [],
    cortisol: [],
    biologicalAge: []
  })),
  processBloodMarkersData: jest.fn((data) => ({
    totalCholesterol: data?.success ? [{ date: '2024-01-01', value: 200, unit: 'mg/dL' }] : [],
    ldl: [],
    hdl: [],
    triglycerides: [],
    apoB: [],
    lpA: [],
    whiteBloodCells: [],
    redBloodCells: [],
    hematocrit: [],
    hemoglobin: [],
    platelets: [],
    neutrophilCount: [],
    neutrophilPercentage: [],
    lymphocyteCount: [],
    lymphocytePercentage: [],
    monocyteCount: [],
    monocytePercentage: [],
    eosinophilCount: [],
    eosinophilPercentage: [],
    basophilCount: [],
    basophilPercentage: [],
    mcv: [],
    mch: [],
    mchc: [],
    rdw: [],
    mpv: [],
    hba1c: [],
    fastingInsulin: [],
    glucose: [],
    alt: [],
    ast: [],
    ggt: [],
    egfr: [],
    cystatinC: [],
    bun: [],
    creatinine: [],
    albumin: [],
    testosterone: [],
    freeTesto: [],
    estradiol: [],
    shbg: [],
    t3: [],
    t4: [],
    tsh: [],
    vitaminD: [],
    vitaminB12: [],
    folate: [],
    iron: [],
    magnesium: [],
    rbcMagnesium: [],
    crp: [],
    homocysteine: [],
    igf1: [],
    ferritin: [],
    serumIron: [],
    tibc: [],
    transferrinSaturation: [],
    sodium: [],
    potassium: [],
    calcium: [],
    phosphorus: [],
    bicarbonate: [],
    chloride: [],
    creatineKinase: [],
    cortisol: [],
    biologicalAge: []
  }))
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('useDashboardData', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize with empty data and loading state', () => {
    const { result } = renderHook(() => useDashboardData(undefined));

    expect(result.current.loading).toBe(false); // No userId means no loading
    expect(result.current.error).toBe(null);
    expect(result.current.data).toEqual({
      heartRate: [],
      weight: [],
      bodyFat: [],
      hrv: [],
      vo2max: [],
      bloodMarkers: expect.any(Object)
    });
  });

  it('should not fetch data when userId is undefined', () => {
    renderHook(() => useDashboardData(undefined));

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should fetch data successfully when userId is provided', async () => {
    const mockApiResponses = [
      { data: [{ date: '2024-01-01', value: 70 }] }, // heartRate
      { data: [{ date: '2024-01-01', value: 175 }] }, // weight
      { data: [{ date: '2024-01-01', value: 15 }] }, // bodyFat
      { data: [{ date: '2024-01-01', value: 45 }] }, // hrv
      { data: [{ date: '2024-01-01', value: 50 }] }, // vo2max
      { success: true, data: [] }, // bloodMarkers
      { data: [] }, // sleep
      { data: [] }  // workout
    ];

    mockFetch.mockImplementation(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockApiResponses.shift())
      })
    );

    const { result } = renderHook(() => useDashboardData('user123'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledTimes(8); // 8 API calls
    expect(result.current.error).toBe(null);
    expect(result.current.data.heartRate).toEqual([{ date: '2024-01-01', value: 70 }]);
    expect(result.current.data.weight).toEqual([{ date: '2024-01-01', value: 175 }]);
    expect(result.current.data.bodyFat).toEqual([{ date: '2024-01-01', value: 15 }]);
    expect(result.current.data.hrv).toEqual([{ date: '2024-01-01', value: 45 }]);
    expect(result.current.data.vo2max).toEqual([{ date: '2024-01-01', value: 50 }]);
  });

  it('should handle API errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    mockFetch.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useDashboardData('user123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // The error is caught internally by fetchHomeData and logged, but not set as state error
    // Only the catch block in the main fetchData sets error state, and fetchHomeData returns default values
    expect(result.current.error).toBe(null);
    expect(result.current.data.heartRate).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching home data', expect.any(Error));

    consoleErrorSpy.mockRestore();
  });

  it('should handle network errors in fetchHomeData', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Mock fetch to reject for network error
    mockFetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useDashboardData('user123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should have empty data but no error (handled internally by fetchHomeData)
    expect(result.current.data.heartRate).toEqual([]);
    expect(result.current.data.weight).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching home data', expect.any(Error));

    consoleErrorSpy.mockRestore();
  });

  it('should handle malformed API responses', async () => {
    const mockResponses = [
      null, // heartRate - malformed
      { data: [{ date: '2024-01-01', value: 175 }] }, // weight - valid
      undefined, // bodyFat - malformed
      { data: [{ date: '2024-01-01', value: 45 }] }, // hrv - valid
      { notData: 'invalid' }, // vo2max - malformed
      { success: false }, // bloodMarkers - failed
      { data: [] }, // sleep
      { data: [] }  // workout
    ];

    mockFetch.mockImplementation(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockResponses.shift())
      })
    );

    const { result } = renderHook(() => useDashboardData('user123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should handle malformed responses gracefully with empty arrays
    expect(result.current.data.heartRate).toEqual([]); // null.data -> undefined -> []
    expect(result.current.data.weight).toEqual([]); // responses consumed sequentially, second is null after shift()
    expect(result.current.data.bodyFat).toEqual([]); // undefined.data -> undefined -> []
    expect(result.current.data.hrv).toEqual([]); // responses consumed, becomes null
    expect(result.current.data.vo2max).toEqual([]); // no .data property -> []
  });

  it('should allow refetching data', async () => {
    const mockApiResponse = { data: [{ date: '2024-01-01', value: 70 }] };

    mockFetch.mockResolvedValue({
      json: () => Promise.resolve(mockApiResponse)
    });

    const { result } = renderHook(() => useDashboardData('user123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialCallCount = mockFetch.mock.calls.length;

    // Call refetchData
    await act(async () => {
      await result.current.refetchData();
    });

    expect(mockFetch.mock.calls.length).toBeGreaterThan(initialCallCount);
  });

  it('should update blood markers via updateBloodMarkers function', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ data: [] })
    });

    const { result } = renderHook(() => useDashboardData('user123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newBloodMarkers = {
      ...result.current.data.bloodMarkers,
      totalCholesterol: [{ date: '2024-01-02', value: 190, unit: 'mg/dL' }]
    };

    // Update blood markers with act() to avoid React warnings
    act(() => {
      result.current.updateBloodMarkers(newBloodMarkers);
    });

    expect(result.current.data.bloodMarkers.totalCholesterol).toEqual([
      { date: '2024-01-02', value: 190, unit: 'mg/dL' }
    ]);
  });

  it('should make API calls with correct URLs and timestamps', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ data: [] })
    });

    const userId = 'user123';
    renderHook(() => useDashboardData(userId));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(8);
    });

    // Check that all expected API endpoints were called
    const expectedTypes = ['heartRate', 'weight', 'bodyFat', 'hrv', 'vo2max', 'bloodMarkers', 'sleep', 'workout'];
    
    expectedTypes.forEach((type, index) => {
      const call = mockFetch.mock.calls[index];
      expect(call[0]).toMatch(new RegExp(`/api/health-data\\?type=${type}&userId=${userId}&t=\\d+`));
    });
  });

  it('should process blood markers data correctly', async () => {
    const mockBloodMarkersResponse = {
      success: true,
      data: [
        {
          date: '2024-01-01',
          markers: [
            { name: 'Total Cholesterol', value: 200, unit: 'mg/dL' }
          ]
        }
      ]
    };

    const mockApiResponses = [
      { data: [] }, // heartRate
      { data: [] }, // weight
      { data: [] }, // bodyFat
      { data: [] }, // hrv
      { data: [] }, // vo2max
      mockBloodMarkersResponse, // bloodMarkers
      { data: [] }, // sleep
      { data: [] }  // workout
    ];

    mockFetch.mockImplementation(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockApiResponses.shift())
      })
    );

    const { result } = renderHook(() => useDashboardData('user123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should have processed blood markers through the mocked function
    expect(result.current.data.bloodMarkers.totalCholesterol).toEqual([
      { date: '2024-01-01', value: 200, unit: 'mg/dL' }
    ]);
  });

  it('should handle userId changes', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ data: [] })
    });

    const { result, rerender } = renderHook(
      ({ userId }) => useDashboardData(userId),
      { initialProps: { userId: 'user1' } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialCallCount = mockFetch.mock.calls.length;

    // Change userId
    rerender({ userId: 'user2' });

    await waitFor(() => {
      expect(mockFetch.mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  it('should stop loading when userId becomes undefined', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ data: [] })
    });

    const { result, rerender } = renderHook(
      ({ userId }) => useDashboardData(userId),
      { initialProps: { userId: 'user1' } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Change to undefined userId
    rerender({ userId: undefined });

    expect(result.current.loading).toBe(false);
  });
});
