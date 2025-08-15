/**
 * Middleware Authentication Tests
 * 
 * These tests verify the critical authentication logic we implemented:
 * - Dashboard routes are publicly accessible
 * - Admin and upload routes require authentication
 * - API route protection works correctly
 * - Old URL format redirects work
 */

import { getToken } from 'next-auth/jwt';
import { middleware } from './middleware';

// Mock next-auth/jwt
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

// Mock Next.js server components with minimal implementation  
const mockHeadersSet = jest.fn();
const mockHeadersGet = jest.fn();

jest.mock('next/server', () => {
  return {
    NextResponse: {
      next: () => ({
        status: 200,
        headers: {
          get: mockHeadersGet,
          set: mockHeadersSet,
        }
      }),
      redirect: (url: URL) => ({
        status: 307,
        headers: {
          get: (key: string) => key === 'location' ? url.toString() : null,
          set: jest.fn(),
        }
      }),
      json: (data: any, init?: any) => ({
        status: init?.status || 200,
        headers: {
          get: jest.fn(),
          set: jest.fn(),
        },
        json: () => Promise.resolve(data),
      }),
    }
  };
});

const mockedGetToken = getToken as jest.MockedFunction<typeof getToken>;

describe('Middleware Authentication Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHeadersSet.mockClear();
    mockHeadersGet.mockClear();
  });

  // Helper to create a minimal request object with just what middleware needs
  const createMockRequest = (pathname: string, baseUrl = 'http://localhost:3000') => {
    const fullUrl = `${baseUrl}${pathname}`;
    return {
      url: fullUrl,
      nextUrl: {
        pathname,
        search: '',
      },
      headers: {
        get: jest.fn(),
      }
    } as any;
  };

  describe('Dashboard Routes - Public Access', () => {
    it('should allow unauthenticated users to access dashboard', async () => {
      mockedGetToken.mockResolvedValue(null);
      const request = createMockRequest('/dashboard/user123');

      const response = await middleware(request);

      expect(response.status).toBe(200);
      // Verifies dashboard is accessible without auth
    });

    it('should allow authenticated users to access dashboard', async () => {
      mockedGetToken.mockResolvedValue({ sub: 'user123' });
      const request = createMockRequest('/dashboard/user456');

      const response = await middleware(request);

      expect(response.status).toBe(200);
      // Verifies dashboard is accessible with auth
    });

    it('should redirect old dashboard URL format', async () => {
      mockedGetToken.mockResolvedValue(null);
      const request = createMockRequest('/dashboard/userId=123456');

      const response = await middleware(request);

      expect(response.status).toBe(307);
      // Verifies old URL format triggers redirect
    });

    it('should handle complex user IDs in old format', async () => {
      mockedGetToken.mockResolvedValue(null);
      const request = createMockRequest('/dashboard/userId=100492380040453908509');

      const response = await middleware(request);

      expect(response.status).toBe(307);
      // Verifies complex user IDs are handled in redirects
    });
  });

  describe('Protected Routes - Upload and Admin', () => {
    it('should redirect unauthenticated users from upload to signin', async () => {
      mockedGetToken.mockResolvedValue(null);
      const request = createMockRequest('/upload');

      const response = await middleware(request);

      expect(response.status).toBe(307);
      // Verifies upload requires authentication
    });

    it('should allow authenticated users to access upload', async () => {
      mockedGetToken.mockResolvedValue({ sub: 'user123' });
      const request = createMockRequest('/upload');

      const response = await middleware(request);

      expect(response.status).toBe(200);
    });

    it('should redirect unauthenticated users from admin to signin', async () => {
      mockedGetToken.mockResolvedValue(null);
      const request = createMockRequest('/admin/users');

      const response = await middleware(request);

      expect(response.status).toBe(307);
      // Verifies upload requires authentication
    });

    it('should allow authenticated users to access admin', async () => {
      mockedGetToken.mockResolvedValue({ sub: 'admin123' });
      const request = createMockRequest('/admin/users');

      const response = await middleware(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Auth Pages Redirect Logic', () => {
    it('should redirect authenticated users from signin to upload', async () => {
      mockedGetToken.mockResolvedValue({ sub: 'user123' });
      const request = createMockRequest('/auth/signin');

      const response = await middleware(request);

      expect(response.status).toBe(307);
      // Verifies authenticated users redirect from signin to upload
    });

    it('should allow unauthenticated users to access signin', async () => {
      mockedGetToken.mockResolvedValue(null);
      const request = createMockRequest('/auth/signin');

      const response = await middleware(request);

      expect(response.status).toBe(200);
    });

    it('should allow anyone to access invite page', async () => {
      mockedGetToken.mockResolvedValue({ sub: 'user123' });
      const request = createMockRequest('/auth/invite');

      const response = await middleware(request);

      expect(response.status).toBe(200);
    });
  });

  describe('API Routes Protection', () => {
    it('should allow public access to health-data API', async () => {
      mockedGetToken.mockResolvedValue(null);
      const request = createMockRequest('/api/health-data/123');

      const response = await middleware(request);

      expect(response.status).toBe(200);
    });

    it('should allow public access to leaderboard API', async () => {
      mockedGetToken.mockResolvedValue(null);
      const request = createMockRequest('/api/leaderboard/hrv');

      const response = await middleware(request);

      expect(response.status).toBe(200);
    });

    it('should allow public access to users API', async () => {
      mockedGetToken.mockResolvedValue(null);
      const request = createMockRequest('/api/users/123');

      const response = await middleware(request);

      expect(response.status).toBe(200);
    });

    it('should block unauthenticated access to protected API', async () => {
      mockedGetToken.mockResolvedValue(null);
      const request = createMockRequest('/api/upload-url');

      const response = await middleware(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('should allow authenticated access to protected API', async () => {
      mockedGetToken.mockResolvedValue({ sub: 'user123' });
      const request = createMockRequest('/api/upload-url');

      const response = await middleware(request);

      expect(response.status).toBe(200);
    });

    it('should always allow auth API routes', async () => {
      mockedGetToken.mockResolvedValue(null);
      const request = createMockRequest('/api/auth/signin');

      const response = await middleware(request);

      expect(response.status).toBe(200);
    });

    it('should allow iOS auth routes without general auth', async () => {
      mockedGetToken.mockResolvedValue(null);
      const request = createMockRequest('/api/auth/ios/google-signin');

      const response = await middleware(request);

      expect(response.status).toBe(200);
    });

    it('should allow iOS health data routes without general auth', async () => {
      mockedGetToken.mockResolvedValue(null);
      const request = createMockRequest('/api/health-data/ios');

      const response = await middleware(request);

      expect(response.status).toBe(200);
    });

    it('should treat unknown API routes as protected by default', async () => {
      mockedGetToken.mockResolvedValue(null);
      const request = createMockRequest('/api/unknown-endpoint');

      const response = await middleware(request);

      expect(response.status).toBe(401);
    });
  });

  describe('Error Handling', () => {
    it('should handle getToken returning null (unauthenticated)', async () => {
      mockedGetToken.mockResolvedValue(null);
      const request = createMockRequest('/upload');

      const response = await middleware(request);

      expect(response.status).toBe(307);
      // Verifies upload requires authentication
    });

    it('should handle edge case URLs gracefully', async () => {
      mockedGetToken.mockResolvedValue(null);
      const request = createMockRequest('/dashboard/random-path');

      const response = await middleware(request);

      expect(response.status).toBe(200);
      // Verifies middleware handles various dashboard paths
    });
  });

  describe('Public Routes', () => {
    it('should allow access to leaderboard without auth', async () => {
      mockedGetToken.mockResolvedValue(null);
      const request = createMockRequest('/leaderboard');

      const response = await middleware(request);

      expect(response.status).toBe(200);
    });

    it('should set pathname header for non-dashboard routes', async () => {
      mockedGetToken.mockResolvedValue(null);
      const request = createMockRequest('/leaderboard');

      const response = await middleware(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('x-pathname')).toBe('/leaderboard');
    });
  });
});
