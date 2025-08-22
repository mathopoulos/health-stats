import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BloodTab from '../BloodTab';

// Mock the imported components
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
  const mockProps = {
    isAddResultsModalOpen: false,
    setIsAddResultsModalOpen: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the main heading', () => {
    render(<BloodTab {...mockProps} />);
    expect(screen.getByText('Blood Markers')).toBeInTheDocument();
  });

  it('renders all three main sections', () => {
    render(<BloodTab {...mockProps} />);
    
    expect(screen.getByText('Upload Blood Test PDF')).toBeInTheDocument();
    expect(screen.getByText('Manually Add')).toBeInTheDocument();
    expect(screen.getByText('Blood Marker History')).toBeInTheDocument();
  });

  it('renders the PDF upload section with description', () => {
    render(<BloodTab {...mockProps} />);
    
    expect(screen.getByText('Upload Blood Test PDF')).toBeInTheDocument();
    expect(screen.getByText(/upload your blood test pdf and we'll automatically extract/i)).toBeInTheDocument();
  });

  it('renders the manual entry section with description', () => {
    render(<BloodTab {...mockProps} />);
    
    expect(screen.getByText('Manually Add')).toBeInTheDocument();
    expect(screen.getByText(/manually add and track your blood test results/i)).toBeInTheDocument();
  });

  it('renders the add blood test results button', () => {
    render(<BloodTab {...mockProps} />);
    
    const addButton = screen.getByText('Add Blood Test Results');
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveClass('bg-indigo-600');
  });

  it('calls setIsAddResultsModalOpen when add button is clicked', () => {
    render(<BloodTab {...mockProps} />);
    
    const addButton = screen.getByText('Add Blood Test Results');
    fireEvent.click(addButton);
    
    expect(mockProps.setIsAddResultsModalOpen).toHaveBeenCalledWith(true);
  });

  it('renders the BloodTestUpload component', () => {
    render(<BloodTab {...mockProps} />);
    expect(screen.getByTestId('blood-test-upload')).toBeInTheDocument();
  });

  it('renders the BloodMarkerHistory component', () => {
    render(<BloodTab {...mockProps} />);
    expect(screen.getByTestId('blood-marker-history')).toBeInTheDocument();
  });

  it('renders with proper structure and styling', () => {
    const { container } = render(<BloodTab {...mockProps} />);
    expect(container.firstChild).toHaveClass('space-y-6');
  });

  it('has accessible content structure', () => {
    render(<BloodTab {...mockProps} />);
    
    // Check for headings hierarchy
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
  });

  it('handles different modal open states', () => {
    const { rerender } = render(<BloodTab {...mockProps} />);
    expect(screen.getByText('Add Blood Test Results')).toBeInTheDocument();
    
    rerender(<BloodTab {...mockProps} isAddResultsModalOpen={true} />);
    expect(screen.getByText('Add Blood Test Results')).toBeInTheDocument();
  });

  it('renders button with correct styling classes', () => {
    render(<BloodTab {...mockProps} />);
    
    const addButton = screen.getByText('Add Blood Test Results');
    expect(addButton).toHaveClass(
      'mt-4',
      'inline-flex',
      'items-center',
      'px-4',
      'py-2',
      'border',
      'border-transparent',
      'text-sm',
      'font-medium',
      'rounded-md',
      'shadow-sm',
      'text-white',
      'bg-indigo-600',
      'hover:bg-indigo-700'
    );
  });

  it('handles multiple button clicks', () => {
    render(<BloodTab {...mockProps} />);
    
    const addButton = screen.getByText('Add Blood Test Results');
    fireEvent.click(addButton);
    fireEvent.click(addButton);
    fireEvent.click(addButton);
    
    expect(mockProps.setIsAddResultsModalOpen).toHaveBeenCalledTimes(3);
    expect(mockProps.setIsAddResultsModalOpen).toHaveBeenCalledWith(true);
  });

  it('integrates properly with child components', () => {
    render(<BloodTab {...mockProps} />);
    
    // Both mocked components should be rendered
    expect(screen.getByTestId('blood-test-upload')).toBeInTheDocument();
    expect(screen.getByTestId('blood-marker-history')).toBeInTheDocument();
    
    // And they should be in their respective sections
    expect(screen.getByText('Blood Test Upload Component')).toBeInTheDocument();
    expect(screen.getByText('Blood Marker History Component')).toBeInTheDocument();
  });

  it('renders sections in correct order', () => {
    render(<BloodTab {...mockProps} />);
    
    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings[0]).toHaveTextContent('Upload Blood Test PDF');
    expect(headings[1]).toHaveTextContent('Manually Add');
    expect(headings[2]).toHaveTextContent('Blood Marker History');
  });

  it('handles props changes gracefully', () => {
    const { rerender } = render(<BloodTab {...mockProps} />);
    
    const newMockSetFunction = jest.fn();
    rerender(<BloodTab isAddResultsModalOpen={true} setIsAddResultsModalOpen={newMockSetFunction} />);
    
    const addButton = screen.getByText('Add Blood Test Results');
    fireEvent.click(addButton);
    
    expect(newMockSetFunction).toHaveBeenCalledWith(true);
    expect(mockProps.setIsAddResultsModalOpen).not.toHaveBeenCalled();
  });
});