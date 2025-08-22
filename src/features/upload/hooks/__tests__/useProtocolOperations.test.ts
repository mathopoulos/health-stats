import { renderHook, act, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useProtocolOperations } from '../useProtocolOperations';

// Mock next-auth/react
jest.mock('next-auth/react');
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

// Mock fetch
global.fetch = jest.fn();

// Mock setTimeout to make tests run faster
jest.useFakeTimers();

const mockSession = {
  user: { id: 'test-user-id' },
  expires: '2024-01-01',
};

const createMockResponse = (data: any, ok = true) => ({
  ok,
  json: jest.fn().mockResolvedValue(data),
});

describe('useProtocolOperations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    });
    (fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  describe('Initial State', () => {
    it('should initialize with empty/default state', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn(),
      });
      
      const { result } = renderHook(() => useProtocolOperations());
      
      expect(result.current.profileImage).toBeNull();
      expect(result.current.name).toBe('');
      expect(result.current.currentDiet).toBe('');
      expect(result.current.workoutProtocols).toEqual([]);
      expect(result.current.supplementProtocols).toEqual([]);
      expect(result.current.experiments).toEqual([]);
      expect(result.current.isSavingProtocol).toBe(false);
      expect(result.current.isSavingWorkoutProtocol).toBe(false);
      expect(result.current.isSavingSupplementProtocol).toBe(false);
      expect(result.current.isSavingExperiment).toBe(false);
      expect(result.current.isLoadingExperiments).toBe(false);
      expect(result.current.status).toBe('');
    });

    it('should return all required functions', () => {
      const { result } = renderHook(() => useProtocolOperations());
      
      expect(typeof result.current.handleDietChange).toBe('function');
      expect(typeof result.current.addWorkoutProtocol).toBe('function');
      expect(typeof result.current.removeWorkoutProtocol).toBe('function');
      expect(typeof result.current.updateWorkoutProtocolFrequency).toBe('function');
      expect(typeof result.current.handleSaveWorkoutProtocols).toBe('function');
      expect(typeof result.current.addSupplementProtocol).toBe('function');
      expect(typeof result.current.updateSupplementProtocol).toBe('function');
      expect(typeof result.current.handleSaveSupplementProtocols).toBe('function');
      expect(typeof result.current.handleSaveExperiment).toBe('function');
      expect(typeof result.current.removeExperiment).toBe('function');
      expect(typeof result.current.handleUpdateExperiment).toBe('function');
      expect(typeof result.current.refreshExperiments).toBe('function');
    });
  });

  describe('Data Fetching', () => {
    it('should fetch initial data on session change', async () => {
      (fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse({ 
          success: true, 
          user: { name: 'Test User', profileImage: 'test.jpg' }
        }))
        .mockResolvedValueOnce(createMockResponse({ 
          success: true, 
          data: [{ protocol: 'Mediterranean' }] 
        }))
        .mockResolvedValueOnce(createMockResponse({ 
          success: true, 
          data: [{ protocol: '{"workouts":[{"type":"running","frequency":3}]}' }] 
        }))
        .mockResolvedValueOnce(createMockResponse({ 
          success: true, 
          data: [{ protocol: '{"supplements":[{"type":"Vitamin D","frequency":"daily","dosage":"1000","unit":"IU"}]}' }] 
        }))
        .mockResolvedValueOnce(createMockResponse({ 
          success: true, 
          data: [{ id: '1', name: 'Test Experiment', description: 'Test', status: 'active' }] 
        }));

      const { result } = renderHook(() => useProtocolOperations());

      await waitFor(() => {
        expect(result.current.name).toBe('Test User');
        expect(result.current.profileImage).toBe('test.jpg');
        expect(result.current.currentDiet).toBe('Mediterranean');
        expect(result.current.workoutProtocols).toEqual([{ type: 'running', frequency: 3 }]);
        expect(result.current.supplementProtocols).toEqual([{ type: 'Vitamin D', frequency: 'daily', dosage: '1000', unit: 'IU' }]);
        expect(result.current.experiments).toEqual([{ id: '1', name: 'Test Experiment', description: 'Test', status: 'active' }]);
      });

      expect(fetch).toHaveBeenCalledTimes(5);
    });

    it('should not fetch data when session is loading', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn(),
      });

      renderHook(() => useProtocolOperations());
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should not fetch data when no user session', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      renderHook(() => useProtocolOperations());
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('Diet Operations', () => {
    it('should handle diet change successfully', async () => {
      (fetch as jest.Mock).mockResolvedValue(createMockResponse({ success: true }));
      
      const { result } = renderHook(() => useProtocolOperations());

      await act(async () => {
        await result.current.handleDietChange('Keto');
      });

      expect(result.current.currentDiet).toBe('Keto');
      expect(result.current.isSavingProtocol).toBe(false);
      expect(result.current.status).toBe('Diet protocol updated successfully');
      
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      
      expect(result.current.status).toBe('');
    });

    it('should handle diet change error and revert', async () => {
      const { result } = renderHook(() => useProtocolOperations());
      
      // Set initial diet
      act(() => {
        result.current.handleDietChange('Mediterranean');
      });
      
      (fetch as jest.Mock).mockResolvedValue(createMockResponse({ 
        error: 'Failed to save' 
      }, false));

      await act(async () => {
        await result.current.handleDietChange('Keto');
      });

      expect(result.current.currentDiet).toBe('Mediterranean'); // Reverted
      expect(result.current.status).toBe('Failed to save');
    });

    it('should not change diet if same as current', async () => {
      const { result } = renderHook(() => useProtocolOperations());

      // Set initial diet
      act(() => {
        result.current.handleDietChange('Keto');
      });

      (fetch as jest.Mock).mockClear();

      await act(async () => {
        await result.current.handleDietChange('Keto'); // Same diet
      });

      expect(fetch).not.toHaveBeenCalled();
      expect(result.current.isSavingProtocol).toBe(false);
    });
  });

  describe('Workout Operations', () => {
    it('should add workout protocol locally', () => {
      const { result } = renderHook(() => useProtocolOperations());

      act(() => {
        result.current.addWorkoutProtocol('running');
      });

      expect(result.current.workoutProtocols).toEqual([{ type: 'running', frequency: 2 }]);
    });

    it('should not add duplicate workout protocol', () => {
      const { result } = renderHook(() => useProtocolOperations());

      act(() => {
        result.current.addWorkoutProtocol('running');
        result.current.addWorkoutProtocol('running'); // Duplicate
      });

      expect(result.current.workoutProtocols).toEqual([{ type: 'running', frequency: 2 }]);
    });

    it('should remove workout protocol successfully', async () => {
      (fetch as jest.Mock).mockResolvedValue(createMockResponse({ success: true }));
      
      const { result } = renderHook(() => useProtocolOperations());

      // Add a protocol first
      act(() => {
        result.current.addWorkoutProtocol('running');
        result.current.addWorkoutProtocol('cycling');
      });

      await act(async () => {
        await result.current.removeWorkoutProtocol('running');
      });

      expect(result.current.workoutProtocols).toEqual([{ type: 'cycling', frequency: 2 }]);
      expect(result.current.status).toBe('Workout protocol removed successfully');
    });

    it('should handle workout protocol removal error', async () => {
      (fetch as jest.Mock).mockResolvedValue(createMockResponse({ 
        error: 'Failed to remove' 
      }, false));
      
      const { result } = renderHook(() => useProtocolOperations());

      // Add a protocol first
      act(() => {
        result.current.addWorkoutProtocol('running');
      });

      const originalProtocols = result.current.workoutProtocols;

      await act(async () => {
        await result.current.removeWorkoutProtocol('running');
      });

      expect(result.current.workoutProtocols).toEqual(originalProtocols); // Reverted
      expect(result.current.status).toBe('Failed to remove');
    });

    it('should update workout protocol frequency', async () => {
      (fetch as jest.Mock).mockResolvedValue(createMockResponse({ success: true }));
      
      const { result } = renderHook(() => useProtocolOperations());

      // Add a protocol first
      act(() => {
        result.current.addWorkoutProtocol('running');
      });

      await act(async () => {
        await result.current.updateWorkoutProtocolFrequency('running', 5);
      });

      expect(result.current.workoutProtocols).toEqual([{ type: 'running', frequency: 5 }]);
      expect(result.current.status).toBe('Workout protocol updated successfully');
    });

    it('should save workout protocols', async () => {
      (fetch as jest.Mock).mockResolvedValue(createMockResponse({ success: true }));
      
      const { result } = renderHook(() => useProtocolOperations());

      const newProtocols = [
        { type: 'running', frequency: 3 },
        { type: 'cycling', frequency: 2 }
      ];

      await act(async () => {
        await result.current.handleSaveWorkoutProtocols(newProtocols);
      });

      expect(result.current.workoutProtocols).toEqual(newProtocols);
      expect(result.current.isSavingWorkoutProtocol).toBe(false);
      expect(result.current.status).toBe('Workout protocols updated successfully');
    });
  });

  describe('Supplement Operations', () => {
    it('should add supplement protocol locally', () => {
      const { result } = renderHook(() => useProtocolOperations());

      act(() => {
        result.current.addSupplementProtocol('Vitamin D', 'daily', '1000', 'IU');
      });

      expect(result.current.supplementProtocols).toEqual([{
        type: 'Vitamin D',
        frequency: 'daily',
        dosage: '1000',
        unit: 'IU'
      }]);
    });

    it('should not add duplicate supplement protocol', () => {
      const { result } = renderHook(() => useProtocolOperations());

      act(() => {
        result.current.addSupplementProtocol('Vitamin D', 'daily', '1000', 'IU');
        result.current.addSupplementProtocol('Vitamin D', 'daily', '2000', 'IU'); // Duplicate type
      });

      expect(result.current.supplementProtocols).toHaveLength(1);
    });

    it('should update supplement protocol', async () => {
      (fetch as jest.Mock).mockResolvedValue(createMockResponse({ success: true }));
      
      const { result } = renderHook(() => useProtocolOperations());

      // Add a supplement first
      act(() => {
        result.current.addSupplementProtocol('Vitamin D', 'daily', '1000', 'IU');
      });

      await act(async () => {
        await result.current.updateSupplementProtocol('Vitamin D', 'dosage', '2000');
      });

      expect(result.current.supplementProtocols).toEqual([{
        type: 'Vitamin D',
        frequency: 'daily',
        dosage: '2000',
        unit: 'IU'
      }]);
    });

    it('should save supplement protocols', async () => {
      (fetch as jest.Mock).mockResolvedValue(createMockResponse({ success: true }));
      
      const { result } = renderHook(() => useProtocolOperations());

      const newProtocols = [
        { type: 'Vitamin D', frequency: 'daily', dosage: '1000', unit: 'IU' },
        { type: 'Omega-3', frequency: 'daily', dosage: '500', unit: 'mg' }
      ];

      await act(async () => {
        await result.current.handleSaveSupplementProtocols(newProtocols);
      });

      expect(result.current.supplementProtocols).toEqual(newProtocols);
      expect(result.current.isSavingSupplementProtocol).toBe(false);
    });
  });

  describe('Experiment Operations', () => {
    it('should save experiment and refresh list', async () => {
      // Mock all the initial data fetches plus the experiment operations
      (fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse({ success: true, user: {} })) // User data
        .mockResolvedValueOnce(createMockResponse({ success: true, data: [] })) // Diet
        .mockResolvedValueOnce(createMockResponse({ success: true, data: [] })) // Workouts
        .mockResolvedValueOnce(createMockResponse({ success: true, data: [] })) // Supplements
        .mockResolvedValueOnce(createMockResponse({ success: true, data: [] })) // Initial experiments
        .mockResolvedValueOnce(createMockResponse({ success: true })) // Save experiment
        .mockResolvedValueOnce(createMockResponse({ // Refresh experiments
          success: true,
          data: [{ id: '1', name: 'Test Experiment', status: 'active' }]
        }));
      
      const { result } = renderHook(() => useProtocolOperations());

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.isLoadingExperiments).toBe(false);
      });

      const experimentData = {
        name: 'Test Experiment',
        description: 'Test Description',
        frequency: 'daily',
        duration: '30 days',
        fitnessMarkers: ['weight'],
        bloodMarkers: ['glucose']
      };

      await act(async () => {
        await result.current.handleSaveExperiment(experimentData);
      });

      expect(result.current.isSavingExperiment).toBe(false);
      expect(result.current.status).toBe('Experiment created successfully');
    });

    it('should remove experiment', async () => {
      (fetch as jest.Mock).mockResolvedValue(createMockResponse({ success: true }));
      
      const { result } = renderHook(() => useProtocolOperations());

      // Add an experiment first (simulating initial load)
      act(() => {
        result.current.experiments.push({
          id: '1',
          name: 'Test',
          description: 'Test',
          frequency: 'daily',
          duration: '30 days',
          fitnessMarkers: [],
          bloodMarkers: [],
          status: 'active',
          createdAt: '2024-01-01'
        });
      });

      await act(async () => {
        await result.current.removeExperiment('1');
      });

      expect(result.current.experiments).toEqual([]);
      expect(result.current.status).toBe('Experiment deleted successfully');
    });

    it('should update experiment locally', async () => {
      const { result } = renderHook(() => useProtocolOperations());

      const initialExperiment = {
        id: '1',
        name: 'Test',
        description: 'Test',
        frequency: 'daily',
        duration: '30 days',
        fitnessMarkers: [],
        bloodMarkers: [],
        status: 'active' as const,
        createdAt: '2024-01-01'
      };

      // Set initial experiment
      act(() => {
        result.current.experiments.push(initialExperiment);
      });

      const updatedExperiment = {
        ...initialExperiment,
        name: 'Updated Test',
        status: 'paused' as const
      };

      await act(async () => {
        await result.current.handleUpdateExperiment(updatedExperiment);
      });

      expect(result.current.experiments[0].name).toBe('Updated Test');
      expect(result.current.experiments[0].status).toBe('paused');
    });

    it('should refresh experiments', async () => {
      // Mock initial data loading
      (fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse({ success: true, user: {} })) // User data
        .mockResolvedValueOnce(createMockResponse({ success: true, data: [] })) // Diet
        .mockResolvedValueOnce(createMockResponse({ success: true, data: [] })) // Workouts
        .mockResolvedValueOnce(createMockResponse({ success: true, data: [] })) // Supplements
        .mockResolvedValueOnce(createMockResponse({ success: true, data: [] })) // Initial experiments
        .mockResolvedValueOnce(createMockResponse({
          success: true,
          data: [
            { id: '1', name: 'Experiment 1', status: 'active' },
            { id: '2', name: 'Experiment 2', status: 'paused' }
          ]
        })); // Manual refresh
      
      const { result } = renderHook(() => useProtocolOperations());

      // Wait for initial load to complete
      await waitFor(() => {
        expect(result.current.isLoadingExperiments).toBe(false);
      });

      await act(async () => {
        await result.current.refreshExperiments();
      });

      expect(result.current.experiments).toHaveLength(2);
      expect(result.current.isLoadingExperiments).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      const { result } = renderHook(() => useProtocolOperations());

      await act(async () => {
        await result.current.handleDietChange('Keto');
      });

      expect(result.current.status).toBe('Network error');
      expect(result.current.isSavingProtocol).toBe(false);
    });

    it('should handle API errors with custom messages', async () => {
      (fetch as jest.Mock).mockResolvedValue(createMockResponse({
        error: 'Custom API error'
      }, false));
      
      const { result } = renderHook(() => useProtocolOperations());

      await act(async () => {
        await result.current.handleSaveExperiment({
          name: 'Test',
          description: 'Test',
          frequency: 'daily',
          duration: '30 days',
          fitnessMarkers: [],
          bloodMarkers: []
        });
      });

      expect(result.current.status).toBe('Custom API error');
    });
  });

  describe('Status Management', () => {
    it('should clear status messages after timeout', async () => {
      (fetch as jest.Mock).mockResolvedValue(createMockResponse({ success: true }));
      
      const { result } = renderHook(() => useProtocolOperations());

      await act(async () => {
        await result.current.handleDietChange('Keto');
      });

      expect(result.current.status).toBe('Diet protocol updated successfully');

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(result.current.status).toBe('');
    });

    it('should handle multiple status updates', async () => {
      (fetch as jest.Mock).mockResolvedValue(createMockResponse({ success: true }));
      
      const { result } = renderHook(() => useProtocolOperations());

      await act(async () => {
        await result.current.handleDietChange('Keto');
      });

      expect(result.current.status).toBe('Diet protocol updated successfully');

      await act(async () => {
        await result.current.addWorkoutProtocol('running');
        await result.current.removeWorkoutProtocol('running');
      });

      expect(result.current.status).toBe('Workout protocol removed successfully');
    });
  });

  describe('Hook Stability', () => {
    it('should maintain function reference stability for key functions', () => {
      const { result, rerender } = renderHook(() => useProtocolOperations());
      
      const initialAddWorkoutProtocol = result.current.addWorkoutProtocol;
      const initialAddSupplementProtocol = result.current.addSupplementProtocol;
      const initialRemoveExperiment = result.current.removeExperiment;
      
      // Trigger state change
      act(() => {
        result.current.addWorkoutProtocol('running');
      });
      
      rerender();
      
      // Function references should remain stable for functions without dependencies
      expect(result.current.addWorkoutProtocol).toBe(initialAddWorkoutProtocol);
      expect(result.current.addSupplementProtocol).toBe(initialAddSupplementProtocol);
      expect(result.current.removeExperiment).toBe(initialRemoveExperiment);
    });
  });
});
