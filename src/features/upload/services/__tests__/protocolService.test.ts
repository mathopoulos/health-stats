import { ProtocolService, WorkoutProtocol, SupplementProtocol } from '../protocolService';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ProtocolService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Diet Protocol Methods', () => {
    describe('updateDietProtocol', () => {
      it('updates diet protocol successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
        });

        await expect(ProtocolService.updateDietProtocol('Mediterranean')).resolves.toBeUndefined();

        expect(mockFetch).toHaveBeenCalledWith('/api/diet-protocol', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ diet: 'Mediterranean' }),
        });
      });

      it('throws error when update fails', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
        });

        await expect(ProtocolService.updateDietProtocol('Keto')).rejects.toThrow('Failed to update diet protocol');
      });

      it('throws error when network fails', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(ProtocolService.updateDietProtocol('Paleo')).rejects.toThrow('Network error');
      });

      it('handles empty diet string', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
        });

        await expect(ProtocolService.updateDietProtocol('')).resolves.toBeUndefined();

        expect(mockFetch).toHaveBeenCalledWith('/api/diet-protocol', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ diet: '' }),
        });
      });
    });
  });

  describe('Workout Protocol Methods', () => {
    describe('saveWorkoutProtocols', () => {
      it('saves workout protocols successfully', async () => {
        const protocols: WorkoutProtocol[] = [
          { type: 'Running', frequency: 3 },
          { type: 'Weight Training', frequency: 4 },
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
        });

        await expect(ProtocolService.saveWorkoutProtocols(protocols)).resolves.toBeUndefined();

        expect(mockFetch).toHaveBeenCalledWith('/api/workout-protocols', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ protocols }),
        });
      });

      it('saves empty protocols array', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
        });

        await expect(ProtocolService.saveWorkoutProtocols([])).resolves.toBeUndefined();

        expect(mockFetch).toHaveBeenCalledWith('/api/workout-protocols', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ protocols: [] }),
        });
      });

      it('throws error when save fails', async () => {
        const protocols: WorkoutProtocol[] = [{ type: 'Running', frequency: 3 }];

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
        });

        await expect(ProtocolService.saveWorkoutProtocols(protocols)).rejects.toThrow('Failed to save workout protocols');
      });

      it('throws error when network fails', async () => {
        const protocols: WorkoutProtocol[] = [{ type: 'Running', frequency: 3 }];

        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(ProtocolService.saveWorkoutProtocols(protocols)).rejects.toThrow('Network error');
      });
    });

    describe('updateWorkoutProtocolFrequency', () => {
      it('updates workout protocol frequency successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
        });

        await expect(ProtocolService.updateWorkoutProtocolFrequency('Running', 5)).resolves.toBeUndefined();

        expect(mockFetch).toHaveBeenCalledWith('/api/workout-protocols', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: 'Running', frequency: 5 }),
        });
      });

      it('throws error when update fails', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

        await expect(ProtocolService.updateWorkoutProtocolFrequency('Swimming', 2)).rejects.toThrow('Failed to update workout protocol frequency');
      });

      it('throws error when network fails', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(ProtocolService.updateWorkoutProtocolFrequency('Cycling', 3)).rejects.toThrow('Network error');
      });

      it('handles zero frequency', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
        });

        await expect(ProtocolService.updateWorkoutProtocolFrequency('Rest', 0)).resolves.toBeUndefined();

        expect(mockFetch).toHaveBeenCalledWith('/api/workout-protocols', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: 'Rest', frequency: 0 }),
        });
      });
    });

    describe('deleteWorkoutProtocol', () => {
      it('deletes workout protocol successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
        });

        await expect(ProtocolService.deleteWorkoutProtocol('Running')).resolves.toBeUndefined();

        expect(mockFetch).toHaveBeenCalledWith('/api/workout-protocols', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: 'Running' }),
        });
      });

      it('throws error when deletion fails', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

        await expect(ProtocolService.deleteWorkoutProtocol('Swimming')).rejects.toThrow('Failed to remove workout protocol');
      });

      it('throws error when network fails', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(ProtocolService.deleteWorkoutProtocol('Cycling')).rejects.toThrow('Network error');
      });

      it('handles empty type string', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
        });

        await expect(ProtocolService.deleteWorkoutProtocol('')).resolves.toBeUndefined();

        expect(mockFetch).toHaveBeenCalledWith('/api/workout-protocols', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: '' }),
        });
      });
    });
  });

  describe('Supplement Protocol Methods', () => {
    describe('saveSupplementProtocols', () => {
      it('saves supplement protocols successfully', async () => {
        const protocols: SupplementProtocol[] = [
          { type: 'Vitamin D', frequency: 'daily', dosage: '1000', unit: 'IU' },
          { type: 'Omega-3', frequency: 'twice-daily', dosage: '500', unit: 'mg' },
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
        });

        await expect(ProtocolService.saveSupplementProtocols(protocols)).resolves.toBeUndefined();

        expect(mockFetch).toHaveBeenCalledWith('/api/supplement-protocols', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ protocols }),
        });
      });

      it('saves empty protocols array', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
        });

        await expect(ProtocolService.saveSupplementProtocols([])).resolves.toBeUndefined();

        expect(mockFetch).toHaveBeenCalledWith('/api/supplement-protocols', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ protocols: [] }),
        });
      });

      it('throws error when save fails', async () => {
        const protocols: SupplementProtocol[] = [
          { type: 'Vitamin C', frequency: 'daily', dosage: '500', unit: 'mg' },
        ];

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
        });

        await expect(ProtocolService.saveSupplementProtocols(protocols)).rejects.toThrow('Failed to save supplement protocols');
      });

      it('throws error when network fails', async () => {
        const protocols: SupplementProtocol[] = [
          { type: 'Magnesium', frequency: 'daily', dosage: '200', unit: 'mg' },
        ];

        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(ProtocolService.saveSupplementProtocols(protocols)).rejects.toThrow('Network error');
      });
    });

    describe('updateSupplementProtocol', () => {
      it('updates supplement protocol successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
        });

        await expect(ProtocolService.updateSupplementProtocol('Vitamin D', 'dosage', '2000')).resolves.toBeUndefined();

        expect(mockFetch).toHaveBeenCalledWith('/api/supplement-protocols', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: 'Vitamin D', field: 'dosage', value: '2000' }),
        });
      });

      it('updates different fields successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
        });

        await expect(ProtocolService.updateSupplementProtocol('Omega-3', 'frequency', 'twice-daily')).resolves.toBeUndefined();

        expect(mockFetch).toHaveBeenCalledWith('/api/supplement-protocols', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: 'Omega-3', field: 'frequency', value: 'twice-daily' }),
        });
      });

      it('throws error when update fails', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

        await expect(ProtocolService.updateSupplementProtocol('Vitamin C', 'unit', 'mg')).rejects.toThrow('Failed to update supplement protocol');
      });

      it('throws error when network fails', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(ProtocolService.updateSupplementProtocol('Zinc', 'dosage', '15')).rejects.toThrow('Network error');
      });

      it('handles empty values', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
        });

        await expect(ProtocolService.updateSupplementProtocol('', '', '')).resolves.toBeUndefined();

        expect(mockFetch).toHaveBeenCalledWith('/api/supplement-protocols', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: '', field: '', value: '' }),
        });
      });
    });
  });

  describe('Validation Methods', () => {
    describe('validateWorkoutType', () => {
      const existingProtocols: WorkoutProtocol[] = [
        { type: 'Running', frequency: 3 },
        { type: 'Swimming', frequency: 2 },
      ];

      it('returns null for valid workout type', () => {
        expect(ProtocolService.validateWorkoutType('Cycling', existingProtocols)).toBeNull();
        expect(ProtocolService.validateWorkoutType('Weight Training', existingProtocols)).toBeNull();
        expect(ProtocolService.validateWorkoutType('Yoga', [])).toBeNull();
      });

      it('returns error for empty workout type', () => {
        expect(ProtocolService.validateWorkoutType('', existingProtocols)).toBe('Workout type is required');
        expect(ProtocolService.validateWorkoutType('   ', existingProtocols)).toBe('Workout type is required');
        expect(ProtocolService.validateWorkoutType('\t\n', existingProtocols)).toBe('Workout type is required');
      });

      it('returns error for duplicate workout type', () => {
        expect(ProtocolService.validateWorkoutType('Running', existingProtocols)).toBe('This workout type is already added');
        expect(ProtocolService.validateWorkoutType('Swimming', existingProtocols)).toBe('This workout type is already added');
      });

      it('handles case sensitivity correctly', () => {
        expect(ProtocolService.validateWorkoutType('running', existingProtocols)).toBeNull(); // Different case
        expect(ProtocolService.validateWorkoutType('RUNNING', existingProtocols)).toBeNull(); // Different case
      });

      it('handles empty existing protocols', () => {
        expect(ProtocolService.validateWorkoutType('Running', [])).toBeNull();
        expect(ProtocolService.validateWorkoutType('Any Workout', [])).toBeNull();
      });
    });

    describe('validateSupplementType', () => {
      const existingProtocols: SupplementProtocol[] = [
        { type: 'Vitamin D', frequency: 'daily', dosage: '1000', unit: 'IU' },
        { type: 'Omega-3', frequency: 'twice-daily', dosage: '500', unit: 'mg' },
      ];

      it('returns null for valid supplement type', () => {
        expect(ProtocolService.validateSupplementType('Vitamin C', existingProtocols)).toBeNull();
        expect(ProtocolService.validateSupplementType('Magnesium', existingProtocols)).toBeNull();
        expect(ProtocolService.validateSupplementType('Zinc', [])).toBeNull();
      });

      it('returns error for empty supplement type', () => {
        expect(ProtocolService.validateSupplementType('', existingProtocols)).toBe('Supplement type is required');
        expect(ProtocolService.validateSupplementType('   ', existingProtocols)).toBe('Supplement type is required');
        expect(ProtocolService.validateSupplementType('\t\n', existingProtocols)).toBe('Supplement type is required');
      });

      it('returns error for duplicate supplement type', () => {
        expect(ProtocolService.validateSupplementType('Vitamin D', existingProtocols)).toBe('This supplement is already added');
        expect(ProtocolService.validateSupplementType('Omega-3', existingProtocols)).toBe('This supplement is already added');
      });

      it('handles case sensitivity correctly', () => {
        expect(ProtocolService.validateSupplementType('vitamin d', existingProtocols)).toBeNull(); // Different case
        expect(ProtocolService.validateSupplementType('VITAMIN D', existingProtocols)).toBeNull(); // Different case
      });

      it('handles empty existing protocols', () => {
        expect(ProtocolService.validateSupplementType('Vitamin D', [])).toBeNull();
        expect(ProtocolService.validateSupplementType('Any Supplement', [])).toBeNull();
      });
    });

    describe('validateFrequency', () => {
      it('returns null for valid frequencies', () => {
        expect(ProtocolService.validateFrequency(1)).toBeNull();
        expect(ProtocolService.validateFrequency(3)).toBeNull();
        expect(ProtocolService.validateFrequency(7)).toBeNull();
      });

      it('returns error for frequencies below 1', () => {
        expect(ProtocolService.validateFrequency(0)).toBe('Frequency must be between 1 and 7 times per week');
        expect(ProtocolService.validateFrequency(-1)).toBe('Frequency must be between 1 and 7 times per week');
        expect(ProtocolService.validateFrequency(-10)).toBe('Frequency must be between 1 and 7 times per week');
      });

      it('returns error for frequencies above 7', () => {
        expect(ProtocolService.validateFrequency(8)).toBe('Frequency must be between 1 and 7 times per week');
        expect(ProtocolService.validateFrequency(10)).toBe('Frequency must be between 1 and 7 times per week');
        expect(ProtocolService.validateFrequency(100)).toBe('Frequency must be between 1 and 7 times per week');
      });

      it('handles decimal frequencies', () => {
        expect(ProtocolService.validateFrequency(1.5)).toBeNull(); // Valid: between 1 and 7
        expect(ProtocolService.validateFrequency(3.7)).toBeNull(); // Valid: between 1 and 7
        expect(ProtocolService.validateFrequency(0.5)).toBe('Frequency must be between 1 and 7 times per week'); // Invalid: < 1
      });
    });

    describe('validateDosage', () => {
      it('returns null for valid dosages', () => {
        expect(ProtocolService.validateDosage('100')).toBeNull();
        expect(ProtocolService.validateDosage('1000 mg')).toBeNull();
        expect(ProtocolService.validateDosage('2.5')).toBeNull();
        expect(ProtocolService.validateDosage('1-2 tablets')).toBeNull();
      });

      it('returns error for empty dosage', () => {
        expect(ProtocolService.validateDosage('')).toBe('Dosage is required');
        expect(ProtocolService.validateDosage('   ')).toBe('Dosage is required');
        expect(ProtocolService.validateDosage('\t\n')).toBe('Dosage is required');
      });

      it('accepts any non-empty string as valid dosage', () => {
        expect(ProtocolService.validateDosage('a')).toBeNull();
        expect(ProtocolService.validateDosage('any text')).toBeNull();
        expect(ProtocolService.validateDosage('123abc')).toBeNull();
        expect(ProtocolService.validateDosage('!@#$%')).toBeNull();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles special characters in protocol types', () => {
      const protocols: WorkoutProtocol[] = [];
      
      expect(ProtocolService.validateWorkoutType('High-Intensity Training', protocols)).toBeNull();
      expect(ProtocolService.validateWorkoutType('Cardio & Strength', protocols)).toBeNull();
      expect(ProtocolService.validateWorkoutType('Exercise (Advanced)', protocols)).toBeNull();
    });

    it('handles very long protocol names', () => {
      const longName = 'Very'.repeat(50) + 'LongWorkoutName';
      const protocols: WorkoutProtocol[] = [];
      
      expect(ProtocolService.validateWorkoutType(longName, protocols)).toBeNull();
    });

    it('handles unicode characters in protocol names', () => {
      const protocols: SupplementProtocol[] = [];
      
      expect(ProtocolService.validateSupplementType('Витамин D', protocols)).toBeNull();
      expect(ProtocolService.validateSupplementType('Omega-3 💊', protocols)).toBeNull();
    });

    it('handles extreme frequency values', () => {
      expect(ProtocolService.validateFrequency(Number.MAX_SAFE_INTEGER)).toBe('Frequency must be between 1 and 7 times per week');
      expect(ProtocolService.validateFrequency(Number.MIN_SAFE_INTEGER)).toBe('Frequency must be between 1 and 7 times per week');
    });

    it('handles NaN and Infinity frequencies', () => {
      expect(ProtocolService.validateFrequency(NaN)).toBeNull(); // NaN comparisons return false, so passes validation
      expect(ProtocolService.validateFrequency(Infinity)).toBe('Frequency must be between 1 and 7 times per week'); // Infinity > 7
      expect(ProtocolService.validateFrequency(-Infinity)).toBe('Frequency must be between 1 and 7 times per week'); // -Infinity < 1
    });

    it('handles complex dosage formats', () => {
      expect(ProtocolService.validateDosage('1-2 capsules with meals')).toBeNull();
      expect(ProtocolService.validateDosage('500mg twice daily')).toBeNull();
      expect(ProtocolService.validateDosage('As directed by physician')).toBeNull();
    });
  });
});
