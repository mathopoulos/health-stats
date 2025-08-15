import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TrendIndicator } from './TrendIndicator';

describe('TrendIndicator', () => {
  describe('Fitness Metrics', () => {
    describe('Body Fat Percentage', () => {
      it('shows green color when body fat decreases (good trend)', () => {
        render(
          <TrendIndicator
            current={15}
            previous={18}
            isFitnessMetric={true}
            isBodyFat={true}
          />
        );
        
        const container = screen.getByText('16.7%').parentElement;
        expect(container).toHaveClass('text-green-500');
      });

      it('shows red color when body fat increases (bad trend)', () => {
        render(
          <TrendIndicator
            current={20}
            previous={18}
            isFitnessMetric={true}
            isBodyFat={true}
          />
        );
        
        const container = screen.getByText('11.1%').parentElement;
        expect(container).toHaveClass('text-red-500');
      });

      it('shows correct percentage calculation for decrease', () => {
        render(
          <TrendIndicator
            current={15}
            previous={20}
            isFitnessMetric={true}
            isBodyFat={true}
          />
        );
        
        expect(screen.getByText('25.0%')).toBeInTheDocument();
      });
    });

    describe('Other Fitness Metrics (HRV, VO2 max, weight)', () => {
      it('shows green color when metric increases (good trend)', () => {
        render(
          <TrendIndicator
            current={45}
            previous={40}
            isFitnessMetric={true}
            isBodyFat={false}
          />
        );
        
        const container = screen.getByText('12.5%').parentElement;
        expect(container).toHaveClass('text-green-500');
      });

      it('shows red color when metric decreases (bad trend)', () => {
        render(
          <TrendIndicator
            current={35}
            previous={40}
            isFitnessMetric={true}
            isBodyFat={false}
          />
        );
        
        const container = screen.getByText('12.5%').parentElement;
        expect(container).toHaveClass('text-red-500');
      });
    });

    describe('Zero Change', () => {
      it('displays 0.0% for zero change', () => {
        render(
          <TrendIndicator
            current={50}
            previous={50}
            isFitnessMetric={true}
          />
        );
        
        expect(screen.getByText('0.0%')).toBeInTheDocument();
      });

      it('shows different svg element for zero change', () => {
        render(
          <TrendIndicator
            current={50}
            previous={50}
            isFitnessMetric={true}
          />
        );
        
        const svg = document.querySelector('svg');
        expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
      });
    });

    describe('Custom Colors for Fitness Metrics', () => {
      it('applies custom background and text colors when provided', () => {
        render(
          <TrendIndicator
            current={45}
            previous={40}
            isFitnessMetric={true}
            customColors={{
              bgColor: 'bg-blue-100',
              textColor: 'text-blue-800',
              iconColor: 'text-blue-600'
            }}
          />
        );
        
        const container = screen.getByText('+12.5%').closest('div');
        expect(container).toHaveClass('bg-blue-100');
        
        const text = screen.getByText('+12.5%');
        expect(text).toHaveClass('text-blue-800');
      });

      it('shows time range when showTimeRange is true', () => {
        render(
          <TrendIndicator
            current={45}
            previous={40}
            isFitnessMetric={true}
            showTimeRange={true}
            timeRangeLabel="30 Days"
            customColors={{ bgColor: 'bg-gray-100' }}
          />
        );
        
        expect(screen.getByText(/over 30 days/)).toBeInTheDocument();
      });
    });
  });

  describe('Blood Marker Logic', () => {
    const defaultProps = {
      current: 75,
      previous: 70,
      min: 50,
      max: 100,
      isFitnessMetric: false
    };

    describe('Optimal Range Movement', () => {
      it('shows green when moving towards optimal range from below', () => {
        render(
          <TrendIndicator
            {...defaultProps}
            current={65}
            previous={60}
            min={40}
            max={120}
          />
        );
        
        const container = screen.getByText('8.3%').parentElement;
        expect(container).toHaveClass('text-green-500');
      });

      it('shows green when moving towards optimal range from above', () => {
        render(
          <TrendIndicator
            {...defaultProps}
            current={85}
            previous={95}
            min={40}
            max={120}
          />
        );
        
        const container = screen.getByText('10.5%').parentElement;
        expect(container).toHaveClass('text-green-500');
      });

      it('shows green when already in optimal range', () => {
        render(
          <TrendIndicator
            {...defaultProps}
            current={75}
            previous={70}
            min={50}
            max={100}
          />
        );
        
        const container = screen.getByText('7.1%').parentElement;
        expect(container).toHaveClass('text-green-500');
      });
    });

    describe('Moving from Optimal to Normal', () => {
      it('shows red when moving from optimal to normal range', () => {
        render(
          <TrendIndicator
            {...defaultProps}
            current={62}
            previous={75}
            min={50}
            max={100}
          />
        );
        
        const container = screen.getByText('17.3%').parentElement;
        expect(container).toHaveClass('text-red-500');
      });
    });

    describe('Moving Towards Abnormal', () => {
      it('shows red when moving above max range', () => {
        render(
          <TrendIndicator
            {...defaultProps}
            current={105}
            previous={95}
            min={50}
            max={100}
          />
        );
        
        const container = screen.getByText('10.5%').parentElement;
        expect(container).toHaveClass('text-red-500');
      });

      it('shows red when moving below min range', () => {
        render(
          <TrendIndicator
            {...defaultProps}
            current={45}
            previous={55}
            min={50}
            max={100}
          />
        );
        
        const container = screen.getByText('18.2%').parentElement;
        expect(container).toHaveClass('text-red-500');
      });
    });

    describe('decreaseIsGood Logic', () => {
      it('shows green when decrease is good and value decreases', () => {
        render(
          <TrendIndicator
            {...defaultProps}
            current={70}
            previous={80}
            decreaseIsGood={true}
          />
        );
        
        const container = screen.getByText('12.5%').parentElement;
        expect(container).toHaveClass('text-green-500');
      });

      it('shows red when decrease is good but value increases', () => {
        render(
          <TrendIndicator
            current={90}
            previous={80}
            min={50}
            max={100}
            decreaseIsGood={true}
            isFitnessMetric={false}
          />
        );
        
        const container = screen.getByText('12.5%').parentElement;
        expect(container).toHaveClass('text-red-500');
      });

      it('shows red when decrease is bad and value decreases', () => {
        render(
          <TrendIndicator
            current={60}
            previous={65}
            min={50}
            max={100}
            decreaseIsGood={false}
            isFitnessMetric={false}
          />
        );
        
        const container = screen.getByText('7.7%').parentElement;
        expect(container).toHaveClass('text-red-500');
      });

      it('shows green when decrease is bad but value increases', () => {
        render(
          <TrendIndicator
            {...defaultProps}
            current={80}
            previous={70}
            decreaseIsGood={false}
          />
        );
        
        const container = screen.getByText('14.3%').parentElement;
        expect(container).toHaveClass('text-green-500');
      });
    });

    describe('Custom Colors for Blood Markers', () => {
      it('applies custom background but preserves red/green logic', () => {
        render(
          <TrendIndicator
            {...defaultProps}
            current={65}
            previous={60}
            min={40}
            max={120}
            customColors={{
              bgColor: 'bg-gray-100',
              textColor: 'text-custom-color'
            }}
          />
        );
        
        const container = screen.getByText('+8.3%').closest('div');
        expect(container).toHaveClass('bg-gray-100');
        
        const text = screen.getByText('+8.3%');
        expect(text).toHaveClass('text-green-500');
      });
    });

    describe('Default Gray Color', () => {
      it('shows appropriate color based on range logic', () => {
        render(
          <TrendIndicator
            current={75}
            previous={70}
            min={50}
            max={100}
            isFitnessMetric={false}
          />
        );
        
        const container = screen.getByText('7.1%').parentElement;
        expect(container).toHaveClass('text-green-500');
      });
    });
  });

  describe('Visual Elements', () => {
    it('renders svg for positive change', () => {
      render(
        <TrendIndicator
          current={75}
          previous={70}
          isFitnessMetric={true}
        />
      );
      
      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('stroke', 'currentColor');
    });

    it('renders svg for negative change', () => {
      render(
        <TrendIndicator
          current={65}
          previous={70}
          isFitnessMetric={true}
        />
      );
      
      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('stroke', 'currentColor');
    });

    it('applies custom className when provided', () => {
      render(
        <TrendIndicator
          current={75}
          previous={70}
          isFitnessMetric={true}
          className="custom-class"
        />
      );
      
      // The className is applied to the root span element
      const element = screen.getByText('7.1%').parentElement;
      expect(element).toHaveClass('custom-class');
    });
  });

  describe('Percentage Calculations', () => {
    it('calculates percentage change correctly for increase', () => {
      render(
        <TrendIndicator
          current={120}
          previous={100}
          isFitnessMetric={true}
        />
      );
      
      expect(screen.getByText('20.0%')).toBeInTheDocument();
    });

    it('calculates percentage change correctly for decrease', () => {
      render(
        <TrendIndicator
          current={80}
          previous={100}
          isFitnessMetric={true}
        />
      );
      
      expect(screen.getByText('20.0%')).toBeInTheDocument();
    });

    it('handles decimal precision correctly', () => {
      render(
        <TrendIndicator
          current={33.33}
          previous={30}
          isFitnessMetric={true}
        />
      );
      
      expect(screen.getByText('11.1%')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero previous value gracefully', () => {
      render(
        <TrendIndicator
          current={10}
          previous={0}
          isFitnessMetric={true}
        />
      );
      
      expect(screen.getByText('Infinity%')).toBeInTheDocument();
    });

    it('handles negative values', () => {
      render(
        <TrendIndicator
          current={-5}
          previous={-10}
          isFitnessMetric={true}
        />
      );
      
      expect(screen.getByText('50.0%')).toBeInTheDocument();
    });

    it('handles very small differences', () => {
      render(
        <TrendIndicator
          current={100.01}
          previous={100}
          isFitnessMetric={true}
        />
      );
      
      expect(screen.getByText('0.0%')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('renders with fitness metric structure without custom colors', () => {
      render(
        <TrendIndicator
          current={75}
          previous={70}
          isFitnessMetric={true}
        />
      );
      
      const spanElement = screen.getByText('7.1%').parentElement;
      expect(spanElement?.tagName).toBe('SPAN');
      expect(spanElement).toHaveClass('text-xs', 'md:text-sm', 'flex', 'items-center');
    });

    it('renders with custom colors pill structure', () => {
      render(
        <TrendIndicator
          current={75}
          previous={70}
          isFitnessMetric={true}
          customColors={{ bgColor: 'bg-gray-100' }}
        />
      );
      
      const divElement = screen.getByText('+7.1%').closest('div');
      expect(divElement?.tagName).toBe('DIV');
      expect(divElement).toHaveClass('flex', 'items-center', 'bg-gray-100', 'rounded-xl');
    });
  });
});