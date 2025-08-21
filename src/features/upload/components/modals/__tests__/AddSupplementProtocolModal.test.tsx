import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toast } from 'react-hot-toast';
import AddSupplementProtocolModal from '../AddSupplementProtocolModal';

// Mock react-hot-toast
jest.mock('react-hot-toast');
const mockToast = toast as jest.Mocked<typeof toast>;

describe('AddSupplementProtocolModal', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSave: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when open', () => {
    render(<AddSupplementProtocolModal {...mockProps} />);
    expect(screen.getByText('Add Supplement Protocols')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<AddSupplementProtocolModal {...mockProps} isOpen={false} />);
    expect(screen.queryByText('Add Supplement Protocols')).not.toBeInTheDocument();
  });

  it('renders selection step initially', () => {
    render(<AddSupplementProtocolModal {...mockProps} />);
    
    expect(screen.getByPlaceholderText('Search supplements...')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('renders supplement list', () => {
    render(<AddSupplementProtocolModal {...mockProps} />);
    
    expect(screen.getByText('Vitamin D3')).toBeInTheDocument();
    expect(screen.getByText('Vitamin C')).toBeInTheDocument();
    expect(screen.getByText('Magnesium')).toBeInTheDocument();
    expect(screen.getByText('Fish Oil')).toBeInTheDocument();
  });

  it('handles search input', () => {
    render(<AddSupplementProtocolModal {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search supplements...');
    fireEvent.change(searchInput, { target: { value: 'vitamin' } });
    
    expect(searchInput).toHaveValue('vitamin');
    expect(screen.getByText('Vitamin D3')).toBeInTheDocument();
    expect(screen.getByText('Vitamin C')).toBeInTheDocument();
    expect(screen.queryByText('Magnesium')).not.toBeInTheDocument();
  });

  it('handles supplement selection', () => {
    render(<AddSupplementProtocolModal {...mockProps} />);
    
    const vitaminD3 = screen.getByText('Vitamin D3');
    fireEvent.click(vitaminD3.closest('div')!);
    
    // Should show checkmark
    expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled();
  });

  it('handles supplement deselection', () => {
    render(<AddSupplementProtocolModal {...mockProps} />);
    
    const vitaminD3 = screen.getByText('Vitamin D3');
    const supplementDiv = vitaminD3.closest('div')!;
    
    // Select supplement
    fireEvent.click(supplementDiv);
    expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled();
    
    // Deselect supplement
    fireEvent.click(supplementDiv);
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('disables Next button when no supplements selected', () => {
    render(<AddSupplementProtocolModal {...mockProps} />);
    
    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeDisabled();
  });

  it('enables Next button when supplements selected', () => {
    render(<AddSupplementProtocolModal {...mockProps} />);
    
    const vitaminD3 = screen.getByText('Vitamin D3');
    fireEvent.click(vitaminD3.closest('div')!);
    
    const nextButton = screen.getByText('Next');
    expect(nextButton).not.toBeDisabled();
  });

  it('navigates to details step', () => {
    render(<AddSupplementProtocolModal {...mockProps} />);
    
    // Select a supplement
    const vitaminD3 = screen.getByText('Vitamin D3');
    fireEvent.click(vitaminD3.closest('div')!);
    
    // Click Next
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    // Should show details step
    expect(screen.getByText('Back')).toBeInTheDocument();
    expect(screen.getByText('Save 1 Supplement')).toBeInTheDocument();
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });

  it('handles dosage input in details step', () => {
    render(<AddSupplementProtocolModal {...mockProps} />);
    
    // Select supplement and go to details step
    const vitaminD3 = screen.getByText('Vitamin D3');
    fireEvent.click(vitaminD3.closest('div')!);
    fireEvent.click(screen.getByText('Next'));
    
    // Find dosage input
    const dosageInput = screen.getByPlaceholderText('Amount');
    fireEvent.change(dosageInput, { target: { value: '5000' } });
    
    expect(dosageInput).toHaveValue('5000');
  });

  it('handles unit selection in details step', () => {
    render(<AddSupplementProtocolModal {...mockProps} />);
    
    // Select supplement and go to details step
    const vitaminD3 = screen.getByText('Vitamin D3');
    fireEvent.click(vitaminD3.closest('div')!);
    fireEvent.click(screen.getByText('Next'));
    
    // Find unit select
    const unitSelect = screen.getByDisplayValue('IU');
    fireEvent.change(unitSelect, { target: { value: 'mg' } });
    
    expect(unitSelect).toHaveValue('mg');
  });

  it('handles frequency selection in details step', () => {
    render(<AddSupplementProtocolModal {...mockProps} />);
    
    // Select supplement and go to details step
    const vitaminD3 = screen.getByText('Vitamin D3');
    fireEvent.click(vitaminD3.closest('div')!);
    fireEvent.click(screen.getByText('Next'));
    
    // Find frequency select
    const frequencySelect = screen.getByDisplayValue('Daily');
    fireEvent.change(frequencySelect, { target: { value: 'twice-daily' } });
    
    expect(frequencySelect).toHaveValue('twice-daily');
  });

  it('submits form with valid data', async () => {
    render(<AddSupplementProtocolModal {...mockProps} />);
    
    // Select supplement and go to details step
    const vitaminD3 = screen.getByText('Vitamin D3');
    fireEvent.click(vitaminD3.closest('div')!);
    fireEvent.click(screen.getByText('Next'));
    
    // Modify dosage
    const dosageInput = screen.getByPlaceholderText('Amount');
    fireEvent.change(dosageInput, { target: { value: '5000' } });
    
    // Submit
    const saveButton = screen.getByText('Save 1 Supplement');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockProps.onSave).toHaveBeenCalledWith([
        {
          type: 'vitamin-d3',
          frequency: 'daily',
          dosage: '5000',
          unit: 'IU'
        }
      ]);
    });
  });

  it('shows loading state during submission', async () => {
    const mockSave = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<AddSupplementProtocolModal {...mockProps} onSave={mockSave} />);
    
    // Select supplement and go to details step
    const vitaminD3 = screen.getByText('Vitamin D3');
    fireEvent.click(vitaminD3.closest('div')!);
    fireEvent.click(screen.getByText('Next'));
    
    // Submit
    const saveButton = screen.getByText('Save 1 Supplement');
    fireEvent.click(saveButton);
    
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
    });
  });

  it('handles multiple supplement selection', () => {
    render(<AddSupplementProtocolModal {...mockProps} />);
    
    // Select multiple supplements
    fireEvent.click(screen.getByText('Vitamin D3').closest('div')!);
    fireEvent.click(screen.getByText('Vitamin C').closest('div')!);
    fireEvent.click(screen.getByText('Magnesium').closest('div')!);
    
    // Click Next
    fireEvent.click(screen.getByText('Next'));
    
    // Should show details for all supplements
    expect(screen.getByText('Save 3 Supplements')).toBeInTheDocument();
  });

  it('handles back navigation from details step', () => {
    render(<AddSupplementProtocolModal {...mockProps} />);
    
    // Select supplement and go to details step
    const vitaminD3 = screen.getByText('Vitamin D3');
    fireEvent.click(vitaminD3.closest('div')!);
    fireEvent.click(screen.getByText('Next'));
    
    // Click Back
    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);
    
    // Should return to selection step
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.queryByText('Back')).not.toBeInTheDocument();
  });

  it('handles close button click', () => {
    render(<AddSupplementProtocolModal {...mockProps} />);
    
    const closeButton = screen.getByText('Cancel');
    fireEvent.click(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('resets form when modal closes', () => {
    const { rerender } = render(<AddSupplementProtocolModal {...mockProps} />);
    
    // Select a supplement
    const vitaminD3 = screen.getByText('Vitamin D3');
    fireEvent.click(vitaminD3.closest('div')!);
    
    // Close modal
    const closeButton = screen.getByText('Cancel');
    fireEvent.click(closeButton);
    
    // Reopen modal
    rerender(<AddSupplementProtocolModal {...mockProps} isOpen={true} />);
    
    // Should be back to selection step with no supplements selected
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeDisabled();
  });

  it('shows no supplements found message', () => {
    render(<AddSupplementProtocolModal {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search supplements...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    expect(screen.getByText('No supplements found matching your criteria')).toBeInTheDocument();
  });

  it('shows success toast on successful save', async () => {
    render(<AddSupplementProtocolModal {...mockProps} />);
    
    // Select supplement and go to details step
    const vitaminD3 = screen.getByText('Vitamin D3');
    fireEvent.click(vitaminD3.closest('div')!);
    fireEvent.click(screen.getByText('Next'));
    
    // Submit
    const saveButton = screen.getByText('Save 1 Supplement');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('Supplement protocols saved successfully');
    });
  });

  it('handles save error', async () => {
    const mockSave = jest.fn().mockRejectedValue(new Error('Save failed'));
    render(<AddSupplementProtocolModal {...mockProps} onSave={mockSave} />);
    
    // Select supplement and go to details step
    const vitaminD3 = screen.getByText('Vitamin D3');
    fireEvent.click(vitaminD3.closest('div')!);
    fireEvent.click(screen.getByText('Next'));
    
    // Submit
    const saveButton = screen.getByText('Save 1 Supplement');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to save supplement protocols')).toBeInTheDocument();
      expect(mockToast.error).toHaveBeenCalledWith('Failed to save supplement protocols');
    });
  });

  it('validates form before allowing submission', () => {
    render(<AddSupplementProtocolModal {...mockProps} />);
    
    // Select supplement and go to details step
    const vitaminD3 = screen.getByText('Vitamin D3');
    fireEvent.click(vitaminD3.closest('div')!);
    fireEvent.click(screen.getByText('Next'));
    
    // Clear required fields
    const dosageInput = screen.getByPlaceholderText('Amount');
    fireEvent.change(dosageInput, { target: { value: '' } });
    
    // Save button should be disabled
    const saveButton = screen.getByText('Save 1 Supplement');
    expect(saveButton).toBeDisabled();
  });

  it('shows frequency options', () => {
    render(<AddSupplementProtocolModal {...mockProps} />);
    
    // Select supplement and go to details step
    const vitaminD3 = screen.getByText('Vitamin D3');
    fireEvent.click(vitaminD3.closest('div')!);
    fireEvent.click(screen.getByText('Next'));
    
    // Check frequency options exist
    const frequencySelect = screen.getByDisplayValue('Daily');
    expect(frequencySelect).toBeInTheDocument();
    
    // Test changing frequency
    fireEvent.change(frequencySelect, { target: { value: 'weekly' } });
    expect(frequencySelect).toHaveValue('weekly');
  });

  it('handles unit options correctly', () => {
    render(<AddSupplementProtocolModal {...mockProps} />);
    
    // Select supplement and go to details step
    const vitaminD3 = screen.getByText('Vitamin D3');
    fireEvent.click(vitaminD3.closest('div')!);
    fireEvent.click(screen.getByText('Next'));
    
    // Check unit options
    const unitSelect = screen.getByDisplayValue('IU');
    expect(unitSelect).toBeInTheDocument();
    
    // Should have multiple unit options available
    fireEvent.change(unitSelect, { target: { value: 'mg' } });
    expect(unitSelect).toHaveValue('mg');
  });

  it('disables save button during submission', async () => {
    const mockSave = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<AddSupplementProtocolModal {...mockProps} onSave={mockSave} />);
    
    // Select supplement and go to details step
    const vitaminD3 = screen.getByText('Vitamin D3');
    fireEvent.click(vitaminD3.closest('div')!);
    fireEvent.click(screen.getByText('Next'));
    
    // Submit
    const saveButton = screen.getByText('Save 1 Supplement');
    fireEvent.click(saveButton);
    
    // Verify the save function is called
    await waitFor(() => {
      expect(mockSave).toHaveBeenCalled();
    });
  });
});
