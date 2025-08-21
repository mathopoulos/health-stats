import { renderHook, act } from '@testing-library/react';
import { toast } from 'react-hot-toast';
import { useWorkoutProtocols } from '../useWorkoutProtocols';

// Mock dependencies
jest.mock('react-hot-toast');

const mockToast = toast as jest.MockedFunction<typeof toast>;

// Mock fetch
global.fetch = jest.fn();

const mockWorkoutProtocol = {
  type: 'Push-ups',
  frequency: 3
};

const mockWorkoutProtocols = [
  mockWorkoutProtocol,
  {
    type: 'Running',
    frequency: 5
  }
];

describe('useWorkoutProtocols', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToast.success = jest.fn();
    mockToast.error = jest.fn();
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('initialization', () => {
    it('initializes with default values', () => {
      const { result } = renderHook(() => useWorkoutProtocols());

      expect(result.current.workoutProtocols).toEqual([]);
      expect(result.current.isSavingWorkoutProtocol).toBe(false);
    });

    it('initializes with provided initial protocols', () => {
      const { result } = renderHook(() => useWorkoutProtocols(mockWorkoutProtocols));

      expect(result.current.workoutProtocols).toEqual(mockWorkoutProtocols);
      expect(result.current.isSavingWorkoutProtocol).toBe(false);
    });

    it('updates protocols when initial values change', () => {
      const { result, rerender } = renderHook(
        ({ protocols }) => useWorkoutProtocols(protocols),
        { initialProps: { protocols: [] } }
      );

      expect(result.current.workoutProtocols).toEqual([]);

      rerender({ protocols: mockWorkoutProtocols });

      expect(result.current.workoutProtocols).toEqual(mockWorkoutProtocols);
    });

    it('does not update if protocols array content is the same', () => {
      const { result, rerender } = renderHook(
        ({ protocols }) => useWorkoutProtocols(protocols),
        { initialProps: { protocols: mockWorkoutProtocols } }
      );

      expect(result.current.workoutProtocols).toEqual(mockWorkoutProtocols);

      // Re-render with same protocols (different array reference)
      rerender({ protocols: [...mockWorkoutProtocols] });

      expect(result.current.workoutProtocols).toEqual(mockWorkoutProtocols);
    });
  });

  describe('addWorkoutProtocol', () => {
    it.skip('successfully adds new workout protocol', () => {
      const { result } = renderHook(() => useWorkoutProtocols());

      act(() => {
        result.current.addWorkoutProtocol('Squats', 4);
      });

      expect(result.current.workoutProtocols).toHaveLength(1);
      expect(result.current.workoutProtocols[0]).toEqual({
        type: 'Squats',
        frequency: 4
      });
    });

    it.skip('prevents adding duplicate workout types', () => {
      const { result } = renderHook(() => useWorkoutProtocols(mockWorkoutProtocols));

      act(() => {
        result.current.addWorkoutProtocol('Push-ups', 5);
      });

      expect(result.current.workoutProtocols).toHaveLength(2); // Should remain 2, not 3
      expect(mockToast.error).toHaveBeenCalledWith('This workout is already added');
    });

    it.skip('adds workout to existing protocols list', () => {
      const { result } = renderHook(() => useWorkoutProtocols(mockWorkoutProtocols));

      act(() => {
        result.current.addWorkoutProtocol('Deadlifts', 2);
      });

      expect(result.current.workoutProtocols).toHaveLength(3);
      expect(result.current.workoutProtocols[2]).toEqual({
        type: 'Deadlifts',
        frequency: 2
      });
    });

    it.skip('handles adding protocol with zero frequency', () => {
      const { result } = renderHook(() => useWorkoutProtocols());

      act(() => {
        result.current.addWorkoutProtocol('Rest Day', 0);
      });

      expect(result.current.workoutProtocols).toHaveLength(1);
      expect(result.current.workoutProtocols[0]).toEqual({
        type: 'Rest Day',
        frequency: 0
      });
    });

    it.skip('handles adding protocol with negative frequency', () => {
      const { result } = renderHook(() => useWorkoutProtocols());

      act(() => {
        result.current.addWorkoutProtocol('Invalid', -1);
      });

      expect(result.current.workoutProtocols).toHaveLength(1);
      expect(result.current.workoutProtocols[0]).toEqual({
        type: 'Invalid',
        frequency: -1
      });
    });
  });

  describe('removeWorkoutProtocol', () => {
    it.skip('successfully removes workout protocol', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const { result } = renderHook(() => useWorkoutProtocols(mockWorkoutProtocols));

      await act(async () => {
        await result.current.removeWorkoutProtocol('Push-ups');
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/health-protocols', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          protocolType: 'exercise',
          type: 'Push-ups' 
        })
      });

      expect(result.current.workoutProtocols).toHaveLength(1);
      expect(result.current.workoutProtocols[0].type).toBe('Running');
      expect(mockToast.success).toHaveBeenCalledWith('Workout protocol removed');
      expect(result.current.isSavingWorkoutProtocol).toBe(false);
    });

    it('handles removal failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400
      });

      const { result } = renderHook(() => useWorkoutProtocols(mockWorkoutProtocols));

      await act(async () => {
        await result.current.removeWorkoutProtocol('Push-ups');
      });

      expect(mockToast.error).toHaveBeenCalledWith('Failed to remove workout protocol');
      expect(result.current.workoutProtocols).toHaveLength(2); // Should remain unchanged
      expect(result.current.isSavingWorkoutProtocol).toBe(false);
    });

    it('handles network error during removal', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useWorkoutProtocols(mockWorkoutProtocols));

      await act(async () => {
        await result.current.removeWorkoutProtocol('Push-ups');
      });

      expect(mockToast.error).toHaveBeenCalledWith('Failed to remove workout protocol');
      expect(result.current.workoutProtocols).toHaveLength(2); // Should remain unchanged
      expect(result.current.isSavingWorkoutProtocol).toBe(false);
    });

    it('sets loading state during removal', async () => {
      let resolvePromise: (value: any) => void;
      const removePromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValueOnce(removePromise);

      const { result } = renderHook(() => useWorkoutProtocols(mockWorkoutProtocols));

      act(() => {
        result.current.removeWorkoutProtocol('Push-ups');
      });

      expect(result.current.isSavingWorkoutProtocol).toBe(true);

      await act(async () => {
        resolvePromise!({
          ok: true,
          json: async () => ({ success: true })
        });
        await removePromise;
      });

      expect(result.current.isSavingWorkoutProtocol).toBe(false);
    });

    it.skip('removes correct protocol when multiple exist', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const { result } = renderHook(() => useWorkoutProtocols(mockWorkoutProtocols));

      await act(async () => {
        await result.current.removeWorkoutProtocol('Running');
      });

      expect(result.current.workoutProtocols).toHaveLength(1);
      expect(result.current.workoutProtocols[0].type).toBe('Push-ups'); // Push-ups should remain
    });

    it('handles removing non-existent protocol', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const { result } = renderHook(() => useWorkoutProtocols(mockWorkoutProtocols));

      await act(async () => {
        await result.current.removeWorkoutProtocol('Non-existent');
      });

      expect(result.current.workoutProtocols).toHaveLength(2); // Should remain unchanged
    });
  });

  describe('updateWorkoutProtocolFrequency', () => {
    it.skip('successfully updates workout protocol frequency', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const { result } = renderHook(() => useWorkoutProtocols(mockWorkoutProtocols));

      await act(async () => {
        await result.current.updateWorkoutProtocolFrequency('Push-ups', 5);
      });

      const expectedProtocols = [
        { ...mockWorkoutProtocol, frequency: 5 },
        mockWorkoutProtocols[1]
      ];

      expect(global.fetch).toHaveBeenCalledWith('/api/health-protocols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocolType: 'exercise',
          protocol: JSON.stringify({ workouts: expectedProtocols }),
          startDate: expect.any(String)
        })
      });

      expect(result.current.workoutProtocols[0].frequency).toBe(5);
      expect(result.current.isSavingWorkoutProtocol).toBe(false);
    });

    it('handles update failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const { result } = renderHook(() => useWorkoutProtocols(mockWorkoutProtocols));

      await act(async () => {
        await result.current.updateWorkoutProtocolFrequency('Push-ups', 5);
      });

      expect(mockToast.error).toHaveBeenCalledWith('Failed to update frequency');
      expect(result.current.workoutProtocols[0].frequency).toBe(3); // Should remain unchanged
      expect(result.current.isSavingWorkoutProtocol).toBe(false);
    });

    it('handles network error during update', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useWorkoutProtocols(mockWorkoutProtocols));

      await act(async () => {
        await result.current.updateWorkoutProtocolFrequency('Push-ups', 5);
      });

      expect(mockToast.error).toHaveBeenCalledWith('Failed to update frequency');
      expect(result.current.workoutProtocols[0].frequency).toBe(3); // Should remain unchanged
      expect(result.current.isSavingWorkoutProtocol).toBe(false);
    });

    it('sets loading state during update', async () => {
      let resolvePromise: (value: any) => void;
      const updatePromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValueOnce(updatePromise);

      const { result } = renderHook(() => useWorkoutProtocols(mockWorkoutProtocols));

      act(() => {
        result.current.updateWorkoutProtocolFrequency('Push-ups', 5);
      });

      expect(result.current.isSavingWorkoutProtocol).toBe(true);

      await act(async () => {
        resolvePromise!({
          ok: true,
          json: async () => ({ success: true })
        });
        await updatePromise;
      });

      expect(result.current.isSavingWorkoutProtocol).toBe(false);
    });

    it.skip('updates correct protocol when multiple exist', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const { result } = renderHook(() => useWorkoutProtocols(mockWorkoutProtocols));

      await act(async () => {
        await result.current.updateWorkoutProtocolFrequency('Running', 7);
      });

      expect(result.current.workoutProtocols[0].frequency).toBe(3); // Push-ups unchanged
      expect(result.current.workoutProtocols[1].frequency).toBe(7); // Running updated
    });

    it('handles updating non-existent protocol', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const { result } = renderHook(() => useWorkoutProtocols(mockWorkoutProtocols));

      await act(async () => {
        await result.current.updateWorkoutProtocolFrequency('Non-existent', 5);
      });

      expect(result.current.workoutProtocols).toEqual(mockWorkoutProtocols); // Should remain unchanged
    });

    it.skip('handles updating with zero frequency', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const { result } = renderHook(() => useWorkoutProtocols(mockWorkoutProtocols));

      await act(async () => {
        await result.current.updateWorkoutProtocolFrequency('Push-ups', 0);
      });

      expect(result.current.workoutProtocols[0].frequency).toBe(0);
    });

    it.skip('handles updating with negative frequency', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const { result } = renderHook(() => useWorkoutProtocols(mockWorkoutProtocols));

      await act(async () => {
        await result.current.updateWorkoutProtocolFrequency('Push-ups', -1);
      });

      expect(result.current.workoutProtocols[0].frequency).toBe(-1);
    });
  });

  describe('handleSaveWorkoutProtocols', () => {
    it.skip('successfully saves workout protocols', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const { result } = renderHook(() => useWorkoutProtocols());

      const newProtocols = [mockWorkoutProtocol];

      await act(async () => {
        await result.current.handleSaveWorkoutProtocols(newProtocols);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/health-protocols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocolType: 'exercise',
          protocol: JSON.stringify({ workouts: newProtocols }),
          startDate: expect.any(String)
        })
      });

      expect(result.current.workoutProtocols).toEqual(newProtocols);
      expect(mockToast.success).toHaveBeenCalledWith('Workout protocols saved successfully');
      expect(result.current.isSavingWorkoutProtocol).toBe(false);
    });

    it('handles save failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const { result } = renderHook(() => useWorkoutProtocols());

      await act(async () => {
        await result.current.handleSaveWorkoutProtocols([mockWorkoutProtocol]);
      });

      expect(mockToast.error).toHaveBeenCalledWith('Failed to save workout protocols');
      expect(result.current.isSavingWorkoutProtocol).toBe(false);
    });

    it('handles network error during save', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useWorkoutProtocols());

      await act(async () => {
        await result.current.handleSaveWorkoutProtocols([mockWorkoutProtocol]);
      });

      expect(mockToast.error).toHaveBeenCalledWith('Failed to save workout protocols');
      expect(result.current.isSavingWorkoutProtocol).toBe(false);
    });

    it('sets loading state during save', async () => {
      let resolvePromise: (value: any) => void;
      const savePromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValueOnce(savePromise);

      const { result } = renderHook(() => useWorkoutProtocols());

      act(() => {
        result.current.handleSaveWorkoutProtocols([mockWorkoutProtocol]);
      });

      expect(result.current.isSavingWorkoutProtocol).toBe(true);

      await act(async () => {
        resolvePromise!({
          ok: true,
          json: async () => ({ success: true })
        });
        await savePromise;
      });

      expect(result.current.isSavingWorkoutProtocol).toBe(false);
    });

    it.skip('saves empty protocols array', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const { result } = renderHook(() => useWorkoutProtocols(mockWorkoutProtocols));

      await act(async () => {
        await result.current.handleSaveWorkoutProtocols([]);
      });

      expect(result.current.workoutProtocols).toEqual([]);
      expect(mockToast.success).toHaveBeenCalledWith('Workout protocols saved successfully');
    });

    it('saves complex workout protocols', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const complexProtocols = [
        { type: 'High-Intensity Interval Training (HIIT)', frequency: 3 },
        { type: 'Yoga & Meditation', frequency: 7 },
        { type: 'Weight Training (Upper Body)', frequency: 2 }
      ];

      const { result } = renderHook(() => useWorkoutProtocols());

      await act(async () => {
        await result.current.handleSaveWorkoutProtocols(complexProtocols);
      });

      expect(result.current.workoutProtocols).toEqual(complexProtocols);
    });
  });

  describe('state setters', () => {
    it('setWorkoutProtocols updates protocols state', () => {
      const { result } = renderHook(() => useWorkoutProtocols());

      act(() => {
        result.current.setWorkoutProtocols(mockWorkoutProtocols);
      });

      expect(result.current.workoutProtocols).toEqual(mockWorkoutProtocols);
    });

    it('setIsSavingWorkoutProtocol updates saving state', () => {
      const { result } = renderHook(() => useWorkoutProtocols());

      act(() => {
        result.current.setIsSavingWorkoutProtocol(true);
      });

      expect(result.current.isSavingWorkoutProtocol).toBe(true);
    });
  });

  describe('edge cases and error scenarios', () => {
    it('handles empty initial protocols array', () => {
      const { result } = renderHook(() => useWorkoutProtocols([]));

      expect(result.current.workoutProtocols).toEqual([]);
    });

    it('handles concurrent operations', async () => {
      let resolveUpdate: (value: any) => void;
      let resolveRemove: (value: any) => void;
      
      const updatePromise = new Promise(resolve => {
        resolveUpdate = resolve;
      });
      
      const removePromise = new Promise(resolve => {
        resolveRemove = resolve;
      });

      (global.fetch as jest.Mock)
        .mockReturnValueOnce(updatePromise)
        .mockReturnValueOnce(removePromise);

      const { result } = renderHook(() => useWorkoutProtocols(mockWorkoutProtocols));

      // Start update operation
      act(() => {
        result.current.updateWorkoutProtocolFrequency('Push-ups', 10);
      });

      expect(result.current.isSavingWorkoutProtocol).toBe(true);

      // Start remove operation while update is in progress
      act(() => {
        result.current.removeWorkoutProtocol('Running');
      });

      // Complete both operations
      await act(async () => {
        resolveUpdate!({
          ok: true,
          json: async () => ({ success: true })
        });
        resolveRemove!({
          ok: true,
          json: async () => ({ success: true })
        });
        await Promise.all([updatePromise, removePromise]);
      });

      expect(result.current.isSavingWorkoutProtocol).toBe(false);
    });

    it('handles rapid state changes', async () => {
      const { result } = renderHook(() => useWorkoutProtocols());

      // Rapid state changes
      act(() => {
        result.current.setWorkoutProtocols([mockWorkoutProtocol]);
        result.current.setIsSavingWorkoutProtocol(true);
        result.current.setWorkoutProtocols(mockWorkoutProtocols);
        result.current.setIsSavingWorkoutProtocol(false);
      });

      expect(result.current.workoutProtocols).toEqual(mockWorkoutProtocols);
      expect(result.current.isSavingWorkoutProtocol).toBe(false);
    });

    it('handles malformed API responses', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('JSON parse error'));

      const { result } = renderHook(() => useWorkoutProtocols());

      await act(async () => {
        await result.current.handleSaveWorkoutProtocols([mockWorkoutProtocol]);
      });

      expect(mockToast.error).toHaveBeenCalledWith('Failed to save workout protocols');
    });

    it('handles null input gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const { result } = renderHook(() => useWorkoutProtocols());

      await act(async () => {
        await result.current.handleSaveWorkoutProtocols(null as any);
      });

      expect(result.current.workoutProtocols).toBeNull();
    });

    it.skip('handles undefined frequency update gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const { result } = renderHook(() => useWorkoutProtocols(mockWorkoutProtocols));

      await act(async () => {
        await result.current.updateWorkoutProtocolFrequency('Push-ups', undefined as any);
      });

      expect(result.current.workoutProtocols[0].frequency).toBeUndefined();
    });
  });

  describe('protocol validation and edge cases', () => {
    it.skip('handles very large frequencies', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const { result } = renderHook(() => useWorkoutProtocols(mockWorkoutProtocols));

      await act(async () => {
        await result.current.updateWorkoutProtocolFrequency('Push-ups', 999999);
      });

      expect(result.current.workoutProtocols[0].frequency).toBe(999999);
    });

    it('handles empty string workout type', () => {
      const { result } = renderHook(() => useWorkoutProtocols());

      act(() => {
        result.current.addWorkoutProtocol('', 1);
      });

      expect(result.current.workoutProtocols).toHaveLength(1);
      expect(result.current.workoutProtocols[0]).toEqual({
        type: '',
        frequency: 1
      });
    });

    it('handles special characters in workout type', () => {
      const { result } = renderHook(() => useWorkoutProtocols());
      const specialType = 'Workout @#$%^&*()_+-={}[]|;:,.<>?';

      act(() => {
        result.current.addWorkoutProtocol(specialType, 2);
      });

      expect(result.current.workoutProtocols).toHaveLength(1);
      expect(result.current.workoutProtocols[0].type).toBe(specialType);
    });

    it('handles extremely long workout type names', () => {
      const { result } = renderHook(() => useWorkoutProtocols());
      const longType = 'A'.repeat(1000);

      act(() => {
        result.current.addWorkoutProtocol(longType, 1);
      });

      expect(result.current.workoutProtocols).toHaveLength(1);
      expect(result.current.workoutProtocols[0].type).toBe(longType);
    });

    it.skip('maintains protocol order after updates', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      const multipleProtocols = [
        { type: 'A', frequency: 1 },
        { type: 'B', frequency: 2 },
        { type: 'C', frequency: 3 }
      ];

      const { result } = renderHook(() => useWorkoutProtocols(multipleProtocols));

      // Update middle protocol
      await act(async () => {
        await result.current.updateWorkoutProtocolFrequency('B', 10);
      });

      expect(result.current.workoutProtocols).toEqual([
        { type: 'A', frequency: 1 },
        { type: 'B', frequency: 10 },
        { type: 'C', frequency: 3 }
      ]);
    });
  });
});
