import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import type { UserData } from '../../types';
import { UserRow } from '../UserManagement/UserRow';

const mockUser: UserData = {
  userId: 'test-user-123',
  name: 'John Doe',
  email: 'john@example.com',
  dashboardPublished: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  profileImage: 'https://example.com/profile.jpg',
  dataCounts: {
    bloodMarkers: 5,
    healthProtocols: 3,
    processingJobs: 2,
    total: 10,
  },
};

const mockUserWithoutName: UserData = {
  ...mockUser,
  name: '',
  profileImage: undefined,
};

describe('UserRow', () => {
  const mockOnDeleteClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render user information correctly', () => {
    render(
      <table>
        <tbody>
          <UserRow
            user={mockUser}
            onDeleteClick={mockOnDeleteClick}
            deletingUserId={null}
          />
        </tbody>
      </table>
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('test-user-123')).toBeInTheDocument();
    expect(screen.getByText('Published')).toBeInTheDocument();
  });

  it('should display "Unnamed User" when name is empty', () => {
    render(
      <table>
        <tbody>
          <UserRow
            user={mockUserWithoutName}
            onDeleteClick={mockOnDeleteClick}
            deletingUserId={null}
          />
        </tbody>
      </table>
    );

    expect(screen.getByText('Unnamed User')).toBeInTheDocument();
  });

  it('should show profile image when available', () => {
    render(
      <table>
        <tbody>
          <UserRow
            user={mockUser}
            onDeleteClick={mockOnDeleteClick}
            deletingUserId={null}
          />
        </tbody>
      </table>
    );

    const profileImage = screen.getByAltText('');
    expect(profileImage).toHaveAttribute('src', 'https://example.com/profile.jpg');
  });

  it('should show user initial when no profile image', () => {
    render(
      <table>
        <tbody>
          <UserRow
            user={mockUserWithoutName}
            onDeleteClick={mockOnDeleteClick}
            deletingUserId={null}
          />
        </tbody>
      </table>
    );

    expect(screen.getByText('J')).toBeInTheDocument(); // First letter of email
  });

  it('should display data counts correctly', () => {
    render(
      <table>
        <tbody>
          <UserRow
            user={mockUser}
            onDeleteClick={mockOnDeleteClick}
            deletingUserId={null}
          />
        </tbody>
      </table>
    );

    expect(screen.getByText('Blood: 5')).toBeInTheDocument();
    expect(screen.getByText('Protocols: 3')).toBeInTheDocument();
    expect(screen.getByText('Jobs: 2')).toBeInTheDocument();
    expect(screen.getByText('Total: 10')).toBeInTheDocument();
  });

  it('should call onDeleteClick when delete button is clicked', () => {
    render(
      <table>
        <tbody>
          <UserRow
            user={mockUser}
            onDeleteClick={mockOnDeleteClick}
            deletingUserId={null}
          />
        </tbody>
      </table>
    );

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    expect(mockOnDeleteClick).toHaveBeenCalledWith(mockUser);
  });

  it('should show "Deleting..." and disable button when user is being deleted', () => {
    render(
      <table>
        <tbody>
          <UserRow
            user={mockUser}
            onDeleteClick={mockOnDeleteClick}
            deletingUserId="test-user-123"
          />
        </tbody>
      </table>
    );

    const deleteButton = screen.getByText('Deleting...');
    expect(deleteButton).toBeDisabled();
  });

  it('should show "Private" status for unpublished dashboards', () => {
    const unpublishedUser = {
      ...mockUser,
      dashboardPublished: false,
    };

    render(
      <table>
        <tbody>
          <UserRow
            user={unpublishedUser}
            onDeleteClick={mockOnDeleteClick}
            deletingUserId={null}
          />
        </tbody>
      </table>
    );

    expect(screen.getByText('Private')).toBeInTheDocument();
  });
});
