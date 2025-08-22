import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MobileNavigation from '../MobileNavigation';

describe('MobileNavigation', () => {
  const defaultProps = {
    activeTab: 'profile',
    onTabChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render all navigation buttons', () => {
      render(<MobileNavigation {...defaultProps} />);
      
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Protocols')).toBeInTheDocument();
      expect(screen.getByText('Fitness')).toBeInTheDocument();
      expect(screen.getByText('Blood')).toBeInTheDocument();
      expect(screen.getByText('More')).toBeInTheDocument();
    });

    it('should render with mobile-specific CSS classes', () => {
      const { container } = render(<MobileNavigation {...defaultProps} />);
      
      const navigationContainer = container.firstChild as HTMLElement;
      expect(navigationContainer).toHaveClass(
        'md:hidden',
        'fixed',
        'bottom-0',
        'left-0',
        'right-0',
        'bg-white',
        'border-t',
        'z-50'
      );
    });

    it('should render navigation buttons with proper layout classes', () => {
      render(<MobileNavigation {...defaultProps} />);
      
      const profileButton = screen.getByText('Profile').closest('button');
      expect(profileButton).toHaveClass(
        'flex',
        'flex-1',
        'flex-col',
        'items-center',
        'justify-center',
        'h-full'
      );
    });

    it('should render all buttons as button elements', () => {
      render(<MobileNavigation {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(5);
      
      buttons.forEach(button => {
        expect(button.tagName).toBe('BUTTON');
      });
    });

    it('should render all SVG icons', () => {
      const { container } = render(<MobileNavigation {...defaultProps} />);
      
      const svgElements = container.querySelectorAll('svg');
      expect(svgElements).toHaveLength(5);
      
      svgElements.forEach(svg => {
        expect(svg).toHaveClass('w-6', 'h-6');
        expect(svg).toHaveAttribute('fill', 'none');
        expect(svg).toHaveAttribute('stroke', 'currentColor');
      });
    });
  });

  describe('Active Tab States', () => {
    it('should highlight profile tab when active', () => {
      render(<MobileNavigation {...defaultProps} activeTab="profile" />);
      
      const profileButton = screen.getByText('Profile').closest('button');
      expect(profileButton).toHaveClass('text-indigo-600');
    });

    it('should highlight protocols tab when active', () => {
      render(<MobileNavigation {...defaultProps} activeTab="protocols" />);
      
      const protocolsButton = screen.getByText('Protocols').closest('button');
      expect(protocolsButton).toHaveClass('text-indigo-600');
    });

    it('should highlight fitness tab when active', () => {
      render(<MobileNavigation {...defaultProps} activeTab="fitness" />);
      
      const fitnessButton = screen.getByText('Fitness').closest('button');
      expect(fitnessButton).toHaveClass('text-indigo-600');
    });

    it('should highlight blood tab when active', () => {
      render(<MobileNavigation {...defaultProps} activeTab="blood" />);
      
      const bloodButton = screen.getByText('Blood').closest('button');
      expect(bloodButton).toHaveClass('text-indigo-600');
    });

    it('should highlight more tab when active', () => {
      render(<MobileNavigation {...defaultProps} activeTab="more" />);
      
      const moreButton = screen.getByText('More').closest('button');
      expect(moreButton).toHaveClass('text-indigo-600');
    });

    it('should show inactive state for non-active tabs', () => {
      render(<MobileNavigation {...defaultProps} activeTab="profile" />);
      
      const fitnessButton = screen.getByText('Fitness').closest('button');
      expect(fitnessButton).toHaveClass('text-gray-600');
      expect(fitnessButton).not.toHaveClass('text-indigo-600');
    });

    it('should apply dark mode classes correctly', () => {
      render(<MobileNavigation {...defaultProps} activeTab="profile" />);
      
      const profileButton = screen.getByText('Profile').closest('button');
      const fitnessButton = screen.getByText('Fitness').closest('button');
      
      expect(profileButton).toHaveClass('dark:text-indigo-400');
      expect(fitnessButton).toHaveClass('dark:text-gray-400');
    });
  });

  describe('Tab Navigation', () => {
    it('should call onTabChange when profile tab is clicked', () => {
      const onTabChange = jest.fn();
      render(<MobileNavigation {...defaultProps} onTabChange={onTabChange} />);
      
      fireEvent.click(screen.getByText('Profile'));
      expect(onTabChange).toHaveBeenCalledWith('profile');
    });

    it('should call onTabChange when protocols tab is clicked', () => {
      const onTabChange = jest.fn();
      render(<MobileNavigation {...defaultProps} onTabChange={onTabChange} />);
      
      fireEvent.click(screen.getByText('Protocols'));
      expect(onTabChange).toHaveBeenCalledWith('protocols');
    });

    it('should call onTabChange when fitness tab is clicked', () => {
      const onTabChange = jest.fn();
      render(<MobileNavigation {...defaultProps} onTabChange={onTabChange} />);
      
      fireEvent.click(screen.getByText('Fitness'));
      expect(onTabChange).toHaveBeenCalledWith('fitness');
    });

    it('should call onTabChange when blood tab is clicked', () => {
      const onTabChange = jest.fn();
      render(<MobileNavigation {...defaultProps} onTabChange={onTabChange} />);
      
      fireEvent.click(screen.getByText('Blood'));
      expect(onTabChange).toHaveBeenCalledWith('blood');
    });

    it('should call onTabChange when more tab is clicked', () => {
      const onTabChange = jest.fn();
      render(<MobileNavigation {...defaultProps} onTabChange={onTabChange} />);
      
      fireEvent.click(screen.getByText('More'));
      expect(onTabChange).toHaveBeenCalledWith('more');
    });

    it('should handle multiple tab clicks correctly', () => {
      const onTabChange = jest.fn();
      render(<MobileNavigation {...defaultProps} onTabChange={onTabChange} />);
      
      fireEvent.click(screen.getByText('Profile'));
      fireEvent.click(screen.getByText('Blood'));
      fireEvent.click(screen.getByText('Fitness'));
      
      expect(onTabChange).toHaveBeenCalledTimes(3);
      expect(onTabChange).toHaveBeenNthCalledWith(1, 'profile');
      expect(onTabChange).toHaveBeenNthCalledWith(2, 'blood');
      expect(onTabChange).toHaveBeenNthCalledWith(3, 'fitness');
    });

    it('should call onTabChange only once per click', () => {
      const onTabChange = jest.fn();
      render(<MobileNavigation {...defaultProps} onTabChange={onTabChange} />);
      
      const profileButton = screen.getByText('Profile');
      
      fireEvent.click(profileButton);
      expect(onTabChange).toHaveBeenCalledTimes(1);
      
      fireEvent.click(profileButton);
      expect(onTabChange).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles for navigation', () => {
      render(<MobileNavigation {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(5);
      
      expect(screen.getByRole('button', { name: /profile/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /protocols/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /fitness/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /blood/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /more/i })).toBeInTheDocument();
    });

    it('should have accessible text labels for each button', () => {
      render(<MobileNavigation {...defaultProps} />);
      
      const profileSpan = screen.getByText('Profile');
      const protocolsSpan = screen.getByText('Protocols');
      const fitnessSpan = screen.getByText('Fitness');
      const bloodSpan = screen.getByText('Blood');
      const moreSpan = screen.getByText('More');
      
      expect(profileSpan).toHaveClass('text-xs', 'mt-1');
      expect(protocolsSpan).toHaveClass('text-xs', 'mt-1');
      expect(fitnessSpan).toHaveClass('text-xs', 'mt-1');
      expect(bloodSpan).toHaveClass('text-xs', 'mt-1');
      expect(moreSpan).toHaveClass('text-xs', 'mt-1');
    });

    it('should be keyboard navigable', () => {
      render(<MobileNavigation {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeEnabled();
        expect(button.tabIndex).not.toBe(-1);
      });
    });
  });

  describe('Visual Design', () => {
    it('should have proper spacing and layout', () => {
      const { container } = render(<MobileNavigation {...defaultProps} />);
      
      const flexContainer = container.querySelector('.flex.justify-around.items-center.h-16');
      expect(flexContainer).toBeInTheDocument();
    });

    it('should have dark mode support', () => {
      const { container } = render(<MobileNavigation {...defaultProps} />);
      
      const navigationContainer = container.firstChild as HTMLElement;
      expect(navigationContainer).toHaveClass('dark:bg-gray-800', 'dark:border-gray-700');
    });

    it('should be fixed to bottom with proper z-index', () => {
      const { container } = render(<MobileNavigation {...defaultProps} />);
      
      const navigationContainer = container.firstChild as HTMLElement;
      expect(navigationContainer).toHaveClass('fixed', 'bottom-0', 'z-50');
    });

    it('should span full width', () => {
      const { container } = render(<MobileNavigation {...defaultProps} />);
      
      const navigationContainer = container.firstChild as HTMLElement;
      expect(navigationContainer).toHaveClass('left-0', 'right-0');
    });
  });

  describe('Component State Management', () => {
    it('should update active state when activeTab prop changes', () => {
      const { rerender } = render(<MobileNavigation {...defaultProps} activeTab="profile" />);
      
      let profileButton = screen.getByText('Profile').closest('button');
      let fitnessButton = screen.getByText('Fitness').closest('button');
      
      expect(profileButton).toHaveClass('text-indigo-600');
      expect(fitnessButton).toHaveClass('text-gray-600');
      
      rerender(<MobileNavigation {...defaultProps} activeTab="fitness" />);
      
      profileButton = screen.getByText('Profile').closest('button');
      fitnessButton = screen.getByText('Fitness').closest('button');
      
      expect(profileButton).toHaveClass('text-gray-600');
      expect(fitnessButton).toHaveClass('text-indigo-600');
    });

    it('should handle edge case active tab values', () => {
      render(<MobileNavigation {...defaultProps} activeTab="nonexistent" />);
      
      // All buttons should show inactive state
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('text-gray-600');
      });
    });

    it('should handle empty string active tab', () => {
      render(<MobileNavigation {...defaultProps} activeTab="" />);
      
      // All buttons should show inactive state
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('text-gray-600');
      });
    });
  });

  describe('Event Handling', () => {
    it('should prevent event propagation or handle clicks cleanly', () => {
      const onTabChange = jest.fn();
      render(<MobileNavigation {...defaultProps} onTabChange={onTabChange} />);
      
      const profileButton = screen.getByText('Profile').closest('button');
      
      // Simulate a click event
      fireEvent.click(profileButton!);
      
      expect(onTabChange).toHaveBeenCalledWith('profile');
    });

    it('should handle rapid successive clicks', () => {
      const onTabChange = jest.fn();
      render(<MobileNavigation {...defaultProps} onTabChange={onTabChange} />);
      
      const profileButton = screen.getByText('Profile').closest('button');
      
      // Rapid clicks
      fireEvent.click(profileButton!);
      fireEvent.click(profileButton!);
      fireEvent.click(profileButton!);
      
      expect(onTabChange).toHaveBeenCalledTimes(3);
      expect(onTabChange).toHaveBeenCalledWith('profile');
    });
  });

  describe('Interface Contract', () => {
    it('should accept all required props correctly', () => {
      const testProps = {
        activeTab: 'protocols',
        onTabChange: jest.fn(),
      };
      
      expect(() => render(<MobileNavigation {...testProps} />)).not.toThrow();
      
      const protocolsButton = screen.getByText('Protocols').closest('button');
      expect(protocolsButton).toHaveClass('text-indigo-600');
    });

    it('should use onTabChange prop correctly for all tabs', () => {
      const onTabChange = jest.fn();
      render(<MobileNavigation activeTab="profile" onTabChange={onTabChange} />);
      
      const tabNames = ['Profile', 'Protocols', 'Fitness', 'Blood', 'More'];
      const expectedCalls = ['profile', 'protocols', 'fitness', 'blood', 'more'];
      
      tabNames.forEach((tabName, index) => {
        fireEvent.click(screen.getByText(tabName));
        expect(onTabChange).toHaveBeenCalledWith(expectedCalls[index]);
      });
      
      expect(onTabChange).toHaveBeenCalledTimes(5);
    });
  });
});

