import { SLEEP_STAGE_TARGETS, type SleepStageTarget } from '../sleep';

describe('SLEEP_STAGE_TARGETS', () => {
  describe('Data Structure', () => {
    it('is defined and is an object', () => {
      expect(SLEEP_STAGE_TARGETS).toBeDefined();
      expect(typeof SLEEP_STAGE_TARGETS).toBe('object');
      expect(SLEEP_STAGE_TARGETS).not.toBeNull();
    });

    it('contains expected sleep stages', () => {
      const expectedStages = ['deep', 'core', 'rem'];
      expectedStages.forEach(stage => {
        expect(SLEEP_STAGE_TARGETS[stage]).toBeDefined();
      });
    });

    it('contains exactly 3 sleep stages', () => {
      const stageCount = Object.keys(SLEEP_STAGE_TARGETS).length;
      expect(stageCount).toBe(3);
    });

    it('all values are SleepStageTarget objects', () => {
      Object.values(SLEEP_STAGE_TARGETS).forEach((target: SleepStageTarget) => {
        expect(typeof target).toBe('object');
        expect(typeof target.target).toBe('number');
        expect(typeof target.color).toBe('string');
        expect(typeof target.label).toBe('string');
      });
    });
  });

  describe('Deep Sleep Stage', () => {
    it('has correct target value', () => {
      expect(SLEEP_STAGE_TARGETS.deep.target).toBe(90);
    });

    it('has correct color class', () => {
      expect(SLEEP_STAGE_TARGETS.deep.color).toBe('bg-indigo-500 dark:bg-indigo-400');
    });

    it('has correct label', () => {
      expect(SLEEP_STAGE_TARGETS.deep.label).toBe('Deep Sleep');
    });

    it('has all required properties', () => {
      const deepSleep = SLEEP_STAGE_TARGETS.deep;
      expect(deepSleep).toHaveProperty('target');
      expect(deepSleep).toHaveProperty('color');
      expect(deepSleep).toHaveProperty('label');
    });
  });

  describe('Core Sleep Stage', () => {
    it('has correct target value', () => {
      expect(SLEEP_STAGE_TARGETS.core.target).toBe(240);
    });

    it('has correct color class', () => {
      expect(SLEEP_STAGE_TARGETS.core.color).toBe('bg-blue-500 dark:bg-blue-400');
    });

    it('has correct label', () => {
      expect(SLEEP_STAGE_TARGETS.core.label).toBe('Core Sleep');
    });

    it('has all required properties', () => {
      const coreSleep = SLEEP_STAGE_TARGETS.core;
      expect(coreSleep).toHaveProperty('target');
      expect(coreSleep).toHaveProperty('color');
      expect(coreSleep).toHaveProperty('label');
    });
  });

  describe('REM Sleep Stage', () => {
    it('has correct target value', () => {
      expect(SLEEP_STAGE_TARGETS.rem.target).toBe(90);
    });

    it('has correct color class', () => {
      expect(SLEEP_STAGE_TARGETS.rem.color).toBe('bg-purple-500 dark:bg-purple-400');
    });

    it('has correct label', () => {
      expect(SLEEP_STAGE_TARGETS.rem.label).toBe('REM Sleep');
    });

    it('has all required properties', () => {
      const remSleep = SLEEP_STAGE_TARGETS.rem;
      expect(remSleep).toHaveProperty('target');
      expect(remSleep).toHaveProperty('color');
      expect(remSleep).toHaveProperty('label');
    });
  });

  describe('Target Values', () => {
    it('all targets are positive numbers', () => {
      Object.values(SLEEP_STAGE_TARGETS).forEach(stage => {
        expect(stage.target).toBeGreaterThan(0);
        expect(Number.isFinite(stage.target)).toBe(true);
      });
    });

    it('targets are in reasonable ranges (minutes)', () => {
      // Deep sleep: should be between 30-120 minutes
      expect(SLEEP_STAGE_TARGETS.deep.target).toBeGreaterThanOrEqual(30);
      expect(SLEEP_STAGE_TARGETS.deep.target).toBeLessThanOrEqual(120);

      // Core sleep: should be the longest phase, 3-5 hours
      expect(SLEEP_STAGE_TARGETS.core.target).toBeGreaterThanOrEqual(180);
      expect(SLEEP_STAGE_TARGETS.core.target).toBeLessThanOrEqual(300);

      // REM sleep: should be similar to deep sleep
      expect(SLEEP_STAGE_TARGETS.rem.target).toBeGreaterThanOrEqual(30);
      expect(SLEEP_STAGE_TARGETS.rem.target).toBeLessThanOrEqual(120);
    });

    it('core sleep has the highest target', () => {
      const coreTarget = SLEEP_STAGE_TARGETS.core.target;
      const deepTarget = SLEEP_STAGE_TARGETS.deep.target;
      const remTarget = SLEEP_STAGE_TARGETS.rem.target;

      expect(coreTarget).toBeGreaterThan(deepTarget);
      expect(coreTarget).toBeGreaterThan(remTarget);
    });

    it('deep and REM sleep have equal targets', () => {
      expect(SLEEP_STAGE_TARGETS.deep.target).toBe(SLEEP_STAGE_TARGETS.rem.target);
    });
  });

  describe('Color Classes', () => {
    it('all colors are valid Tailwind CSS classes', () => {
      Object.values(SLEEP_STAGE_TARGETS).forEach(stage => {
        expect(stage.color).toMatch(/^bg-\w+-\d+\s+dark:bg-\w+-\d+$/);
      });
    });

    it('colors support dark mode', () => {
      Object.values(SLEEP_STAGE_TARGETS).forEach(stage => {
        expect(stage.color).toContain('dark:');
      });
    });

    it('each stage has a different color', () => {
      const colors = Object.values(SLEEP_STAGE_TARGETS).map(stage => stage.color);
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(colors.length);
    });

    it('uses appropriate color schemes for each stage', () => {
      expect(SLEEP_STAGE_TARGETS.deep.color).toContain('indigo');
      expect(SLEEP_STAGE_TARGETS.core.color).toContain('blue');
      expect(SLEEP_STAGE_TARGETS.rem.color).toContain('purple');
    });
  });

  describe('Labels', () => {
    it('all labels are non-empty strings', () => {
      Object.values(SLEEP_STAGE_TARGETS).forEach(stage => {
        expect(stage.label).toBeTruthy();
        expect(typeof stage.label).toBe('string');
        expect(stage.label.length).toBeGreaterThan(0);
      });
    });

    it('labels are properly formatted', () => {
      expect(SLEEP_STAGE_TARGETS.deep.label).toBe('Deep Sleep');
      expect(SLEEP_STAGE_TARGETS.core.label).toBe('Core Sleep');
      expect(SLEEP_STAGE_TARGETS.rem.label).toBe('REM Sleep');
    });

    it('labels use proper capitalization', () => {
      Object.values(SLEEP_STAGE_TARGETS).forEach(stage => {
        expect(stage.label).toMatch(/^[A-Z]/); // Starts with capital letter
        expect(stage.label).toContain('Sleep');
      });
    });

    it('each stage has a unique label', () => {
      const labels = Object.values(SLEEP_STAGE_TARGETS).map(stage => stage.label);
      const uniqueLabels = new Set(labels);
      expect(uniqueLabels.size).toBe(labels.length);
    });
  });

  describe('Object Immutability', () => {
    it('is declared as const', () => {
      // This is a compile-time check, verified by TypeScript
      // We can't easily test runtime immutability without Object.freeze()
      expect(typeof SLEEP_STAGE_TARGETS).toBe('object');
      expect(SLEEP_STAGE_TARGETS).toBeDefined();
    });

    it('stage objects are accessible but type-safe', () => {
      // TypeScript prevents modification at compile time
      expect(SLEEP_STAGE_TARGETS.deep).toBeDefined();
      expect(SLEEP_STAGE_TARGETS.core).toBeDefined();
      expect(SLEEP_STAGE_TARGETS.rem).toBeDefined();
    });
  });

  describe('Type Compatibility', () => {
    it('satisfies SleepStageTarget interface', () => {
      const testTarget: SleepStageTarget = {
        target: 120,
        color: 'bg-green-500 dark:bg-green-400',
        label: 'Test Sleep',
      };

      expect(typeof testTarget.target).toBe('number');
      expect(typeof testTarget.color).toBe('string');
      expect(typeof testTarget.label).toBe('string');
    });

    it('can be used in loops and iterations', () => {
      const stages = Object.keys(SLEEP_STAGE_TARGETS);
      const targets = Object.values(SLEEP_STAGE_TARGETS);
      const entries = Object.entries(SLEEP_STAGE_TARGETS);

      expect(stages).toHaveLength(3);
      expect(targets).toHaveLength(3);
      expect(entries).toHaveLength(3);

      // Test that we can iterate over entries
      entries.forEach(([key, value]) => {
        expect(typeof key).toBe('string');
        expect(typeof value).toBe('object');
        expect(value).toHaveProperty('target');
        expect(value).toHaveProperty('color');
        expect(value).toHaveProperty('label');
      });
    });
  });

  describe('Practical Usage', () => {
    it('can be used to calculate total sleep time', () => {
      const totalTarget = Object.values(SLEEP_STAGE_TARGETS)
        .reduce((sum, stage) => sum + stage.target, 0);

      // Total should be around 7-8 hours (420-480 minutes)
      expect(totalTarget).toBeGreaterThanOrEqual(400);
      expect(totalTarget).toBeLessThanOrEqual(500);
      expect(totalTarget).toBe(420); // 90 + 240 + 90
    });

    it('provides all necessary data for UI components', () => {
      Object.entries(SLEEP_STAGE_TARGETS).forEach(([key, stage]) => {
        // Each stage provides all data needed for a sleep visualization
        expect(stage.target).toBeDefined(); // For calculating bar widths/heights
        expect(stage.color).toBeDefined(); // For styling the visualization
        expect(stage.label).toBeDefined(); // For displaying to users
        
        // Key should match common sleep stage naming
        expect(['deep', 'core', 'rem']).toContain(key);
      });
    });
  });
});
