// Test to ensure all exports from index.ts work correctly
import * as ComponentExports from '../index';

describe('Dashboard Components Index', () => {
  it('exports all expected components', () => {
    expect(ComponentExports.WorkoutHeatMap).toBeDefined();
    expect(ComponentExports.WorkoutTooltip).toBeDefined();  
    expect(ComponentExports.HeatmapLegend).toBeDefined();
    
    // WorkoutHeatMap is a regular function component
    expect(typeof ComponentExports.WorkoutHeatMap).toBe('function');
    
    // WorkoutTooltip and HeatmapLegend are React.memo wrapped components (objects)
    expect(typeof ComponentExports.WorkoutTooltip).toBe('object');
    expect(typeof ComponentExports.HeatmapLegend).toBe('function');
  });

  it('has all exports as functions/components', () => {
    const exportNames = Object.keys(ComponentExports);
    expect(exportNames.length).toBeGreaterThan(0);
    
    // All exports should be functions or React.memo objects (which are valid React components)
    exportNames.forEach(exportName => {
      const exportValue = ComponentExports[exportName as keyof typeof ComponentExports];
      const exportType = typeof exportValue;
      expect(exportType === 'function' || exportType === 'object').toBe(true);
    });
  });
});
