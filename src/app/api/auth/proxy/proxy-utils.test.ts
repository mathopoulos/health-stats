/**
 * @jest-environment node
 */

import {
  ProxyState,
  generateSignature,
  verifyState,
  isTrustedDomain,
  parseState,
  extractTargetUrl,
  buildCallbackUrl,
  buildErrorUrl,
  addOAuthParams
} from './proxy-utils';

// Mock environment variables
const mockEnv = {
  NEXTAUTH_SECRET: 'test-secret-key',
  NEXTAUTH_URL: 'https://www.revly.health',
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

describe('OAuth Proxy Utils', () => {
  describe('generateSignature', () => {
    it('should generate consistent signatures', () => {
      const data = 'test-data';
      const sig1 = generateSignature(data);
      const sig2 = generateSignature(data);
      
      expect(sig1).toBe(sig2);
      expect(sig1).toHaveLength(64); // SHA256 hex length
    });

    it('should generate different signatures for different data', () => {
      const sig1 = generateSignature('data1');
      const sig2 = generateSignature('data2');
      
      expect(sig1).not.toBe(sig2);
    });
  });

  describe('verifyState', () => {
    it('should verify valid state', () => {
      const now = Date.now();
      const data = 'https://example.com::' + now;
      const signature = generateSignature(data);
      
      const state: ProxyState = {
        targetUrl: 'https://example.com',
        timestamp: now,
        signature
      };
      
      expect(verifyState(state)).toBe(true);
    });

    it('should reject expired state', () => {
      const oldTime = Date.now() - (11 * 60 * 1000); // 11 minutes ago
      const data = 'https://example.com::' + oldTime;
      const signature = generateSignature(data);
      
      const state: ProxyState = {
        targetUrl: 'https://example.com',
        timestamp: oldTime,
        signature
      };
      
      expect(verifyState(state)).toBe(false);
    });

    it('should reject invalid signature', () => {
      const now = Date.now();
      
      const state: ProxyState = {
        targetUrl: 'https://example.com',
        timestamp: now,
        signature: 'invalid-signature'
      };
      
      expect(verifyState(state)).toBe(false);
    });

    it('should handle state with originalState', () => {
      const now = Date.now();
      const originalState = 'oauth-state-123';
      const data = 'https://example.com:' + originalState + ':' + now;
      const signature = generateSignature(data);
      
      const state: ProxyState = {
        targetUrl: 'https://example.com',
        originalState,
        timestamp: now,
        signature
      };
      
      expect(verifyState(state)).toBe(true);
    });
  });

  describe('isTrustedDomain', () => {
    it('should accept localhost', () => {
      expect(isTrustedDomain('http://localhost:3000')).toBe(true);
    });

    it('should accept revly.health domains', () => {
      expect(isTrustedDomain('https://www.revly.health')).toBe(true);
      expect(isTrustedDomain('https://revly.health')).toBe(true);
    });

    it('should accept vercel deployments', () => {
      expect(isTrustedDomain('https://app-abc123.vercel.app')).toBe(true);
      expect(isTrustedDomain('https://preview-xyz.vercel.com')).toBe(true);
    });

    it('should reject untrusted domains', () => {
      expect(isTrustedDomain('https://evil.com')).toBe(false);
      expect(isTrustedDomain('https://fake-vercel.app.evil.com')).toBe(false);
    });

    it('should handle invalid URLs', () => {
      expect(isTrustedDomain('not-a-url')).toBe(false);
      expect(isTrustedDomain('')).toBe(false);
    });
  });

  describe('parseState', () => {
    it('should parse valid base64 encoded state', () => {
      const state = {
        targetUrl: 'https://example.com',
        originalState: 'test',
        signature: 'sig123',
        timestamp: 123456
      };
      const encoded = Buffer.from(JSON.stringify(state)).toString('base64');
      
      const result = parseState(encoded);
      expect(result).toEqual(state);
    });

    it('should return null for invalid base64', () => {
      expect(parseState('invalid-base64')).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      const invalid = Buffer.from('not json').toString('base64');
      expect(parseState(invalid)).toBeNull();
    });
  });

  describe('extractTargetUrl', () => {
    it('should return fallback when no state provided', () => {
      expect(extractTargetUrl()).toBe('https://www.revly.health');
    });

    it('should return fallback when state is invalid', () => {
      expect(extractTargetUrl('invalid')).toBe('https://www.revly.health');
    });

    it('should extract URL from valid state', () => {
      const state = {
        targetUrl: 'https://preview.vercel.app',
        signature: 'sig',
        timestamp: Date.now()
      };
      const encoded = Buffer.from(JSON.stringify(state)).toString('base64');
      
      expect(extractTargetUrl(encoded)).toBe('https://preview.vercel.app');
    });

    it('should return fallback for untrusted domain', () => {
      const state = {
        targetUrl: 'https://evil.com',
        signature: 'sig',
        timestamp: Date.now()
      };
      const encoded = Buffer.from(JSON.stringify(state)).toString('base64');
      
      expect(extractTargetUrl(encoded)).toBe('https://www.revly.health');
    });
  });

  describe('buildCallbackUrl', () => {
    it('should build URL with code only', () => {
      const result = buildCallbackUrl('https://example.com', 'auth_code_123');
      expect(result).toBe('https://example.com/?code=auth_code_123');
    });

    it('should build URL with code and state', () => {
      const result = buildCallbackUrl('https://example.com', 'auth_code_123', 'state_456');
      expect(result).toBe('https://example.com/?code=auth_code_123&state=state_456');
    });
  });

  describe('buildErrorUrl', () => {
    it('should build error URL', () => {
      const result = buildErrorUrl('https://example.com', 'access_denied');
      expect(result).toBe('https://example.com/auth/error?error=access_denied');
    });
  });

  describe('addOAuthParams', () => {
    it('should add valid parameters', () => {
      const url = new URL('https://example.com');
      const params = {
        scope: 'email profile',
        authuser: '0',
        prompt: 'consent',
        empty: null,
        undefined: undefined as any
      };
      
      const result = addOAuthParams(url, params);
      
      expect(result.searchParams.get('scope')).toBe('email profile');
      expect(result.searchParams.get('authuser')).toBe('0');
      expect(result.searchParams.get('prompt')).toBe('consent');
      expect(result.searchParams.has('empty')).toBe(false);
      expect(result.searchParams.has('undefined')).toBe(false);
    });
  });
});
