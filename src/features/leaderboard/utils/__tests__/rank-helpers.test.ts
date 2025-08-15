import { getRankText, getRankColor, getRankGradient, getRankConfig } from '../rank-helpers';

describe('rank-helpers', () => {
  describe('getRankText', () => {
    it('returns correct ordinal suffixes for 1st-3rd place', () => {
      expect(getRankText(1)).toBe('1st');
      expect(getRankText(2)).toBe('2nd');
      expect(getRankText(3)).toBe('3rd');
    });

    it('returns "th" for numbers 4-10', () => {
      expect(getRankText(4)).toBe('4th');
      expect(getRankText(5)).toBe('5th');
      expect(getRankText(10)).toBe('10th');
    });

    it('handles special cases for 11th-13th', () => {
      expect(getRankText(11)).toBe('11th');
      expect(getRankText(12)).toBe('12th');
      expect(getRankText(13)).toBe('13th');
    });

    it('correctly handles larger numbers', () => {
      expect(getRankText(21)).toBe('21st');
      expect(getRankText(22)).toBe('22nd');
      expect(getRankText(23)).toBe('23rd');
      expect(getRankText(24)).toBe('24th');
      expect(getRankText(101)).toBe('101st');
      expect(getRankText(111)).toBe('111th');
    });
  });

  describe('getRankColor', () => {
    it('returns white colors for 1st place', () => {
      const color = getRankColor(1);
      expect(color).toContain('white');
    });

    it('returns silver colors for 2nd place', () => {
      const color = getRankColor(2);
      expect(color).toContain('gray');
    });

    it('returns bronze colors for 3rd place', () => {
      const color = getRankColor(3);
      expect(color).toContain('amber');
    });

    it('returns default colors for other ranks', () => {
      const color = getRankColor(4);
      expect(color).toContain('indigo');
      
      const color10 = getRankColor(10);
      expect(color10).toContain('indigo');
    });
  });

  describe('getRankGradient', () => {
    it('returns yellow gradient for 1st place', () => {
      const gradient = getRankGradient(1);
      expect(gradient).toContain('yellow');
    });

    it('returns gray gradient for 2nd place', () => {
      const gradient = getRankGradient(2);
      expect(gradient).toContain('gray');
    });

    it('returns amber gradient for 3rd place', () => {
      const gradient = getRankGradient(3);
      expect(gradient).toContain('amber');
    });

    it('returns indigo-purple gradient for other ranks', () => {
      const gradient = getRankGradient(4);
      expect(gradient).toContain('indigo');
      expect(gradient).toContain('purple');
    });
  });

  describe('getRankConfig', () => {
    it('returns complete config for 1st place', () => {
      const config = getRankConfig(1);
      
      expect(config.text).toBe('1st');
      expect(config.color).toContain('white');
      expect(config.gradient).toContain('yellow');
      expect(config.icon).toBeUndefined();
    });

    it('returns complete config for 2nd place', () => {
      const config = getRankConfig(2);
      
      expect(config.text).toBe('2nd');
      expect(config.color).toContain('gray');
      expect(config.gradient).toContain('gray');
      expect(config.icon).toBe('🏆');
    });

    it('returns complete config for 3rd place', () => {
      const config = getRankConfig(3);
      
      expect(config.text).toBe('3rd');
      expect(config.color).toContain('amber');
      expect(config.gradient).toContain('amber');
      expect(config.icon).toBe('🏆');
    });

    it('returns config without icon for ranks > 3', () => {
      const config = getRankConfig(4);
      
      expect(config.text).toBe('4th');
      expect(config.color).toContain('indigo');
      expect(config.gradient).toContain('indigo');
      expect(config.icon).toBeUndefined();
    });

    it('has all required properties', () => {
      const config = getRankConfig(1);
      
      expect(config).toHaveProperty('text');
      expect(config).toHaveProperty('color');
      expect(config).toHaveProperty('gradient');
      expect(config).toHaveProperty('icon');
    });
  });
});
