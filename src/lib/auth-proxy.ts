import crypto from 'crypto';
import { getOAuthProxySecret } from './auth-secrets';

/**
 * Auth Proxy Utilities
 * 
 * These utilities help generate and manage the state parameter for the OAuth proxy flow.
 * They ensure secure communication between the OAuth provider and the target environment.
 */

interface ProxyState {
  targetUrl: string;      // Where to redirect back to
  originalState?: string; // Original state from the OAuth flow
  signature: string;      // HMAC signature for integrity
  timestamp: number;      // When the state was created
}

const PROXY_SECRET = getOAuthProxySecret();

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
 * Get the base URL for the current environment
 */
export function getBaseUrl(): string {
  // Production URL
  if (process.env.NODE_ENV === 'production' && process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  
  // Vercel preview deployment
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Development fallback
  return 'http://localhost:3000';
}

/**
 * Get the OAuth proxy URL (stable redirect URI)
 */
export function getProxyUrl(): string {
  // In production, use the stable proxy domain
  if (process.env.NODE_ENV === 'production') {
    return process.env.OAUTH_PROXY_URL || 'https://auth.revly.health/api/auth/proxy';
  }
  
  // For development and preview, we'll use a fallback
  // This allows testing without setting up the proxy domain
  const baseUrl = getBaseUrl();
  return `${baseUrl}/api/auth/proxy`;
}

/**
 * Generate a proxy state parameter that encodes the target redirect URL
 */
export function generateProxyState(originalState?: string): string {
  const targetUrl = `${getBaseUrl()}/api/auth/callback/google`;
  const timestamp = Date.now();
  
  // Create signature
  const dataToSign = `${targetUrl}:${originalState || ''}:${timestamp}`;
  const signature = generateSignature(dataToSign);
  
  const proxyState: ProxyState = {
    targetUrl,
    originalState,
    signature,
    timestamp
  };
  
  // Base64 encode the state object
  return Buffer.from(JSON.stringify(proxyState)).toString('base64');
}

/**
 * Check if we should use the proxy for OAuth redirects
 */
export function shouldUseProxy(): boolean {
  // Always use proxy in production
  if (process.env.NODE_ENV === 'production') {
    return true;
  }
  
  // Use proxy for Vercel preview deployments
  if (process.env.VERCEL_URL && process.env.VERCEL_ENV === 'preview') {
    return true;
  }
  
  // Use proxy if explicitly enabled
  if (process.env.USE_OAUTH_PROXY === 'true') {
    return true;
  }
  
  // For local development, don't use proxy by default
  return false;
}

/**
 * Get the redirect URI for OAuth provider configuration
 * This returns either the proxy URL or the direct callback URL
 */
export function getOAuthRedirectUri(): string {
  if (shouldUseProxy()) {
    return getProxyUrl();
  }
  
  return `${getBaseUrl()}/api/auth/callback/google`;
}

/**
 * Modify OAuth authorization URL to use proxy if needed
 */
export function modifyOAuthUrl(url: string, originalState?: string): string {
  if (!shouldUseProxy()) {
    return url;
  }
  
  try {
    const authUrl = new URL(url);
    
    // Replace redirect_uri with proxy URL
    authUrl.searchParams.set('redirect_uri', getProxyUrl());
    
    // Replace state with proxy state
    const proxyState = generateProxyState(originalState);
    authUrl.searchParams.set('state', proxyState);
    
    return authUrl.toString();
  } catch (error) {
    console.error('Auth proxy: Error modifying OAuth URL', error);
    return url;
  }
}
