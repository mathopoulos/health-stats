/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, POST } from './route';

// Mock environment variables
const mockEnv = {
  NEXTAUTH_URL: 'https://www.revly.health',
  NODE_ENV: 'test'
};

const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv, ...mockEnv };
});

afterAll(() => {
  process.env = originalEnv;
});

// Helper to create mock requests
function createMockRequest(url: string, headers: Record<string, string> = {}) {
  return new NextRequest(url, {
    headers: {
      'user-agent': 'test',
      ...headers
    }
  });
}

describe('Simple OAuth Proxy', () => {
  describe('GET /api/auth/proxy', () => {
    
    it('should handle successful OAuth callback from Vercel preview', async () => {
      const request = createMockRequest(
        'https://auth.revly.health/api/auth/proxy?code=oauth_code_123&state=nextauth_state_abc',
        {
          'referer': 'https://health-stats-preview-xyz.vercel.app/auth/signin'
        }
      );

      const response = await GET(request);
      
      expect(response.status).toBeGreaterThanOrEqual(302);
      expect(response.status).toBeLessThanOrEqual(308);
      
      const location = response.headers.get('location');
      expect(location).toContain('health-stats-preview-xyz.vercel.app');
      expect(location).toContain('/api/auth/callback/google');
      expect(location).toContain('code=oauth_code_123');
      expect(location).toContain('state=nextauth_state_abc');
    });

    it('should fallback to production when no referer', async () => {
      const request = createMockRequest(
        'https://auth.revly.health/api/auth/proxy?code=oauth_code_123&state=nextauth_state_abc'
      );

      const response = await GET(request);
      
      const location = response.headers.get('location');
      expect(location).toContain('www.revly.health');
      expect(location).toContain('/api/auth/callback/google');
      expect(location).toContain('code=oauth_code_123');
      expect(location).toContain('state=nextauth_state_abc');
    });

    it('should handle localhost development environment', async () => {
      const request = createMockRequest(
        'https://auth.revly.health/api/auth/proxy?code=oauth_code_123&state=nextauth_state_abc',
        {
          'referer': 'http://localhost:3000/auth/signin'
        }
      );

      const response = await GET(request);
      
      const location = response.headers.get('location');
      expect(location).toContain('localhost:3000');
      expect(location).toContain('/api/auth/callback/google');
    });

    it('should handle OAuth errors', async () => {
      const request = createMockRequest(
        'https://auth.revly.health/api/auth/proxy?error=access_denied&state=nextauth_state',
        {
          'referer': 'https://preview.vercel.app/auth/signin'
        }
      );

      const response = await GET(request);
      
      const location = response.headers.get('location');
      expect(location).toContain('preview.vercel.app');
      expect(location).toContain('/auth/error');
      expect(location).toContain('error=access_denied');
    });

    it('should handle missing code parameter', async () => {
      const request = createMockRequest(
        'https://auth.revly.health/api/auth/proxy?state=nextauth_state'
      );

      const response = await GET(request);
      
      const location = response.headers.get('location');
      expect(location).toContain('/auth/error');
      expect(location).toContain('error=missing_parameters');
    });

    it('should handle missing state parameter (state is optional for proxy)', async () => {
      const request = createMockRequest(
        'https://auth.revly.health/api/auth/proxy?code=oauth_code_123'
      );

      const response = await GET(request);
      
      // State is optional when using proxy, so this should redirect to callback
      const location = response.headers.get('location');
      expect(location).toContain('www.revly.health');
      expect(location).toContain('/api/auth/callback/google');
      expect(location).toContain('code=oauth_code_123');
    });

    it('should reject untrusted domains', async () => {
      const request = createMockRequest(
        'https://auth.revly.health/api/auth/proxy?code=oauth_code_123&state=nextauth_state',
        {
          'referer': 'https://evil.com/auth/signin'
        }
      );

      const response = await GET(request);
      
      const location = response.headers.get('location');
      expect(location).toContain('www.revly.health'); // Should fallback to production
      expect(location).not.toContain('evil.com');
    });

    it('should preserve additional OAuth parameters', async () => {
      const request = createMockRequest(
        'https://auth.revly.health/api/auth/proxy?code=oauth_code&state=nextauth_state&scope=email%20profile&authuser=0'
      );

      const response = await GET(request);
      
      const location = response.headers.get('location');
      expect(location).toContain('code=oauth_code');
      expect(location).toContain('state=nextauth_state');
      expect(location).toContain('scope=email+profile'); // URL encoded
      expect(location).toContain('authuser=0');
    });

    it('should handle malformed referer gracefully', async () => {
      const request = createMockRequest(
        'https://auth.revly.health/api/auth/proxy?code=oauth_code&state=nextauth_state',
        {
          'referer': 'not-a-valid-url'
        }
      );

      const response = await GET(request);
      
      const location = response.headers.get('location');
      expect(location).toContain('www.revly.health'); // Should fallback
    });

  });

  describe('POST /api/auth/proxy', () => {
    
    it('should return health check', async () => {
      const response = await POST();
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('healthy');
      expect(data.version).toBe('1.0.0');
      expect(data.timestamp).toBeDefined();
    });

  });
});