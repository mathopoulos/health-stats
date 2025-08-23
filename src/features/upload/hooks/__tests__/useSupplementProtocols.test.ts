import { renderHook, act } from '@testing-library/react';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { useSupplementProtocols } from '../useSupplementProtocols';

// Mock dependencies
jest.mock('react-hot-toast');
jest.mock('next-auth/react');

const mockToast = toast as jest.MockedFunction<typeof toast>;
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

// Mock fetch
global.fetch = jest.fn();

const mockSupplementProtocol = {
  type: 'Vitamin D',
  dosage: '2000',
  frequency: 'daily',
  unit: 'IU'
};

const mockSupplementProtocols = [
  mockSupplementProtocol,
  {
    type: 'Omega-3',
    dosage: '1000',
    frequency: 'twice daily',
    unit: 'mg'
  }
];

describe('useSupplementProtocols', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToast.success = jest.fn();
    mockToast.error = jest.fn();
    (global.fetch as jest.Mock).mockClear();
    
    // Default session mock
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'test-user-id',
          name: 'Test User',
          email: 'test@example.com',
        },
      },
      status: 'authenticated'
    } as any);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('initialization', () => {
    it('initializes with default values', () => {
      const { result } = renderHook(() => useSupplementProtocols());

      expect(result.current.supplementProtocols).toEqual([]);
      expect(result.current.isSavingSupplementProtocol).toBe(false);
    });

    it('initializes with provided initial protocols', () => {
      const { result } = renderHook(() => useSupplementProtocols(mockSupplementProtocols));

      expect(result.current.supplementProtocols).toEqual(mockSupplementProtocols);
      expect(result.current.isSavingSupplementProtocol).toBe(false);
    });

    it('updates protocols when initial values change', () => {
      const { result, rerender } = renderHook(
        ({ protocols }) => useSupplementProtocols(protocols),
        { initialProps: { protocols: [] } }
      );

      expect(result.current.supplementProtocols).toEqual([]);

      rerender({ protocols: mockSupplementProtocols });

      expect(result.current.supplementProtocols).toEqual(mockSupplementProtocols);
    });

    it('does not update if protocols are the same', () => {
      const { result, rerender } = renderHook(
        ({ protocols }) => useSupplementProtocols(protocols),
        { initialProps: { protocols: mockSupplementProtocols } }
      );

      expect(result.current.supplementProtocols).toEqual(mockSupplementProtocols);

      // Re-render with same protocols
      rerender({ protocols: mockSupplementProtocols });

      expect(result.current.supplementProtocols).toEqual(mockSupplementProtocols);
    });
  });

  describe('updateSupplementProtocol', () => {
    it.skip('successfully updates supplement protocol field', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const { result } = renderHook(() => useSupplementProtocols(mockSupplementProtocols));

      await act(async () => {
        await result.current.updateSupplementProtocol('Vitamin D', 'dosage', '3000');
      });

      const expectedProtocols = [
        { ...mockSupplementProtocol, dosage: '3000' },
        mockSupplementProtocols[1]
      ];

      expect(global.fetch).toHaveBeenCalledWith('/api/health-protocols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocolType: 'supplement',
          protocol: JSON.stringify({ supplements: expectedProtocols }),
          startDate: expect.any(String)
        })
      });

      expect(result.current.supplementProtocols[0].dosage).toBe('3000');
      expect(result.current.isSavingSupplementProtocol).toBe(false);
    });

    it('handles update failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400
      });

      const { result } = renderHook(() => useSupplementProtocols(mockSupplementProtocols));

      await act(async () => {
        await result.current.updateSupplementProtocol('Vitamin D', 'dosage', '3000 IU');
      });

      expect(mockToast.error).toHaveBeenCalledWith('Failed to update supplement protocol');
      expect(result.current.isSavingSupplementProtocol).toBe(false);
    });

    it('handles network error during update', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useSupplementProtocols(mockSupplementProtocols));

      await act(async () => {
        await result.current.updateSupplementProtocol('Vitamin D', 'dosage', '3000 IU');
      });

      expect(mockToast.error).toHaveBeenCalledWith('Failed to update supplement protocol');
      expect(result.current.isSavingSupplementProtocol).toBe(false);
    });

    it('sets loading state during update', async () => {
      let resolvePromise: (value: any) => void;
      const updatePromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValueOnce(updatePromise);

      const { result } = renderHook(() => useSupplementProtocols(mockSupplementProtocols));

      act(() => {
        result.current.updateSupplementProtocol('Vitamin D', 'dosage', '3000 IU');
      });

      expect(result.current.isSavingSupplementProtocol).toBe(true);

      await act(async () => {
        resolvePromise!({
          ok: true,
          json: async () => ({ success: true })
        });
        await updatePromise;
      });

      expect(result.current.isSavingSupplementProtocol).toBe(false);
    });

    it.skip('updates correct protocol when multiple protocols exist', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const { result } = renderHook(() => useSupplementProtocols(mockSupplementProtocols));

      await act(async () => {
        await result.current.updateSupplementProtocol('Omega-3', 'frequency', 'once daily');
      });

      expect(result.current.supplementProtocols[0].frequency).toBe('daily'); // Vitamin D unchanged
      expect(result.current.supplementProtocols[1].frequency).toBe('once daily'); // Omega-3 updated
    });
  });

  describe('handleSaveSupplementProtocols', () => {
    it.skip('successfully saves supplement protocols', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const { result } = renderHook(() => useSupplementProtocols());

      const newProtocols = [mockSupplementProtocol];

      await act(async () => {
        await result.current.handleSaveSupplementProtocols(newProtocols);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/health-protocols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocolType: 'supplement',
          protocol: JSON.stringify({ supplements: newProtocols }),
          startDate: expect.any(String)
        })
      });

      expect(result.current.supplementProtocols).toEqual(newProtocols);
      expect(mockToast.success).toHaveBeenCalledWith('Supplement protocols saved successfully');
      expect(result.current.isSavingSupplementProtocol).toBe(false);
    });

    it('handles save failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const { result } = renderHook(() => useSupplementProtocols());

      await act(async () => {
        await result.current.handleSaveSupplementProtocols([mockSupplementProtocol]);
      });

      expect(mockToast.error).toHaveBeenCalledWith('Failed to save supplement protocols');
      expect(result.current.isSavingSupplementProtocol).toBe(false);
    });

    it('handles network error during save', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useSupplementProtocols());

      await act(async () => {
        await result.current.handleSaveSupplementProtocols([mockSupplementProtocol]);
      });

      expect(mockToast.error).toHaveBeenCalledWith('Failed to save supplement protocols');
      expect(result.current.isSavingSupplementProtocol).toBe(false);
    });

    it('sets loading state during save', async () => {
      let resolvePromise: (value: any) => void;
      const savePromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValueOnce(savePromise);

      const { result } = renderHook(() => useSupplementProtocols());

      act(() => {
        result.current.handleSaveSupplementProtocols([mockSupplementProtocol]);
      });

      expect(result.current.isSavingSupplementProtocol).toBe(true);

      await act(async () => {
        resolvePromise!({
          ok: true,
          json: async () => ({ success: true })
        });
        await savePromise;
      });

      expect(result.current.isSavingSupplementProtocol).toBe(false);
    });

    it.skip('saves empty protocols array', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const { result } = renderHook(() => useSupplementProtocols(mockSupplementProtocols));

      await act(async () => {
        await result.current.handleSaveSupplementProtocols([]);
      });

      expect(result.current.supplementProtocols).toEqual([]);
      expect(mockToast.success).toHaveBeenCalledWith('Supplement protocols saved successfully');
    });
  });

  describe('addSupplementProtocol', () => {
    it('successfully adds new supplement protocol', () => {
      const { result } = renderHook(() => useSupplementProtocols());

      act(() => {
        result.current.addSupplementProtocol('Vitamin C', 'daily', '1000', 'mg');
      });

      expect(result.current.supplementProtocols).toHaveLength(1);
      expect(result.current.supplementProtocols[0]).toEqual({
        type: 'Vitamin C',
        frequency: 'daily',
        dosage: '1000',
        unit: 'mg'
      });
    });

    it('prevents adding duplicate supplement types', () => {
      const { result } = renderHook(() => useSupplementProtocols(mockSupplementProtocols));

      act(() => {
        result.current.addSupplementProtocol('Vitamin D', 'twice daily', '5000', 'IU');
      });

      expect(result.current.supplementProtocols).toHaveLength(2); // Should remain 2, not 3
      expect(mockToast.error).toHaveBeenCalledWith('This supplement is already added');
    });

    it.skip('adds supplement to existing protocols list', () => {
      const { result } = renderHook(() => useSupplementProtocols(mockSupplementProtocols));

      act(() => {
        result.current.addSupplementProtocol('Vitamin C', 'daily', '500', 'mg');
      });

      expect(result.current.supplementProtocols).toHaveLength(3);
      expect(result.current.supplementProtocols[2]).toEqual({
        type: 'Vitamin C',
        frequency: 'daily',
        dosage: '500',
        unit: 'mg'
      });
    });

    it('handles adding protocol with empty values', () => {
      const { result } = renderHook(() => useSupplementProtocols());

      act(() => {
        result.current.addSupplementProtocol('', '', '', '');
      });

      expect(result.current.supplementProtocols).toHaveLength(1);
      expect(result.current.supplementProtocols[0]).toEqual({
        type: '',
        frequency: '',
        dosage: '',
        unit: ''
      });
    });
  });

  describe('state setters', () => {
    it('setSupplementProtocols updates protocols state', () => {
      const { result } = renderHook(() => useSupplementProtocols());

      act(() => {
        result.current.setSupplementProtocols(mockSupplementProtocols);
      });

      expect(result.current.supplementProtocols).toEqual(mockSupplementProtocols);
    });

    it('setIsSavingSupplementProtocol updates saving state', () => {
      const { result } = renderHook(() => useSupplementProtocols());

      act(() => {
        result.current.setIsSavingSupplementProtocol(true);
      });

      expect(result.current.isSavingSupplementProtocol).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles empty initial protocols array', () => {
      const { result } = renderHook(() => useSupplementProtocols([]));

      expect(result.current.supplementProtocols).toEqual([]);
    });

    it('handles updating non-existent protocol type', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const { result } = renderHook(() => useSupplementProtocols(mockSupplementProtocols));

      await act(async () => {
        await result.current.updateSupplementProtocol('Non-existent', 'dosage', '100mg');
      });

      // Protocol list should remain unchanged since the type doesn't exist
      expect(result.current.supplementProtocols).toEqual(mockSupplementProtocols);
    });

    it.skip('handles updating multiple fields on same protocol', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      const { result } = renderHook(() => useSupplementProtocols(mockSupplementProtocols));

      await act(async () => {
        await result.current.updateSupplementProtocol('Vitamin D', 'dosage', '3000');
      });

      await act(async () => {
        await result.current.updateSupplementProtocol('Vitamin D', 'frequency', 'twice daily');
      });

      expect(result.current.supplementProtocols[0].dosage).toBe('3000');
      expect(result.current.supplementProtocols[0].frequency).toBe('twice daily');
      expect(result.current.supplementProtocols[0].type).toBe('Vitamin D'); // Other fields unchanged
    });

    it.skip('handles updating with empty string value', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const { result } = renderHook(() => useSupplementProtocols(mockSupplementProtocols));

      await act(async () => {
        await result.current.updateSupplementProtocol('Vitamin D', 'unit', '');
      });

      expect(result.current.supplementProtocols[0].unit).toBe('');
    });

    it.skip('handles saving protocols with complex data structures', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const complexProtocols = [
        {
          type: 'Multi-vitamin with special chars: @#$%^&*()',
          dosage: '1',
          frequency: 'daily',
          unit: 'tablet'
        }
      ];

      const { result } = renderHook(() => useSupplementProtocols());

      await act(async () => {
        await result.current.handleSaveSupplementProtocols(complexProtocols);
      });

      expect(result.current.supplementProtocols).toEqual(complexProtocols);
    });
  });

  describe('protocol state management', () => {
    it('maintains state consistency during concurrent operations', async () => {
      let resolveUpdate: (value: any) => void;
      let resolveSave: (value: any) => void;
      
      const updatePromise = new Promise(resolve => {
        resolveUpdate = resolve;
      });
      
      const savePromise = new Promise(resolve => {
        resolveSave = resolve;
      });

      (global.fetch as jest.Mock)
        .mockReturnValueOnce(updatePromise)
        .mockReturnValueOnce(savePromise);

      const { result } = renderHook(() => useSupplementProtocols(mockSupplementProtocols));

      // Start update operation
      act(() => {
        result.current.updateSupplementProtocol('Vitamin D', 'dosage', '4000 IU');
      });

      expect(result.current.isSavingSupplementProtocol).toBe(true);

      // Start save operation while update is in progress
      act(() => {
        result.current.handleSaveSupplementProtocols([mockSupplementProtocol]);
      });

      // Complete both operations
      await act(async () => {
        resolveUpdate!({
          ok: true,
          json: async () => ({ success: true })
        });
        resolveSave!({
          ok: true,
          json: async () => ({ success: true })
        });
        await Promise.all([updatePromise, savePromise]);
      });

      expect(result.current.isSavingSupplementProtocol).toBe(false);
    });

    it('handles rapid state changes', async () => {
      const { result } = renderHook(() => useSupplementProtocols());

      // Rapid state changes
      act(() => {
        result.current.setSupplementProtocols([mockSupplementProtocol]);
        result.current.setIsSavingSupplementProtocol(true);
        result.current.setSupplementProtocols(mockSupplementProtocols);
        result.current.setIsSavingSupplementProtocol(false);
      });

      expect(result.current.supplementProtocols).toEqual(mockSupplementProtocols);
      expect(result.current.isSavingSupplementProtocol).toBe(false);
    });
  });

  describe('API response handling', () => {
    it('handles malformed API response', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('JSON parse error'));

      const { result } = renderHook(() => useSupplementProtocols());

      await act(async () => {
        await result.current.handleSaveSupplementProtocols([mockSupplementProtocol]);
      });

      expect(mockToast.error).toHaveBeenCalledWith('Failed to save supplement protocols');
    });

    it('handles missing response body', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => null
      });

      const { result } = renderHook(() => useSupplementProtocols());

      await act(async () => {
        await result.current.updateSupplementProtocol('Vitamin D', 'dosage', '3000 IU');
      });

      expect(mockToast.error).toHaveBeenCalledWith('Failed to update supplement protocol');
    });
  });

  describe('validation and edge cases', () => {
    it.skip('handles updating with undefined values', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const { result } = renderHook(() => useSupplementProtocols(mockSupplementProtocols));

      await act(async () => {
        await result.current.updateSupplementProtocol('Vitamin D', 'dosage', undefined as any);
      });

      expect(result.current.supplementProtocols[0].dosage).toBeUndefined();
    });

    it.skip('handles saving with null protocols', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const { result } = renderHook(() => useSupplementProtocols());

      await act(async () => {
        await result.current.handleSaveSupplementProtocols(null as any);
      });

      expect(result.current.supplementProtocols).toBeNull();
    });

    it.skip('handles protocol with all fields updated', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      const { result } = renderHook(() => useSupplementProtocols([mockSupplementProtocol]));

      // Update all fields
      await act(async () => {
        await result.current.updateSupplementProtocol('Vitamin D', 'type', 'Vitamin D3');
      });
      await act(async () => {
        await result.current.updateSupplementProtocol('Vitamin D3', 'dosage', '5000');
      });
      await act(async () => {
        await result.current.updateSupplementProtocol('Vitamin D3', 'frequency', 'twice daily');
      });
      await act(async () => {
        await result.current.updateSupplementProtocol('Vitamin D3', 'unit', 'mcg');
      });

      const updatedProtocol = result.current.supplementProtocols[0];
      expect(updatedProtocol.type).toBe('Vitamin D3');
      expect(updatedProtocol.dosage).toBe('5000');
      expect(updatedProtocol.frequency).toBe('twice daily');
      expect(updatedProtocol.unit).toBe('mcg');
    });
  });
});
