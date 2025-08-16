import { describe, it, expect } from '@jest/globals';
import {
  ADMIN_EMAIL,
  DELETE_CONFIRMATION_PREFIX,
  API_ENDPOINTS,
  ADMIN_MESSAGES,
  ADMIN_PAGE_METADATA,
} from '../admin-constants';

describe('admin-constants', () => {
  describe('ADMIN_EMAIL', () => {
    it('should be the correct admin email', () => {
      expect(ADMIN_EMAIL).toBe('alexandros@mathopoulos.com');
    });
  });

  describe('DELETE_CONFIRMATION_PREFIX', () => {
    it('should have correct prefix for delete confirmation', () => {
      expect(DELETE_CONFIRMATION_PREFIX).toBe('DELETE ');
    });
  });

  describe('API_ENDPOINTS', () => {
    it('should contain all required API endpoints', () => {
      expect(API_ENDPOINTS.ADMIN_USERS).toBe('/api/admin/users');
      expect(API_ENDPOINTS.DELETE_USER).toBe('/api/admin/delete-user');
    });

    it('should be defined as const object', () => {
      expect(typeof API_ENDPOINTS).toBe('object');
      expect(API_ENDPOINTS).toBeDefined();
    });
  });

  describe('ADMIN_MESSAGES', () => {
    it('should contain all required admin messages', () => {
      expect(ADMIN_MESSAGES.UNAUTHORIZED).toBe('Unauthorized access');
      expect(ADMIN_MESSAGES.LOADING).toBe('Loading...');
      expect(ADMIN_MESSAGES.FETCH_USERS_ERROR).toBe('Failed to fetch users');
      expect(ADMIN_MESSAGES.DELETE_USER_ERROR).toBe('Failed to delete user');
      expect(ADMIN_MESSAGES.DELETE_USER_SUCCESS).toBe('User deleted successfully');
      expect(ADMIN_MESSAGES.CONFIRMATION_TEXT_ERROR).toBe('Please type the confirmation text exactly as shown');
      expect(ADMIN_MESSAGES.NO_USERS_FOUND).toBe('No users found');
    });

    it('should be defined as const object', () => {
      expect(typeof ADMIN_MESSAGES).toBe('object');
      expect(ADMIN_MESSAGES).toBeDefined();
    });
  });

  describe('ADMIN_PAGE_METADATA', () => {
    it('should contain correct page metadata', () => {
      expect(ADMIN_PAGE_METADATA.title).toBe('Admin Dashboard - Health Stats');
      expect(ADMIN_PAGE_METADATA.description).toBe('Administrative dashboard for managing users and system data.');
      expect(ADMIN_PAGE_METADATA.robots).toBe('noindex, nofollow');
    });

    it('should be defined as const object', () => {
      expect(typeof ADMIN_PAGE_METADATA).toBe('object');
      expect(ADMIN_PAGE_METADATA).toBeDefined();
    });
  });
});
