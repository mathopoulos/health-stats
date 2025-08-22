import React from 'react';
import { render, screen } from '@testing-library/react';
import StatusIndicator from '../StatusIndicator';

describe('StatusIndicator', () => {
  const defaultMessage = 'Test status message';

  describe('Basic Rendering', () => {
    it('should render success type correctly', () => {
      render(<StatusIndicator type="success" message={defaultMessage} />);
      
      expect(screen.getByText(defaultMessage)).toBeInTheDocument();
      
      const container = screen.getByText(defaultMessage).closest('div');
      expect(container).toHaveClass(
        'flex',
        'items-start',
        'space-x-3',
        'p-4',
        'rounded-lg',
        'bg-green-50'
      );
    });

    it('should render error type correctly', () => {
      render(<StatusIndicator type="error" message={defaultMessage} />);
      
      expect(screen.getByText(defaultMessage)).toBeInTheDocument();
      
      const container = screen.getByText(defaultMessage).closest('div');
      expect(container).toHaveClass(
        'flex',
        'items-start',
        'space-x-3',
        'p-4',
        'rounded-lg',
        'bg-red-50'
      );
    });

    it('should render warning type correctly', () => {
      render(<StatusIndicator type="warning" message={defaultMessage} />);
      
      expect(screen.getByText(defaultMessage)).toBeInTheDocument();
      
      const container = screen.getByText(defaultMessage).closest('div');
      expect(container).toHaveClass(
        'flex',
        'items-start',
        'space-x-3',
        'p-4',
        'rounded-lg',
        'bg-yellow-50'
      );
    });

    it('should render info type correctly', () => {
      render(<StatusIndicator type="info" message={defaultMessage} />);
      
      expect(screen.getByText(defaultMessage)).toBeInTheDocument();
      
      const container = screen.getByText(defaultMessage).closest('div');
      expect(container).toHaveClass(
        'flex',
        'items-start',
        'space-x-3',
        'p-4',
        'rounded-lg',
        'bg-blue-50'
      );
    });
  });

  describe('Message Display', () => {
    it('should display the provided message', () => {
      const testMessage = 'Custom status message';
      render(<StatusIndicator type="info" message={testMessage} />);
      
      expect(screen.getByText(testMessage)).toBeInTheDocument();
    });

    it('should render message with correct text styling', () => {
      render(<StatusIndicator type="success" message={defaultMessage} />);
      
      const messageElement = screen.getByText(defaultMessage);
      expect(messageElement).toHaveClass('text-sm', 'text-green-700');
    });

    it('should handle empty message', () => {
      const { container } = render(<StatusIndicator type="info" message="" />);
      
      const messageElement = container.querySelector('p.text-sm');
      expect(messageElement).toBeInTheDocument();
      expect(messageElement).toHaveTextContent('');
      expect(messageElement).toHaveClass('text-sm');
    });

    it('should handle long messages', () => {
      const longMessage = 'This is a very long status message that should still be displayed correctly without any issues and should not cause the component to break or malfunction in any way.';
      render(<StatusIndicator type="warning" message={longMessage} />);
      
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });
  });

  describe('Icon Rendering', () => {
    it('should render success icon', () => {
      const { container } = render(<StatusIndicator type="success" message={defaultMessage} />);
      
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('w-5', 'h-5');
      expect(svg?.parentElement).toHaveClass('text-green-500');
      
      // Check for success checkmark path
      const path = svg?.querySelector('path');
      expect(path).toHaveAttribute('d', 'M5 13l4 4L19 7');
    });

    it('should render error icon', () => {
      const { container } = render(<StatusIndicator type="error" message={defaultMessage} />);
      
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg?.parentElement).toHaveClass('text-red-500');
      
      // Check for error X path
      const path = svg?.querySelector('path');
      expect(path).toHaveAttribute('d', 'M6 18L18 6M6 6l12 12');
    });

    it('should render warning icon', () => {
      const { container } = render(<StatusIndicator type="warning" message={defaultMessage} />);
      
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg?.parentElement).toHaveClass('text-yellow-500');
      
      // Check for warning triangle path
      const path = svg?.querySelector('path');
      expect(path).toHaveAttribute('d', 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z');
    });

    it('should render info icon', () => {
      const { container } = render(<StatusIndicator type="info" message={defaultMessage} />);
      
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg?.parentElement).toHaveClass('text-blue-500');
      
      // Check for info circle path
      const path = svg?.querySelector('path');
      expect(path).toHaveAttribute('d', 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z');
    });

    it('should render icon with proper flex properties', () => {
      const { container } = render(<StatusIndicator type="success" message={defaultMessage} />);
      
      const iconContainer = container.querySelector('.flex-shrink-0');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer).toHaveClass('flex-shrink-0');
    });
  });

  describe('Color Themes', () => {
    it('should apply success color theme', () => {
      const { container } = render(<StatusIndicator type="success" message={defaultMessage} />);
      
      const mainContainer = container.firstChild as HTMLElement;
      const iconContainer = container.querySelector('.flex-shrink-0');
      const messageElement = screen.getByText(defaultMessage);
      
      expect(mainContainer).toHaveClass('bg-green-50');
      expect(iconContainer).toHaveClass('text-green-500');
      expect(messageElement).toHaveClass('text-green-700');
    });

    it('should apply error color theme', () => {
      const { container } = render(<StatusIndicator type="error" message={defaultMessage} />);
      
      const mainContainer = container.firstChild as HTMLElement;
      const iconContainer = container.querySelector('.flex-shrink-0');
      const messageElement = screen.getByText(defaultMessage);
      
      expect(mainContainer).toHaveClass('bg-red-50');
      expect(iconContainer).toHaveClass('text-red-500');
      expect(messageElement).toHaveClass('text-red-700');
    });

    it('should apply warning color theme', () => {
      const { container } = render(<StatusIndicator type="warning" message={defaultMessage} />);
      
      const mainContainer = container.firstChild as HTMLElement;
      const iconContainer = container.querySelector('.flex-shrink-0');
      const messageElement = screen.getByText(defaultMessage);
      
      expect(mainContainer).toHaveClass('bg-yellow-50');
      expect(iconContainer).toHaveClass('text-yellow-500');
      expect(messageElement).toHaveClass('text-yellow-700');
    });

    it('should apply info color theme', () => {
      const { container } = render(<StatusIndicator type="info" message={defaultMessage} />);
      
      const mainContainer = container.firstChild as HTMLElement;
      const iconContainer = container.querySelector('.flex-shrink-0');
      const messageElement = screen.getByText(defaultMessage);
      
      expect(mainContainer).toHaveClass('bg-blue-50');
      expect(iconContainer).toHaveClass('text-blue-500');
      expect(messageElement).toHaveClass('text-blue-700');
    });
  });

  describe('Dark Mode Support', () => {
    it('should include dark mode classes for success type', () => {
      const { container } = render(<StatusIndicator type="success" message={defaultMessage} />);
      
      const mainContainer = container.firstChild as HTMLElement;
      const iconContainer = container.querySelector('.flex-shrink-0');
      const messageElement = screen.getByText(defaultMessage);
      
      expect(mainContainer).toHaveClass('dark:bg-green-900/20');
      expect(iconContainer).toHaveClass('dark:text-green-400');
      expect(messageElement).toHaveClass('dark:text-green-300');
    });

    it('should include dark mode classes for error type', () => {
      const { container } = render(<StatusIndicator type="error" message={defaultMessage} />);
      
      const mainContainer = container.firstChild as HTMLElement;
      const iconContainer = container.querySelector('.flex-shrink-0');
      const messageElement = screen.getByText(defaultMessage);
      
      expect(mainContainer).toHaveClass('dark:bg-red-900/20');
      expect(iconContainer).toHaveClass('dark:text-red-400');
      expect(messageElement).toHaveClass('dark:text-red-300');
    });

    it('should include dark mode classes for warning type', () => {
      const { container } = render(<StatusIndicator type="warning" message={defaultMessage} />);
      
      const mainContainer = container.firstChild as HTMLElement;
      const iconContainer = container.querySelector('.flex-shrink-0');
      const messageElement = screen.getByText(defaultMessage);
      
      expect(mainContainer).toHaveClass('dark:bg-yellow-900/20');
      expect(iconContainer).toHaveClass('dark:text-yellow-400');
      expect(messageElement).toHaveClass('dark:text-yellow-300');
    });

    it('should include dark mode classes for info type', () => {
      const { container } = render(<StatusIndicator type="info" message={defaultMessage} />);
      
      const mainContainer = container.firstChild as HTMLElement;
      const iconContainer = container.querySelector('.flex-shrink-0');
      const messageElement = screen.getByText(defaultMessage);
      
      expect(mainContainer).toHaveClass('dark:bg-blue-900/20');
      expect(iconContainer).toHaveClass('dark:text-blue-400');
      expect(messageElement).toHaveClass('dark:text-blue-300');
    });
  });

  describe('Custom ClassName', () => {
    it('should apply custom className when provided', () => {
      const customClass = 'custom-status-indicator';
      const { container } = render(
        <StatusIndicator type="info" message={defaultMessage} className={customClass} />
      );
      
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass(customClass);
    });

    it('should apply multiple custom classes', () => {
      const customClasses = 'custom-class-1 custom-class-2 mb-4';
      const { container } = render(
        <StatusIndicator type="success" message={defaultMessage} className={customClasses} />
      );
      
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('custom-class-1', 'custom-class-2', 'mb-4');
    });

    it('should work without custom className (default empty string)', () => {
      const { container } = render(<StatusIndicator type="warning" message={defaultMessage} />);
      
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('flex', 'items-start', 'space-x-3', 'p-4', 'rounded-lg');
    });

    it('should handle undefined className', () => {
      const { container } = render(
        <StatusIndicator type="error" message={defaultMessage} className={undefined} />
      );
      
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('flex', 'items-start', 'space-x-3', 'p-4', 'rounded-lg');
    });
  });

  describe('Component Structure', () => {
    it('should have correct DOM structure', () => {
      const { container } = render(<StatusIndicator type="success" message={defaultMessage} />);
      
      // Main container
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.tagName).toBe('DIV');
      expect(mainContainer.children).toHaveLength(2);
      
      // Icon container
      const iconContainer = mainContainer.children[0];
      expect(iconContainer).toHaveClass('flex-shrink-0');
      
      // Message container
      const messageContainer = mainContainer.children[1];
      expect(messageContainer.tagName).toBe('P');
      expect(messageContainer).toHaveClass('text-sm');
    });

    it('should maintain consistent layout across all types', () => {
      const types: Array<'success' | 'error' | 'warning' | 'info'> = ['success', 'error', 'warning', 'info'];
      
      types.forEach(type => {
        const { container } = render(<StatusIndicator type={type} message={defaultMessage} />);
        
        const mainContainer = container.firstChild as HTMLElement;
        expect(mainContainer).toHaveClass(
          'flex',
          'items-start',
          'space-x-3',
          'p-4',
          'rounded-lg'
        );
        
        expect(mainContainer.children).toHaveLength(2);
        
        const iconContainer = mainContainer.children[0];
        expect(iconContainer).toHaveClass('flex-shrink-0');
        
        const messageContainer = mainContainer.children[1];
        expect(messageContainer.tagName).toBe('P');
        expect(messageContainer).toHaveClass('text-sm');
      });
    });
  });

  describe('Accessibility', () => {
    it('should be accessible with proper text content', () => {
      render(<StatusIndicator type="success" message="Operation completed successfully" />);
      
      expect(screen.getByText('Operation completed successfully')).toBeInTheDocument();
    });

    it('should have proper semantic structure', () => {
      const { container } = render(<StatusIndicator type="error" message="An error occurred" />);
      
      const messageElement = screen.getByText('An error occurred');
      expect(messageElement.tagName).toBe('P');
    });

    it('should work with screen readers via text content', () => {
      render(<StatusIndicator type="warning" message="Please review your input" />);
      
      const messageElement = screen.getByText('Please review your input');
      expect(messageElement).toBeInTheDocument();
      expect(messageElement).toHaveTextContent('Please review your input');
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in message', () => {
      const specialMessage = 'Error: File "test & data.csv" couldn\'t be processed!';
      render(<StatusIndicator type="error" message={specialMessage} />);
      
      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });

    it('should handle HTML entities in message', () => {
      const htmlMessage = 'Size must be < 100MB & > 0MB';
      render(<StatusIndicator type="warning" message={htmlMessage} />);
      
      expect(screen.getByText(htmlMessage)).toBeInTheDocument();
    });

    it('should handle numeric messages', () => {
      const numericMessage = '404';
      render(<StatusIndicator type="error" message={numericMessage} />);
      
      expect(screen.getByText(numericMessage)).toBeInTheDocument();
    });

    it('should handle multiline messages gracefully', () => {
      const multilineMessage = 'Line 1\nLine 2\nLine 3';
      const { container } = render(<StatusIndicator type="info" message={multilineMessage} />);
      
      const messageElement = container.querySelector('p.text-sm');
      expect(messageElement).toBeInTheDocument();
      // HTML normalizes whitespace, so \n becomes space
      expect(messageElement).toHaveTextContent('Line 1 Line 2 Line 3');
    });
  });

  describe('Type Safety and Configuration', () => {
    it('should handle all valid type values without errors', () => {
      const validTypes: Array<'success' | 'error' | 'warning' | 'info'> = ['success', 'error', 'warning', 'info'];
      
      validTypes.forEach(type => {
        expect(() => {
          render(<StatusIndicator type={type} message={`Testing ${type} type`} />);
        }).not.toThrow();
        
        expect(screen.getByText(`Testing ${type} type`)).toBeInTheDocument();
      });
    });
  });
});
