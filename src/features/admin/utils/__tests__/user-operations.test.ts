import { describe, it, expect } from '@jest/globals';
import type { UserData } from '../../types';
import {
  calculateAdminStats,
  generateDeleteConfirmationText,
  isValidDeleteConfirmation,
  getUserDisplayName,
  getUserInitial,
} from '../user-operations';

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
    name: '',
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

describe('user-operations', () => {
  describe('calculateAdminStats', () => {
    it('should calculate correct admin statistics', () => {
      const stats = calculateAdminStats(mockUsers);
      
      expect(stats).toEqual({
        totalUsers: 2,
        publishedDashboards: 1,
        totalBloodMarkers: 7,
        totalDataPoints: 13,
      });
    });

    it('should handle empty users array', () => {
      const stats = calculateAdminStats([]);
      
      expect(stats).toEqual({
        totalUsers: 0,
        publishedDashboards: 0,
        totalBloodMarkers: 0,
        totalDataPoints: 0,
      });
    });
  });

  describe('generateDeleteConfirmationText', () => {
    it('should generate confirmation text with user name', () => {
      const text = generateDeleteConfirmationText(mockUsers[0]);
      expect(text).toBe('DELETE John Doe');
    });

    it('should generate confirmation text with email when name is empty', () => {
      const text = generateDeleteConfirmationText(mockUsers[1]);
      expect(text).toBe('DELETE jane@example.com');
    });
  });

  describe('isValidDeleteConfirmation', () => {
    it('should return true for exact match', () => {
      const result = isValidDeleteConfirmation('DELETE John Doe', 'DELETE John Doe');
      expect(result).toBe(true);
    });

    it('should return false for partial match', () => {
      const result = isValidDeleteConfirmation('DELETE John', 'DELETE John Doe');
      expect(result).toBe(false);
    });

    it('should return false for case mismatch', () => {
      const result = isValidDeleteConfirmation('delete john doe', 'DELETE John Doe');
      expect(result).toBe(false);
    });
  });

  describe('getUserDisplayName', () => {
    it('should return name when available', () => {
      const displayName = getUserDisplayName(mockUsers[0]);
      expect(displayName).toBe('John Doe');
    });

    it('should return "Unnamed User" when name is empty', () => {
      const displayName = getUserDisplayName(mockUsers[1]);
      expect(displayName).toBe('Unnamed User');
    });
  });

  describe('getUserInitial', () => {
    it('should return first letter of name when available', () => {
      const initial = getUserInitial(mockUsers[0]);
      expect(initial).toBe('J');
    });

    it('should return first letter of email when name is empty', () => {
      const initial = getUserInitial(mockUsers[1]);
      expect(initial).toBe('J');
    });

    it('should return "?" when both name and email are empty', () => {
      const userWithoutNameOrEmail = {
        ...mockUsers[0],
        name: '',
        email: '',
      };
      const initial = getUserInitial(userWithoutNameOrEmail);
      expect(initial).toBe('?');
    });
  });
});
