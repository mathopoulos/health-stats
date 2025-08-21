import { renderHook, act } from '@testing-library/react';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { useExperiments } from '../useExperiments';

// Mock dependencies
jest.mock('react-hot-toast');
jest.mock('next-auth/react');

const mockToast = toast as jest.MockedFunction<typeof toast>;
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

// Mock fetch
global.fetch = jest.fn();

const mockExperiment = {
  id: 'exp-1',
  name: 'Test Experiment',
  description: 'Test description',
  frequency: 'daily',
  duration: '4-weeks',
  fitnessMarkers: ['heartRate', 'vo2max'],
  bloodMarkers: ['glucose', 'cholesterol'],
  status: 'active' as const,
  createdAt: '2024-01-01T00:00:00Z'
};

const mockSession = {
  user: { id: 'user-123' }
};

describe('useExperiments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToast.success = jest.fn();
    mockToast.error = jest.fn();
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated'
    } as any);
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('initialization', () => {
    it('initializes with default values', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      });

      const { result } = renderHook(() => useExperiments());

      expect(result.current.experiments).toEqual([]);
      expect(result.current.editingExperiment).toBeNull();
      
      // Wait for initial load to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      expect(result.current.isLoadingExperiments).toBe(false);
    });

    it('does not fetch experiments when session is not available', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated'
      } as any);

      renderHook(() => useExperiments());

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('fetches experiments when session is available', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [mockExperiment] })
      });

      const { result } = renderHook(() => useExperiments());

      // Wait for useEffect to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/experiments?userId=user-123&t='),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          })
        })
      );
    });
  });

  describe('fetchExperiments', () => {
    it('successfully fetches experiments', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [mockExperiment] })
      });

      const { result } = renderHook(() => useExperiments());

      await act(async () => {
        await result.current.fetchExperiments();
      });

      expect(result.current.experiments).toEqual([mockExperiment]);
      expect(result.current.isLoadingExperiments).toBe(false);
    });

    it('handles API success response without data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, data: null })
      });

      const { result } = renderHook(() => useExperiments());

      await act(async () => {
        await result.current.fetchExperiments();
      });

      expect(result.current.experiments).toEqual([]);
    });

    it('handles fetch failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useExperiments());

      await act(async () => {
        await result.current.fetchExperiments();
      });

      expect(mockToast.error).toHaveBeenCalledWith('Failed to load experiments');
      expect(result.current.isLoadingExperiments).toBe(false);
    });

    it('sets loading state during fetch', async () => {
      let resolvePromise: (value: any) => void;
      const fetchPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValueOnce(fetchPromise);

      const { result } = renderHook(() => useExperiments());

      act(() => {
        result.current.fetchExperiments();
      });

      expect(result.current.isLoadingExperiments).toBe(true);

      await act(async () => {
        resolvePromise!({
          ok: true,
          json: async () => ({ success: true, data: [] })
        });
        await fetchPromise;
      });

      expect(result.current.isLoadingExperiments).toBe(false);
    });

    it('returns early when no session user id', async () => {
      mockUseSession.mockReturnValue({
        data: { user: {} },
        status: 'authenticated'
      } as any);

      const { result } = renderHook(() => useExperiments());

      await act(async () => {
        await result.current.fetchExperiments();
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('handleSaveExperiment', () => {
    it('successfully saves experiment', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockExperiment })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [mockExperiment] })
        });

      const { result } = renderHook(() => useExperiments());

      const experimentData = {
        name: 'New Experiment',
        description: 'New description',
        frequency: 'weekly',
        duration: '8-weeks',
        fitnessMarkers: ['heartRate'],
        bloodMarkers: ['glucose']
      };

      await act(async () => {
        await result.current.handleSaveExperiment(experimentData);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...experimentData, status: 'active' })
      });

      expect(mockToast.success).toHaveBeenCalledWith('Experiment created successfully');
    });

    it('handles save experiment failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400
      });

      const { result } = renderHook(() => useExperiments());

      await act(async () => {
        await result.current.handleSaveExperiment({
          name: 'Test',
          description: 'Test',
          frequency: 'daily',
          duration: '4-weeks',
          fitnessMarkers: [],
          bloodMarkers: []
        });
      });

      expect(mockToast.error).toHaveBeenCalledWith('Failed to create experiment');
    });

    it('handles network error during save', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useExperiments());

      await act(async () => {
        await result.current.handleSaveExperiment({
          name: 'Test',
          description: 'Test',
          frequency: 'daily',
          duration: '4-weeks',
          fitnessMarkers: [],
          bloodMarkers: []
        });
      });

      expect(mockToast.error).toHaveBeenCalledWith('Failed to create experiment');
    });
  });

  describe('removeExperiment', () => {
    it('successfully removes experiment', async () => {
      // Mock initial fetch
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [mockExperiment] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        });

      const { result } = renderHook(() => useExperiments());

      // Wait for initial fetch
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.experiments).toEqual([mockExperiment]);

      await act(async () => {
        await result.current.removeExperiment('exp-1');
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/experiments?id=exp-1', {
        method: 'DELETE'
      });

      expect(result.current.experiments).toEqual([]);
      expect(mockToast.success).toHaveBeenCalledWith('Experiment deleted successfully');
    });

    it('handles remove experiment failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const { result } = renderHook(() => useExperiments());

      await act(async () => {
        await result.current.removeExperiment('exp-1');
      });

      expect(mockToast.error).toHaveBeenCalledWith('Failed to delete experiment');
    });

    it('handles network error during remove', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useExperiments());

      await act(async () => {
        await result.current.removeExperiment('exp-1');
      });

      expect(mockToast.error).toHaveBeenCalledWith('Failed to delete experiment');
    });
  });

  describe('handleEditExperiment', () => {
    it('sets editing experiment', () => {
      const { result } = renderHook(() => useExperiments());

      act(() => {
        result.current.handleEditExperiment(mockExperiment);
      });

      expect(result.current.editingExperiment).toEqual(mockExperiment);
    });
  });

  describe('handleUpdateExperiment', () => {
    it('successfully updates experiment', async () => {
      const updatedExperiment = { ...mockExperiment, name: 'Updated Name' };
      
      // Mock initial fetch and update call
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [mockExperiment] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: updatedExperiment })
        });

      const { result } = renderHook(() => useExperiments());

      // Wait for initial fetch
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Set editing state
      act(() => {
        result.current.setEditingExperiment(mockExperiment);
      });

      const updateData = { name: 'Updated Name' };

      await act(async () => {
        await result.current.handleUpdateExperiment(updateData);
      });

      expect(global.fetch).toHaveBeenLastCalledWith('/api/experiments?id=exp-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      expect(result.current.editingExperiment).toBeNull();
      expect(result.current.experiments[0].name).toBe('Updated Name');
      expect(mockToast.success).toHaveBeenCalledWith('Experiment updated successfully');
    });

    it('handles update experiment failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400
      });

      const { result } = renderHook(() => useExperiments());

      act(() => {
        result.current.setEditingExperiment(mockExperiment);
      });

      await act(async () => {
        await result.current.handleUpdateExperiment({ name: 'Updated' });
      });

      expect(mockToast.error).toHaveBeenCalledWith('Failed to update experiment');
    });

    it('returns early when no editing experiment', async () => {
      // Mock initial fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      });

      const { result } = renderHook(() => useExperiments());

      // Wait for initial fetch
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Clear previous calls
      (global.fetch as jest.Mock).mockClear();

      await act(async () => {
        await result.current.handleUpdateExperiment({ name: 'Updated' });
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('handles network error during update', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useExperiments());

      act(() => {
        result.current.setEditingExperiment(mockExperiment);
      });

      await act(async () => {
        await result.current.handleUpdateExperiment({ name: 'Updated' });
      });

      expect(mockToast.error).toHaveBeenCalledWith('Failed to update experiment');
    });
  });

  describe('state setters', () => {
    it('setExperiments updates experiments state', () => {
      const { result } = renderHook(() => useExperiments());

      act(() => {
        result.current.setExperiments([mockExperiment]);
      });

      expect(result.current.experiments).toEqual([mockExperiment]);
    });

    it('setIsLoadingExperiments updates loading state', () => {
      const { result } = renderHook(() => useExperiments());

      act(() => {
        result.current.setIsLoadingExperiments(true);
      });

      expect(result.current.isLoadingExperiments).toBe(true);
    });

    it('setEditingExperiment updates editing state', () => {
      const { result } = renderHook(() => useExperiments());

      act(() => {
        result.current.setEditingExperiment(mockExperiment);
      });

      expect(result.current.editingExperiment).toEqual(mockExperiment);
    });
  });

  describe('additional edge cases', () => {
    it('handles multiple experiments in state updates', async () => {
      const mockExperiment2 = { ...mockExperiment, id: 'exp-2', name: 'Experiment 2' };
      
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [mockExperiment, mockExperiment2] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: { ...mockExperiment, name: 'Updated' } })
        });

      const { result } = renderHook(() => useExperiments());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.experiments).toHaveLength(2);

      // Test updating one of multiple experiments
      act(() => {
        result.current.setEditingExperiment(mockExperiment);
      });

      await act(async () => {
        await result.current.handleUpdateExperiment({ name: 'Updated' });
      });

      expect(result.current.experiments[0].name).toBe('Updated');
      expect(result.current.experiments[1].name).toBe('Experiment 2');
    });

    it('handles refetch after save experiment success', async () => {
      const savedExperiment = { ...mockExperiment, id: 'new-exp' };
      
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: savedExperiment })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [savedExperiment] })
        });

      const { result } = renderHook(() => useExperiments());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.handleSaveExperiment({
          name: 'New Experiment',
          description: 'Description',
          frequency: 'daily',
          duration: '4-weeks',
          fitnessMarkers: [],
          bloodMarkers: []
        });
      });

      expect(result.current.experiments).toHaveLength(1);
      expect(result.current.experiments[0].id).toBe('new-exp');
    });

    it('handles empty response data gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: null })
      });

      const { result } = renderHook(() => useExperiments());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.experiments).toEqual([]);
    });
  });

  describe('session dependency', () => {
    it('refetches experiments when session user id changes', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: [] })
      });

      const { rerender } = renderHook(() => useExperiments());

      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Change session
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-456' } },
        status: 'authenticated'
      } as any);

      rerender();

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenLastCalledWith(
        expect.stringContaining('userId=user-456'),
        expect.any(Object)
      );
    });
  });
});
