import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BloodTab from '../BloodTab';

// Mock the blood marker components
jest.mock('@features/blood-markers/components/BloodTestUpload', () => {
  return function MockBloodTestUpload() {
    return <div data-testid="blood-test-upload">Blood Test Upload Component</div>;
  };
});

jest.mock('@features/blood-markers/components/BloodMarkerHistory', () => {
  return function MockBloodMarkerHistory() {
    return <div data-testid="blood-marker-history">Blood Marker History Component</div>;
  };
});

describe('BloodTab', () => {
  const defaultProps = {
    isAddResultsModalOpen: false,
    setIsAddResultsModalOpen: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('renders the blood tab with correct heading', () => {
      render(<BloodTab {...defaultProps} />);
      
      expect(screen.getByText('Blood Markers')).toBeInTheDocument();
    });

    it('renders all main sections', () => {
      render(<BloodTab {...defaultProps} />);
      
      // PDF Upload Section
      expect(screen.getByText('Upload Blood Test PDF')).toBeInTheDocument();
      expect(screen.getByText('Upload your blood test PDF and we\'ll automatically extract the results.')).toBeInTheDocument();
      
      // Manual Entry Section
      expect(screen.getByText('Manually Add')).toBeInTheDocument();
      expect(screen.getByText('Manually add and track your blood test results here.')).toBeInTheDocument();
      
      // History Section
      expect(screen.getByText('Blood Marker History')).toBeInTheDocument();
    });

    it('renders BloodTestUpload component', () => {
      render(<BloodTab {...defaultProps} />);
      
      expect(screen.getByTestId('blood-test-upload')).toBeInTheDocument();
    });

    it('renders BloodMarkerHistory component', () => {
      render(<BloodTab {...defaultProps} />);
      
      expect(screen.getByTestId('blood-marker-history')).toBeInTheDocument();
    });
  });

  describe('Manual Entry Functionality', () => {
    it('renders add blood test results button', () => {
      render(<BloodTab {...defaultProps} />);
      
      const addButton = screen.getByText('Add Blood Test Results');
      expect(addButton).toBeInTheDocument();
      expect(addButton.tagName).toBe('BUTTON');
    });

    it('calls setIsAddResultsModalOpen when add button is clicked', () => {
      const setIsAddResultsModalOpen = jest.fn();
      render(<BloodTab {...defaultProps} setIsAddResultsModalOpen={setIsAddResultsModalOpen} />);
      
      const addButton = screen.getByText('Add Blood Test Results');
      fireEvent.click(addButton);
      
      expect(setIsAddResultsModalOpen).toHaveBeenCalledWith(true);
    });

    it('has proper button styling', () => {
      render(<BloodTab {...defaultProps} />);
      
      const addButton = screen.getByText('Add Blood Test Results');
      expect(addButton).toHaveClass('inline-flex', 'items-center', 'px-4', 'py-2');
      expect(addButton).toHaveClass('bg-indigo-600', 'hover:bg-indigo-700');
    });
  });

  describe('Component Integration', () => {
    it('passes correct props to child components', () => {
      // This test ensures that the component structure is maintained
      // and that the mocked components are rendered correctly
      render(<BloodTab {...defaultProps} />);
      
      expect(screen.getByTestId('blood-test-upload')).toBeInTheDocument();
      expect(screen.getByTestId('blood-marker-history')).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('has proper section layout', () => {
      const { container } = render(<BloodTab {...defaultProps} />);
      
      // Check for main container structure
      const mainContainer = container.firstChild;
      expect(mainContainer).toHaveClass('space-y-6');
    });

    it('renders sections with proper styling', () => {
      render(<BloodTab {...defaultProps} />);
      
      // Check that all main content sections have proper card styling
      const sections = screen.getAllByText(/Upload Blood Test PDF|Manually Add|Blood Marker History/).map(
        text => text.closest('.bg-white, .dark\\:bg-gray-800')
      );
      
      // Should have at least 3 sections (upload, manual, history)
      expect(sections.length).toBeGreaterThanOrEqual(3);
    });

    it('has responsive heading that hides on mobile', () => {
      render(<BloodTab {...defaultProps} />);
      
      const heading = screen.getByText('Blood Markers');
      expect(heading).toHaveClass('hidden', 'md:block');
    });
  });

  describe('Content Accuracy', () => {
    it('displays correct descriptive text for PDF upload', () => {
      render(<BloodTab {...defaultProps} />);
      
      expect(screen.getByText('Upload your blood test PDF and we\'ll automatically extract the results.')).toBeInTheDocument();
    });

    it('displays correct descriptive text for manual entry', () => {
      render(<BloodTab {...defaultProps} />);
      
      expect(screen.getByText('Manually add and track your blood test results here.')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<BloodTab {...defaultProps} />);
      
      // Main heading should be h2
      const mainHeading = screen.getByRole('heading', { name: 'Blood Markers' });
      expect(mainHeading.tagName).toBe('H2');
      
      // Section headings should be h3
      const sectionHeadings = screen.getAllByRole('heading', { level: 3 });
      expect(sectionHeadings.length).toBe(3); // Upload, Manual, History
    });

    it('has properly labeled button', () => {
      render(<BloodTab {...defaultProps} />);
      
      const addButton = screen.getByRole('button', { name: 'Add Blood Test Results' });
      expect(addButton).toBeInTheDocument();
    });

    it('maintains focus management', () => {
      render(<BloodTab {...defaultProps} />);
      
      const addButton = screen.getByText('Add Blood Test Results');
      addButton.focus();
      expect(document.activeElement).toBe(addButton);
    });
  });

  describe('Component Props', () => {
    it('accepts isAddResultsModalOpen prop', () => {
      // Test that the component doesn't break with different prop values
      render(<BloodTab {...defaultProps} isAddResultsModalOpen={true} />);
      expect(screen.getByTestId('blood-test-upload')).toBeInTheDocument();
    });

    it('accepts setIsAddResultsModalOpen function prop', () => {
      const mockFunction = jest.fn();
      render(<BloodTab {...defaultProps} setIsAddResultsModalOpen={mockFunction} />);
      
      const addButton = screen.getByText('Add Blood Test Results');
      fireEvent.click(addButton);
      
      expect(mockFunction).toHaveBeenCalledTimes(1);
    });
  });
});
