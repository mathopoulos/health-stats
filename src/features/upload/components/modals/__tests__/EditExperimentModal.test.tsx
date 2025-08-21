import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toast } from 'react-hot-toast';
import EditExperimentModal from '../EditExperimentModal';

// Mock react-hot-toast
jest.mock('react-hot-toast');
const mockToast = toast as jest.Mocked<typeof toast>;

describe('EditExperimentModal', () => {
  const mockExperiment = {
    id: '1',
    name: 'Test Experiment',
    description: 'Test Description',
    frequency: 'daily',
    duration: '4-weeks',
    fitnessMarkers: ['HRV', 'VO2 Max'],
    bloodMarkers: ['Total Cholesterol'],
    status: 'active' as const,
    createdAt: '2024-01-01T00:00:00.000Z'
  };

  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSave: jest.fn(),
    experiment: mockExperiment,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset fetch mock
    global.fetch = jest.fn();
  });

  it('renders when open', () => {
    render(<EditExperimentModal {...mockProps} />);
    expect(screen.getByText('Edit Experiment')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<EditExperimentModal {...mockProps} isOpen={false} />);
    expect(screen.queryByText('Edit Experiment')).not.toBeInTheDocument();
  });

  it('renders experiment data in form fields', () => {
    render(<EditExperimentModal {...mockProps} />);
    
    expect(screen.getByDisplayValue('Test Experiment')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
    // For select elements, check the value directly
    const frequencySelect = screen.getByLabelText(/frequency/i);
    const durationSelect = screen.getByLabelText(/duration/i);
    expect(frequencySelect).toHaveValue('daily');
    expect(durationSelect).toHaveValue('4-weeks');
  });

  it('handles experiment name change', () => {
    render(<EditExperimentModal {...mockProps} />);
    
    const nameInput = screen.getByDisplayValue('Test Experiment');
    fireEvent.change(nameInput, { target: { value: 'Updated Experiment' } });
    
    expect(nameInput).toHaveValue('Updated Experiment');
  });

  it('handles experiment description change', () => {
    render(<EditExperimentModal {...mockProps} />);
    
    const descriptionInput = screen.getByDisplayValue('Test Description');
    fireEvent.change(descriptionInput, { target: { value: 'Updated Description' } });
    
    expect(descriptionInput).toHaveValue('Updated Description');
  });

  it('handles frequency change', () => {
    render(<EditExperimentModal {...mockProps} />);
    
    const frequencySelect = screen.getByLabelText(/frequency/i);
    fireEvent.change(frequencySelect, { target: { value: 'weekly' } });
    
    expect(frequencySelect).toHaveValue('weekly');
  });

  it('handles duration change', () => {
    render(<EditExperimentModal {...mockProps} />);
    
    const durationSelect = screen.getByLabelText(/duration/i);
    fireEvent.change(durationSelect, { target: { value: '8-weeks' } });
    
    expect(durationSelect).toHaveValue('8-weeks');
  });

  it('shows selected fitness markers', () => {
    render(<EditExperimentModal {...mockProps} />);
    
    const hrvCheckbox = screen.getByRole('checkbox', { name: /hrv/i });
    const vo2MaxCheckbox = screen.getByRole('checkbox', { name: /vo2 max/i });
    
    expect(hrvCheckbox).toBeChecked();
    expect(vo2MaxCheckbox).toBeChecked();
  });

  it('shows selected blood markers', () => {
    render(<EditExperimentModal {...mockProps} />);
    
    const cholesterolCheckbox = screen.getByRole('checkbox', { name: /total cholesterol/i });
    expect(cholesterolCheckbox).toBeChecked();
  });

  it('handles fitness marker deselection', () => {
    render(<EditExperimentModal {...mockProps} />);
    
    const hrvCheckbox = screen.getByRole('checkbox', { name: /hrv/i });
    
    // Should be initially checked
    expect(hrvCheckbox).toBeChecked();
    
    // Click to deselect
    fireEvent.click(hrvCheckbox);
    expect(hrvCheckbox).not.toBeChecked();
  });

  it('handles blood marker deselection', () => {
    render(<EditExperimentModal {...mockProps} />);
    
    const cholesterolCheckbox = screen.getByRole('checkbox', { name: /total cholesterol/i });
    
    // Should be initially checked
    expect(cholesterolCheckbox).toBeChecked();
    
    // Click to deselect
    fireEvent.click(cholesterolCheckbox);
    expect(cholesterolCheckbox).not.toBeChecked();
  });

  it('handles fitness marker selection', () => {
    render(<EditExperimentModal {...mockProps} />);
    
    const weightCheckbox = screen.getByRole('checkbox', { name: /weight/i });
    
    // Should be initially unchecked
    expect(weightCheckbox).not.toBeChecked();
    
    // Click to select
    fireEvent.click(weightCheckbox);
    expect(weightCheckbox).toBeChecked();
  });

  it('handles blood marker selection', () => {
    render(<EditExperimentModal {...mockProps} />);
    
    const ldlCheckbox = screen.getByRole('checkbox', { name: /^ldl$/i });
    
    // Should be initially unchecked
    expect(ldlCheckbox).not.toBeChecked();
    
    // Click to select
    fireEvent.click(ldlCheckbox);
    expect(ldlCheckbox).toBeChecked();
  });

  it('validates required fields', async () => {
    render(<EditExperimentModal {...mockProps} />);
    
    // Clear name field
    const nameInput = screen.getByDisplayValue('Test Experiment');
    fireEvent.change(nameInput, { target: { value: '' } });
    
    // Try to submit
    const saveButton = screen.getByText('Update Experiment');
    fireEvent.click(saveButton);
    
    // Should show error
    await waitFor(() => {
      expect(screen.getByText('Experiment name is required')).toBeInTheDocument();
    });
  });

  it('validates at least one marker selected', async () => {
    render(<EditExperimentModal {...mockProps} />);
    
    // Deselect all markers
    const hrvCheckbox = screen.getByRole('checkbox', { name: /hrv/i });
    const vo2MaxCheckbox = screen.getByRole('checkbox', { name: /vo2 max/i });
    const cholesterolCheckbox = screen.getByRole('checkbox', { name: /total cholesterol/i });
    
    fireEvent.click(hrvCheckbox);
    fireEvent.click(vo2MaxCheckbox);
    fireEvent.click(cholesterolCheckbox);
    
    // Try to submit
    const saveButton = screen.getByText('Update Experiment');
    fireEvent.click(saveButton);
    
    // Should show error
    await waitFor(() => {
      expect(screen.getByText('Please select at least one marker to track')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    // Mock successful fetch
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    } as Response);

    render(<EditExperimentModal {...mockProps} />);
    
    // Modify experiment name
    const nameInput = screen.getByDisplayValue('Test Experiment');
    fireEvent.change(nameInput, { target: { value: 'Updated Experiment' } });
    
    // Submit
    const saveButton = screen.getByText('Update Experiment');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockProps.onSave).toHaveBeenCalledWith({
        id: '1',
        name: 'Updated Experiment',
        description: 'Test Description',
        frequency: 'daily',
        duration: '4-weeks',
        fitnessMarkers: ['HRV', 'VO2 Max'],
        bloodMarkers: ['Total Cholesterol'],
        status: 'active',
        createdAt: '2024-01-01T00:00:00.000Z'
      });
    });
  });

  it('shows loading state during submission', async () => {
    global.fetch = jest.fn(() => new Promise(resolve => setTimeout(() => resolve({
      ok: true,
      json: () => Promise.resolve({ success: true })
    } as Response), 100)));
    
    render(<EditExperimentModal {...mockProps} />);
    
    // Submit
    const saveButton = screen.getByText('Update Experiment');
    fireEvent.click(saveButton);
    
    expect(screen.getByText('Updating...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Updating...')).not.toBeInTheDocument();
    });
  });

  it('handles close button click', () => {
    render(<EditExperimentModal {...mockProps} />);
    
    const closeButton = screen.getByText('Cancel');
    fireEvent.click(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('resets form when modal closes and reopens', () => {
    const { rerender } = render(<EditExperimentModal {...mockProps} />);
    
    // Modify experiment name
    const nameInput = screen.getByDisplayValue('Test Experiment');
    fireEvent.change(nameInput, { target: { value: 'Modified Name' } });
    
    // Close modal
    const closeButton = screen.getByText('Cancel');
    fireEvent.click(closeButton);
    
    // Reopen modal
    rerender(<EditExperimentModal {...mockProps} isOpen={true} />);
    
    // Form should be reset to empty values when reopened
    const nameInputAfterReset = screen.getByLabelText(/experiment name/i);
    expect(nameInputAfterReset).toHaveValue('');
  });

  it('shows success toast on successful save', async () => {
    // Mock successful fetch
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    } as Response);

    render(<EditExperimentModal {...mockProps} />);
    
    // Submit
    const saveButton = screen.getByText('Update Experiment');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('Experiment updated successfully');
    });
  });

  it('handles save error', async () => {
    // Mock the fetch call to return an error
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));
    
    render(<EditExperimentModal {...mockProps} />);
    
    // Submit
    const saveButton = screen.getByText('Update Experiment');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Failed to update experiment');
    });
  });

  it('disables save button during submission', async () => {
    global.fetch = jest.fn(() => new Promise(resolve => setTimeout(() => resolve({
      ok: true,
      json: () => Promise.resolve({ success: true })
    } as Response), 100)));
    
    render(<EditExperimentModal {...mockProps} />);
    
    // Submit
    const saveButton = screen.getByText('Update Experiment');
    fireEvent.click(saveButton);
    
    expect(saveButton).toBeDisabled();
    
    await waitFor(() => {
      expect(saveButton).not.toBeDisabled();
    });
  });

  it('handles experiment with no markers', async () => {
    const experimentWithNoMarkers = {
      ...mockExperiment,
      fitnessMarkers: [],
      bloodMarkers: []
    };

    render(<EditExperimentModal {...mockProps} experiment={experimentWithNoMarkers} />);
    
    // Try to submit
    const saveButton = screen.getByText('Update Experiment');
    fireEvent.click(saveButton);
    
    // Should show error
    await waitFor(() => {
      expect(screen.getByText('Please select at least one marker to track')).toBeInTheDocument();
    });
  });

  it('handles experiment with all marker types', () => {
    const experimentWithAllMarkers = {
      ...mockExperiment,
      fitnessMarkers: ['HRV', 'VO2 Max', 'Weight', 'Body Fat %'],
      bloodMarkers: ['Total Cholesterol', 'LDL', 'HDL', 'Triglycerides']
    };

    render(<EditExperimentModal {...mockProps} experiment={experimentWithAllMarkers} />);
    
    // All markers should be checked
    experimentWithAllMarkers.fitnessMarkers.forEach(marker => {
      const checkbox = screen.getByRole('checkbox', { name: new RegExp(marker.replace('%', '\\%'), 'i') });
      expect(checkbox).toBeChecked();
    });

    experimentWithAllMarkers.bloodMarkers.forEach(marker => {
      const checkbox = screen.getByRole('checkbox', { name: new RegExp(marker, 'i') });
      expect(checkbox).toBeChecked();
    });
  });

  it('handles form validation on marker changes', () => {
    render(<EditExperimentModal {...mockProps} />);
    
    // Remove all fitness markers
    const hrvCheckbox = screen.getByRole('checkbox', { name: /hrv/i });
    const vo2MaxCheckbox = screen.getByRole('checkbox', { name: /vo2 max/i });
    fireEvent.click(hrvCheckbox);
    fireEvent.click(vo2MaxCheckbox);
    
    // Remove all blood markers  
    const cholesterolCheckbox = screen.getByRole('checkbox', { name: /total cholesterol/i });
    fireEvent.click(cholesterolCheckbox);
    
    // Try to submit - should show error
    const saveButton = screen.getByText('Update Experiment');
    fireEvent.click(saveButton);
    
    // Should show validation error
    expect(screen.getByText('Please select at least one marker to track')).toBeInTheDocument();
  });

  it('handles null experiment prop', () => {
    render(<EditExperimentModal {...mockProps} experiment={null} />);
    
    // Should not render anything when experiment is null
    expect(screen.queryByText('Edit Experiment')).not.toBeInTheDocument();
  });

  it('handles undefined experiment prop', () => {
    render(<EditExperimentModal {...mockProps} experiment={undefined} />);
    
    // Should not render anything when experiment is undefined
    expect(screen.queryByText('Edit Experiment')).not.toBeInTheDocument();
  });

  it('updates form when experiment prop changes', () => {
    const { rerender } = render(<EditExperimentModal {...mockProps} />);
    
    // Should show initial experiment data
    expect(screen.getByDisplayValue('Test Experiment')).toBeInTheDocument();
    
    // Update experiment prop
    const updatedExperiment = {
      ...mockExperiment,
      name: 'Different Experiment',
      description: 'Different Description'
    };
    
    rerender(<EditExperimentModal {...mockProps} experiment={updatedExperiment} />);
    
    // Should show updated experiment data
    expect(screen.getByDisplayValue('Different Experiment')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Different Description')).toBeInTheDocument();
  });
});
