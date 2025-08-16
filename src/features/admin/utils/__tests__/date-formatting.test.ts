import { describe, it, expect } from '@jest/globals';
import { formatDate } from '../date-formatting';

describe('date-formatting', () => {
  describe('formatDate', () => {
    it('should format valid date string correctly', () => {
      const formatted = formatDate('2023-12-25T15:30:00Z');
      // Note: The exact format will depend on the system locale, 
      // but we can check that it contains expected parts
      expect(formatted).toMatch(/Dec/);
      expect(formatted).toMatch(/25/);
      expect(formatted).toMatch(/2023/);
    });

    it('should return "N/A" for empty string', () => {
      const formatted = formatDate('');
      expect(formatted).toBe('N/A');
    });

    it('should return "N/A" for invalid date string', () => {
      const formatted = formatDate('invalid-date');
      expect(formatted).toBe('N/A');
    });

    it('should handle ISO date strings', () => {
      const isoDate = '2023-01-15T08:45:30.123Z';
      const formatted = formatDate(isoDate);
      expect(typeof formatted).toBe('string');
      expect(formatted).not.toBe('N/A');
    });
  });
});
