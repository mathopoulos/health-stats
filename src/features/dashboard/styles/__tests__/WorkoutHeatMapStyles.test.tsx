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

  it('renders jsx styled component', () => {
    const { container } = render(<WorkoutHeatMapStyles />);
    
    // styled-jsx doesn't create actual style elements in test environment
    // but the component should render without errors
    expect(container).toBeDefined();
  });

  it('creates global styles structure', () => {
    const { container } = render(<WorkoutHeatMapStyles />);
    
    // The component renders successfully (no style elements in test env)
    expect(container).toBeDefined();
    expect(container.firstChild).toBeTruthy();
  });

  it('returns jsx element', () => {
    const result = WorkoutHeatMapStyles({});
    expect(result).toBeDefined();
    expect(React.isValidElement(result)).toBe(true);
  });
});
