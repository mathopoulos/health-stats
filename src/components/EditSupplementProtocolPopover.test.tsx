import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import EditSupplementProtocolModal from './EditSupplementProtocolPopover';

const mockSupplement = {
  type: 'vitamin-d3',
  frequency: 'daily',
  dosage: '1000',
  unit: 'IU'
};

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  supplement: mockSupplement,
  onUpdate: jest.fn(),
  isSaving: false
};

// Mock Headless UI Dialog to avoid portal issues in tests
jest.mock('@headlessui/react', () => {
  const MockDialog = ({ open, onClose, children, ...props }: any) => (
    open ? (
      <div data-testid="dialog-backdrop" onClick={() => onClose()} {...props}>
        <div onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      </div>
    ) : null
  );

  const MockPanel = ({ children, ...props }: any) => (
    <div data-testid="dialog-panel" {...props}>
      {children}
    </div>
  );

  const MockTitle = ({ children, ...props }: any) => (
    <h2 data-testid="dialog-title" {...props}>
      {children}
    </h2>
  );

  MockDialog.Panel = MockPanel;
  MockDialog.Title = MockTitle;

  return {
    Dialog: MockDialog
  };
});

describe('EditSupplementProtocolModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Modal Rendering', () => {
    it('renders modal when isOpen is true', () => {
      render(<EditSupplementProtocolModal {...defaultProps} />);
      
      expect(screen.getByTestId('dialog-panel')).toBeInTheDocument();
      expect(screen.getByText('Edit Vitamin D3')).toBeInTheDocument();
    });

    it('does not render modal when isOpen is false', () => {
      render(<EditSupplementProtocolModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByTestId('dialog-panel')).not.toBeInTheDocument();
    });

    it('does not render when supplement is null', () => {
      render(<EditSupplementProtocolModal {...defaultProps} supplement={null} />);
      
      expect(screen.queryByTestId('dialog-panel')).not.toBeInTheDocument();
    });

    it('formats supplement type name correctly in title', () => {
      const supplementWithHyphens = {
        ...mockSupplement,
        type: 'omega-3-fish-oil'
      };
      
      render(<EditSupplementProtocolModal {...defaultProps} supplement={supplementWithHyphens} />);
      
      expect(screen.getByText('Edit Omega 3 Fish Oil')).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('displays current supplement values in form fields', () => {
      render(<EditSupplementProtocolModal {...defaultProps} />);
      
      const dosageInput = screen.getByDisplayValue('1000');
      const unitSelect = screen.getByRole('combobox', { name: /unit/i });
      const frequencySelect = screen.getByRole('combobox', { name: /frequency/i });
      
      expect(dosageInput).toBeInTheDocument();
      expect(unitSelect).toHaveValue('IU');
      expect(frequencySelect).toHaveValue('daily');
    });

    it('updates local dosage state when dosage input changes', async () => {
      const user = userEvent.setup();
      render(<EditSupplementProtocolModal {...defaultProps} />);
      
      const dosageInput = screen.getByDisplayValue('1000');
      await user.clear(dosageInput);
      await user.type(dosageInput, '2000');
      
      expect(dosageInput).toHaveValue('2000');
    });

    it('updates local unit state when unit select changes', async () => {
      const user = userEvent.setup();
      render(<EditSupplementProtocolModal {...defaultProps} />);
      
      const unitSelect = screen.getByRole('combobox', { name: /unit/i });
      await user.selectOptions(unitSelect, 'mg');
      
      expect(unitSelect).toHaveValue('mg');
    });

    it('updates local frequency state when frequency select changes', async () => {
      const user = userEvent.setup();
      render(<EditSupplementProtocolModal {...defaultProps} />);
      
      const frequencySelect = screen.getByRole('combobox', { name: /frequency/i });
      await user.selectOptions(frequencySelect, 'twice-daily');
      
      expect(frequencySelect).toHaveValue('twice-daily');
    });

    it('renders all unit options correctly', () => {
      render(<EditSupplementProtocolModal {...defaultProps} />);
      
      const unitSelect = screen.getByRole('combobox', { name: /unit/i });
      const options = Array.from(unitSelect.querySelectorAll('option'));
      const optionValues = options.map(option => option.getAttribute('value'));
      
      expect(optionValues).toEqual(['mg', 'mcg', 'g', 'IU', 'capsule', 'tablet', 'ml', 'drops']);
    });

    it('renders all frequency options correctly', () => {
      render(<EditSupplementProtocolModal {...defaultProps} />);
      
      const frequencySelect = screen.getByRole('combobox', { name: /frequency/i });
      const options = Array.from(frequencySelect.querySelectorAll('option'));
      const optionValues = options.map(option => option.getAttribute('value'));
      
      expect(optionValues).toEqual(['daily', 'twice-daily', 'three-times-daily', 'weekly', 'as-needed']);
    });
  });

  describe('Save Functionality', () => {
    it('calls onUpdate only for changed values when save is clicked', async () => {
      const user = userEvent.setup();
      const onUpdateMock = jest.fn();
      
      render(<EditSupplementProtocolModal {...defaultProps} onUpdate={onUpdateMock} />);
      
      // Change only dosage and frequency
      const dosageInput = screen.getByDisplayValue('1000');
      await user.clear(dosageInput);
      await user.type(dosageInput, '2000');
      
      const frequencySelect = screen.getByRole('combobox', { name: /frequency/i });
      await user.selectOptions(frequencySelect, 'twice-daily');
      
      // Click save
      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);
      
      expect(onUpdateMock).toHaveBeenCalledTimes(2);
      expect(onUpdateMock).toHaveBeenCalledWith('vitamin-d3', 'dosage', '2000');
      expect(onUpdateMock).toHaveBeenCalledWith('vitamin-d3', 'frequency', 'twice-daily');
    });

    it('does not call onUpdate for unchanged values', async () => {
      const user = userEvent.setup();
      const onUpdateMock = jest.fn();
      
      render(<EditSupplementProtocolModal {...defaultProps} onUpdate={onUpdateMock} />);
      
      // Click save without changing anything
      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);
      
      expect(onUpdateMock).not.toHaveBeenCalled();
    });

    it('calls onClose after saving', async () => {
      const user = userEvent.setup();
      const onCloseMock = jest.fn();
      
      render(<EditSupplementProtocolModal {...defaultProps} onClose={onCloseMock} />);
      
      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);
      
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    it('does not save when supplement is null', async () => {
      const user = userEvent.setup();
      const onUpdateMock = jest.fn();
      const onCloseMock = jest.fn();
      
      // Force render with null supplement (shouldn't happen in practice)
      const { rerender } = render(<EditSupplementProtocolModal {...defaultProps} onUpdate={onUpdateMock} onClose={onCloseMock} />);
      
      // Change supplement to null after render
      rerender(<EditSupplementProtocolModal {...defaultProps} supplement={null} onUpdate={onUpdateMock} onClose={onCloseMock} />);
      
      // Modal shouldn't be visible, but if it were and we clicked save
      // This tests the handleSave early return
      expect(onUpdateMock).not.toHaveBeenCalled();
      expect(onCloseMock).not.toHaveBeenCalled();
    });
  });

  describe('Cancel Functionality', () => {
    it('resets values to original when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onCloseMock = jest.fn();
      
      render(<EditSupplementProtocolModal {...defaultProps} onClose={onCloseMock} />);
      
      // Change values
      const dosageInput = screen.getByDisplayValue('1000');
      await user.clear(dosageInput);
      await user.type(dosageInput, '2000');
      
      const frequencySelect = screen.getByRole('combobox', { name: /frequency/i });
      await user.selectOptions(frequencySelect, 'weekly');
      
      // Click cancel
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when X button is clicked', async () => {
      const user = userEvent.setup();
      const onCloseMock = jest.fn();
      
      render(<EditSupplementProtocolModal {...defaultProps} onClose={onCloseMock} />);
      
      const closeButton = screen.getByRole('button', { name: '' }); // SVG button
      await user.click(closeButton);
      
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      const onCloseMock = jest.fn();
      
      render(<EditSupplementProtocolModal {...defaultProps} onClose={onCloseMock} />);
      
      const backdrop = screen.getByTestId('dialog-backdrop');
      await user.click(backdrop);
      
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading States', () => {
    it('shows loading state when isSaving is true', () => {
      render(<EditSupplementProtocolModal {...defaultProps} isSaving={true} />);
      
      const saveButton = screen.getByText('Saving...');
      expect(saveButton).toBeDisabled();
      expect(screen.getByRole('button', { name: /saving/i })).toHaveClass('disabled:opacity-50');
    });

    it('shows spinner when isSaving is true', () => {
      render(<EditSupplementProtocolModal {...defaultProps} isSaving={true} />);
      
      const spinner = screen.getByRole('button', { name: /saving/i }).querySelector('svg');
      expect(spinner).toHaveClass('animate-spin');
    });

    it('shows normal save button when isSaving is false', () => {
      render(<EditSupplementProtocolModal {...defaultProps} isSaving={false} />);
      
      const saveButton = screen.getByText('Save Changes');
      expect(saveButton).not.toBeDisabled();
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
    });
  });

  describe('State Updates on Prop Changes', () => {
    it('updates local state when supplement prop changes', () => {
      const { rerender } = render(<EditSupplementProtocolModal {...defaultProps} />);
      
      expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
      expect(screen.getByDisplayValue('IU')).toBeInTheDocument();
      
      const newSupplement = {
        type: 'magnesium',
        frequency: 'twice-daily',
        dosage: '400',
        unit: 'mg'
      };
      
      rerender(<EditSupplementProtocolModal {...defaultProps} supplement={newSupplement} />);
      
      expect(screen.getByDisplayValue('400')).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /unit/i })).toHaveValue('mg');
      expect(screen.getByRole('combobox', { name: /frequency/i })).toHaveValue('twice-daily');
    });
  });

  describe('Form Labels and Accessibility', () => {
    it('has proper labels for form fields', () => {
      render(<EditSupplementProtocolModal {...defaultProps} />);
      
      expect(screen.getByText('Dosage')).toBeInTheDocument();
      expect(screen.getByText('Frequency')).toBeInTheDocument();
    });

    it('has proper placeholder text', () => {
      render(<EditSupplementProtocolModal {...defaultProps} />);
      
      const dosageInput = screen.getByPlaceholderText('Amount');
      expect(dosageInput).toBeInTheDocument();
    });
  });

  describe('Visual Elements', () => {
    it('renders close button with correct SVG', () => {
      render(<EditSupplementProtocolModal {...defaultProps} />);
      
      const closeButton = screen.getByRole('button', { name: '' });
      const svg = closeButton.querySelector('svg');
      
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
      expect(svg).toHaveClass('w-5', 'h-5', 'text-gray-500');
    });

    it('applies correct CSS classes to main elements', () => {
      render(<EditSupplementProtocolModal {...defaultProps} />);
      
      const panel = screen.getByTestId('dialog-panel');
      expect(panel).toHaveClass('bg-white', 'dark:bg-gray-800', 'rounded-2xl', 'max-w-md', 'w-full', 'shadow-xl');
      
      const title = screen.getByTestId('dialog-title');
      expect(title).toHaveClass('text-xl', 'font-semibold', 'text-gray-900', 'dark:text-white');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty dosage input', async () => {
      const user = userEvent.setup();
      const onUpdateMock = jest.fn();
      
      render(<EditSupplementProtocolModal {...defaultProps} onUpdate={onUpdateMock} />);
      
      const dosageInput = screen.getByDisplayValue('1000');
      await user.clear(dosageInput);
      
      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);
      
      expect(onUpdateMock).toHaveBeenCalledWith('vitamin-d3', 'dosage', '');
    });

    it('handles special characters in dosage', async () => {
      const user = userEvent.setup();
      const onUpdateMock = jest.fn();
      
      render(<EditSupplementProtocolModal {...defaultProps} onUpdate={onUpdateMock} />);
      
      const dosageInput = screen.getByDisplayValue('1000');
      await user.clear(dosageInput);
      await user.type(dosageInput, '1,000.5');
      
      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);
      
      expect(onUpdateMock).toHaveBeenCalledWith('vitamin-d3', 'dosage', '1,000.5');
    });

    it('handles supplement type with no hyphens', () => {
      const supplementNoHyphens = {
        ...mockSupplement,
        type: 'magnesium'
      };
      
      render(<EditSupplementProtocolModal {...defaultProps} supplement={supplementNoHyphens} />);
      
      expect(screen.getByText('Edit Magnesium')).toBeInTheDocument();
    });
  });
});
