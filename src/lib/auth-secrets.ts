/**
 * Shared secret management for OAuth proxy
 * 
 * This ensures consistent secret usage across the proxy route and utilities
 */

export function getOAuthProxySecret(): string {
  return process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me';
}
