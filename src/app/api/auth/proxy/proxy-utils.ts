import { getOAuthProxySecret } from '@/lib/auth-secrets';
import crypto from 'crypto';

/**
 * Utilities for OAuth proxy functionality
 * Extracted for better testability
 */

export interface ProxyState {
  targetUrl: string;      // Where to redirect back to
  originalState?: string; // Original state from the OAuth flow
  signature: string;      // HMAC signature for integrity
  timestamp: number;      // When the state was created (for expiry)
}

const PROXY_SECRET = getOAuthProxySecret();
const STATE_EXPIRY_MINUTES = 10; // State expires after 10 minutes

// Trusted domains for redirects
const TRUSTED_DOMAINS = [
  'localhost',
  'www.revly.health',
  'revly.health',
  '.vercel.app', // All Vercel preview deployments
  '.vercel.com'  // Alternative Vercel domains
];

/**
 * Generate HMAC signature for state validation
 */
export function generateSignature(data: string): string {
  return crypto
    .createHmac('sha256', PROXY_SECRET)
    .update(data)
    .digest('hex');
}

/**
 * Verify state integrity and expiry
 */
export function verifyState(state: ProxyState): boolean {
  // Check expiry
  const now = Date.now();
  const stateAge = now - state.timestamp;
  const maxAge = STATE_EXPIRY_MINUTES * 60 * 1000;
  
  if (stateAge > maxAge) {
    return false;
  }

  // Verify signature
  const dataToSign = `${state.targetUrl}:${state.originalState || ''}:${state.timestamp}`;
  const expectedSignature = generateSignature(dataToSign);
  
  return state.signature === expectedSignature;
}

/**
 * Check if a URL is from a trusted domain
 */
export function isTrustedDomain(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;
    
    return TRUSTED_DOMAINS.some(trustedDomain => {
      if (trustedDomain.startsWith('.')) {
        // Wildcard domain like .vercel.app
        return hostname.endsWith(trustedDomain);
      }
      // Special case for localhost - allow any port
      if (trustedDomain === 'localhost') {
        return hostname === 'localhost';
      }
      return hostname === trustedDomain;
    });
  } catch (error) {
    return false;
  }
}

/**
 * Parse and decode the state parameter
 */
export function parseState(stateParam: string): ProxyState | null {
  try {
    const decoded = atob(stateParam);
    return JSON.parse(decoded) as ProxyState;
  } catch (error) {
    return null;
  }
}

/**
 * Extract target URL from state (for error redirects)
 */
export function extractTargetUrl(state?: string): string {
  const fallbackUrl = process.env.NEXTAUTH_URL || 'https://www.revly.health';
  
  if (!state) {
    return fallbackUrl;
  }

  const decodedState = parseState(state);
  if (decodedState && isTrustedDomain(decodedState.targetUrl)) {
    return decodedState.targetUrl;
  }
  
  return fallbackUrl;
}

/**
 * Build OAuth callback URL with parameters
 */
export function buildCallbackUrl(targetUrl: string, code: string, originalState?: string): string {
  const url = new URL(targetUrl);
  url.searchParams.set('code', code);
  
  if (originalState) {
    url.searchParams.set('state', originalState);
  }
  
  return url.toString();
}

/**
 * Build error redirect URL
 */
export function buildErrorUrl(targetUrl: string, error: string): string {
  const url = new URL('/auth/error', targetUrl);
  url.searchParams.set('error', error);
  return url.toString();
}

/**
 * Add OAuth parameters to URL
 */
export function addOAuthParams(url: URL, params: Record<string, string | null>): URL {
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });
  return url;
}
