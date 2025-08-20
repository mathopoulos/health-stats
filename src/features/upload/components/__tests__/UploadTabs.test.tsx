import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import UploadTabs, { DEFAULT_UPLOAD_TABS, MINIMAL_UPLOAD_TABS } from '../UploadTabs';

describe('UploadTabs', () => {
  const mockOnTabChange = jest.fn();
  const defaultProps = {
    tabs: DEFAULT_UPLOAD_TABS,
    activeTab: 'blood-test',
    onTabChange: mockOnTabChange
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<UploadTabs {...defaultProps} />);
      // Should render either tabpanel (desktop) or combobox (mobile)
      expect(screen.getByRole('tabpanel') || screen.getByRole('combobox')).toBeInTheDocument();
    });

    it.skip('should render all tabs', () => {
      render(<UploadTabs {...defaultProps} />);

      DEFAULT_UPLOAD_TABS.forEach(tab => {
        expect(screen.getByText(tab.label)).toBeInTheDocument();
      });
    });

    it('should render tab icons', () => {
      render(<UploadTabs {...defaultProps} />);

      // Check that icons are rendered by looking for SVG elements
      const icons = document.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should render tab descriptions when provided', () => {
      render(<UploadTabs {...defaultProps} />);

      DEFAULT_UPLOAD_TABS.forEach(tab => {
        if (tab.description) {
          expect(screen.getByText(tab.description)).toBeInTheDocument();
        }
      });
    });

    it('should apply custom className', () => {
      const customClass = 'custom-class';
      render(<UploadTabs {...defaultProps} className={customClass} />);

      expect(screen.getByText('Blood Test').closest('.w-full')).toHaveClass(customClass);
    });
  });

  describe('Mobile Responsive Behavior', () => {
    it('should render select dropdown on mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 600, writable: true });

      render(<UploadTabs {...defaultProps} />);

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(select).toHaveValue('blood-test');
    });

    it('should render all tabs as options in mobile select', () => {
      Object.defineProperty(window, 'innerWidth', { value: 600, writable: true });

      render(<UploadTabs {...defaultProps} />);

      const select = screen.getByRole('combobox');
      DEFAULT_UPLOAD_TABS.forEach(tab => {
        const option = screen.getByRole('option', { name: tab.label });
        expect(option).toBeInTheDocument();
        expect(option).toHaveValue(tab.id);
      });
    });

    it('should call onTabChange when mobile select changes', () => {
      Object.defineProperty(window, 'innerWidth', { value: 600, writable: true });

      render(<UploadTabs {...defaultProps} />);

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'health-data' } });

      expect(mockOnTabChange).toHaveBeenCalledWith('health-data');
    });

    it('should handle disabled tabs in mobile select', () => {
      Object.defineProperty(window, 'innerWidth', { value: 600, writable: true });

      const tabsWithDisabled = [
        ...DEFAULT_UPLOAD_TABS.slice(0, 2),
        { ...DEFAULT_UPLOAD_TABS[2], disabled: true }
      ];

      render(<UploadTabs {...defaultProps} tabs={tabsWithDisabled} />);

      const disabledOption = screen.getByRole('option', { name: 'Experiments' });
      expect(disabledOption).toBeDisabled();
    });
  });

  describe('Desktop Tab Navigation', () => {
    beforeEach(() => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
    });

    it('should render tab navigation on desktop screens', () => {
      render(<UploadTabs {...defaultProps} />);

      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('should render tab buttons with correct labels', () => {
      render(<UploadTabs {...defaultProps} />);

      DEFAULT_UPLOAD_TABS.forEach(tab => {
        const button = screen.getByRole('tab', { name: new RegExp(tab.label) });
        expect(button).toBeInTheDocument();
      });
    });

    it('should call onTabChange when tab button is clicked', () => {
      render(<UploadTabs {...defaultProps} />);

      const healthDataTab = screen.getByRole('tab', { name: /Health Data/i });
      fireEvent.click(healthDataTab);

      expect(mockOnTabChange).toHaveBeenCalledWith('health-data');
    });

    it('should not call onTabChange when disabled tab is clicked', () => {
      const tabsWithDisabled = [
        ...DEFAULT_UPLOAD_TABS.slice(0, 2),
        { ...DEFAULT_UPLOAD_TABS[2], disabled: true }
      ];

      render(<UploadTabs {...defaultProps} tabs={tabsWithDisabled} />);

      const disabledTab = screen.getByRole('tab', { name: /Experiments/i });
      expect(disabledTab).toBeDisabled();

      fireEvent.click(disabledTab);
      expect(mockOnTabChange).not.toHaveBeenCalled();
    });

    it('should apply correct styling for active tab', () => {
      render(<UploadTabs {...defaultProps} />);

      const activeTab = screen.getByRole('tab', { name: /Blood Test/i });
      expect(activeTab).toHaveAttribute('aria-current', 'page');
      expect(activeTab).toHaveClass('text-indigo-600');
    });

    it('should apply correct styling for inactive tabs', () => {
      render(<UploadTabs {...defaultProps} />);

      const inactiveTab = screen.getByRole('tab', { name: /Health Data/i });
      expect(inactiveTab).not.toHaveAttribute('aria-current');
      expect(inactiveTab).toHaveClass('text-gray-500');
    });

    it('should apply correct styling for disabled tabs', () => {
      const tabsWithDisabled = [
        ...DEFAULT_UPLOAD_TABS.slice(0, 2),
        { ...DEFAULT_UPLOAD_TABS[2], disabled: true }
      ];

      render(<UploadTabs {...defaultProps} tabs={tabsWithDisabled} />);

      const disabledTab = screen.getByRole('tab', { name: /Experiments/i });
      expect(disabledTab).toHaveClass('text-gray-400');
      expect(disabledTab).toHaveClass('cursor-not-allowed');
    });
  });

  describe('Tab Content Area', () => {
    it('should render tab content for active tab', () => {
      render(<UploadTabs {...defaultProps} />);

      const activeTabPanel = screen.getByRole('tabpanel');
      expect(activeTabPanel).toBeInTheDocument();
      expect(activeTabPanel).toHaveAttribute('aria-labelledby', 'tab-blood-test');
    });

    it('should not render content for inactive tabs', () => {
      render(<UploadTabs {...defaultProps} />);

      // Only the active tab content should be rendered
      const tabPanels = screen.getAllByRole('tabpanel');
      expect(tabPanels).toHaveLength(1);
    });

    it('should update tab content when active tab changes', () => {
      const { rerender } = render(<UploadTabs {...defaultProps} />);

      expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'tab-blood-test');

      rerender(<UploadTabs {...defaultProps} activeTab="health-data" />);

      expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'tab-health-data');
    });
  });

  describe('Pre-configured Tabs', () => {
    it('should work with DEFAULT_UPLOAD_TABS', () => {
      render(
        <UploadTabs
          tabs={DEFAULT_UPLOAD_TABS}
          activeTab="experiments"
          onTabChange={mockOnTabChange}
        />
      );

      expect(screen.getByText('Experiments')).toBeInTheDocument();
      expect(screen.getByText('Manage experiment protocols')).toBeInTheDocument();
    });

    it('should work with MINIMAL_UPLOAD_TABS', () => {
      render(
        <UploadTabs
          tabs={MINIMAL_UPLOAD_TABS}
          activeTab="blood-test"
          onTabChange={mockOnTabChange}
        />
      );

      expect(screen.getByText('Blood Test')).toBeInTheDocument();
      expect(screen.getByText('Health Data')).toBeInTheDocument();
      expect(screen.queryByText('Experiments')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for tab navigation', () => {
      render(<UploadTabs {...defaultProps} />);

      expect(screen.getByRole('tablist')).toHaveAttribute('aria-label', 'Tabs');
    });

    it('should have proper ARIA attributes for tab buttons', () => {
      render(<UploadTabs {...defaultProps} />);

      const activeTab = screen.getByRole('tab', { name: /Blood Test/i });
      expect(activeTab).toHaveAttribute('aria-current', 'page');

      const inactiveTab = screen.getByRole('tab', { name: /Health Data/i });
      expect(inactiveTab).not.toHaveAttribute('aria-current');
    });

    it('should have proper ARIA attributes for tab content', () => {
      render(<UploadTabs {...defaultProps} />);

      const tabPanel = screen.getByRole('tabpanel');
      expect(tabPanel).toHaveAttribute('aria-labelledby', 'tab-blood-test');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty tabs array', () => {
      render(<UploadTabs {...defaultProps} tabs={[]} />);

      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });

    it('should handle tabs without descriptions', () => {
      const tabsWithoutDescriptions = DEFAULT_UPLOAD_TABS.map(tab => ({
        ...tab,
        description: undefined
      }));

      render(<UploadTabs {...defaultProps} tabs={tabsWithoutDescriptions} />);

      // Should not crash and should render tabs (look for button text specifically)
      const bloodTestButton = screen.getByRole('button', { name: /Blood Test/ });
      expect(bloodTestButton).toBeInTheDocument();
    });

    it('should handle tabs without icons', () => {
      const tabsWithoutIcons = DEFAULT_UPLOAD_TABS.map(tab => ({
        ...tab,
        icon: null
      }));

      render(<UploadTabs {...defaultProps} tabs={tabsWithoutIcons} />);

      // Should not crash and should render tabs (look for button text specifically)
      const bloodTestButton = screen.getByRole('button', { name: /Blood Test/ });
      expect(bloodTestButton).toBeInTheDocument();
    });

    it('should handle active tab not in tabs array', () => {
      render(<UploadTabs {...defaultProps} activeTab="non-existent" />);

      // Should not crash and should render either tabpanel or combobox
      expect(screen.getByRole('tabpanel') || screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should show mobile version on small screens', () => {
      // Mock small screen
      Object.defineProperty(window, 'innerWidth', { value: 500, writable: true });
      window.dispatchEvent(new Event('resize'));

      render(<UploadTabs {...defaultProps} />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    });

    it('should show desktop version on large screens', () => {
      // Mock large screen
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
      window.dispatchEvent(new Event('resize'));

      render(<UploadTabs {...defaultProps} />);

      // Should show desktop navigation (tablist role)
      const navigation = screen.getByRole('navigation', { name: 'Tabs' });
      expect(navigation).toBeInTheDocument();
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });
  });
});
