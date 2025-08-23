import React from 'react';
import { render } from '../../../../test-utils';
import { WorkoutHeatMapStyles } from '../WorkoutHeatMapStyles';

describe('WorkoutHeatMapStyles', () => {
  it('renders without crashing', () => {
    const { container } = render(<WorkoutHeatMapStyles />);
    // Component renders successfully if no error is thrown
    expect(container).toBeDefined();
  });

  it('is a functional component', () => {
    expect(typeof WorkoutHeatMapStyles).toBe('function');
  });

  it('can be rendered multiple times', () => {
    render(<WorkoutHeatMapStyles />);
    render(<WorkoutHeatMapStyles />);
    // Should not throw any errors
  });
});
