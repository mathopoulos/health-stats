import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getOAuthProxySecret } from '@/lib/auth-secrets';
import crypto from 'crypto';

/**
 * OAuth Redirect Proxy
 * 
 * This endpoint serves as a stable redirect URI for OAuth providers (like Google)
 * that can be configured once and work across all environments (production, preview, development).
 * 
 * Flow:
 * 1. User initiates OAuth from any environment (prod/preview/dev)
 * 2. OAuth provider redirects to this stable proxy URL
 * 3. Proxy validates the state and redirects back to the original environment
 * 4. Original environment completes the OAuth flow
 * 
 * Security:
 * - State parameter validation to prevent CSRF attacks
 * - Origin validation to ensure redirects only go to trusted domains
 * - Signature verification to prevent state tampering
 */

interface ProxyState {
  targetUrl: string;      // Where to redirect back to
  originalState?: string; // Original state from the OAuth flow
  signature: string;      // HMAC signature for integrity
  timestamp: number;      // When the state was created (for expiry)
}

const PROXY_SECRET = getOAuthProxySecret();
const STATE_EXPIRY_MINUTES = 10; // State expires after 10 minutes

// Trusted domains for redirects
const TRUSTED_DOMAINS = [
  'localhost:3000',
  'www.revly.health',
  'revly.health',
  '.vercel.app', // All Vercel preview deployments
  '.vercel.com'  // Alternative Vercel domains
];

/**
 * Generate HMAC signature for state validation
 */
function generateSignature(data: string): string {
  return crypto
    .createHmac('sha256', PROXY_SECRET)
    .update(data)
    .digest('hex');
}

/**
 * Verify state integrity and expiry
 */
function verifyState(state: ProxyState): boolean {
  // Check expiry
  const now = Date.now();
  const stateAge = now - state.timestamp;
  const maxAge = STATE_EXPIRY_MINUTES * 60 * 1000;
  
  if (stateAge > maxAge) {
    console.warn('OAuth proxy: State expired', { age: stateAge, maxAge });
    return false;
  }

  // Verify signature
  const dataToSign = `${state.targetUrl}:${state.originalState || ''}:${state.timestamp}`;
  const expectedSignature = generateSignature(dataToSign);
  
  if (state.signature !== expectedSignature) {
    console.warn('OAuth proxy: Invalid state signature');
    return false;
  }

  return true;
}

/**
 * Check if a URL is from a trusted domain
 */
function isTrustedDomain(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;
    
    return TRUSTED_DOMAINS.some(trustedDomain => {
      if (trustedDomain.startsWith('.')) {
        // Wildcard domain like .vercel.app
        return hostname.endsWith(trustedDomain);
      }
      return hostname === trustedDomain;
    });
  } catch (error) {
    console.error('OAuth proxy: Invalid URL format', url, error);
    return false;
  }
}

/**
 * Handle OAuth callback and redirect to target environment
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  console.log('OAuth proxy: Received callback', {
    hasCode: !!code,
    hasState: !!state,
    error: error || 'none'
  });

  // Handle OAuth errors
  if (error) {
    console.error('OAuth proxy: OAuth provider returned error', error);
    
    // Try to extract target URL from state even on error
    let errorRedirectUrl = process.env.NEXTAUTH_URL || 'https://www.revly.health';
    
    if (state) {
      try {
        const decodedState: ProxyState = JSON.parse(atob(state));
        if (isTrustedDomain(decodedState.targetUrl)) {
          const targetUrl = new URL(decodedState.targetUrl);
          errorRedirectUrl = `${targetUrl.origin}/auth/error?error=${encodeURIComponent(error)}`;
        }
      } catch (e) {
        console.warn('OAuth proxy: Could not decode state for error redirect', e);
      }
    }
    
    return NextResponse.redirect(errorRedirectUrl);
  }

  // Validate required parameters
  if (!code || !state) {
    console.error('OAuth proxy: Missing required parameters', { code: !!code, state: !!state });
    const fallbackUrl = process.env.NEXTAUTH_URL || 'https://www.revly.health';
    return NextResponse.redirect(`${fallbackUrl}/auth/error?error=missing_parameters`);
  }

  try {
    // Decode and validate state
    const decodedState: ProxyState = JSON.parse(atob(state));
    
    if (!verifyState(decodedState)) {
      console.error('OAuth proxy: State validation failed');
      const fallbackUrl = process.env.NEXTAUTH_URL || 'https://www.revly.health';
      return NextResponse.redirect(`${fallbackUrl}/auth/error?error=invalid_state`);
    }

    // Validate target domain
    if (!isTrustedDomain(decodedState.targetUrl)) {
      console.error('OAuth proxy: Untrusted target domain', decodedState.targetUrl);
      const fallbackUrl = process.env.NEXTAUTH_URL || 'https://www.revly.health';
      return NextResponse.redirect(`${fallbackUrl}/auth/error?error=untrusted_domain`);
    }

    // Build redirect URL with OAuth parameters
    const targetUrl = new URL(decodedState.targetUrl);
    targetUrl.searchParams.set('code', code);
    
    // Restore original state if it existed
    if (decodedState.originalState) {
      targetUrl.searchParams.set('state', decodedState.originalState);
    }

    // Add any additional parameters from the OAuth callback
    const scope = searchParams.get('scope');
    const authuser = searchParams.get('authuser');
    const prompt = searchParams.get('prompt');
    
    if (scope) targetUrl.searchParams.set('scope', scope);
    if (authuser) targetUrl.searchParams.set('authuser', authuser);
    if (prompt) targetUrl.searchParams.set('prompt', prompt);

    console.log('OAuth proxy: Redirecting to target', {
      target: targetUrl.toString(),
      hasOriginalState: !!decodedState.originalState
    });

    return NextResponse.redirect(targetUrl.toString());

  } catch (error) {
    console.error('OAuth proxy: Error processing callback', error);
    const fallbackUrl = process.env.NEXTAUTH_URL || 'https://www.revly.health';
    return NextResponse.redirect(`${fallbackUrl}/auth/error?error=processing_error`);
  }
}

/**
 * Health check endpoint
 */
export async function POST(request: NextRequest) {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}
