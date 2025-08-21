import { ExperimentService, CreateExperimentRequest, UpdateExperimentRequest, Experiment } from '../experimentService';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ExperimentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('API Methods', () => {
    describe('getExperiments', () => {
      it('fetches experiments successfully', async () => {
        const mockExperiments: Experiment[] = [
          {
            id: '1',
            name: 'Sleep Tracking',
            description: 'Track sleep quality',
            frequency: 'daily',
            duration: '4-weeks',
            fitnessMarkers: ['sleep'],
            bloodMarkers: ['cortisol'],
            status: 'active',
            createdAt: '2024-01-01',
          },
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockExperiments),
        });

        const result = await ExperimentService.getExperiments();

        expect(mockFetch).toHaveBeenCalledWith('/api/experiments');
        expect(result).toEqual(mockExperiments);
      });

      it('throws error when fetch fails', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
        });

        await expect(ExperimentService.getExperiments()).rejects.toThrow('Failed to load experiments');
      });

      it('throws error when network fails', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(ExperimentService.getExperiments()).rejects.toThrow('Network error');
      });
    });

    describe('createExperiment', () => {
      const mockExperimentRequest: CreateExperimentRequest = {
        name: 'Test Experiment',
        description: 'Test description for the experiment',
        frequency: 'daily',
        duration: '4-weeks',
        fitnessMarkers: ['steps'],
        bloodMarkers: ['glucose'],
        status: 'active',
      };

      it('creates experiment successfully', async () => {
        const mockCreatedExperiment: Experiment = {
          ...mockExperimentRequest,
          id: '123',
          createdAt: '2024-01-01',
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockCreatedExperiment),
        });

        const result = await ExperimentService.createExperiment(mockExperimentRequest);

        expect(mockFetch).toHaveBeenCalledWith('/api/experiments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockExperimentRequest),
        });
        expect(result).toEqual(mockCreatedExperiment);
      });

      it('throws error when creation fails', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
        });

        await expect(ExperimentService.createExperiment(mockExperimentRequest)).rejects.toThrow('Failed to create experiment');
      });

      it('throws error when network fails', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(ExperimentService.createExperiment(mockExperimentRequest)).rejects.toThrow('Network error');
      });
    });

    describe('updateExperiment', () => {
      const mockUpdateRequest: UpdateExperimentRequest = {
        name: 'Updated Experiment',
        status: 'completed',
      };

      it('updates experiment successfully', async () => {
        const mockUpdatedExperiment: Experiment = {
          id: '123',
          name: 'Updated Experiment',
          description: 'Test description',
          frequency: 'daily',
          duration: '4-weeks',
          fitnessMarkers: ['steps'],
          bloodMarkers: ['glucose'],
          status: 'completed',
          createdAt: '2024-01-01',
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockUpdatedExperiment),
        });

        const result = await ExperimentService.updateExperiment('123', mockUpdateRequest);

        expect(mockFetch).toHaveBeenCalledWith('/api/experiments/123', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockUpdateRequest),
        });
        expect(result).toEqual(mockUpdatedExperiment);
      });

      it('throws error when update fails', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

        await expect(ExperimentService.updateExperiment('123', mockUpdateRequest)).rejects.toThrow('Failed to update experiment');
      });

      it('throws error when network fails', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(ExperimentService.updateExperiment('123', mockUpdateRequest)).rejects.toThrow('Network error');
      });
    });

    describe('deleteExperiment', () => {
      it('deletes experiment successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
        });

        await expect(ExperimentService.deleteExperiment('123')).resolves.toBeUndefined();

        expect(mockFetch).toHaveBeenCalledWith('/api/experiments/123', {
          method: 'DELETE',
        });
      });

      it('throws error when deletion fails', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

        await expect(ExperimentService.deleteExperiment('123')).rejects.toThrow('Failed to delete experiment');
      });

      it('throws error when network fails', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(ExperimentService.deleteExperiment('123')).rejects.toThrow('Network error');
      });
    });
  });

  describe('Validation Methods', () => {
    describe('validateExperimentName', () => {
      it('returns null for valid name', () => {
        expect(ExperimentService.validateExperimentName('Valid Experiment Name')).toBeNull();
        expect(ExperimentService.validateExperimentName('ABC')).toBeNull(); // minimum length
        expect(ExperimentService.validateExperimentName('A'.repeat(100))).toBeNull(); // maximum length
      });

      it('returns error for empty/whitespace name', () => {
        expect(ExperimentService.validateExperimentName('')).toBe('Experiment name is required');
        expect(ExperimentService.validateExperimentName('   ')).toBe('Experiment name is required');
        expect(ExperimentService.validateExperimentName('\n\t')).toBe('Experiment name is required');
      });

      it('returns error for name too short', () => {
        expect(ExperimentService.validateExperimentName('AB')).toBe('Experiment name must be at least 3 characters long');
        expect(ExperimentService.validateExperimentName('A')).toBe('Experiment name must be at least 3 characters long');
      });

      it('returns error for name too long', () => {
        const longName = 'A'.repeat(101);
        expect(ExperimentService.validateExperimentName(longName)).toBe('Experiment name must be less than 100 characters');
      });
    });

    describe('validateExperimentDescription', () => {
      it('returns null for valid description', () => {
        expect(ExperimentService.validateExperimentDescription('This is a valid description')).toBeNull();
        expect(ExperimentService.validateExperimentDescription('1234567890')).toBeNull(); // minimum length
        expect(ExperimentService.validateExperimentDescription('A'.repeat(500))).toBeNull(); // maximum length
      });

      it('returns error for empty/whitespace description', () => {
        expect(ExperimentService.validateExperimentDescription('')).toBe('Experiment description is required');
        expect(ExperimentService.validateExperimentDescription('   ')).toBe('Experiment description is required');
        expect(ExperimentService.validateExperimentDescription('\n\t')).toBe('Experiment description is required');
      });

      it('returns error for description too short', () => {
        expect(ExperimentService.validateExperimentDescription('123456789')).toBe('Description must be at least 10 characters long');
        expect(ExperimentService.validateExperimentDescription('short')).toBe('Description must be at least 10 characters long');
      });

      it('returns error for description too long', () => {
        const longDescription = 'A'.repeat(501);
        expect(ExperimentService.validateExperimentDescription(longDescription)).toBe('Description must be less than 500 characters');
      });
    });

    describe('validateFrequency', () => {
      it('returns null for valid frequencies', () => {
        expect(ExperimentService.validateFrequency('daily')).toBeNull();
        expect(ExperimentService.validateFrequency('weekly')).toBeNull();
        expect(ExperimentService.validateFrequency('biweekly')).toBeNull();
        expect(ExperimentService.validateFrequency('monthly')).toBeNull();
      });

      it('returns null for valid frequencies with different case', () => {
        expect(ExperimentService.validateFrequency('DAILY')).toBeNull();
        expect(ExperimentService.validateFrequency('Weekly')).toBeNull();
        expect(ExperimentService.validateFrequency('BiWeekly')).toBeNull();
        expect(ExperimentService.validateFrequency('MONTHLY')).toBeNull();
      });

      it('returns error for empty frequency', () => {
        expect(ExperimentService.validateFrequency('')).toBe('Frequency is required');
        expect(ExperimentService.validateFrequency('   ')).toBe('Please select a valid frequency');
      });

      it('returns error for invalid frequency', () => {
        expect(ExperimentService.validateFrequency('invalid')).toBe('Please select a valid frequency');
        expect(ExperimentService.validateFrequency('yearly')).toBe('Please select a valid frequency');
        expect(ExperimentService.validateFrequency('hourly')).toBe('Please select a valid frequency');
      });
    });

    describe('validateDuration', () => {
      it('returns null for valid duration', () => {
        expect(ExperimentService.validateDuration('4-weeks')).toBeNull();
        expect(ExperimentService.validateDuration('2-months')).toBeNull();
        expect(ExperimentService.validateDuration('1-year')).toBeNull();
        expect(ExperimentService.validateDuration('30-days')).toBeNull();
      });

      it('returns error for empty/whitespace duration', () => {
        expect(ExperimentService.validateDuration('')).toBe('Duration is required');
        expect(ExperimentService.validateDuration('   ')).toBe('Duration is required');
        expect(ExperimentService.validateDuration('\n\t')).toBe('Duration is required');
      });
    });

    describe('validateMarkers', () => {
      it('returns null for valid marker arrays', () => {
        expect(ExperimentService.validateMarkers(['marker1'])).toBeNull();
        expect(ExperimentService.validateMarkers(['marker1', 'marker2'])).toBeNull();
        expect(ExperimentService.validateMarkers(Array(10).fill('marker'))).toBeNull(); // exactly 10
      });

      it('returns error for empty marker array', () => {
        expect(ExperimentService.validateMarkers([])).toBe('Please select at least one marker to track');
      });

      it('returns error for too many markers', () => {
        const tooManyMarkers = Array(11).fill('marker');
        expect(ExperimentService.validateMarkers(tooManyMarkers)).toBe('Please select no more than 10 markers');
      });
    });

    describe('validateExperiment', () => {
      const validExperiment: CreateExperimentRequest = {
        name: 'Valid Experiment',
        description: 'This is a valid experiment description',
        frequency: 'daily',
        duration: '4-weeks',
        fitnessMarkers: ['steps'],
        bloodMarkers: ['glucose'],
        status: 'active',
      };

      it('returns empty object for valid experiment', () => {
        const errors = ExperimentService.validateExperiment(validExperiment);
        expect(errors).toEqual({});
      });

      it('returns multiple errors for invalid experiment', () => {
        const invalidExperiment: CreateExperimentRequest = {
          name: 'AB', // too short
          description: 'short', // too short
          frequency: 'invalid', // invalid frequency
          duration: '', // empty
          fitnessMarkers: [],
          bloodMarkers: [], // no markers selected
          status: 'active',
        };

        const errors = ExperimentService.validateExperiment(invalidExperiment);
        
        expect(errors.name).toBe('Experiment name must be at least 3 characters long');
        expect(errors.description).toBe('Description must be at least 10 characters long');
        expect(errors.frequency).toBe('Please select a valid frequency');
        expect(errors.duration).toBe('Duration is required');
        expect(errors.markers).toBe('Please select at least one marker to track');
      });

      it('validates markers correctly when combining fitness and blood markers', () => {
        const experimentWithTooManyMarkers: CreateExperimentRequest = {
          ...validExperiment,
          fitnessMarkers: Array(6).fill('fitness'),
          bloodMarkers: Array(5).fill('blood'),
        };

        const errors = ExperimentService.validateExperiment(experimentWithTooManyMarkers);
        expect(errors.markers).toBe('Please select no more than 10 markers');
      });

      it('validates individual fields independently', () => {
        const partiallyInvalidExperiment: CreateExperimentRequest = {
          name: 'Valid Name',
          description: 'Valid description with enough characters',
          frequency: 'invalid', // only this is invalid
          duration: '4-weeks',
          fitnessMarkers: ['steps'],
          bloodMarkers: [],
          status: 'active',
        };

        const errors = ExperimentService.validateExperiment(partiallyInvalidExperiment);
        
        expect(errors.frequency).toBe('Please select a valid frequency');
        expect(errors.name).toBeUndefined();
        expect(errors.description).toBeUndefined();
        expect(errors.duration).toBeUndefined();
        expect(errors.markers).toBeUndefined();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles null/undefined values gracefully in validation', () => {
      // Test validation methods with edge case inputs
      expect(() => {
        ExperimentService.validateExperimentName(null as any);
      }).toThrow(); // Should throw as trim() will fail

      expect(() => {
        ExperimentService.validateExperimentDescription(undefined as any);
      }).toThrow(); // Should throw as trim() will fail
    });

    it('handles special characters in experiment data', () => {
      const experimentWithSpecialChars: CreateExperimentRequest = {
        name: 'Test & Special (Characters) 100%',
        description: 'Description with special chars: @#$%^&*()_+-={}[]|;:,.<>?',
        frequency: 'daily',
        duration: '4-weeks',
        fitnessMarkers: ['marker-with-dash'],
        bloodMarkers: ['marker_with_underscore'],
        status: 'active',
      };

      const errors = ExperimentService.validateExperiment(experimentWithSpecialChars);
      expect(errors).toEqual({});
    });

    it('handles unicode characters in validation', () => {
      const unicodeExperiment: CreateExperimentRequest = {
        name: 'Test 🧪 Experiment',
        description: 'Description with émojis and ñón-ASCII çharacters',
        frequency: 'daily',
        duration: '4-weeks',
        fitnessMarkers: ['💪'],
        bloodMarkers: ['🩸'],
        status: 'active',
      };

      const errors = ExperimentService.validateExperiment(unicodeExperiment);
      expect(errors).toEqual({});
    });
  });
});
