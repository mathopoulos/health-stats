import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import type { UserData, AdminStats } from '../../types';
import { UsersList } from '../UserManagement/UsersList';

const mockStats: AdminStats = {
  totalUsers: 2,
  publishedDashboards: 1,
  totalBloodMarkers: 7,
  totalDataPoints: 13,
};

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

describe('UsersList', () => {
  const mockOnDeleteClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render stats and users table when not loading', () => {
    render(
      <UsersList
        users={mockUsers}
        stats={mockStats}
        loading={false}
        onDeleteClick={mockOnDeleteClick}
        deletingUserId={null}
      />
    );

    // Should render stats
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();

    // Should render users table
    expect(screen.getByText('All Users (2)')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should show loading state when loading is true', () => {
    render(
      <UsersList
        users={[]}
        stats={mockStats}
        loading={true}
        onDeleteClick={mockOnDeleteClick}
        deletingUserId={null}
      />
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Overview')).not.toBeInTheDocument();
  });

  it('should pass delete handler to users table', () => {
    render(
      <UsersList
        users={mockUsers}
        stats={mockStats}
        loading={false}
        onDeleteClick={mockOnDeleteClick}
        deletingUserId={null}
      />
    );

    // The delete buttons should be present (from UsersTable -> UserRow)
    const deleteButtons = screen.getAllByText('Delete');
    expect(deleteButtons).toHaveLength(2);
  });

  it('should pass deletingUserId to users table', () => {
    render(
      <UsersList
        users={mockUsers}
        stats={mockStats}
        loading={false}
        onDeleteClick={mockOnDeleteClick}
        deletingUserId="user1"
      />
    );

    // One button should show "Deleting..." for user1
    expect(screen.getByText('Deleting...')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });
});
