import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple OAuth Redirect Proxy
 * 
 * This proxy works with NextAuth's standard OAuth flow without requiring custom state formats.
 * It determines the target environment from the Referer header and forwards OAuth parameters.
 * 
 * Flow:
 * 1. User initiates OAuth from any environment (NextAuth generates standard state)
 * 2. Google redirects to this proxy with standard OAuth parameters
 * 3. Proxy determines target environment from Referer header
 * 4. Proxy redirects to target environment's NextAuth callback with original parameters
 * 5. NextAuth completes OAuth flow normally
 */

// Trusted domains for security
const TRUSTED_DOMAINS = [
  'localhost',
  'revly.health',
  'www.revly.health',
  'vercel.app'
];

/**
 * Check if a domain is trusted
 */
function isTrustedDomain(hostname: string): boolean {
  return TRUSTED_DOMAINS.some(domain => {
    if (domain === 'vercel.app') {
      return hostname.includes('.vercel.app');
    }
    return hostname === domain || hostname.includes(domain);
  });
}

/**
 * Determine target URL from query parameter or Referer header
 */
function getTargetEnvironment(request: NextRequest): string {
  // Check explicit target parameter first (most reliable)
  const targetParam = request.nextUrl.searchParams.get('target');
  if (targetParam) {
    try {
      const targetUrl = new URL(decodeURIComponent(targetParam));
      if (isTrustedDomain(targetUrl.hostname)) {
        console.log('Using explicit target parameter:', targetParam);
        return `${targetUrl.protocol}//${targetUrl.host}`;
      } else {
        console.warn('Untrusted target parameter:', targetParam);
      }
    } catch (e) {
      console.warn('Invalid target parameter:', targetParam);
    }
  }

  // Check Referer header as fallback
  const referer = request.headers.get('referer');
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      // Skip Google referers - they don't tell us the original environment
      if (refererUrl.hostname.includes('google.com') || refererUrl.hostname.includes('accounts.google.com')) {
        console.log('Skipping Google referer, using production fallback');
      } else if (isTrustedDomain(refererUrl.hostname)) {
        return `${refererUrl.protocol}//${refererUrl.host}`;
      }
    } catch (e) {
      console.warn('Invalid referer:', referer);
    }
  }

  // Fallback to production
  return process.env.NEXTAUTH_URL || 'https://www.revly.health';
}

/**
 * Handle OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('🔄 OAuth proxy received:', {
      hasCode: !!code,
      hasState: !!state,
      hasError: !!error,
      referer: request.headers.get('referer'),
      allParams: Object.fromEntries(searchParams.entries())
    });

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      const targetEnv = getTargetEnvironment(request);
      return NextResponse.redirect(`${targetEnv}/auth/error?error=${encodeURIComponent(error)}`);
    }

    // Validate required parameters - state is optional when using proxy
    if (!code) {
      console.error('Missing OAuth code parameter');
      const targetEnv = getTargetEnvironment(request);
      return NextResponse.redirect(`${targetEnv}/auth/error?error=missing_parameters`);
    }

    // Determine target environment
    const targetEnv = getTargetEnvironment(request);
    
    // Build NextAuth callback URL
    const callbackUrl = new URL(`${targetEnv}/api/auth/callback/google`);
    
    // Forward all OAuth parameters to NextAuth (excluding our internal target parameter)
    const forwardedParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key !== 'target') { // Exclude our internal target parameter
        callbackUrl.searchParams.set(key, value);
        forwardedParams[key] = value;
      }
    });

    console.log('🚀 Proxy redirecting:', {
      targetEnv,
      callbackUrl: callbackUrl.toString(),
      forwardedParams,
      originalReferer: request.headers.get('referer'),
      stateParam: state,
      cookies: request.headers.get('cookie')
    });
    
    // Create redirect response and preserve any relevant cookies
    const response = NextResponse.redirect(callbackUrl.toString());
    
    // Forward any auth-related cookies from the original request
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      response.headers.set('cookie', cookieHeader);
    }
    
    return response;

  } catch (error) {
    console.error('OAuth proxy error:', error);
    const fallbackUrl = process.env.NEXTAUTH_URL || 'https://www.revly.health';
    return NextResponse.redirect(`${fallbackUrl}/auth/error?error=proxy_error`);
  }
}

/**
 * Health check
 */
export async function POST() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}