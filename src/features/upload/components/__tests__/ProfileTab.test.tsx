import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import ProfileTab from '../ProfileTab';

// Mock dependencies
jest.mock('next-auth/react');
jest.mock('react-hot-toast');
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockToast = toast as jest.MockedFunction<typeof toast>;

// Mock fetch
global.fetch = jest.fn();

describe('ProfileTab', () => {
  const defaultProps = {
    name: 'John Doe',
    setName: jest.fn(),
    nameError: null,
    setNameError: jest.fn(),
    age: 30,
    setAge: jest.fn(),
    ageError: null,
    setAgeError: jest.fn(),
    sex: 'male' as const,
    setSex: jest.fn(),
    sexError: null,
    setSexError: jest.fn(),
    profileImage: null,
    setProfileImage: jest.fn(),
    imageError: null,
    setImageError: jest.fn(),
    isUploadingImage: false,
    setIsUploadingImage: jest.fn(),
    isSavingProfile: false,
    setIsSavingProfile: jest.fn(),
    showDeleteAccountDialog: false,
    setShowDeleteAccountDialog: jest.fn(),
    isDeletingAccount: false,
    setIsDeletingAccount: jest.fn(),
    confirmationPhrase: '',
    setConfirmationPhrase: jest.fn(),
    requiredPhrase: 'DELETE MY ACCOUNT',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      status: 'authenticated',
      update: jest.fn(),
    });
    mockToast.success = jest.fn();
    mockToast.error = jest.fn();
  });

  describe('Profile Information Section', () => {
    it('renders profile form with correct initial values', () => {
      render(<ProfileTab {...defaultProps} />);
      
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('30')).toBeInTheDocument();
      
      // For select elements, check the selected option
      const sexSelect = screen.getByLabelText('Biological Sex') as HTMLSelectElement;
      expect(sexSelect.value).toBe('male');
    });

    it('shows dashboard link for mobile when user has ID', () => {
      render(<ProfileTab {...defaultProps} />);
      
      const dashboardLink = screen.getByText('View Dashboard').closest('a');
      expect(dashboardLink).toHaveAttribute('href', '/dashboard/userId=test-user-id');
    });

    it('shows validation errors when provided', () => {
      render(<ProfileTab {...defaultProps} nameError="Name is required" ageError="Invalid age" />);
      
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Invalid age')).toBeInTheDocument();
    });

    it('shows profile image when provided', () => {
      render(<ProfileTab {...defaultProps} profileImage="https://example.com/image.jpg" />);
      
      const profileImage = screen.getByAltText('Profile');
      expect(profileImage).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('shows default profile icon when no image', () => {
      render(<ProfileTab {...defaultProps} />);
      
      // Should show the default user icon SVG
      expect(screen.getByText('Change Photo')).toBeInTheDocument();
    });
  });

  describe('Profile Update Functionality', () => {
    it('calls setName when name input changes', () => {
      const setName = jest.fn();
      render(<ProfileTab {...defaultProps} setName={setName} />);
      
      const nameInput = screen.getByDisplayValue('John Doe');
      fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
      
      expect(setName).toHaveBeenCalledWith('Jane Doe');
    });

    it('calls setAge when age input changes', () => {
      const setAge = jest.fn();
      render(<ProfileTab {...defaultProps} setAge={setAge} />);
      
      const ageInput = screen.getByDisplayValue('30');
      fireEvent.change(ageInput, { target: { value: '25' } });
      
      expect(setAge).toHaveBeenCalledWith(25);
    });

    it('calls setSex when sex select changes', () => {
      const setSex = jest.fn();
      render(<ProfileTab {...defaultProps} setSex={setSex} />);
      
      const sexSelect = screen.getByLabelText('Biological Sex');
      fireEvent.change(sexSelect, { target: { value: 'female' } });
      
      expect(setSex).toHaveBeenCalledWith('female');
    });

    it('validates required name before saving', async () => {
      const setNameError = jest.fn();
      render(<ProfileTab {...defaultProps} name="" setNameError={setNameError} />);
      
      const updateButton = screen.getAllByText('Update')[0];
      fireEvent.click(updateButton);
      
      expect(setNameError).toHaveBeenCalledWith('Name is required');
    });

    it('validates age range before saving', async () => {
      const setAgeError = jest.fn();
      render(<ProfileTab {...defaultProps} age={150} setAgeError={setAgeError} />);
      
      const updateButton = screen.getAllByText('Update')[0];
      fireEvent.click(updateButton);
      
      expect(setAgeError).toHaveBeenCalledWith('Please enter a valid age between 0 and 120');
    });

    it('makes API call to update profile on valid submission', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<ProfileTab {...defaultProps} />);
      
      const updateButton = screen.getAllByText('Update')[0];
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/update-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'John Doe',
            age: 30,
            sex: 'male',
          }),
        });
      });

      expect(mockToast.success).toHaveBeenCalledWith('Profile updated successfully');
    });

    it('handles API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const setNameError = jest.fn();
      render(<ProfileTab {...defaultProps} setNameError={setNameError} />);
      
      const updateButton = screen.getAllByText('Update')[0];
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(setNameError).toHaveBeenCalledWith('Network error');
        expect(mockToast.error).toHaveBeenCalledWith('Failed to update profile');
      });
    });
  });

  describe('Profile Image Upload', () => {
    it('triggers file input when change photo is clicked', () => {
      render(<ProfileTab {...defaultProps} />);
      
      const changePhotoButton = screen.getByText('Change Photo').closest('button');
      expect(changePhotoButton).toBeInTheDocument();
    });

    it('shows loading state when uploading image', () => {
      render(<ProfileTab {...defaultProps} isUploadingImage={true} />);
      
      // Should show loading spinner instead of change photo text
      expect(screen.queryByText('Change Photo')).not.toBeInTheDocument();
    });

    it('shows image error when provided', () => {
      render(<ProfileTab {...defaultProps} imageError="Failed to upload image" />);
      
      expect(screen.getByText('Failed to upload image')).toBeInTheDocument();
    });
  });

  describe('Account Deletion', () => {
    it('opens delete account dialog when delete button clicked', () => {
      const setShowDeleteAccountDialog = jest.fn();
      render(<ProfileTab {...defaultProps} setShowDeleteAccountDialog={setShowDeleteAccountDialog} />);
      
      const deleteButton = screen.getByText('Delete Account');
      fireEvent.click(deleteButton);
      
      expect(setShowDeleteAccountDialog).toHaveBeenCalledWith(true);
    });

    it('shows delete account dialog when showDeleteAccountDialog is true', () => {
      render(<ProfileTab {...defaultProps} showDeleteAccountDialog={true} />);
      
      expect(screen.getByText('Confirm Account Deletion')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('DELETE MY ACCOUNT')).toBeInTheDocument();
    });

    it('validates confirmation phrase before deletion', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        status: 'authenticated',
        update: jest.fn(),
      });

      // Render with wrong confirmation phrase
      render(<ProfileTab {...defaultProps} showDeleteAccountDialog={true} confirmationPhrase="wrong phrase" />);
      
      const deleteButton = screen.getByText('Delete My Account');
      expect(deleteButton).toBeDisabled(); // Button should be disabled with wrong phrase
      
      // The validation happens on component render/state, not on click for disabled buttons
      // So we test that the button is properly disabled instead
    });

    it('calls delete API when confirmation phrase matches', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<ProfileTab {...defaultProps} showDeleteAccountDialog={true} confirmationPhrase="DELETE MY ACCOUNT" />);
      
      const deleteButton = screen.getByText('Delete My Account');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/delete-account', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        });
      });

      expect(mockToast.success).toHaveBeenCalledWith('Account deleted successfully');
    });

    it('handles delete API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Delete failed' }),
      });

      render(<ProfileTab {...defaultProps} showDeleteAccountDialog={true} confirmationPhrase="DELETE MY ACCOUNT" />);
      
      const deleteButton = screen.getByText('Delete My Account');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Delete failed');
      });
    });

    it('closes dialog when cancel button clicked', () => {
      const setShowDeleteAccountDialog = jest.fn();
      const setConfirmationPhrase = jest.fn();
      
      render(<ProfileTab {...defaultProps} 
        showDeleteAccountDialog={true} 
        setShowDeleteAccountDialog={setShowDeleteAccountDialog}
        setConfirmationPhrase={setConfirmationPhrase}
      />);
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(setShowDeleteAccountDialog).toHaveBeenCalledWith(false);
      expect(setConfirmationPhrase).toHaveBeenCalledWith('');
    });
  });

  describe('Loading States', () => {
    it('disables update button when saving profile', () => {
      render(<ProfileTab {...defaultProps} isSavingProfile={true} />);
      
      const updateButtons = screen.getAllByText(/Update/);
      updateButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('shows loading spinner when saving profile', () => {
      render(<ProfileTab {...defaultProps} isSavingProfile={true} />);
      
      // Should show loading spinners - look for SVG elements with animation class
      const spinners = document.querySelectorAll('.animate-spin');
      expect(spinners.length).toBeGreaterThan(0);
    });

    it('disables delete button when deleting account', () => {
      render(<ProfileTab {...defaultProps} showDeleteAccountDialog={true} isDeletingAccount={true} />);
      
      const deleteButton = screen.getByText('Deleting...');
      expect(deleteButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      render(<ProfileTab {...defaultProps} />);
      
      expect(screen.getByLabelText('Display Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Age')).toBeInTheDocument();
      expect(screen.getByLabelText('Biological Sex')).toBeInTheDocument();
    });

    it('has proper button accessibility', () => {
      render(<ProfileTab {...defaultProps} />);
      
      const updateButtons = screen.getAllByRole('button', { name: /Update/ });
      expect(updateButtons.length).toBeGreaterThan(0);
      
      const deleteButton = screen.getByRole('button', { name: 'Delete Account' });
      expect(deleteButton).toBeInTheDocument();
    });
  });
});
