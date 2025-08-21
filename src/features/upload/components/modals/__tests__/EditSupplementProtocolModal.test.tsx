import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditSupplementProtocolModal from '../EditSupplementProtocolModal';

describe('EditSupplementProtocolModal', () => {
  const mockSupplement = {
    type: 'vitamin-d3',
    frequency: 'daily',
    dosage: '2000',
    unit: 'IU'
  };

  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    onUpdate: jest.fn(),
    supplement: mockSupplement,
    isSaving: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when open', () => {
    render(<EditSupplementProtocolModal {...mockProps} />);
    expect(screen.getByText('Edit Vitamin D3')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<EditSupplementProtocolModal {...mockProps} isOpen={false} />);
    expect(screen.queryByText('Edit Vitamin D3')).not.toBeInTheDocument();
  });

  it('renders supplement data in form fields', () => {
    render(<EditSupplementProtocolModal {...mockProps} />);
    
    expect(screen.getByDisplayValue('2000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('IU')).toBeInTheDocument();
    expect(screen.getByDisplayValue('daily')).toBeInTheDocument();
  });

  it('handles dosage change', () => {
    render(<EditSupplementProtocolModal {...mockProps} />);
    
    const dosageInput = screen.getByDisplayValue('2000');
    fireEvent.change(dosageInput, { target: { value: '3000' } });
    
    expect(dosageInput).toHaveValue('3000');
  });

  it('handles unit change', () => {
    render(<EditSupplementProtocolModal {...mockProps} />);
    
    const unitSelect = screen.getByDisplayValue('IU');
    fireEvent.change(unitSelect, { target: { value: 'mg' } });
    
    expect(unitSelect).toHaveValue('mg');
  });

  it('handles frequency change', () => {
    render(<EditSupplementProtocolModal {...mockProps} />);
    
    const frequencySelect = screen.getByDisplayValue('daily');
    fireEvent.change(frequencySelect, { target: { value: 'twice-daily' } });
    
    expect(frequencySelect).toHaveValue('twice-daily');
  });

  it('calls onUpdate when dosage changed and saved', () => {
    render(<EditSupplementProtocolModal {...mockProps} />);
    
    // Modify dosage
    const dosageInput = screen.getByDisplayValue('2000');
    fireEvent.change(dosageInput, { target: { value: '3000' } });
    
    // Submit
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);
    
    expect(mockProps.onUpdate).toHaveBeenCalledWith('vitamin-d3', 'dosage', '3000');
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('calls onUpdate when unit changed and saved', () => {
    render(<EditSupplementProtocolModal {...mockProps} />);
    
    // Modify unit
    const unitSelect = screen.getByDisplayValue('IU');
    fireEvent.change(unitSelect, { target: { value: 'mg' } });
    
    // Submit
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);
    
    expect(mockProps.onUpdate).toHaveBeenCalledWith('vitamin-d3', 'unit', 'mg');
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('calls onUpdate when frequency changed and saved', () => {
    render(<EditSupplementProtocolModal {...mockProps} />);
    
    // Modify frequency
    const frequencySelect = screen.getByDisplayValue('daily');
    fireEvent.change(frequencySelect, { target: { value: 'twice-daily' } });
    
    // Submit
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);
    
    expect(mockProps.onUpdate).toHaveBeenCalledWith('vitamin-d3', 'frequency', 'twice-daily');
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('calls onUpdate for all changed fields when saved', () => {
    render(<EditSupplementProtocolModal {...mockProps} />);
    
    // Modify all fields
    const dosageInput = screen.getByDisplayValue('2000');
    fireEvent.change(dosageInput, { target: { value: '3000' } });
    
    const unitSelect = screen.getByDisplayValue('IU');
    fireEvent.change(unitSelect, { target: { value: 'mg' } });
    
    const frequencySelect = screen.getByDisplayValue('daily');
    fireEvent.change(frequencySelect, { target: { value: 'twice-daily' } });
    
    // Submit
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);
    
    expect(mockProps.onUpdate).toHaveBeenCalledWith('vitamin-d3', 'dosage', '3000');
    expect(mockProps.onUpdate).toHaveBeenCalledWith('vitamin-d3', 'unit', 'mg');
    expect(mockProps.onUpdate).toHaveBeenCalledWith('vitamin-d3', 'frequency', 'twice-daily');
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('does not call onUpdate when no changes made', () => {
    render(<EditSupplementProtocolModal {...mockProps} />);
    
    // Submit without changes
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);
    
    expect(mockProps.onUpdate).not.toHaveBeenCalled();
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('shows loading state when isSaving is true', () => {
    render(<EditSupplementProtocolModal {...mockProps} isSaving={true} />);
    
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    const saveButton = screen.getByRole('button', { name: /saving/i });
    expect(saveButton).toBeDisabled();
  });

  it('handles close button click', () => {
    render(<EditSupplementProtocolModal {...mockProps} />);
    
    const closeButton = screen.getByText('Cancel');
    fireEvent.click(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('handles X button click', () => {
    render(<EditSupplementProtocolModal {...mockProps} />);
    
    // Find the X button (SVG icon button)
    const xButton = screen.getByRole('button', { name: '' }); // The X button has no accessible name
    fireEvent.click(xButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('resets form when cancelled', () => {
    render(<EditSupplementProtocolModal {...mockProps} />);
    
    // Modify dosage
    const dosageInput = screen.getByDisplayValue('2000');
    fireEvent.change(dosageInput, { target: { value: '5000' } });
    
    expect(dosageInput).toHaveValue('5000');
    
    // Cancel (which resets the form)
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('resets form when supplement prop changes', () => {
    const { rerender } = render(<EditSupplementProtocolModal {...mockProps} />);
    
    // Modify dosage
    const dosageInput = screen.getByDisplayValue('2000');
    fireEvent.change(dosageInput, { target: { value: '5000' } });
    
    expect(dosageInput).toHaveValue('5000');
    
    // Update supplement prop
    const updatedSupplement = {
      ...mockSupplement,
      dosage: '3000',
      unit: 'mg'
    };
    
    rerender(<EditSupplementProtocolModal {...mockProps} supplement={updatedSupplement} />);
    
    // Should show updated supplement data
    expect(screen.getByDisplayValue('3000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('mg')).toBeInTheDocument();
  });

  it('handles different supplement types', () => {
    const magnesiumSupplement = {
      ...mockSupplement,
      type: 'magnesium',
      dosage: '400',
      unit: 'mg'
    };

    render(<EditSupplementProtocolModal {...mockProps} supplement={magnesiumSupplement} />);
    
    expect(screen.getByText('Edit Magnesium')).toBeInTheDocument();
    expect(screen.getByDisplayValue('400')).toBeInTheDocument();
    expect(screen.getByDisplayValue('mg')).toBeInTheDocument();
  });

  it('handles multi-word supplement types', () => {
    const multiWordSupplement = {
      ...mockSupplement,
      type: 'omega-3-fatty-acids',
      dosage: '1000',
      unit: 'mg'
    };

    render(<EditSupplementProtocolModal {...mockProps} supplement={multiWordSupplement} />);
    
    expect(screen.getByText('Edit Omega 3 Fatty Acids')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('mg')).toBeInTheDocument();
  });

  it('handles null supplement prop', () => {
    render(<EditSupplementProtocolModal {...mockProps} supplement={null} />);
    
    // Should not render anything when supplement is null
    expect(screen.queryByText('Edit Vitamin D3')).not.toBeInTheDocument();
  });

  it('handles undefined supplement prop', () => {
    render(<EditSupplementProtocolModal {...mockProps} supplement={undefined} />);
    
    // Should not render anything when supplement is undefined
    expect(screen.queryByText('Edit Vitamin D3')).not.toBeInTheDocument();
  });

  it('handles different frequency options', () => {
    render(<EditSupplementProtocolModal {...mockProps} />);
    
    const frequencySelect = screen.getByDisplayValue('daily');
    
    // Change to different frequency
    fireEvent.change(frequencySelect, { target: { value: 'weekly' } });
    expect(frequencySelect).toHaveValue('weekly');
    
    fireEvent.change(frequencySelect, { target: { value: 'as-needed' } });
    expect(frequencySelect).toHaveValue('as-needed');
    
    fireEvent.change(frequencySelect, { target: { value: 'three-times-daily' } });
    expect(frequencySelect).toHaveValue('three-times-daily');
  });

  it('handles different unit options', () => {
    render(<EditSupplementProtocolModal {...mockProps} />);
    
    const unitSelect = screen.getByDisplayValue('IU');
    
    // Change to different units
    fireEvent.change(unitSelect, { target: { value: 'mg' } });
    expect(unitSelect).toHaveValue('mg');
    
    fireEvent.change(unitSelect, { target: { value: 'mcg' } });
    expect(unitSelect).toHaveValue('mcg');
    
    fireEvent.change(unitSelect, { target: { value: 'capsule' } });
    expect(unitSelect).toHaveValue('capsule');
    
    fireEvent.change(unitSelect, { target: { value: 'ml' } });
    expect(unitSelect).toHaveValue('ml');
  });

  it('shows supplement type in title', () => {
    render(<EditSupplementProtocolModal {...mockProps} />);
    
    // Should show the supplement type in the title
    expect(screen.getByText('Edit Vitamin D3')).toBeInTheDocument();
  });

  it('accepts any dosage input including non-numeric', () => {
    render(<EditSupplementProtocolModal {...mockProps} />);
    
    const dosageInput = screen.getByDisplayValue('2000');
    
    // Component accepts any text input
    fireEvent.change(dosageInput, { target: { value: 'abc' } });
    expect(dosageInput).toHaveValue('abc');
    
    fireEvent.change(dosageInput, { target: { value: '0' } });
    expect(dosageInput).toHaveValue('0');
    
    fireEvent.change(dosageInput, { target: { value: '999999' } });
    expect(dosageInput).toHaveValue('999999');
  });

  it('has accessibility labels for inputs', () => {
    render(<EditSupplementProtocolModal {...mockProps} />);
    
    expect(screen.getByLabelText('Dosage amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Unit')).toBeInTheDocument();
    expect(screen.getByLabelText('Frequency')).toBeInTheDocument();
  });

  it('shows all available frequency options', () => {
    render(<EditSupplementProtocolModal {...mockProps} />);
    
    const frequencySelect = screen.getByDisplayValue('daily');
    
    // Check that all frequency options are available
    expect(screen.getByRole('option', { name: 'Daily' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Twice Daily' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Three Times Daily' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Weekly' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'As Needed' })).toBeInTheDocument();
  });

  it('shows all available unit options', () => {
    render(<EditSupplementProtocolModal {...mockProps} />);
    
    // Check that all unit options are available
    expect(screen.getByRole('option', { name: 'mg' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'mcg' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'g' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'IU' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'capsule' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'tablet' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'ml' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'drops' })).toBeInTheDocument();
  });
});
