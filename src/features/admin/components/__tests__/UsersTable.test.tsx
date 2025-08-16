import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import type { UserData } from '../../types';
import { UsersTable } from '../UserManagement/UsersTable';

const mockUsers: UserData[] = [
  {
    userId: 'user1',
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
  },
  {
    userId: 'user2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    dashboardPublished: false,
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z',
    dataCounts: {
      bloodMarkers: 2,
      healthProtocols: 1,
      processingJobs: 0,
      total: 3,
    },
  },
];

describe('UsersTable', () => {
  const mockOnDeleteClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render table headers correctly', () => {
    render(
      <UsersTable
        users={mockUsers}
        onDeleteClick={mockOnDeleteClick}
        deletingUserId={null}
      />
    );

    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Data Counts')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('should display correct user count in header', () => {
    render(
      <UsersTable
        users={mockUsers}
        onDeleteClick={mockOnDeleteClick}
        deletingUserId={null}
      />
    );

    expect(screen.getByText('All Users (2)')).toBeInTheDocument();
  });

  it('should render all users in table rows', () => {
    render(
      <UsersTable
        users={mockUsers}
        onDeleteClick={mockOnDeleteClick}
        deletingUserId={null}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('should show empty state when no users', () => {
    render(
      <UsersTable
        users={[]}
        onDeleteClick={mockOnDeleteClick}
        deletingUserId={null}
      />
    );

    expect(screen.getByText('All Users (0)')).toBeInTheDocument();
    expect(screen.getByText('No users found')).toBeInTheDocument();
  });

  it('should call onDeleteClick when delete button is clicked', () => {
    render(
      <UsersTable
        users={mockUsers}
        onDeleteClick={mockOnDeleteClick}
        deletingUserId={null}
      />
    );

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    expect(mockOnDeleteClick).toHaveBeenCalledWith(mockUsers[0]);
  });

  it('should pass deletingUserId to UserRow components', () => {
    render(
      <UsersTable
        users={mockUsers}
        onDeleteClick={mockOnDeleteClick}
        deletingUserId="user1"
      />
    );

    expect(screen.getByText('Deleting...')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });
});
