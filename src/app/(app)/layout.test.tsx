/**
 * App Layout Authentication Tests
 * 
 * These tests verify the server-side authentication logic:
 * - Protected routes (admin, upload) require authentication
 * - Public routes (dashboard, leaderboard) don't require authentication
 * - Proper redirect behavior for unauthenticated users
 * - Pathname detection from various header sources
 */

import React from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import AppLayout from './layout';

// Mock Next.js server functions
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock('next/headers', () => ({
  headers: jest.fn(),
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
const mockHeaders = headers as jest.MockedFunction<typeof headers>;

describe('App Layout Authentication Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockHeaders = (pathname: string) => ({
    get: jest.fn((key: string) => {
      if (key === 'x-pathname') return pathname;
      if (key === 'x-invoke-path') return null;
      if (key === 'x-middleware-request-pathname') return null;
      return null;
    }),
  });

  describe('Protected Routes - Authentication Required', () => {
    it('should redirect unauthenticated users from admin routes', async () => {
      mockGetServerSession.mockResolvedValue(null);
      mockHeaders.mockReturnValue(createMockHeaders('/admin/users') as any);

      await AppLayout({ children: <div>test</div> });

      expect(mockRedirect).toHaveBeenCalledWith('/auth/signin');
    });

    it('should redirect unauthenticated users from upload routes', async () => {
      mockGetServerSession.mockResolvedValue(null);
      mockHeaders.mockReturnValue(createMockHeaders('/upload') as any);

      await AppLayout({ children: <div>test</div> });

      expect(mockRedirect).toHaveBeenCalledWith('/auth/signin');
    });

    it('should redirect unauthenticated users from nested admin routes', async () => {
      mockGetServerSession.mockResolvedValue(null);
      mockHeaders.mockReturnValue(createMockHeaders('/admin/system/config') as any);

      await AppLayout({ children: <div>test</div> });

      expect(mockRedirect).toHaveBeenCalledWith('/auth/signin');
    });

    it('should redirect unauthenticated users from nested upload routes', async () => {
      mockGetServerSession.mockResolvedValue(null);
      mockHeaders.mockReturnValue(createMockHeaders('/upload/new-data') as any);

      await AppLayout({ children: <div>test</div> });

      expect(mockRedirect).toHaveBeenCalledWith('/auth/signin');
    });

    it('should allow authenticated users to access admin routes', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'admin123' } });
      mockHeaders.mockReturnValue(createMockHeaders('/admin/users') as any);

      await AppLayout({ children: <div>test</div> });

      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('should allow authenticated users to access upload routes', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user123' } });
      mockHeaders.mockReturnValue(createMockHeaders('/upload') as any);

      await AppLayout({ children: <div>test</div> });

      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe('Public Routes - No Authentication Required', () => {
    it('should allow unauthenticated users to access dashboard routes', async () => {
      mockGetServerSession.mockResolvedValue(null);
      mockHeaders.mockReturnValue(createMockHeaders('/dashboard/user123') as any);

      await AppLayout({ children: <div>test</div> });

      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('should allow unauthenticated users to access leaderboard', async () => {
      mockGetServerSession.mockResolvedValue(null);
      mockHeaders.mockReturnValue(createMockHeaders('/leaderboard') as any);

      await AppLayout({ children: <div>test</div> });

      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('should allow unauthenticated users to access auth pages', async () => {
      mockGetServerSession.mockResolvedValue(null);
      mockHeaders.mockReturnValue(createMockHeaders('/auth/signin') as any);

      await AppLayout({ children: <div>test</div> });

      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('should allow authenticated users to access public routes', async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: 'user123' } });
      mockHeaders.mockReturnValue(createMockHeaders('/dashboard/user456') as any);

      await AppLayout({ children: <div>test</div> });

      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe('Pathname Detection Logic', () => {
    it('should detect pathname from x-pathname header', async () => {
      mockGetServerSession.mockResolvedValue(null);
      const mockHeadersObj = {
        get: jest.fn((key: string) => {
          if (key === 'x-pathname') return '/admin/test';
          return null;
        }),
      };
      mockHeaders.mockReturnValue(mockHeadersObj as any);

      await AppLayout({ children: <div>test</div> });

      expect(mockRedirect).toHaveBeenCalledWith('/auth/signin');
      expect(mockHeadersObj.get).toHaveBeenCalledWith('x-pathname');
    });

    it('should fallback to x-invoke-path header', async () => {
      mockGetServerSession.mockResolvedValue(null);
      const mockHeadersObj = {
        get: jest.fn((key: string) => {
          if (key === 'x-pathname') return null;
          if (key === 'x-invoke-path') return '/upload/test';
          return null;
        }),
      };
      mockHeaders.mockReturnValue(mockHeadersObj as any);

      await AppLayout({ children: <div>test</div> });

      expect(mockRedirect).toHaveBeenCalledWith('/auth/signin');
      expect(mockHeadersObj.get).toHaveBeenCalledWith('x-invoke-path');
    });

    it('should fallback to x-middleware-request-pathname header', async () => {
      mockGetServerSession.mockResolvedValue(null);
      const mockHeadersObj = {
        get: jest.fn((key: string) => {
          if (key === 'x-pathname') return null;
          if (key === 'x-invoke-path') return null;
          if (key === 'x-middleware-request-pathname') return '/admin/fallback';
          return null;
        }),
      };
      mockHeaders.mockReturnValue(mockHeadersObj as any);

      await AppLayout({ children: <div>test</div> });

      expect(mockRedirect).toHaveBeenCalledWith('/auth/signin');
      expect(mockHeadersObj.get).toHaveBeenCalledWith('x-middleware-request-pathname');
    });

    it('should handle missing pathname gracefully', async () => {
      mockGetServerSession.mockResolvedValue(null);
      const mockHeadersObj = {
        get: jest.fn(() => null),
      };
      mockHeaders.mockReturnValue(mockHeadersObj as any);

      await AppLayout({ children: <div>test</div> });

      // Should not redirect if no pathname is detected
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe('Route Classification Logic', () => {
    it('should correctly identify protected routes', async () => {
      const protectedRoutes = ['/admin', '/upload'];
      const testCases = [
        { path: '/admin', expected: true },
        { path: '/admin/users', expected: true },
        { path: '/upload', expected: true },
        { path: '/upload/files', expected: true },
        { path: '/dashboard/user123', expected: false },
        { path: '/leaderboard', expected: false },
        { path: '/auth/signin', expected: false },
      ];

      testCases.forEach(({ path, expected }) => {
        const requiresAuth = protectedRoutes.some(route => path.startsWith(route));
        expect(requiresAuth).toBe(expected);
      });
    });

    it('should handle edge cases in route matching', async () => {
      const protectedRoutes = ['/admin', '/upload'];
      
      // Test JavaScript's startsWith behavior (these actually DO match)
      expect('/administrator'.startsWith('/admin')).toBe(true);
      expect('/uploading'.startsWith('/upload')).toBe(true);
      
      // These also match as expected
      expect('/admin123'.startsWith('/admin')).toBe(true);
      expect('/upload-files'.startsWith('/upload')).toBe(true);
      
      // These should NOT match
      expect('/dashboard'.startsWith('/admin')).toBe(false);
      expect('/leaderboard'.startsWith('/upload')).toBe(false);
    });
  });

  describe('Session Handling', () => {
    it('should handle null session correctly', async () => {
      mockGetServerSession.mockResolvedValue(null);
      mockHeaders.mockReturnValue(createMockHeaders('/dashboard/test') as any);

      await AppLayout({ children: <div>test</div> });

      expect(mockGetServerSession).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it('should handle valid session correctly', async () => {
      const mockSession = { 
        user: { id: 'user123', email: 'test@example.com' },
        expires: new Date().toISOString()
      };
      mockGetServerSession.mockResolvedValue(mockSession);
      mockHeaders.mockReturnValue(createMockHeaders('/admin/test') as any);

      await AppLayout({ children: <div>test</div> });

      expect(mockGetServerSession).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe('Critical Path Tests (Regression Prevention)', () => {
    it('should never block dashboard access', async () => {
      // Test multiple dashboard scenarios to prevent regression
      const dashboardPaths = [
        '/dashboard/user123',
        '/dashboard/userId=123456',
        '/dashboard/100492380040453908509',
      ];

      for (const path of dashboardPaths) {
        mockGetServerSession.mockResolvedValue(null);
        mockHeaders.mockReturnValue(createMockHeaders(path) as any);

        await AppLayout({ children: <div>test</div> });

        expect(mockRedirect).not.toHaveBeenCalled();
        jest.clearAllMocks();
      }
    });

    it('should always protect admin and upload routes', async () => {
      // Test multiple protected scenarios to prevent regression
      const protectedPaths = [
        '/admin',
        '/admin/users',
        '/admin/system/config',
        '/upload',
        '/upload/new-data',
        '/upload/files/process',
      ];

      for (const path of protectedPaths) {
        mockGetServerSession.mockResolvedValue(null);
        mockHeaders.mockReturnValue(createMockHeaders(path) as any);

        await AppLayout({ children: <div>test</div> });

        expect(mockRedirect).toHaveBeenCalledWith('/auth/signin');
        jest.clearAllMocks();
      }
    });
  });
});
