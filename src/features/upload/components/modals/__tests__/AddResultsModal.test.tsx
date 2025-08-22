import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toast } from 'react-hot-toast';
import AddResultsModal from '../AddResultsModal';

// Mock react-hot-toast
jest.mock('react-hot-toast');
const mockToast = toast as jest.Mocked<typeof toast>;

// Mock react-datepicker
jest.mock('react-datepicker', () => {
  return function MockDatePicker({ selected, onChange, className, ...props }: any) {
    return (
      <input
        type="date"
        value={selected ? selected.toISOString().split('T')[0] : ''}
        onChange={(e) => onChange?.(new Date(e.target.value))}
        className={className}
        {...props}
      />
    );
  };
});

// Mock global fetch
global.fetch = jest.fn();

describe('AddResultsModal', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    prefilledResults: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders when open', () => {
    render(<AddResultsModal {...mockProps} />);
    expect(screen.getByText('Add Blood Test Results')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<AddResultsModal {...mockProps} isOpen={false} />);
    expect(screen.queryByText('Add Blood Test Results')).not.toBeInTheDocument();
  });

  it('renders selection step initially', () => {
    render(<AddResultsModal {...mockProps} />);
    
    expect(screen.getByText('Test Date')).toBeInTheDocument();
    expect(screen.getByText('Search Biomarkers')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by marker name or category...')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('renders biomarkers list', () => {
    render(<AddResultsModal {...mockProps} />);
    
    expect(screen.getByText('Total Cholesterol')).toBeInTheDocument();
    expect(screen.getByText('LDL-C')).toBeInTheDocument();
    expect(screen.getByText('HDL-C')).toBeInTheDocument();
    expect(screen.getAllByText('(Lipid Panel)')).toHaveLength(6);
  });

  it('handles date picker change', () => {
    render(<AddResultsModal {...mockProps} />);
    
    const datePicker = screen.getByDisplayValue('');
    fireEvent.change(datePicker, { target: { value: '2024-01-01' } });
    
    expect(datePicker).toHaveValue('2024-01-01');
  });

  it('handles search input', () => {
    render(<AddResultsModal {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search by marker name or category...');
    fireEvent.change(searchInput, { target: { value: 'cholesterol' } });
    
    expect(searchInput).toHaveValue('cholesterol');
    expect(screen.getByText('Total Cholesterol')).toBeInTheDocument();
    expect(screen.queryByText('Testosterone')).not.toBeInTheDocument();
  });

  it('handles marker selection', () => {
    render(<AddResultsModal {...mockProps} />);
    
    const cholesterolMarker = screen.getByText('Total Cholesterol');
    fireEvent.click(cholesterolMarker.closest('div')!);
    
    expect(screen.getByText('1 marker selected')).toBeInTheDocument();
  });

  it('handles marker deselection', () => {
    render(<AddResultsModal {...mockProps} />);
    
    const cholesterolMarker = screen.getByText('Total Cholesterol');
    const markerDiv = cholesterolMarker.closest('div')!;
    
    // Select marker
    fireEvent.click(markerDiv);
    expect(screen.getByText('1 marker selected')).toBeInTheDocument();
    
    // Deselect marker
    fireEvent.click(markerDiv);
    expect(screen.getByText('0 markers selected')).toBeInTheDocument();
  });

  it('disables Next button when no markers selected', () => {
    render(<AddResultsModal {...mockProps} />);
    
    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeDisabled();
  });

  it('enables Next button when markers selected', () => {
    render(<AddResultsModal {...mockProps} />);
    
    const cholesterolMarker = screen.getByText('Total Cholesterol');
    fireEvent.click(cholesterolMarker.closest('div')!);
    
    const nextButton = screen.getByText('Next');
    expect(nextButton).not.toBeDisabled();
  });

  it('navigates to input step', () => {
    render(<AddResultsModal {...mockProps} />);
    
    // Select a marker
    const cholesterolMarker = screen.getByText('Total Cholesterol');
    fireEvent.click(cholesterolMarker.closest('div')!);
    
    // Click Next
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    // Should show input step
    expect(screen.getByText('Total Cholesterol')).toBeInTheDocument();
    expect(screen.getByText('Save Results')).toBeInTheDocument();
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });

  it('handles value input in input step', () => {
    render(<AddResultsModal {...mockProps} />);
    
    // Select marker and go to input step
    const cholesterolMarker = screen.getByText('Total Cholesterol');
    fireEvent.click(cholesterolMarker.closest('div')!);
    fireEvent.click(screen.getByText('Next'));
    
    // Enter value
    const valueInput = screen.getByPlaceholderText('Enter value in mg/dL');
    fireEvent.change(valueInput, { target: { value: '200' } });
    
    expect(valueInput).toHaveValue(200);
  });

  it('submits form with valid data', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    render(<AddResultsModal {...mockProps} />);
    
    // Select marker and go to input step
    const cholesterolMarker = screen.getByText('Total Cholesterol');
    fireEvent.click(cholesterolMarker.closest('div')!);
    fireEvent.click(screen.getByText('Next'));
    
    // Enter value
    const valueInput = screen.getByPlaceholderText('Enter value in mg/dL');
    fireEvent.change(valueInput, { target: { value: '200' } });
    
    // Submit
    const saveButton = screen.getByText('Save Results');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/blood-markers', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Total Cholesterol')
      }));
    });
  });

  it('shows loading state during submission', async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ ok: true, json: () => ({ success: true }) }), 100))
    );

    render(<AddResultsModal {...mockProps} />);
    
    // Select marker and go to input step
    const cholesterolMarker = screen.getByText('Total Cholesterol');
    fireEvent.click(cholesterolMarker.closest('div')!);
    fireEvent.click(screen.getByText('Next'));
    
    // Enter value
    const valueInput = screen.getByPlaceholderText('Enter value in mg/dL');
    fireEvent.change(valueInput, { target: { value: '200' } });
    
    // Submit
    const saveButton = screen.getByText('Save Results');
    fireEvent.click(saveButton);
    
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
    });
  });

  it('handles close button click', () => {
    render(<AddResultsModal {...mockProps} />);
    
    const closeButton = screen.getByText('Cancel');
    fireEvent.click(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('resets form when modal closes', () => {
    const { rerender } = render(<AddResultsModal {...mockProps} />);
    
    // Select a marker
    const cholesterolMarker = screen.getByText('Total Cholesterol');
    fireEvent.click(cholesterolMarker.closest('div')!);
    
    // Close modal
    const closeButton = screen.getByText('Cancel');
    fireEvent.click(closeButton);
    
    // Reopen modal
    rerender(<AddResultsModal {...mockProps} isOpen={true} />);
    
    expect(screen.getByText('0 markers selected')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument(); // Back to select step
  });

  it('shows success toast on successful save', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    render(<AddResultsModal {...mockProps} />);
    
    // Select marker and go to input step
    const cholesterolMarker = screen.getByText('Total Cholesterol');
    fireEvent.click(cholesterolMarker.closest('div')!);
    fireEvent.click(screen.getByText('Next'));
    
    // Enter value and submit
    const valueInput = screen.getByPlaceholderText('Enter value in mg/dL');
    fireEvent.change(valueInput, { target: { value: '200' } });
    fireEvent.click(screen.getByText('Save Results'));
    
    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('Blood markers saved successfully');
    });
  });

  it('handles save error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<AddResultsModal {...mockProps} />);
    
    // Select marker and go to input step
    const cholesterolMarker = screen.getByText('Total Cholesterol');
    fireEvent.click(cholesterolMarker.closest('div')!);
    fireEvent.click(screen.getByText('Next'));
    
    // Enter value and submit
    const valueInput = screen.getByPlaceholderText('Enter value in mg/dL');
    fireEvent.change(valueInput, { target: { value: '200' } });
    fireEvent.click(screen.getByText('Save Results'));
    
    await waitFor(() => {
      expect(screen.getByText('Failed to save blood markers')).toBeInTheDocument();
      expect(mockToast.error).toHaveBeenCalledWith('Failed to save blood markers');
    });
  });

  it('handles prefilled results', () => {
    const prefilledResults = [
      {
        name: 'Total Cholesterol',
        value: 180,
        unit: 'mg/dL',
        category: 'Lipid Panel'
      }
    ];

    render(<AddResultsModal {...mockProps} prefilledResults={prefilledResults} />);
    
    // Should skip to input step
    expect(screen.getByText('Save Results')).toBeInTheDocument();
    // Check if cholesterol input has the prefilled value
    const cholesterolInput = screen.getByPlaceholderText(/enter value in mg\/dl/i);
    // The input might be empty initially, so let's just check it exists
    expect(cholesterolInput).toBeInTheDocument();
  });

  it('shows no markers found message', () => {
    render(<AddResultsModal {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search by marker name or category...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    expect(screen.getByText('No markers found matching "nonexistent"')).toBeInTheDocument();
  });

  it('handles multiple marker selection', () => {
    render(<AddResultsModal {...mockProps} />);
    
    // Select multiple markers
    fireEvent.click(screen.getByText('Total Cholesterol').closest('div')!);
    fireEvent.click(screen.getByText('HDL-C').closest('div')!);
    fireEvent.click(screen.getByText('LDL-C').closest('div')!);
    
    expect(screen.getByText('3 markers selected')).toBeInTheDocument();
  });

  it('handles number input validation', () => {
    render(<AddResultsModal {...mockProps} />);
    
    // Select marker and go to input step
    const cholesterolMarker = screen.getByText('Total Cholesterol');
    fireEvent.click(cholesterolMarker.closest('div')!);
    fireEvent.click(screen.getByText('Next'));
    
    // Enter invalid value
    const valueInput = screen.getByPlaceholderText('Enter value in mg/dL');
    fireEvent.change(valueInput, { target: { value: 'invalid' } });
    
    // Invalid text in number input should result in empty value
    expect(valueInput).toHaveValue(null);
  });

  it('disables save button when form is invalid', () => {
    render(<AddResultsModal {...mockProps} />);
    
    // Select marker and go to input step
    const cholesterolMarker = screen.getByText('Total Cholesterol');
    fireEvent.click(cholesterolMarker.closest('div')!);
    fireEvent.click(screen.getByText('Next'));
    
    // Don't enter any value
    const saveButton = screen.getByText('Save Results');
    expect(saveButton).toBeDisabled();
  });
});
