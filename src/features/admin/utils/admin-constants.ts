export const ADMIN_EMAIL = 'alexandros@mathopoulos.com';

export const DELETE_CONFIRMATION_PREFIX = 'DELETE ';

export const API_ENDPOINTS = {
  ADMIN_USERS: '/api/admin/users',
  DELETE_USER: '/api/admin/delete-user',
} as const;

export const ADMIN_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  LOADING: 'Loading...',
  FETCH_USERS_ERROR: 'Failed to fetch users',
  DELETE_USER_ERROR: 'Failed to delete user',
  DELETE_USER_SUCCESS: 'User deleted successfully',
  CONFIRMATION_TEXT_ERROR: 'Please type the confirmation text exactly as shown',
  NO_USERS_FOUND: 'No users found',
} as const;

export const ADMIN_PAGE_METADATA = {
  title: 'Admin Dashboard - Health Stats',
  description: 'Administrative dashboard for managing users and system data.',
  robots: 'noindex, nofollow',
} as const;
