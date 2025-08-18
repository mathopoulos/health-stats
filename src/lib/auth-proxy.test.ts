/**
 * @jest-environment node
 */

import {
  getBaseUrl,
  getProxyUrl,
  generateProxyState,
  shouldUseProxy,
  getOAuthRedirectUri,
  modifyOAuthUrl
} from './auth-proxy';

// Mock environment variables
const mockEnv = {
  NEXTAUTH_SECRET: 'test-secret-key',
  NODE_ENV: 'test'
};

// Save original env
const originalEnv = process.env;

beforeEach(() => {
  // Reset environment for each test
  process.env = { ...originalEnv, ...mockEnv };
});

afterAll(() => {
  process.env = originalEnv;
});

describe('Auth Proxy Utilities', () => {
  describe('getBaseUrl', () => {
    it('should return NEXTAUTH_URL in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXTAUTH_URL = 'https://www.revly.health';
      
      const result = getBaseUrl();
      
      expect(result).toBe('https://www.revly.health');
    });

    it('should return Vercel URL when available', () => {
      process.env.VERCEL_URL = 'health-stats-abc.vercel.app';
      
      const result = getBaseUrl();
      
      expect(result).toBe('https://health-stats-abc.vercel.app');
    });

    it('should return localhost for development', () => {
      delete process.env.NEXTAUTH_URL;
      delete process.env.VERCEL_URL;
      
      const result = getBaseUrl();
      
      expect(result).toBe('http://localhost:3000');
    });

    it('should prioritize NEXTAUTH_URL over VERCEL_URL in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXTAUTH_URL = 'https://www.revly.health';
      process.env.VERCEL_URL = 'health-stats-abc.vercel.app';
      
      const result = getBaseUrl();
      
      expect(result).toBe('https://www.revly.health');
    });
  });

  describe('getProxyUrl', () => {
    it('should return stable proxy URL in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.OAUTH_PROXY_URL = 'https://auth.revly.health/api/auth/proxy';
      
      const result = getProxyUrl();
      
      expect(result).toBe('https://auth.revly.health/api/auth/proxy');
    });

    it('should use default proxy URL in production if not configured', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.OAUTH_PROXY_URL;
      
      const result = getProxyUrl();
      
      expect(result).toBe('https://auth.revly.health/api/auth/proxy');
    });

    it('should use local proxy URL for development', () => {
      process.env.NODE_ENV = 'development';
      
      const result = getProxyUrl();
      
      expect(result).toBe('http://localhost:3000/api/auth/proxy');
    });

    it('should use Vercel URL for preview deployments', () => {
      process.env.VERCEL_URL = 'health-stats-abc.vercel.app';
      
      const result = getProxyUrl();
      
      expect(result).toBe('https://health-stats-abc.vercel.app/api/auth/proxy');
    });
  });

  describe('shouldUseProxy', () => {
    it('should return true in production', () => {
      process.env.NODE_ENV = 'production';
      
      const result = shouldUseProxy();
      
      expect(result).toBe(true);
    });

    it('should return true for Vercel preview deployments', () => {
      process.env.VERCEL_URL = 'health-stats-abc.vercel.app';
      process.env.VERCEL_ENV = 'preview';
      
      const result = shouldUseProxy();
      
      expect(result).toBe(true);
    });

    it('should return true when explicitly enabled', () => {
      process.env.USE_OAUTH_PROXY = 'true';
      
      const result = shouldUseProxy();
      
      expect(result).toBe(true);
    });

    it('should return false for local development by default', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.USE_OAUTH_PROXY;
      delete process.env.VERCEL_URL;
      
      const result = shouldUseProxy();
      
      expect(result).toBe(false);
    });

    it('should return false when explicitly disabled', () => {
      process.env.USE_OAUTH_PROXY = 'false';
      
      const result = shouldUseProxy();
      
      expect(result).toBe(false);
    });
  });

  describe('getOAuthRedirectUri', () => {
    it('should return proxy URL when proxy is enabled', () => {
      process.env.NODE_ENV = 'production';
      process.env.OAUTH_PROXY_URL = 'https://auth.revly.health/api/auth/proxy';
      
      const result = getOAuthRedirectUri();
      
      expect(result).toBe('https://auth.revly.health/api/auth/proxy');
    });

    it('should return direct callback URL when proxy is disabled', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.USE_OAUTH_PROXY;
      delete process.env.VERCEL_URL;
      
      const result = getOAuthRedirectUri();
      
      expect(result).toBe('http://localhost:3000/api/auth/callback/google');
    });
  });

  describe('generateProxyState', () => {
    it('should generate valid base64 encoded state', () => {
      const originalState = 'original_state_data';
      
      const result = generateProxyState(originalState);
      
      // Should be valid base64
      expect(() => Buffer.from(result, 'base64')).not.toThrow();
      
      // Should decode to valid JSON
      const decoded = JSON.parse(Buffer.from(result, 'base64').toString());
      expect(decoded).toHaveProperty('targetUrl');
      expect(decoded).toHaveProperty('originalState', originalState);
      expect(decoded).toHaveProperty('signature');
      expect(decoded).toHaveProperty('timestamp');
    });

    it('should generate state without original state', () => {
      const result = generateProxyState();
      
      const decoded = JSON.parse(Buffer.from(result, 'base64').toString());
      expect(decoded.originalState).toBeUndefined();
    });

    it('should include correct target URL', () => {
      process.env.VERCEL_URL = 'health-stats-abc.vercel.app';
      
      const result = generateProxyState();
      
      const decoded = JSON.parse(Buffer.from(result, 'base64').toString());
      expect(decoded.targetUrl).toBe('https://health-stats-abc.vercel.app/api/auth/callback/google');
    });

    it('should generate different signatures for different data', () => {
      const state1 = generateProxyState('state1');
      const state2 = generateProxyState('state2');
      
      const decoded1 = JSON.parse(Buffer.from(state1, 'base64').toString());
      const decoded2 = JSON.parse(Buffer.from(state2, 'base64').toString());
      
      expect(decoded1.signature).not.toBe(decoded2.signature);
    });
  });

  describe('modifyOAuthUrl', () => {
    const originalUrl = 'https://accounts.google.com/oauth/authorize?client_id=123&redirect_uri=http://localhost:3000/api/auth/callback/google&state=abc';

    it('should return original URL when proxy is disabled', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.USE_OAUTH_PROXY;
      delete process.env.VERCEL_URL;
      
      const result = modifyOAuthUrl(originalUrl);
      
      expect(result).toBe(originalUrl);
    });

    it('should modify URL when proxy is enabled', () => {
      process.env.NODE_ENV = 'production';
      process.env.OAUTH_PROXY_URL = 'https://auth.revly.health/api/auth/proxy';
      
      const result = modifyOAuthUrl(originalUrl, 'original_state');
      
      expect(result).toContain('redirect_uri=https%3A%2F%2Fauth.revly.health%2Fapi%2Fauth%2Fproxy');
      expect(result).not.toContain('state=abc');
      
      // Should have a new state parameter
      const url = new URL(result);
      const newState = url.searchParams.get('state');
      expect(newState).toBeTruthy();
      expect(newState).not.toBe('abc');
    });

    it('should handle URLs without state parameter', () => {
      process.env.NODE_ENV = 'production';
      const urlWithoutState = 'https://accounts.google.com/oauth/authorize?client_id=123&redirect_uri=http://localhost:3000/api/auth/callback/google';
      
      const result = modifyOAuthUrl(urlWithoutState);
      
      expect(result).toContain('redirect_uri=https%3A%2F%2Fauth.revly.health%2Fapi%2Fauth%2Fproxy');
      
      const url = new URL(result);
      const state = url.searchParams.get('state');
      expect(state).toBeTruthy();
    });

    it('should handle invalid URLs gracefully', () => {
      process.env.NODE_ENV = 'production';
      const invalidUrl = 'not-a-valid-url';
      
      const result = modifyOAuthUrl(invalidUrl);
      
      expect(result).toBe(invalidUrl);
    });

    it('should preserve other URL parameters', () => {
      process.env.NODE_ENV = 'production';
      const urlWithParams = 'https://accounts.google.com/oauth/authorize?client_id=123&scope=openid+email&response_type=code&redirect_uri=http://localhost:3000/api/auth/callback/google';
      
      const result = modifyOAuthUrl(urlWithParams);
      
      expect(result).toContain('client_id=123');
      expect(result).toContain('scope=openid+email');
      expect(result).toContain('response_type=code');
    });
  });

  describe('State Integrity', () => {
    it('should generate states that can be verified by the proxy', () => {
      const crypto = require('crypto');
      const originalState = 'test_original_state';
      
      // Generate state using the utility
      const proxyState = generateProxyState(originalState);
      const decoded = JSON.parse(Buffer.from(proxyState, 'base64').toString());
      
      // Verify signature matches expected
      const dataToSign = `${decoded.targetUrl}:${decoded.originalState || ''}:${decoded.timestamp}`;
      const expectedSignature = crypto
        .createHmac('sha256', mockEnv.NEXTAUTH_SECRET)
        .update(dataToSign)
        .digest('hex');
      
      expect(decoded.signature).toBe(expectedSignature);
    });

    it('should include recent timestamp', () => {
      const proxyState = generateProxyState();
      const decoded = JSON.parse(Buffer.from(proxyState, 'base64').toString());
      
      const now = Date.now();
      const timeDiff = Math.abs(now - decoded.timestamp);
      
      // Should be within 1 second
      expect(timeDiff).toBeLessThan(1000);
    });
  });
});
