import { NextRequest, NextResponse } from 'next/server';
import { 
  ProxyState,
  parseState, 
  verifyState, 
  isTrustedDomain, 
  extractTargetUrl,
  buildCallbackUrl,
  buildErrorUrl,
  addOAuthParams
} from './proxy-utils';

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

/**
 * Handle OAuth error responses
 */
function handleOAuthError(error: string, state?: string): NextResponse {
  console.error('OAuth proxy: OAuth provider returned error', error);
  
  const targetUrl = extractTargetUrl(state);
  const errorUrl = buildErrorUrl(targetUrl, error);
  
  return NextResponse.redirect(errorUrl);
}

/**
 * Validate required OAuth parameters
 */
function validateParameters(code: string | null, state: string | null): NextResponse | null {
  if (!code || !state) {
    console.error('OAuth proxy: Missing required parameters', { code: !!code, state: !!state });
    const fallbackUrl = process.env.NEXTAUTH_URL || 'https://www.revly.health';
    return NextResponse.redirect(`${fallbackUrl}/auth/error?error=missing_parameters`);
  }
  return null;
}

/**
 * Process OAuth success callback
 */
function processSuccessCallback(
  decodedState: ProxyState, 
  code: string, 
  additionalParams: Record<string, string | null>
): NextResponse {
  // Build target URL with OAuth code
  const targetUrl = new URL(decodedState.targetUrl);
  targetUrl.searchParams.set('code', code);
  
  // Restore original state if it existed
  if (decodedState.originalState) {
    targetUrl.searchParams.set('state', decodedState.originalState);
  }

  // Add OAuth parameters
  addOAuthParams(targetUrl, additionalParams);

  if (process.env.NODE_ENV === 'development') {
    console.log('OAuth proxy: Redirecting to target', {
      target: targetUrl.toString(),
      hasOriginalState: !!decodedState.originalState
    });
  }

  return NextResponse.redirect(targetUrl.toString());
}

/**
 * Handle OAuth callback and redirect to target environment
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Reduced logging for production
  if (process.env.NODE_ENV === 'development') {
    console.log('OAuth proxy: Received callback', {
      hasCode: !!code,
      hasState: !!state,
      error: error || 'none'
    });
  }

  // Handle OAuth errors first
  if (error) {
    return handleOAuthError(error, state || undefined);
  }

  // Validate required parameters
  const validationError = validateParameters(code, state);
  if (validationError) {
    return validationError;
  }

  try {
    // Parse and validate state
    const decodedState = parseState(state!);
    if (!decodedState) {
      console.error('OAuth proxy: Failed to parse state');
      const fallbackUrl = process.env.NEXTAUTH_URL || 'https://www.revly.health';
      return NextResponse.redirect(`${fallbackUrl}/auth/error?error=invalid_state`);
    }
    
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

    // Extract additional OAuth parameters
    const additionalParams = {
      scope: searchParams.get('scope'),
      authuser: searchParams.get('authuser'),
      prompt: searchParams.get('prompt')
    };

    return processSuccessCallback(decodedState, code!, additionalParams);

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
