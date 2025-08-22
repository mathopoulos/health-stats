import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toast } from 'react-hot-toast';
import AddExperimentModal from '../AddExperimentModal';

// Mock react-hot-toast
jest.mock('react-hot-toast');
const mockToast = toast as jest.Mocked<typeof toast>;

describe('AddExperimentModal', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSave: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when open', () => {
    render(<AddExperimentModal {...mockProps} />);
    expect(screen.getByText('Create New Experiment')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<AddExperimentModal {...mockProps} isOpen={false} />);
    expect(screen.queryByText('Create New Experiment')).not.toBeInTheDocument();
  });

  it('renders all form fields', () => {
    render(<AddExperimentModal {...mockProps} />);
    
    expect(screen.getByLabelText(/experiment name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/frequency/i)).toBeInTheDocument();
    expect(screen.getByText('Fitness Markers to Track')).toBeInTheDocument();
    expect(screen.getByText('Blood Markers to Track')).toBeInTheDocument();
  });

  it('renders fitness markers checkboxes', () => {
    render(<AddExperimentModal {...mockProps} />);
    
    expect(screen.getByText('HRV')).toBeInTheDocument();
    expect(screen.getByText('VO2 Max')).toBeInTheDocument();
    expect(screen.getByText('Weight')).toBeInTheDocument();
    expect(screen.getByText('Body Fat %')).toBeInTheDocument();
  });

  it('renders blood markers checkboxes', () => {
    render(<AddExperimentModal {...mockProps} />);
    
    expect(screen.getByText('Total Cholesterol')).toBeInTheDocument();
    expect(screen.getByText('HDL')).toBeInTheDocument();
    expect(screen.getByText('LDL')).toBeInTheDocument();
    expect(screen.getByText('Testosterone')).toBeInTheDocument();
  });

  it('handles form input changes', () => {
    render(<AddExperimentModal {...mockProps} />);
    
    const nameInput = screen.getByLabelText(/experiment name/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    
    fireEvent.change(nameInput, { target: { value: 'Test Experiment' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });
    
    expect(nameInput).toHaveValue('Test Experiment');
    expect(descriptionInput).toHaveValue('Test Description');
  });

  it('handles frequency and duration selection', () => {
    render(<AddExperimentModal {...mockProps} />);
    
    const frequencySelect = screen.getByLabelText(/frequency/i);
    const durationSelect = screen.getByLabelText(/duration/i);
    
    fireEvent.change(frequencySelect, { target: { value: 'weekly' } });
    fireEvent.change(durationSelect, { target: { value: '4-weeks' } });
    
    expect(frequencySelect).toHaveValue('weekly');
    expect(durationSelect).toHaveValue('4-weeks');
  });

  it('handles fitness marker selection', () => {
    render(<AddExperimentModal {...mockProps} />);
    
    const hrvCheckbox = screen.getByRole('checkbox', { name: /hrv/i });
    fireEvent.click(hrvCheckbox);
    
    expect(hrvCheckbox).toBeChecked();
  });

  it('handles blood marker selection', () => {
    render(<AddExperimentModal {...mockProps} />);
    
    const cholesterolCheckbox = screen.getByRole('checkbox', { name: /total cholesterol/i });
    fireEvent.click(cholesterolCheckbox);
    
    expect(cholesterolCheckbox).toBeChecked();
  });

  it('validates required fields - name', async () => {
    render(<AddExperimentModal {...mockProps} />);
    
    const saveButton = screen.getByText('Create Experiment');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText('Experiment name is required')).toBeInTheDocument();
    });
  });

  it('validates required fields - frequency', async () => {
    render(<AddExperimentModal {...mockProps} />);
    
    fireEvent.change(screen.getByLabelText(/experiment name/i), {
      target: { value: 'Test Experiment' }
    });
    
    const saveButton = screen.getByText('Create Experiment');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText('Frequency is required')).toBeInTheDocument();
    });
  });

  it('validates required fields - duration', async () => {
    render(<AddExperimentModal {...mockProps} />);
    
    fireEvent.change(screen.getByLabelText(/experiment name/i), {
      target: { value: 'Test Experiment' }
    });
    fireEvent.change(screen.getByLabelText(/frequency/i), {
      target: { value: 'daily' }
    });
    
    const saveButton = screen.getByText('Create Experiment');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText('Duration is required')).toBeInTheDocument();
    });
  });

  it('validates at least one marker selection', async () => {
    render(<AddExperimentModal {...mockProps} />);
    
    fireEvent.change(screen.getByLabelText(/experiment name/i), {
      target: { value: 'Test Experiment' }
    });
    fireEvent.change(screen.getByLabelText(/frequency/i), {
      target: { value: 'daily' }
    });
    fireEvent.change(screen.getByLabelText(/duration/i), {
      target: { value: '4-weeks' }
    });
    
    const saveButton = screen.getByText('Create Experiment');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please select at least one marker to track')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    render(<AddExperimentModal {...mockProps} />);
    
    fireEvent.change(screen.getByLabelText(/experiment name/i), {
      target: { value: 'Test Experiment' }
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'Test Description' }
    });
    fireEvent.change(screen.getByLabelText(/frequency/i), {
      target: { value: 'daily' }
    });
    fireEvent.change(screen.getByLabelText(/duration/i), {
      target: { value: '4-weeks' }
    });
    
    // Select a fitness marker
    const hrvCheckbox = screen.getByRole('checkbox', { name: /hrv/i });
    fireEvent.click(hrvCheckbox);
    
    const saveButton = screen.getByText('Create Experiment');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockProps.onSave).toHaveBeenCalledWith({
        name: 'Test Experiment',
        description: 'Test Description',
        frequency: 'daily',
        duration: '4-weeks',
        fitnessMarkers: ['HRV'],
        bloodMarkers: [],
      });
    });
  });

  it('shows loading state during submission', async () => {
    const mockSave = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<AddExperimentModal {...mockProps} onSave={mockSave} />);
    
    fireEvent.change(screen.getByLabelText(/experiment name/i), {
      target: { value: 'Test' }
    });
    fireEvent.change(screen.getByLabelText(/frequency/i), {
      target: { value: 'daily' }
    });
    fireEvent.change(screen.getByLabelText(/duration/i), {
      target: { value: '4-weeks' }
    });
    
    const hrvCheckbox = screen.getByRole('checkbox', { name: /hrv/i });
    fireEvent.click(hrvCheckbox);
    
    const saveButton = screen.getByText('Create Experiment');
    fireEvent.click(saveButton);
    
    expect(screen.getByText('Creating...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Creating...')).not.toBeInTheDocument();
    });
  });

  it('handles close button click', () => {
    render(<AddExperimentModal {...mockProps} />);
    
    const closeButton = screen.getByText('Cancel');
    fireEvent.click(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('handles X button click', () => {
    render(<AddExperimentModal {...mockProps} />);
    
    const closeButton = screen.getByRole('button', { name: '' });
    fireEvent.click(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('resets form when modal closes', () => {
    const { rerender } = render(<AddExperimentModal {...mockProps} />);
    
    fireEvent.change(screen.getByLabelText(/experiment name/i), {
      target: { value: 'Test' }
    });
    
    const closeButton = screen.getByText('Cancel');
    fireEvent.click(closeButton);
    
    rerender(<AddExperimentModal {...mockProps} isOpen={true} />);
    
    expect(screen.getByLabelText(/experiment name/i)).toHaveValue('');
  });

  it('handles marker deselection', () => {
    render(<AddExperimentModal {...mockProps} />);
    
    const hrvCheckbox = screen.getByRole('checkbox', { name: /hrv/i });
    
    // Select then deselect
    fireEvent.click(hrvCheckbox);
    expect(hrvCheckbox).toBeChecked();
    
    fireEvent.click(hrvCheckbox);
    expect(hrvCheckbox).not.toBeChecked();
  });

  it('handles error display and clearing', async () => {
    render(<AddExperimentModal {...mockProps} />);
    
    const saveButton = screen.getByText('Create Experiment');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText('Experiment name is required')).toBeInTheDocument();
    });
    
    // Start typing to clear error
    fireEvent.change(screen.getByLabelText(/experiment name/i), {
      target: { value: 'Test' }
    });
    
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Experiment name is required')).not.toBeInTheDocument();
    });
  });

  it('shows success toast on successful save', async () => {
    render(<AddExperimentModal {...mockProps} />);
    
    fireEvent.change(screen.getByLabelText(/experiment name/i), {
      target: { value: 'Test' }
    });
    fireEvent.change(screen.getByLabelText(/frequency/i), {
      target: { value: 'daily' }
    });
    fireEvent.change(screen.getByLabelText(/duration/i), {
      target: { value: '4-weeks' }
    });
    
    const hrvCheckbox = screen.getByRole('checkbox', { name: /hrv/i });
    fireEvent.click(hrvCheckbox);
    
    const saveButton = screen.getByText('Create Experiment');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('Experiment created successfully');
    });
  });

  it('handles save error', async () => {
    const mockSave = jest.fn().mockRejectedValue(new Error('Save failed'));
    render(<AddExperimentModal {...mockProps} onSave={mockSave} />);
    
    fireEvent.change(screen.getByLabelText(/experiment name/i), {
      target: { value: 'Test' }
    });
    fireEvent.change(screen.getByLabelText(/frequency/i), {
      target: { value: 'daily' }
    });
    fireEvent.change(screen.getByLabelText(/duration/i), {
      target: { value: '4-weeks' }
    });
    
    const hrvCheckbox = screen.getByRole('checkbox', { name: /hrv/i });
    fireEvent.click(hrvCheckbox);
    
    const saveButton = screen.getByText('Create Experiment');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to create experiment')).toBeInTheDocument();
      expect(mockToast.error).toHaveBeenCalledWith('Failed to create experiment');
    });
  });
});
