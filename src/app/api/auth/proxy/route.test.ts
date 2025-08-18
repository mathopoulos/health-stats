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

// Helper to create a valid proxy state
function createValidProxyState(targetUrl: string, originalState?: string) {
  const crypto = require('crypto');
  const timestamp = Date.now();
  const dataToSign = `${targetUrl}:${originalState || ''}:${timestamp}`;
  const signature = crypto
    .createHmac('sha256', mockEnv.NEXTAUTH_SECRET)
    .update(dataToSign)
    .digest('hex');

  const proxyState = {
    targetUrl,
    originalState,
    signature,
    timestamp
  };

  return Buffer.from(JSON.stringify(proxyState)).toString('base64');
}

describe('OAuth Proxy API Route', () => {
  describe('GET /api/auth/proxy', () => {
    it('should handle successful OAuth callback with valid state', async () => {
      const targetUrl = 'https://test-preview.vercel.app/api/auth/callback/google';
      const code = 'test_oauth_code';
      const state = createValidProxyState(targetUrl, 'original_state');
      
      const request = createMockRequest(
        `https://auth.revly.health/api/auth/proxy?code=${code}&state=${state}`
      );

      const response = await GET(request);
      
      expect(response.status).toBeGreaterThanOrEqual(302);
      expect(response.status).toBeLessThanOrEqual(308);
      
      const location = response.headers.get('location');
      expect(location).toContain(targetUrl);
      expect(location).toContain(`code=${code}`);
      expect(location).toContain('state=original_state');
    });

    it('should handle OAuth errors gracefully', async () => {
      const targetUrl = 'https://test-preview.vercel.app/api/auth/callback/google';
      const state = createValidProxyState(targetUrl);
      const error = 'access_denied';
      
      const request = createMockRequest(
        `https://auth.revly.health/api/auth/proxy?error=${error}&state=${state}`
      );

      const response = await GET(request);
      
      expect(response.status).toBeGreaterThanOrEqual(302);
      expect(response.status).toBeLessThanOrEqual(308);
      
      const location = response.headers.get('location');
      expect(location).toContain('/auth/error');
      expect(location).toContain(`error=${error}`);
    });

    it('should reject expired state', async () => {
      const crypto = require('crypto');
      const targetUrl = 'https://test-preview.vercel.app/api/auth/callback/google';
      
      // Create expired state (1 hour ago)
      const expiredTimestamp = Date.now() - (60 * 60 * 1000);
      const dataToSign = `${targetUrl}::${expiredTimestamp}`;
      const signature = crypto
        .createHmac('sha256', mockEnv.NEXTAUTH_SECRET)
        .update(dataToSign)
        .digest('hex');

      const expiredState = {
        targetUrl,
        signature,
        timestamp: expiredTimestamp
      };

      const state = Buffer.from(JSON.stringify(expiredState)).toString('base64');
      const code = 'test_oauth_code';
      
      const request = createMockRequest(
        `https://auth.revly.health/api/auth/proxy?code=${code}&state=${state}`
      );

      const response = await GET(request);
      
      expect(response.status).toBeGreaterThanOrEqual(302);
      expect(response.status).toBeLessThanOrEqual(308);
      
      const location = response.headers.get('location');
      expect(location).toContain('/auth/error');
      expect(location).toContain('error=invalid_state');
    });

    it('should reject invalid signature', async () => {
      const targetUrl = 'https://test-preview.vercel.app/api/auth/callback/google';
      const timestamp = Date.now();
      
      // Create state with invalid signature
      const invalidState = {
        targetUrl,
        signature: 'invalid_signature',
        timestamp
      };

      const state = Buffer.from(JSON.stringify(invalidState)).toString('base64');
      const code = 'test_oauth_code';
      
      const request = createMockRequest(
        `https://auth.revly.health/api/auth/proxy?code=${code}&state=${state}`
      );

      const response = await GET(request);
      
      expect(response.status).toBeGreaterThanOrEqual(302);
      expect(response.status).toBeLessThanOrEqual(308);
      
      const location = response.headers.get('location');
      expect(location).toContain('/auth/error');
      expect(location).toContain('error=invalid_state');
    });

    it('should reject untrusted domains', async () => {
      const untrustedUrl = 'https://malicious-site.com/api/auth/callback/google';
      const state = createValidProxyState(untrustedUrl);
      const code = 'test_oauth_code';
      
      const request = createMockRequest(
        `https://auth.revly.health/api/auth/proxy?code=${code}&state=${state}`
      );

      const response = await GET(request);
      
      expect(response.status).toBeGreaterThanOrEqual(302);
      expect(response.status).toBeLessThanOrEqual(308);
      
      const location = response.headers.get('location');
      expect(location).toContain('/auth/error');
      expect(location).toContain('error=untrusted_domain');
    });

    it('should allow trusted Vercel domains', async () => {
      const vercelUrl = 'https://health-stats-abc-xyz.vercel.app/api/auth/callback/google';
      const state = createValidProxyState(vercelUrl);
      const code = 'test_oauth_code';
      
      const request = createMockRequest(
        `https://auth.revly.health/api/auth/proxy?code=${code}&state=${state}`
      );

      const response = await GET(request);
      
      expect(response.status).toBeGreaterThanOrEqual(302);
      expect(response.status).toBeLessThanOrEqual(308);
      
      const location = response.headers.get('location');
      expect(location).toContain(vercelUrl);
      expect(location).toContain(`code=${code}`);
    });

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

    it('should preserve additional OAuth parameters', async () => {
      const targetUrl = 'https://test-preview.vercel.app/api/auth/callback/google';
      const state = createValidProxyState(targetUrl);
      const code = 'test_oauth_code';
      const scope = 'openid email profile';
      const authuser = '0';
      
      const request = createMockRequest(
        `https://auth.revly.health/api/auth/proxy?code=${code}&state=${state}&scope=${encodeURIComponent(scope)}&authuser=${authuser}`
      );

      const response = await GET(request);
      
      expect(response.status).toBeGreaterThanOrEqual(302);
      expect(response.status).toBeLessThanOrEqual(308);
      
      const location = response.headers.get('location');
      expect(location).toContain(`scope=${encodeURIComponent(scope)}`);
      expect(location).toContain(`authuser=${authuser}`);
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
      expect(location).toContain('/auth/error');
      expect(location).toContain('error=processing_error');
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
    });
  });
});

describe('Trusted Domain Validation', () => {
  const testCases = [
    // Trusted domains
    { url: 'https://localhost:3000/callback', trusted: true },
    { url: 'https://www.revly.health/callback', trusted: true },
    { url: 'https://revly.health/callback', trusted: true },
    { url: 'https://health-stats-abc.vercel.app/callback', trusted: true },
    { url: 'https://preview-xyz.vercel.com/callback', trusted: true },
    
    // Untrusted domains
    { url: 'https://malicious-site.com/callback', trusted: false },
    { url: 'https://fake-revly.health.evil.com/callback', trusted: false },
    { url: 'https://notvercel.app/callback', trusted: false }
  ];

  testCases.forEach(({ url, trusted }) => {
    it(`should ${trusted ? 'allow' : 'reject'} ${url}`, async () => {
      const state = createValidProxyState(url);
      const code = 'test_oauth_code';
      
      const request = createMockRequest(
        `https://auth.revly.health/api/auth/proxy?code=${code}&state=${state}`
      );

      const response = await GET(request);
      
      expect(response.status).toBeGreaterThanOrEqual(302);
      expect(response.status).toBeLessThanOrEqual(308);
      
      const location = response.headers.get('location');
      
      if (trusted) {
        expect(location).toContain(url);
      } else {
        expect(location).toContain('/auth/error');
        expect(location).toContain('error=untrusted_domain');
      }
    });
  });
});
