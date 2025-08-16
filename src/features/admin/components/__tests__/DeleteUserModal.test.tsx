import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import type { DeleteConfirmation, UserData } from '../../types';
import { DeleteUserModal } from '../UserManagement/DeleteUserModal';

const mockUser: UserData = {
  userId: 'test-user-123',
  name: 'John Doe',
  email: 'john@example.com',
  dashboardPublished: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  dataCounts: {
    bloodMarkers: 5,
    healthProtocols: 3,
    processingJobs: 2,
    total: 10,
  },
};

const mockDeleteConfirmation: DeleteConfirmation = {
  user: mockUser,
  isOpen: true,
  confirmationText: '',
};

describe('DeleteUserModal', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();
  const mockOnConfirmationTextChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(
      <DeleteUserModal
        deleteConfirmation={{ ...mockDeleteConfirmation, isOpen: false }}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        onConfirmationTextChange={mockOnConfirmationTextChange}
        isDeleting={false}
      />
    );

    expect(screen.queryByText('Delete User Account')).not.toBeInTheDocument();
  });

  it('should not render when user is null', () => {
    render(
      <DeleteUserModal
        deleteConfirmation={{ ...mockDeleteConfirmation, user: null }}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        onConfirmationTextChange={mockOnConfirmationTextChange}
        isDeleting={false}
      />
    );

    expect(screen.queryByText('Delete User Account')).not.toBeInTheDocument();
  });

  it('should render modal content when open', () => {
    render(
      <DeleteUserModal
        deleteConfirmation={mockDeleteConfirmation}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        onConfirmationTextChange={mockOnConfirmationTextChange}
        isDeleting={false}
      />
    );

    expect(screen.getByText('Delete User Account')).toBeInTheDocument();
    expect(screen.getByText(/This will permanently delete the account for/)).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should display user data counts', () => {
    render(
      <DeleteUserModal
        deleteConfirmation={mockDeleteConfirmation}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        onConfirmationTextChange={mockOnConfirmationTextChange}
        isDeleting={false}
      />
    );

    expect(screen.getByText('• 5 blood markers')).toBeInTheDocument();
    expect(screen.getByText('• 3 health protocols')).toBeInTheDocument();
    expect(screen.getByText('• 2 processing jobs')).toBeInTheDocument();
  });

  it('should show correct confirmation text requirement', () => {
    render(
      <DeleteUserModal
        deleteConfirmation={mockDeleteConfirmation}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        onConfirmationTextChange={mockOnConfirmationTextChange}
        isDeleting={false}
      />
    );

    expect(screen.getByText('DELETE John Doe')).toBeInTheDocument();
  });

  it('should call onConfirmationTextChange when input changes', () => {
    render(
      <DeleteUserModal
        deleteConfirmation={mockDeleteConfirmation}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        onConfirmationTextChange={mockOnConfirmationTextChange}
        isDeleting={false}
      />
    );

    const input = screen.getByPlaceholderText('DELETE John Doe');
    fireEvent.change(input, { target: { value: 'DELETE John' } });

    expect(mockOnConfirmationTextChange).toHaveBeenCalledWith('DELETE John');
  });

  it('should call onCancel when cancel button clicked', () => {
    render(
      <DeleteUserModal
        deleteConfirmation={mockDeleteConfirmation}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        onConfirmationTextChange={mockOnConfirmationTextChange}
        isDeleting={false}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should call onConfirm when delete button clicked with correct text', () => {
    const confirmationWithText = {
      ...mockDeleteConfirmation,
      confirmationText: 'DELETE John Doe',
    };

    render(
      <DeleteUserModal
        deleteConfirmation={confirmationWithText}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        onConfirmationTextChange={mockOnConfirmationTextChange}
        isDeleting={false}
      />
    );

    const deleteButton = screen.getByText('Delete User');
    fireEvent.click(deleteButton);

    expect(mockOnConfirm).toHaveBeenCalled();
  });

  it('should disable delete button with incorrect confirmation text', () => {
    const confirmationWithWrongText = {
      ...mockDeleteConfirmation,
      confirmationText: 'DELETE Wrong',
    };

    render(
      <DeleteUserModal
        deleteConfirmation={confirmationWithWrongText}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        onConfirmationTextChange={mockOnConfirmationTextChange}
        isDeleting={false}
      />
    );

    const deleteButton = screen.getByText('Delete User');
    expect(deleteButton).toBeDisabled();
  });

  it('should show deleting state', () => {
    const confirmationWithText = {
      ...mockDeleteConfirmation,
      confirmationText: 'DELETE John Doe',
    };

    render(
      <DeleteUserModal
        deleteConfirmation={confirmationWithText}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        onConfirmationTextChange={mockOnConfirmationTextChange}
        isDeleting={true}
      />
    );

    expect(screen.getByText('Deleting...')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeDisabled();
  });

  it('should render modal with backdrop', () => {
    render(
      <DeleteUserModal
        deleteConfirmation={mockDeleteConfirmation}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        onConfirmationTextChange={mockOnConfirmationTextChange}
        isDeleting={false}
      />
    );

    // Modal should be visible with backdrop
    expect(screen.getByText('Delete User Account')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Delete User')).toBeInTheDocument();
  });
});
