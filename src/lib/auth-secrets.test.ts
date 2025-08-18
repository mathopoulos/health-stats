/**
 * @jest-environment node
 */

import { getOAuthProxySecret } from './auth-secrets';

// Save original env
const originalEnv = process.env;

beforeEach(() => {
  // Reset environment for each test
  process.env = { ...originalEnv };
});

afterAll(() => {
  process.env = originalEnv;
});

describe('Auth Secrets', () => {
  describe('getOAuthProxySecret', () => {
    it('should return NEXTAUTH_SECRET when available', () => {
      process.env.NEXTAUTH_SECRET = 'test-secret-123';
      
      const result = getOAuthProxySecret();
      
      expect(result).toBe('test-secret-123');
    });

    it('should return fallback secret when NEXTAUTH_SECRET is not set', () => {
      delete process.env.NEXTAUTH_SECRET;
      
      const result = getOAuthProxySecret();
      
      expect(result).toBe('fallback-secret-change-me');
    });

    it('should return fallback secret when NEXTAUTH_SECRET is empty', () => {
      process.env.NEXTAUTH_SECRET = '';
      
      const result = getOAuthProxySecret();
      
      expect(result).toBe('fallback-secret-change-me');
    });
  });
});
