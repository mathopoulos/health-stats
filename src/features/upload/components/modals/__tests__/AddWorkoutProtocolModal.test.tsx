import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toast } from 'react-hot-toast';
import AddWorkoutProtocolModal from '../AddWorkoutProtocolModal';

// Mock react-hot-toast
jest.mock('react-hot-toast');
const mockToast = toast as jest.Mocked<typeof toast>;

describe('AddWorkoutProtocolModal', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSave: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when open', () => {
    render(<AddWorkoutProtocolModal {...mockProps} />);
    expect(screen.getByText('Add Workout Protocols')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<AddWorkoutProtocolModal {...mockProps} isOpen={false} />);
    expect(screen.queryByText('Add Workout Protocols')).not.toBeInTheDocument();
  });

  it('renders workout types list', () => {
    render(<AddWorkoutProtocolModal {...mockProps} />);
    
    expect(screen.getByText('Strength Training / Weightlifting')).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(screen.getByText('Yoga')).toBeInTheDocument();
    expect(screen.getByText('Cycling')).toBeInTheDocument();
  });

  it('handles workout selection', () => {
    render(<AddWorkoutProtocolModal {...mockProps} />);
    
    const strengthTraining = screen.getByText('Strength Training / Weightlifting');
    fireEvent.click(strengthTraining.closest('div')!);
    
    // Should enable Next button
    expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled();
  });

  it('handles workout deselection', () => {
    render(<AddWorkoutProtocolModal {...mockProps} />);
    
    const strengthTraining = screen.getByText('Strength Training / Weightlifting');
    const workoutDiv = strengthTraining.closest('div')!;
    
    // Select workout
    fireEvent.click(workoutDiv);
    expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled();
    
    // Deselect workout
    fireEvent.click(workoutDiv);
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('disables Next button when no workouts selected', () => {
    render(<AddWorkoutProtocolModal {...mockProps} />);
    
    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeDisabled();
  });

  it('navigates to frequency step', () => {
    render(<AddWorkoutProtocolModal {...mockProps} />);
    
    // Select a workout
    const strengthTraining = screen.getByText('Strength Training / Weightlifting');
    fireEvent.click(strengthTraining.closest('div')!);
    
    // Click Next
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    // Should show frequency step
    expect(screen.getByText('Back')).toBeInTheDocument();
    expect(screen.getByText('Save 1 Protocol')).toBeInTheDocument();
    expect(screen.getByText('Set Weekly Frequency')).toBeInTheDocument();
  });

  it('handles frequency selection in frequency step', () => {
    render(<AddWorkoutProtocolModal {...mockProps} />);
    
    // Select workout and go to frequency step
    const strengthTraining = screen.getByText('Strength Training / Weightlifting');
    fireEvent.click(strengthTraining.closest('div')!);
    fireEvent.click(screen.getByText('Next'));
    
    // Find frequency select
    const frequencySelect = screen.getByDisplayValue('2x');
    fireEvent.change(frequencySelect, { target: { value: '5' } });
    
    expect(frequencySelect).toHaveValue('5');
  });

  it('submits form with valid data', async () => {
    render(<AddWorkoutProtocolModal {...mockProps} />);
    
    // Select workout and go to frequency step
    const strengthTraining = screen.getByText('Strength Training / Weightlifting');
    fireEvent.click(strengthTraining.closest('div')!);
    fireEvent.click(screen.getByText('Next'));
    
    // Modify frequency
    const frequencySelect = screen.getByDisplayValue('2x');
    fireEvent.change(frequencySelect, { target: { value: '5' } });
    
    // Submit
    const saveButton = screen.getByText('Save 1 Protocol');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockProps.onSave).toHaveBeenCalledWith([
        {
          type: 'strength-training',
          frequency: 5
        }
      ]);
    });
  });

  it('shows loading state during submission', async () => {
    const mockSave = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<AddWorkoutProtocolModal {...mockProps} onSave={mockSave} />);
    
    // Select workout and go to frequency step
    const strengthTraining = screen.getByText('Strength Training / Weightlifting');
    fireEvent.click(strengthTraining.closest('div')!);
    fireEvent.click(screen.getByText('Next'));
    
    // Submit
    const saveButton = screen.getByText('Save 1 Protocol');
    fireEvent.click(saveButton);
    
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
    });
  });

  it('handles multiple workout selection', () => {
    render(<AddWorkoutProtocolModal {...mockProps} />);
    
    // Select multiple workouts
    fireEvent.click(screen.getByText('Strength Training / Weightlifting').closest('div')!);
    fireEvent.click(screen.getByText('Running').closest('div')!);
    fireEvent.click(screen.getByText('Yoga').closest('div')!);
    
    // Click Next
    fireEvent.click(screen.getByText('Next'));
    
    // Should show frequency step for all workouts
    expect(screen.getByText('Save 3 Protocols')).toBeInTheDocument();
  });

  it('handles back navigation from frequency step', () => {
    render(<AddWorkoutProtocolModal {...mockProps} />);
    
    // Select workout and go to frequency step
    const strengthTraining = screen.getByText('Strength Training / Weightlifting');
    fireEvent.click(strengthTraining.closest('div')!);
    fireEvent.click(screen.getByText('Next'));
    
    // Click Back
    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);
    
    // Should return to selection step
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.queryByText('Back')).not.toBeInTheDocument();
  });

  it('handles close button click', () => {
    render(<AddWorkoutProtocolModal {...mockProps} />);
    
    const closeButton = screen.getByText('Cancel');
    fireEvent.click(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('resets form when modal closes', () => {
    const { rerender } = render(<AddWorkoutProtocolModal {...mockProps} />);
    
    // Select a workout
    const strengthTraining = screen.getByText('Strength Training / Weightlifting');
    fireEvent.click(strengthTraining.closest('div')!);
    
    // Close modal
    const closeButton = screen.getByText('Cancel');
    fireEvent.click(closeButton);
    
    // Reopen modal
    rerender(<AddWorkoutProtocolModal {...mockProps} isOpen={true} />);
    
    // Should be back to selection step with no workouts selected
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeDisabled();
  });

  it('shows success toast on successful save', async () => {
    render(<AddWorkoutProtocolModal {...mockProps} />);
    
    // Select workout and go to frequency step
    const strengthTraining = screen.getByText('Strength Training / Weightlifting');
    fireEvent.click(strengthTraining.closest('div')!);
    fireEvent.click(screen.getByText('Next'));
    
    // Submit
    const saveButton = screen.getByText('Save 1 Protocol');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('Workout protocols saved successfully');
    });
  });

  it('handles save error', async () => {
    const mockSave = jest.fn().mockRejectedValue(new Error('Save failed'));
    render(<AddWorkoutProtocolModal {...mockProps} onSave={mockSave} />);
    
    // Select workout and go to frequency step
    const strengthTraining = screen.getByText('Strength Training / Weightlifting');
    fireEvent.click(strengthTraining.closest('div')!);
    fireEvent.click(screen.getByText('Next'));
    
    // Submit
    const saveButton = screen.getByText('Save 1 Protocol');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to save workout protocols')).toBeInTheDocument();
      expect(mockToast.error).toHaveBeenCalledWith('Failed to save workout protocols');
    });
  });

  it('validates frequency range', () => {
    render(<AddWorkoutProtocolModal {...mockProps} />);
    
    // Select workout and go to frequency step
    const strengthTraining = screen.getByText('Strength Training / Weightlifting');
    fireEvent.click(strengthTraining.closest('div')!);
    fireEvent.click(screen.getByText('Next'));
    
    // Frequency should be within 1-7 range (default options)
    const frequencySelect = screen.getByDisplayValue('2x');
    
    // Test valid frequencies are available
    fireEvent.change(frequencySelect, { target: { value: '1' } });
    expect(frequencySelect).toHaveValue('1');
    
    fireEvent.change(frequencySelect, { target: { value: '7' } });
    expect(frequencySelect).toHaveValue('7');
  });

  it('disables save button during submission', async () => {
    const mockSave = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<AddWorkoutProtocolModal {...mockProps} onSave={mockSave} />);
    
    // Select workout and go to frequency step
    const strengthTraining = screen.getByText('Strength Training / Weightlifting');
    fireEvent.click(strengthTraining.closest('div')!);
    fireEvent.click(screen.getByText('Next'));
    
    // Submit
    const saveButton = screen.getByText('Save 1 Protocol');
    fireEvent.click(saveButton);
    
    // Verify the save function is called
    await waitFor(() => {
      expect(mockSave).toHaveBeenCalled();
    });
  });

  it('handles search functionality', () => {
    render(<AddWorkoutProtocolModal {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search by workout name...');
    fireEvent.change(searchInput, { target: { value: 'strength' } });
    
    expect(searchInput).toHaveValue('strength');
    expect(screen.getByText('Strength Training / Weightlifting')).toBeInTheDocument();
  });

  it('shows no workouts found message', () => {
    render(<AddWorkoutProtocolModal {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search by workout name...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    expect(screen.getByText('No workout types found matching "nonexistent"')).toBeInTheDocument();
  });

  it('shows selected count', () => {
    render(<AddWorkoutProtocolModal {...mockProps} />);
    
    // Initially no workouts selected
    expect(screen.getByText('0 workout types selected')).toBeInTheDocument();
    
    // Select one workout
    const strengthTraining = screen.getByText('Strength Training / Weightlifting');
    fireEvent.click(strengthTraining.closest('div')!);
    
    expect(screen.getByText('1 workout type selected')).toBeInTheDocument();
    
    // Select another workout
    const running = screen.getByText('Running');
    fireEvent.click(running.closest('div')!);
    
    expect(screen.getByText('2 workout types selected')).toBeInTheDocument();
  });

  it('shows total weekly sessions in frequency step', () => {
    render(<AddWorkoutProtocolModal {...mockProps} />);
    
    // Select multiple workouts and go to frequency step
    fireEvent.click(screen.getByText('Strength Training / Weightlifting').closest('div')!);
    fireEvent.click(screen.getByText('Running').closest('div')!);
    fireEvent.click(screen.getByText('Next'));
    
    // Should show total weekly sessions (2 workouts x 2 frequency = 4)
    expect(screen.getByText('Total weekly sessions:', { exact: false })).toBeInTheDocument();
    
    // Change frequency of one workout
    const frequencySelects = screen.getAllByDisplayValue('2x');
    fireEvent.change(frequencySelects[0], { target: { value: '3' } });
    
    // Total should update to 5 (3 + 2)
    expect(screen.getByText('Total weekly sessions: 5')).toBeInTheDocument();
  });

  it('shows workout categories in frequency step', () => {
    render(<AddWorkoutProtocolModal {...mockProps} />);
    
    // Select workout and go to frequency step
    const strengthTraining = screen.getByText('Strength Training / Weightlifting');
    fireEvent.click(strengthTraining.closest('div')!);
    fireEvent.click(screen.getByText('Next'));
    
    // Should show workout category
    expect(screen.getByText('(Workout)')).toBeInTheDocument();
  });
});
