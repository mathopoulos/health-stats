import React from 'react';
import { render, screen, fireEvent } from '@/test-utils';
import { TabNavigation, type DashboardTab } from '../TabNavigation';

describe('TabNavigation', () => {
  const mockOnTabChange = jest.fn();

  const defaultProps = {
    activeTab: 'home' as DashboardTab,
    onTabChange: mockOnTabChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<TabNavigation {...defaultProps} />);
      
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('renders all tab buttons', () => {
      render(<TabNavigation {...defaultProps} />);
      
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Fitness Metrics')).toBeInTheDocument();
      expect(screen.getByText('Blood Markers')).toBeInTheDocument();
      expect(screen.getByText('Protocols & Experiments')).toBeInTheDocument();
    });

    it('has correct navigation aria-label', () => {
      render(<TabNavigation {...defaultProps} />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Tabs');
    });

    it('renders with correct container structure', () => {
      const { container } = render(<TabNavigation {...defaultProps} />);
      
      const mainContainer = container.querySelector('.bg-white.dark\\:bg-gray-800.rounded-2xl');
      expect(mainContainer).toBeInTheDocument();
    });

    it('renders scrollable container', () => {
      const { container } = render(<TabNavigation {...defaultProps} />);
      
      const scrollContainer = container.querySelector('.overflow-x-auto');
      expect(scrollContainer).toBeInTheDocument();
    });

    it('renders fade effect', () => {
      const { container } = render(<TabNavigation {...defaultProps} />);
      
      const fadeEffect = container.querySelector('.absolute.right-0.top-0.bottom-0');
      expect(fadeEffect).toBeInTheDocument();
      expect(fadeEffect).toHaveClass('bg-gradient-to-l');
    });
  });

  describe('Active Tab Styling', () => {
    it('applies active styling to home tab when active', () => {
      render(<TabNavigation {...defaultProps} activeTab="home" />);
      
      const homeButton = screen.getByText('Home');
      expect(homeButton).toHaveClass('border-indigo-500', 'text-indigo-600');
      expect(homeButton).not.toHaveClass('border-transparent');
    });

    it('applies active styling to metrics tab when active', () => {
      render(<TabNavigation {...defaultProps} activeTab="metrics" />);
      
      const metricsButton = screen.getByText('Fitness Metrics');
      expect(metricsButton).toHaveClass('border-indigo-500', 'text-indigo-600');
      
      const homeButton = screen.getByText('Home');
      expect(homeButton).toHaveClass('border-transparent');
    });

    it('applies active styling to blood tab when active', () => {
      render(<TabNavigation {...defaultProps} activeTab="blood" />);
      
      const bloodButton = screen.getByText('Blood Markers');
      expect(bloodButton).toHaveClass('border-indigo-500', 'text-indigo-600');
      
      const homeButton = screen.getByText('Home');
      expect(homeButton).toHaveClass('border-transparent');
    });

    it('applies active styling to protocols tab when active', () => {
      render(<TabNavigation {...defaultProps} activeTab="protocols" />);
      
      const protocolsButton = screen.getByText('Protocols & Experiments');
      expect(protocolsButton).toHaveClass('border-indigo-500', 'text-indigo-600');
      
      const homeButton = screen.getByText('Home');
      expect(homeButton).toHaveClass('border-transparent');
    });
  });

  describe('Inactive Tab Styling', () => {
    it('applies inactive styling to non-active tabs', () => {
      render(<TabNavigation {...defaultProps} activeTab="home" />);
      
      const metricsButton = screen.getByText('Fitness Metrics');
      const bloodButton = screen.getByText('Blood Markers');
      const protocolsButton = screen.getByText('Protocols & Experiments');
      
      [metricsButton, bloodButton, protocolsButton].forEach(button => {
        expect(button).toHaveClass('border-transparent', 'text-gray-500');
        expect(button).not.toHaveClass('border-indigo-500');
      });
    });
  });

  describe('Click Interactions', () => {
    it('calls onTabChange with "home" when home tab is clicked', () => {
      render(<TabNavigation {...defaultProps} activeTab="metrics" />);
      
      const homeButton = screen.getByText('Home');
      fireEvent.click(homeButton);
      
      expect(mockOnTabChange).toHaveBeenCalledWith('home');
      expect(mockOnTabChange).toHaveBeenCalledTimes(1);
    });

    it('calls onTabChange with "metrics" when metrics tab is clicked', () => {
      render(<TabNavigation {...defaultProps} activeTab="home" />);
      
      const metricsButton = screen.getByText('Fitness Metrics');
      fireEvent.click(metricsButton);
      
      expect(mockOnTabChange).toHaveBeenCalledWith('metrics');
      expect(mockOnTabChange).toHaveBeenCalledTimes(1);
    });

    it('calls onTabChange with "blood" when blood tab is clicked', () => {
      render(<TabNavigation {...defaultProps} activeTab="home" />);
      
      const bloodButton = screen.getByText('Blood Markers');
      fireEvent.click(bloodButton);
      
      expect(mockOnTabChange).toHaveBeenCalledWith('blood');
      expect(mockOnTabChange).toHaveBeenCalledTimes(1);
    });

    it('calls onTabChange with "protocols" when protocols tab is clicked', () => {
      render(<TabNavigation {...defaultProps} activeTab="home" />);
      
      const protocolsButton = screen.getByText('Protocols & Experiments');
      fireEvent.click(protocolsButton);
      
      expect(mockOnTabChange).toHaveBeenCalledWith('protocols');
      expect(mockOnTabChange).toHaveBeenCalledTimes(1);
    });

    it('can be called multiple times', () => {
      render(<TabNavigation {...defaultProps} activeTab="home" />);
      
      const metricsButton = screen.getByText('Fitness Metrics');
      const bloodButton = screen.getByText('Blood Markers');
      
      fireEvent.click(metricsButton);
      fireEvent.click(bloodButton);
      
      expect(mockOnTabChange).toHaveBeenCalledTimes(2);
      expect(mockOnTabChange).toHaveBeenNthCalledWith(1, 'metrics');
      expect(mockOnTabChange).toHaveBeenNthCalledWith(2, 'blood');
    });

    it('clicking active tab still calls onTabChange', () => {
      render(<TabNavigation {...defaultProps} activeTab="home" />);
      
      const homeButton = screen.getByText('Home');
      fireEvent.click(homeButton);
      
      expect(mockOnTabChange).toHaveBeenCalledWith('home');
      expect(mockOnTabChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Button Properties', () => {
    it('all tab buttons are actually buttons', () => {
      render(<TabNavigation {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4);
      
      buttons.forEach(button => {
        expect(button.tagName).toBe('BUTTON');
      });
    });

    it('buttons have correct base classes', () => {
      render(<TabNavigation {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      
      buttons.forEach(button => {
        expect(button).toHaveClass(
          'py-4',
          'px-1',
          'inline-flex',
          'items-center',
          'border-b-2',
          'font-medium',
          'text-sm',
          'whitespace-nowrap'
        );
      });
    });
  });

  describe('Responsive Design', () => {
    it('has responsive padding classes', () => {
      const { container } = render(<TabNavigation {...defaultProps} />);
      
      const paddedContainer = container.querySelector('.px-4.sm\\:px-6');
      expect(paddedContainer).toBeInTheDocument();
    });

    it('has responsive spacing between tabs', () => {
      const { container } = render(<TabNavigation {...defaultProps} />);
      
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('space-x-4', 'sm:space-x-8');
    });

    it('has minimum width for scrolling', () => {
      const { container } = render(<TabNavigation {...defaultProps} />);
      
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('min-w-max');
    });
  });

  describe('Dark Mode Support', () => {
    it('has dark mode classes in main container', () => {
      const { container } = render(<TabNavigation {...defaultProps} />);
      
      const mainContainer = container.querySelector('.bg-white');
      expect(mainContainer).toHaveClass('dark:bg-gray-800');
    });

    it('has dark mode classes in fade effect', () => {
      const { container } = render(<TabNavigation {...defaultProps} />);
      
      const fadeEffect = container.querySelector('.from-white');
      expect(fadeEffect).toHaveClass('dark:from-gray-800');
    });

    it('active tab has dark mode text color', () => {
      render(<TabNavigation {...defaultProps} activeTab="home" />);
      
      const homeButton = screen.getByText('Home');
      expect(homeButton).toHaveClass('dark:text-indigo-400');
    });

    it('inactive tabs have dark mode text colors', () => {
      render(<TabNavigation {...defaultProps} activeTab="home" />);
      
      const metricsButton = screen.getByText('Fitness Metrics');
      expect(metricsButton).toHaveClass('dark:text-gray-400');
    });

    it('inactive tabs have dark mode hover colors', () => {
      render(<TabNavigation {...defaultProps} activeTab="home" />);
      
      const metricsButton = screen.getByText('Fitness Metrics');
      expect(metricsButton).toHaveClass('dark:hover:text-gray-300');
    });
  });

  describe('Accessibility', () => {
    it('has proper navigation role', () => {
      render(<TabNavigation {...defaultProps} />);
      
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('navigation has aria-label', () => {
      render(<TabNavigation {...defaultProps} />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Tabs');
    });

    it('buttons are focusable', () => {
      render(<TabNavigation {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('can navigate with keyboard', () => {
      render(<TabNavigation {...defaultProps} />);
      
      const homeButton = screen.getByText('Home');
      homeButton.focus();
      
      expect(document.activeElement).toBe(homeButton);
    });
  });

  describe('Type Safety', () => {
    it('accepts all valid DashboardTab values', () => {
      const validTabs: DashboardTab[] = ['home', 'metrics', 'blood', 'protocols'];
      
      validTabs.forEach(tab => {
        const { rerender } = render(<TabNavigation {...defaultProps} activeTab={tab} />);
        expect(screen.getByRole('navigation')).toBeInTheDocument();
        rerender(<TabNavigation {...defaultProps} activeTab={tab} />);
      });
    });
  });
});
