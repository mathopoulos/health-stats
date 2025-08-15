import React from 'react';
import { render } from '@/test-utils';
import {
  ActivityIcon,
  RunIcon,
  WalkIcon,
  BicycleIcon,
  DumbbellIcon,
  SwimIcon,
  ACTIVITY_ICONS,
} from '../workout-icons';

describe('Workout Icons', () => {
  describe('ActivityIcon', () => {
    it('renders without crashing', () => {
      const { container } = render(<ActivityIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('has correct SVG properties', () => {
      const { container } = render(<ActivityIcon />);
      const svg = container.querySelector('svg');
      
      expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
      expect(svg).toHaveAttribute('fill', 'none');
      expect(svg).toHaveAttribute('stroke', 'currentColor');
      expect(svg).toHaveAttribute('stroke-width', '2');
      expect(svg).toHaveAttribute('stroke-linecap', 'round');
      expect(svg).toHaveAttribute('stroke-linejoin', 'round');
    });

    it('renders the activity polyline path', () => {
      const { container } = render(<ActivityIcon />);
      const polyline = container.querySelector('polyline');
      
      expect(polyline).toBeInTheDocument();
      expect(polyline).toHaveAttribute('points', '22 12 18 12 15 21 9 3 6 12 2 12');
    });

    it('accepts and applies custom props', () => {
      const { container } = render(
        <ActivityIcon className="custom-class" width="32" height="32" />
      );
      const svg = container.querySelector('svg');
      
      expect(svg).toHaveClass('custom-class');
      expect(svg).toHaveAttribute('width', '32');
      expect(svg).toHaveAttribute('height', '32');
    });

    it('can be styled with CSS', () => {
      const { container } = render(
        <ActivityIcon style={{ width: '50px', height: '50px' }} />
      );
      const svg = container.querySelector('svg');
      
      expect(svg).toHaveStyle({ width: '50px', height: '50px' });
    });
  });

  describe('RunIcon', () => {
    it('renders without crashing', () => {
      const { container } = render(<RunIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('has correct SVG structure for running icon', () => {
      const { container } = render(<RunIcon />);
      
      // Should have a circle for the head
      const circle = container.querySelector('circle');
      expect(circle).toBeInTheDocument();
      expect(circle).toHaveAttribute('cx', '17');
      expect(circle).toHaveAttribute('cy', '5');
      expect(circle).toHaveAttribute('r', '3');

      // Should have multiple path elements for the body
      const paths = container.querySelectorAll('path');
      expect(paths.length).toBe(3);
    });

    it('accepts custom props', () => {
      const { container } = render(<RunIcon className="run-icon" />);
      const svg = container.querySelector('svg');
      
      expect(svg).toHaveClass('run-icon');
    });
  });

  describe('WalkIcon', () => {
    it('renders without crashing', () => {
      const { container } = render(<WalkIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('has correct SVG structure for walking icon', () => {
      const { container } = render(<WalkIcon />);
      
      // Should have a circle for the head
      const circle = container.querySelector('circle');
      expect(circle).toBeInTheDocument();
      expect(circle).toHaveAttribute('cx', '13');
      expect(circle).toHaveAttribute('cy', '4');
      expect(circle).toHaveAttribute('r', '2');

      // Should have multiple path elements for the body
      const paths = container.querySelectorAll('path');
      expect(paths.length).toBe(4);
    });
  });

  describe('BicycleIcon', () => {
    it('renders without crashing', () => {
      const { container } = render(<BicycleIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('has correct SVG structure for bicycle icon', () => {
      const { container } = render(<BicycleIcon />);
      
      // Should have circles for the wheels and rider
      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBeGreaterThanOrEqual(2);
      
      // Check that there are wheel circles
      const wheelCircles = Array.from(circles).filter(circle => 
        circle.getAttribute('r') === '3.5'
      );
      expect(wheelCircles.length).toBe(2);
    });
  });

  describe('DumbbellIcon', () => {
    it('renders without crashing', () => {
      const { container } = render(<DumbbellIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('has correct SVG structure for dumbbell icon', () => {
      const { container } = render(<DumbbellIcon />);
      
      // Should have multiple path elements for the dumbbell shape
      const paths = container.querySelectorAll('path');
      expect(paths.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('SwimIcon', () => {
    it('renders without crashing', () => {
      const { container } = render(<SwimIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('has correct SVG structure for swimming icon', () => {
      const { container } = render(<SwimIcon />);
      
      // Should have path elements for water and body
      const paths = container.querySelectorAll('path');
      expect(paths.length).toBeGreaterThanOrEqual(3);

      // May have a circle for the head
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('ACTIVITY_ICONS mapping', () => {
    it('is defined and is an object', () => {
      expect(ACTIVITY_ICONS).toBeDefined();
      expect(typeof ACTIVITY_ICONS).toBe('object');
    });

    it('contains expected activity types', () => {
      const expectedActivities = [
        'running',
        'walking', 
        'cycling',
        'strength_training',
        'swimming',
        'hiit',
        'default'
      ];

      expectedActivities.forEach(activity => {
        expect(ACTIVITY_ICONS[activity]).toBeDefined();
      });
    });

    it('maps activities to React elements', () => {
      Object.values(ACTIVITY_ICONS).forEach(icon => {
        expect(icon).toBeDefined();
        expect(typeof icon).toBe('object');
        // Should be a React element
        expect(icon).toHaveProperty('type');
        expect(icon).toHaveProperty('props');
      });
    });

    it('all icons have consistent className structure', () => {
      Object.values(ACTIVITY_ICONS).forEach(icon => {
        const props = (icon as any).props;
        expect(props.className).toContain('h-5');
        expect(props.className).toContain('w-5');
        expect(props.className).toContain('text-green-500');
      });
    });

    it('maps running to RunIcon', () => {
      const runningIcon = ACTIVITY_ICONS['running'];
      expect((runningIcon as any).type).toBe(RunIcon);
    });

    it('maps walking to WalkIcon', () => {
      const walkingIcon = ACTIVITY_ICONS['walking'];
      expect((walkingIcon as any).type).toBe(WalkIcon);
    });

    it('maps cycling to BicycleIcon', () => {
      const cyclingIcon = ACTIVITY_ICONS['cycling'];
      expect((cyclingIcon as any).type).toBe(BicycleIcon);
    });

    it('maps strength_training to DumbbellIcon', () => {
      const strengthIcon = ACTIVITY_ICONS['strength_training'];
      expect((strengthIcon as any).type).toBe(DumbbellIcon);
    });

    it('maps swimming to SwimIcon', () => {
      const swimmingIcon = ACTIVITY_ICONS['swimming'];
      expect((swimmingIcon as any).type).toBe(SwimIcon);
    });

    it('maps hiit and default to ActivityIcon', () => {
      const hiitIcon = ACTIVITY_ICONS['hiit'];
      const defaultIcon = ACTIVITY_ICONS['default'];
      
      expect((hiitIcon as any).type).toBe(ActivityIcon);
      expect((defaultIcon as any).type).toBe(ActivityIcon);
    });

    it('has a fallback default icon', () => {
      expect(ACTIVITY_ICONS['default']).toBeDefined();
      expect((ACTIVITY_ICONS['default'] as any).type).toBe(ActivityIcon);
    });

    it('can be used to render icons dynamically', () => {
      const activityType = 'running';
      const icon = ACTIVITY_ICONS[activityType];
      
      const { container } = render(icon as React.ReactElement);
      const svg = container.querySelector('svg');
      
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('text-green-500');
    });

    it('handles unknown activity types gracefully', () => {
      const unknownActivity = 'unknown_activity';
      const icon = ACTIVITY_ICONS[unknownActivity] || ACTIVITY_ICONS['default'];
      
      const { container } = render(icon as React.ReactElement);
      const svg = container.querySelector('svg');
      
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Icon Accessibility', () => {
    it('all icons support ARIA attributes', () => {
      const icons = [ActivityIcon, RunIcon, WalkIcon, BicycleIcon, DumbbellIcon, SwimIcon];
      
      icons.forEach((IconComponent, index) => {
        const { container } = render(
          <IconComponent aria-label={`Icon ${index}`} role="img" />
        );
        const svg = container.querySelector('svg');
        
        expect(svg).toHaveAttribute('aria-label', `Icon ${index}`);
        expect(svg).toHaveAttribute('role', 'img');
      });
    });

    it('icons can have titles for accessibility', () => {
      const { container } = render(
        <ActivityIcon title="Activity Icon" />
      );
      
      // Icons can accept title as an attribute
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('title', 'Activity Icon');
    });
  });

  describe('Icon Styling', () => {
    it('all icons inherit color from currentColor', () => {
      const icons = [ActivityIcon, RunIcon, WalkIcon, BicycleIcon, DumbbellIcon, SwimIcon];
      
      icons.forEach((IconComponent) => {
        const { container } = render(
          <div style={{ color: 'red' }}>
            <IconComponent />
          </div>
        );
        const svg = container.querySelector('svg');
        
        expect(svg).toHaveAttribute('stroke', 'currentColor');
      });
    });

    it('icons can be resized with CSS', () => {
      const { container } = render(
        <ActivityIcon style={{ width: '100px', height: '100px' }} />
      );
      const svg = container.querySelector('svg');
      
      expect(svg).toHaveStyle({ width: '100px', height: '100px' });
    });
  });

  describe('Performance', () => {
    it('icons render quickly', () => {
      const startTime = performance.now();
      
      [ActivityIcon, RunIcon, WalkIcon, BicycleIcon, DumbbellIcon, SwimIcon].forEach(
        IconComponent => {
          render(<IconComponent />);
        }
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render all icons in less than 100ms (increased for CI stability)
      expect(renderTime).toBeLessThan(100);
    });
  });
});
