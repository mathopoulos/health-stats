// Test to ensure all exports from hooks index.ts work correctly
import * as HookExports from '../index';

describe('Dashboard Hooks Index', () => {
  it('exports all expected hooks', () => {
    expect(HookExports.useWorkoutHeatmapData).toBeDefined();
    expect(typeof HookExports.useWorkoutHeatmapData).toBe('function');
  });

  it('has all exports as functions', () => {
    const exportNames = Object.keys(HookExports);
    expect(exportNames.length).toBeGreaterThan(0);
    
    // All exports should be functions (React hooks)
    exportNames.forEach(exportName => {
      expect(typeof HookExports[exportName as keyof typeof HookExports]).toBe('function');
    });
  });
});
