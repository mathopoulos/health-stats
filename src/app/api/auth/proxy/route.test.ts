/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, POST } from './route';

// Mock environment variables
const mockEnv = {
  NEXTAUTH_SECRET: 'test-secret-key',
  NEXTAUTH_URL: 'https://www.revly.health',
  NODE_ENV: 'test'
};

// Save original env and set test env
const originalEnv = process.env;
beforeAll(() => {
  process.env = { ...originalEnv, ...mockEnv };
});

afterAll(() => {
  process.env = originalEnv;
});

// Helper to create a mock request
function createMockRequest(url: string) {
  return new NextRequest(url, {
    method: 'GET'
  });
}

describe('OAuth Proxy API Route', () => {
  describe('GET /api/auth/proxy', () => {
    it('should handle missing parameters', async () => {
      const request = createMockRequest(
        'https://auth.revly.health/api/auth/proxy'
      );

      const response = await GET(request);
      
      expect(response.status).toBeGreaterThanOrEqual(302);
      expect(response.status).toBeLessThanOrEqual(308);
      
      const location = response.headers.get('location');
      expect(location).toContain('/auth/error');
      expect(location).toContain('error=missing_parameters');
    });

    it('should handle OAuth errors gracefully', async () => {
      const error = 'access_denied';
      
      const request = createMockRequest(
        `https://auth.revly.health/api/auth/proxy?error=${error}`
      );

      const response = await GET(request);
      
      expect(response.status).toBeGreaterThanOrEqual(302);
      expect(response.status).toBeLessThanOrEqual(308);
      
      const location = response.headers.get('location');
      expect(location).toBeTruthy();
    });

    it('should handle malformed state gracefully', async () => {
      const invalidState = 'invalid_base64_state';
      const code = 'test_oauth_code';
      
      const request = createMockRequest(
        `https://auth.revly.health/api/auth/proxy?code=${code}&state=${invalidState}`
      );

      const response = await GET(request);
      
      expect(response.status).toBeGreaterThanOrEqual(302);
      expect(response.status).toBeLessThanOrEqual(308);
      
      const location = response.headers.get('location');
      expect(location).toBeTruthy();
    });

    it('should handle valid state with malformed JSON', async () => {
      const invalidJsonState = Buffer.from('invalid json content').toString('base64');
      const code = 'test_oauth_code';
      
      const request = createMockRequest(
        `https://auth.revly.health/api/auth/proxy?code=${code}&state=${invalidJsonState}`
      );

      const response = await GET(request);
      
      expect(response.status).toBeGreaterThanOrEqual(302);
      expect(response.status).toBeLessThanOrEqual(308);
      
      const location = response.headers.get('location');
      expect(location).toBeTruthy();
    });

    it('should handle expired state gracefully', async () => {
      const expiredTimestamp = Date.now() - (25 * 60 * 1000); // 25 minutes ago
      const stateData = {
        targetUrl: 'https://test.vercel.app/api/auth/callback/google',
        timestamp: expiredTimestamp,
        signature: 'test-signature'
      };
      const expiredState = Buffer.from(JSON.stringify(stateData)).toString('base64');
      const code = 'test_oauth_code';
      
      const request = createMockRequest(
        `https://auth.revly.health/api/auth/proxy?code=${code}&state=${expiredState}`
      );

      const response = await GET(request);
      
      expect(response.status).toBeGreaterThanOrEqual(302);
      expect(response.status).toBeLessThanOrEqual(308);
      
      const location = response.headers.get('location');
      expect(location).toBeTruthy();
    });

    it('should handle state with invalid signature', async () => {
      const stateData = {
        targetUrl: 'https://test.vercel.app/api/auth/callback/google',
        timestamp: Date.now(),
        signature: 'invalid-signature'
      };
      const invalidSigState = Buffer.from(JSON.stringify(stateData)).toString('base64');
      const code = 'test_oauth_code';
      
      const request = createMockRequest(
        `https://auth.revly.health/api/auth/proxy?code=${code}&state=${invalidSigState}`
      );

      const response = await GET(request);
      
      expect(response.status).toBeGreaterThanOrEqual(302);
      expect(response.status).toBeLessThanOrEqual(308);
      
      const location = response.headers.get('location');
      expect(location).toBeTruthy();
    });

    it('should handle missing code parameter', async () => {
      const state = 'some_state';
      
      const request = createMockRequest(
        `https://auth.revly.health/api/auth/proxy?state=${state}`
      );

      const response = await GET(request);
      
      expect(response.status).toBeGreaterThanOrEqual(302);
      expect(response.status).toBeLessThanOrEqual(308);
      
      const location = response.headers.get('location');
      expect(location).toContain('/auth/error');
      expect(location).toContain('error=missing_parameters');
    });

    it('should handle missing state parameter', async () => {
      const code = 'test_oauth_code';
      
      const request = createMockRequest(
        `https://auth.revly.health/api/auth/proxy?code=${code}`
      );

      const response = await GET(request);
      
      expect(response.status).toBeGreaterThanOrEqual(302);
      expect(response.status).toBeLessThanOrEqual(308);
      
      const location = response.headers.get('location');
      expect(location).toContain('/auth/error');
      expect(location).toContain('error=missing_parameters');
    });
  });

  describe('POST /api/auth/proxy', () => {
    it('should return health check response', async () => {
      const request = new NextRequest('https://auth.revly.health/api/auth/proxy', {
        method: 'POST'
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.status).toBe('healthy');
      expect(data.version).toBe('1.0.0');
      expect(data.timestamp).toBeDefined();
      
      // Timestamp should be a valid ISO string
      expect(() => new Date(data.timestamp)).not.toThrow();
      expect(new Date(data.timestamp).getTime()).toBeGreaterThan(0);
    });

    it('should return health check with correct format', async () => {
      const request = new NextRequest('https://auth.revly.health/api/auth/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');
      
      const data = await response.json();
      expect(Object.keys(data)).toEqual(expect.arrayContaining(['status', 'version', 'timestamp']));
      expect(typeof data.status).toBe('string');
      expect(typeof data.version).toBe('string');
      expect(typeof data.timestamp).toBe('string');
    });
  });

  describe('Error handling', () => {
    it('should handle various OAuth error types', async () => {
      const errorTypes = ['access_denied', 'invalid_request', 'unauthorized_client'];
      
      for (const errorType of errorTypes) {
        const request = createMockRequest(
          `https://auth.revly.health/api/auth/proxy?error=${errorType}`
        );

        const response = await GET(request);
        
        expect(response.status).toBeGreaterThanOrEqual(302);
        expect(response.status).toBeLessThanOrEqual(308);
        
        const location = response.headers.get('location');
        expect(location).toBeTruthy();
      }
    });

    it('should handle empty parameters', async () => {
      const request = createMockRequest(
        'https://auth.revly.health/api/auth/proxy?code=&state='
      );

      const response = await GET(request);
      
      expect(response.status).toBeGreaterThanOrEqual(302);
      expect(response.status).toBeLessThanOrEqual(308);
      
      const location = response.headers.get('location');
      expect(location).toContain('/auth/error');
      expect(location).toContain('error=missing_parameters');
    });

    it('should handle URL with error description', async () => {
      const request = createMockRequest(
        'https://auth.revly.health/api/auth/proxy?error=access_denied&error_description=User+cancelled'
      );

      const response = await GET(request);
      
      expect(response.status).toBeGreaterThanOrEqual(302);
      expect(response.status).toBeLessThanOrEqual(308);
      
      const location = response.headers.get('location');
      expect(location).toBeTruthy();
    });

    it('should handle state with missing required fields', async () => {
      const incompleteStateData = {
        // Missing targetUrl
        timestamp: Date.now(),
        signature: 'test-signature'
      };
      const incompleteState = Buffer.from(JSON.stringify(incompleteStateData)).toString('base64');
      const code = 'test_oauth_code';
      
      const request = createMockRequest(
        `https://auth.revly.health/api/auth/proxy?code=${code}&state=${incompleteState}`
      );

      const response = await GET(request);
      
      expect(response.status).toBeGreaterThanOrEqual(302);
      expect(response.status).toBeLessThanOrEqual(308);
      
      const location = response.headers.get('location');
      expect(location).toBeTruthy();
    });

    it('should handle state with missing timestamp', async () => {
      const noTimestampStateData = {
        targetUrl: 'https://test.vercel.app/api/auth/callback/google',
        // Missing timestamp
        signature: 'test-signature'
      };
      const noTimestampState = Buffer.from(JSON.stringify(noTimestampStateData)).toString('base64');
      const code = 'test_oauth_code';
      
      const request = createMockRequest(
        `https://auth.revly.health/api/auth/proxy?code=${code}&state=${noTimestampState}`
      );

      const response = await GET(request);
      
      expect(response.status).toBeGreaterThanOrEqual(302);
      expect(response.status).toBeLessThanOrEqual(308);
      
      const location = response.headers.get('location');
      expect(location).toBeTruthy();
    });

    it('should handle environment fallback', async () => {
      // Test with no environment variables set
      const originalUrl = process.env.NEXTAUTH_URL;
      delete process.env.NEXTAUTH_URL;
      
      const request = createMockRequest(
        'https://auth.revly.health/api/auth/proxy'
      );

      const response = await GET(request);
      
      expect(response.status).toBeGreaterThanOrEqual(302);
      expect(response.status).toBeLessThanOrEqual(308);
      
      const location = response.headers.get('location');
      expect(location).toBeTruthy();
      
      // Restore environment
      if (originalUrl) {
        process.env.NEXTAUTH_URL = originalUrl;
      }
    });
  });
});
