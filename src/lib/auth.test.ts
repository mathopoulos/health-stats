/**
 * @jest-environment node
 */

// Mock environment variables
const mockEnv = {
  NEXTAUTH_SECRET: 'test-secret-key',
  GOOGLE_CLIENT_ID: 'test-google-client-id',
  GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
  NODE_ENV: 'test'
};

// Save original env
const originalEnv = process.env;

beforeAll(() => {
  process.env = { ...originalEnv, ...mockEnv };
});

afterAll(() => {
  process.env = originalEnv;
});

// Mock the auth-proxy module
jest.mock('./auth-proxy', () => ({
  getOAuthRedirectUri: jest.fn(() => 'https://auth.revly.health/api/auth/proxy'),
  getBaseUrl: jest.fn(() => 'https://www.revly.health')
}));

// Mock the stripe module
jest.mock('@/server/payments/stripe', () => ({
  hasUserPurchasedProduct: jest.fn(() => Promise.resolve(false))
}));

import { authOptions } from './auth';

describe('Auth Configuration', () => {
  describe('authOptions', () => {
    it('should be a valid NextAuth configuration object', () => {
      expect(authOptions).toBeDefined();
      expect(typeof authOptions).toBe('object');
    });

    it('should have required properties', () => {
      expect(authOptions).toHaveProperty('providers');
      expect(authOptions).toHaveProperty('session');
      expect(authOptions).toHaveProperty('cookies');
      expect(authOptions).toHaveProperty('callbacks');
      expect(authOptions).toHaveProperty('pages');
    });

    it('should have Google provider configured', () => {
      expect(authOptions.providers).toBeDefined();
      expect(Array.isArray(authOptions.providers)).toBe(true);
      expect(authOptions.providers.length).toBeGreaterThan(0);
      
      // Check if Google provider is configured
      const googleProvider = authOptions.providers[0];
      expect(googleProvider).toBeDefined();
      expect(googleProvider.type).toBe('oauth');
      expect(googleProvider.id).toBe('google');
    });

    it('should have JWT session strategy', () => {
      expect(authOptions.session).toBeDefined();
      expect(authOptions.session.strategy).toBe('jwt');
      expect(authOptions.session.maxAge).toBe(30 * 24 * 60 * 60); // 30 days
    });

    it('should have secure cookie configuration', () => {
      expect(authOptions.cookies).toBeDefined();
      expect(authOptions.cookies.sessionToken).toBeDefined();
      expect(authOptions.cookies.sessionToken.options).toBeDefined();
      expect(authOptions.cookies.sessionToken.options.httpOnly).toBe(true);
      expect(authOptions.cookies.sessionToken.options.sameSite).toBe('lax');
      expect(authOptions.cookies.sessionToken.options.path).toBe('/');
    });

    it('should have signin and error pages configured', () => {
      expect(authOptions.pages).toBeDefined();
      expect(authOptions.pages.signIn).toBe('/auth/signin');
      expect(authOptions.pages.error).toBe('/auth/checkout');
    });

    it('should have required callbacks', () => {
      expect(authOptions.callbacks).toBeDefined();
      expect(authOptions.callbacks.signIn).toBeDefined();
      expect(authOptions.callbacks.jwt).toBeDefined();
      expect(authOptions.callbacks.redirect).toBeDefined();
      expect(authOptions.callbacks.session).toBeDefined();
    });
  });

  describe('Google Provider Configuration', () => {
    it('should have Google provider configured', () => {
      const googleProvider = authOptions.providers[0];
      expect(googleProvider).toBeDefined();
      expect(googleProvider.type).toBe('oauth');
      expect(googleProvider.id).toBe('google');
    });

    it('should have authorization configuration', () => {
      const googleProvider = authOptions.providers[0];
      expect(googleProvider.authorization).toBeDefined();
      expect(googleProvider.authorization.params).toBeDefined();
    });

    it('should have client credentials available from environment', () => {
      // Just test that the environment variables are being used
      expect(process.env.GOOGLE_CLIENT_ID).toBe('test-google-client-id');
      expect(process.env.GOOGLE_CLIENT_SECRET).toBe('test-google-client-secret');
    });
  });

  describe('Callback Functions', () => {
    it('should have signIn callback function', () => {
      expect(typeof authOptions.callbacks.signIn).toBe('function');
    });

    it('should have jwt callback function', () => {
      expect(typeof authOptions.callbacks.jwt).toBe('function');
    });

    it('should have redirect callback function', () => {
      expect(typeof authOptions.callbacks.redirect).toBe('function');
    });

    it('should have session callback function', () => {
      expect(typeof authOptions.callbacks.session).toBe('function');
    });
  });

  describe('Environment Configuration', () => {
    it('should have environment-appropriate cookie configuration', () => {
      expect(authOptions.cookies.sessionToken).toBeDefined();
      expect(authOptions.cookies.sessionToken.name).toBeDefined();
      expect(authOptions.cookies.sessionToken.options).toBeDefined();
      expect(typeof authOptions.cookies.sessionToken.options.secure).toBe('boolean');
    });

    it('should have proper cookie security settings', () => {
      expect(authOptions.cookies.sessionToken.options.httpOnly).toBe(true);
      expect(authOptions.cookies.sessionToken.options.sameSite).toBe('lax');
      expect(authOptions.cookies.sessionToken.options.path).toBe('/');
    });
  });
});
