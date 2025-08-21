import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import ProfileTab from '../ProfileTab';
import * as uploadHooks from '../../hooks';

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

// Mock the hooks
jest.mock('../../hooks', () => ({
  useProfileForm: jest.fn(),
  useImageUpload: jest.fn(),
  useAccountDeletion: jest.fn(),
}));

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockToast = toast as jest.MockedFunction<typeof toast>;
const mockUseProfileForm = uploadHooks.useProfileForm as jest.MockedFunction<typeof uploadHooks.useProfileForm>;
const mockUseImageUpload = uploadHooks.useImageUpload as jest.MockedFunction<typeof uploadHooks.useImageUpload>;
const mockUseAccountDeletion = uploadHooks.useAccountDeletion as jest.MockedFunction<typeof uploadHooks.useAccountDeletion>;

// Mock fetch
global.fetch = jest.fn();

describe('ProfileTab', () => {
  const defaultProfileForm = {
    name: 'John Doe',
    setName: jest.fn(),
    nameError: null,
    setNameError: jest.fn(),
    age: 30 as number | '',
    setAge: jest.fn(),
    ageError: null,
    setAgeError: jest.fn(),
    sex: 'male' as 'male' | 'female' | 'other' | '',
    setSex: jest.fn(),
    sexError: null,
    setSexError: jest.fn(),
    isSavingProfile: false,
    setIsSavingProfile: jest.fn(),
    handleUpdateProfile: jest.fn(),
  };

  const defaultImageUpload = {
    profileImage: null,
    setProfileImage: jest.fn(),
    imageError: null,
    setImageError: jest.fn(),
    isUploadingImage: false,
    setIsUploadingImage: jest.fn(),
    handleProfileImageUpload: jest.fn(),
  };

  const defaultAccountDeletion = {
    showDeleteAccountDialog: false,
    setShowDeleteAccountDialog: jest.fn(),
    isDeletingAccount: false,
    setIsDeletingAccount: jest.fn(),
    confirmationPhrase: '',
    setConfirmationPhrase: jest.fn(),
    requiredPhrase: 'delete my account',
    handleDeleteAccountClick: jest.fn(),
    handleDeleteAccount: jest.fn(),
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

    // Default hook mocks
    mockUseProfileForm.mockReturnValue(defaultProfileForm);
    mockUseImageUpload.mockReturnValue(defaultImageUpload);
    mockUseAccountDeletion.mockReturnValue(defaultAccountDeletion);
  });

  describe('Profile Information Section', () => {
    it('renders profile form with correct initial values', () => {
      render(<ProfileTab />);
      
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('30')).toBeInTheDocument();
      
      // For select elements, check the selected option
      const sexSelect = screen.getByLabelText('Biological Sex') as HTMLSelectElement;
      expect(sexSelect.value).toBe('male');
    });

    it('shows dashboard link for mobile when user has ID', () => {
      render(<ProfileTab />);
      
      const dashboardLink = screen.getByText('View Dashboard').closest('a');
      expect(dashboardLink).toHaveAttribute('href', '/dashboard/userId=test-user-id');
    });

    it('shows validation errors when provided', () => {
      mockUseProfileForm.mockReturnValue({
        ...defaultProfileForm,
        nameError: 'Name is required',
        ageError: 'Invalid age',
      });

      render(<ProfileTab />);
      
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Invalid age')).toBeInTheDocument();
    });

    it('shows profile image when provided', () => {
      mockUseImageUpload.mockReturnValue({
        ...defaultImageUpload,
        profileImage: 'https://example.com/image.jpg',
      });

      render(<ProfileTab />);
      
      const profileImage = screen.getByAltText('Profile');
      expect(profileImage).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('shows default profile icon when no image', () => {
      render(<ProfileTab />);
      
      // Should show the default user icon SVG
      expect(screen.getByText('Change Photo')).toBeInTheDocument();
    });
  });

  describe('Profile Update Functionality', () => {
    it('calls setName when name input changes', () => {
      const setName = jest.fn();
      mockUseProfileForm.mockReturnValue({
        ...defaultProfileForm,
        setName,
      });

      render(<ProfileTab />);
      
      const nameInput = screen.getByDisplayValue('John Doe');
      fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
      
      expect(setName).toHaveBeenCalledWith('Jane Doe');
    });

    it('calls setAge when age input changes', () => {
      const setAge = jest.fn();
      mockUseProfileForm.mockReturnValue({
        ...defaultProfileForm,
        setAge,
      });

      render(<ProfileTab />);
      
      const ageInput = screen.getByDisplayValue('30');
      fireEvent.change(ageInput, { target: { value: '25' } });
      
      expect(setAge).toHaveBeenCalledWith(25);
    });

    it('calls setSex when sex select changes', () => {
      const setSex = jest.fn();
      mockUseProfileForm.mockReturnValue({
        ...defaultProfileForm,
        setSex,
      });

      render(<ProfileTab />);
      
      const sexSelect = screen.getByLabelText('Biological Sex');
      fireEvent.change(sexSelect, { target: { value: 'female' } });
      
      expect(setSex).toHaveBeenCalledWith('female');
    });

    it('calls handleUpdateProfile when update button is clicked', () => {
      const handleUpdateProfile = jest.fn();
      mockUseProfileForm.mockReturnValue({
        ...defaultProfileForm,
        handleUpdateProfile,
      });

      render(<ProfileTab />);
      
      const updateButtons = screen.getAllByText('Update');
      fireEvent.click(updateButtons[0]);
      
      expect(handleUpdateProfile).toHaveBeenCalled();
    });

    it('calls handleUpdateProfile when second update button is clicked', () => {
      const handleUpdateProfile = jest.fn();
      mockUseProfileForm.mockReturnValue({
        ...defaultProfileForm,
        handleUpdateProfile,
      });

      render(<ProfileTab />);
      
      const updateButtons = screen.getAllByText('Update');
      fireEvent.click(updateButtons[1]);
      
      expect(handleUpdateProfile).toHaveBeenCalled();
    });
  });

  describe('Profile Image Upload', () => {
    it('triggers file input when change photo is clicked', () => {
      render(<ProfileTab />);
      
      const changePhotoButton = screen.getByText('Change Photo').closest('button');
      expect(changePhotoButton).toBeInTheDocument();
    });

    it('shows loading state when uploading image', () => {
      mockUseImageUpload.mockReturnValue({
        ...defaultImageUpload,
        isUploadingImage: true,
      });

      render(<ProfileTab />);
      
      // Should show loading spinner instead of change photo text
      expect(screen.queryByText('Change Photo')).not.toBeInTheDocument();
      // Should have a spinner element
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('shows image error when provided', () => {
      mockUseImageUpload.mockReturnValue({
        ...defaultImageUpload,
        imageError: 'Failed to upload image',
      });

      render(<ProfileTab />);
      
      expect(screen.getByText('Failed to upload image')).toBeInTheDocument();
    });

    it('calls handleProfileImageUpload when file is selected', () => {
      const handleProfileImageUpload = jest.fn();
      mockUseImageUpload.mockReturnValue({
        ...defaultImageUpload,
        handleProfileImageUpload,
      });

      render(<ProfileTab />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeTruthy();
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      
      fireEvent.change(fileInput);
      
      expect(handleProfileImageUpload).toHaveBeenCalledWith(file);
    });
  });

  describe('Account Deletion', () => {
    it('calls handleDeleteAccountClick when delete button clicked', () => {
      const handleDeleteAccountClick = jest.fn();
      mockUseAccountDeletion.mockReturnValue({
        ...defaultAccountDeletion,
        handleDeleteAccountClick,
      });

      render(<ProfileTab />);
      
      const deleteButton = screen.getByText('Delete Account');
      fireEvent.click(deleteButton);
      
      expect(handleDeleteAccountClick).toHaveBeenCalled();
    });

    it('shows delete account dialog when showDeleteAccountDialog is true', () => {
      mockUseAccountDeletion.mockReturnValue({
        ...defaultAccountDeletion,
        showDeleteAccountDialog: true,
      });

      render(<ProfileTab />);
      
      expect(screen.getByText('Confirm Account Deletion')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('delete my account')).toBeInTheDocument();
    });

    it('validates confirmation phrase before deletion', () => {
      mockUseAccountDeletion.mockReturnValue({
        ...defaultAccountDeletion,
        showDeleteAccountDialog: true,
        confirmationPhrase: 'wrong phrase',
      });

      render(<ProfileTab />);
      
      const deleteButton = screen.getByText('Delete My Account');
      expect(deleteButton).toBeDisabled(); // Button should be disabled with wrong phrase
    });

    it('enables delete button when confirmation phrase matches', () => {
      mockUseAccountDeletion.mockReturnValue({
        ...defaultAccountDeletion,
        showDeleteAccountDialog: true,
        confirmationPhrase: 'delete my account',
      });

      render(<ProfileTab />);
      
      const deleteButton = screen.getByText('Delete My Account');
      expect(deleteButton).not.toBeDisabled();
    });

    it('calls handleDeleteAccount when delete button clicked with valid phrase', () => {
      const handleDeleteAccount = jest.fn();
      mockUseAccountDeletion.mockReturnValue({
        ...defaultAccountDeletion,
        showDeleteAccountDialog: true,
        confirmationPhrase: 'delete my account',
        handleDeleteAccount,
      });

      render(<ProfileTab />);
      
      const deleteButton = screen.getByText('Delete My Account');
      fireEvent.click(deleteButton);
      
      expect(handleDeleteAccount).toHaveBeenCalled();
    });

    it('closes dialog when cancel button clicked', () => {
      const setShowDeleteAccountDialog = jest.fn();
      const setConfirmationPhrase = jest.fn();
      mockUseAccountDeletion.mockReturnValue({
        ...defaultAccountDeletion,
        showDeleteAccountDialog: true,
        setShowDeleteAccountDialog,
        setConfirmationPhrase,
      });

      render(<ProfileTab />);
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(setShowDeleteAccountDialog).toHaveBeenCalledWith(false);
      expect(setConfirmationPhrase).toHaveBeenCalledWith('');
    });

    it('closes dialog when backdrop is clicked', () => {
      const setShowDeleteAccountDialog = jest.fn();
      const setConfirmationPhrase = jest.fn();
      mockUseAccountDeletion.mockReturnValue({
        ...defaultAccountDeletion,
        showDeleteAccountDialog: true,
        setShowDeleteAccountDialog,
        setConfirmationPhrase,
      });

      render(<ProfileTab />);
      
      const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/30');
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(setShowDeleteAccountDialog).toHaveBeenCalledWith(false);
        expect(setConfirmationPhrase).toHaveBeenCalledWith('');
      }
    });
  });

  describe('Loading States', () => {
    it('disables update buttons when saving profile', () => {
      mockUseProfileForm.mockReturnValue({
        ...defaultProfileForm,
        isSavingProfile: true,
      });

      render(<ProfileTab />);
      
      const updateButtons = screen.getAllByText(/Update/);
      updateButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('shows loading spinner when saving profile', () => {
      mockUseProfileForm.mockReturnValue({
        ...defaultProfileForm,
        isSavingProfile: true,
      });

      render(<ProfileTab />);
      
      // Should show loading spinners - look for SVG elements with animation class
      const spinners = document.querySelectorAll('.animate-spin');
      expect(spinners.length).toBeGreaterThan(0);
    });

    it('shows deleting state when deleting account', () => {
      mockUseAccountDeletion.mockReturnValue({
        ...defaultAccountDeletion,
        showDeleteAccountDialog: true,
        isDeletingAccount: true,
        confirmationPhrase: 'delete my account',
      });

      render(<ProfileTab />);
      
      expect(screen.getByText('Deleting...')).toBeInTheDocument();
    });

    it('disables delete button when deleting account', () => {
      mockUseAccountDeletion.mockReturnValue({
        ...defaultAccountDeletion,
        showDeleteAccountDialog: true,
        isDeletingAccount: true,
        confirmationPhrase: 'delete my account',
      });

      render(<ProfileTab />);
      
      const deleteButton = screen.getByText('Deleting...');
      expect(deleteButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      render(<ProfileTab />);
      
      expect(screen.getByLabelText('Display Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Age')).toBeInTheDocument();
      expect(screen.getByLabelText('Biological Sex')).toBeInTheDocument();
    });

    it('has proper button accessibility', () => {
      render(<ProfileTab />);
      
      const updateButtons = screen.getAllByRole('button', { name: /Update/ });
      expect(updateButtons.length).toBeGreaterThan(0);
      
      const deleteButton = screen.getByRole('button', { name: 'Delete Account' });
      expect(deleteButton).toBeInTheDocument();
    });
  });

  describe('Hook Integration', () => {
    it('passes initial values to useProfileForm hook', () => {
      render(<ProfileTab initialName="Jane" initialAge={25} initialSex="female" />);
      
      expect(mockUseProfileForm).toHaveBeenCalledWith({
        name: 'Jane',
        age: 25,
        sex: 'female',
      });
    });

    it('passes initial profile image to useImageUpload hook', () => {
      render(<ProfileTab initialProfileImage="https://example.com/photo.jpg" />);
      
      expect(mockUseImageUpload).toHaveBeenCalledWith('https://example.com/photo.jpg');
    });

    it('calls useAccountDeletion hook', () => {
      render(<ProfileTab />);
      
      expect(mockUseAccountDeletion).toHaveBeenCalled();
    });
  });
});