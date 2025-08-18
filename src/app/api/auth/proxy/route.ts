import { NextRequest, NextResponse } from 'next/server';

/**
 * OAuth Proxy for Vercel Preview Deployments
 * 
 * This endpoint solves the problem where Google OAuth requires exact redirect URIs,
 * but Vercel preview deployments have unpredictable URLs.
 * 
 * Flow:
 * 1. Preview deployment redirects OAuth to production URL
 * 2. Production completes OAuth with Google (using stable redirect URI)
 * 3. Production redirects back to preview with auth tokens
 */

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const searchParams = url.searchParams;
  
  // Get the original URL that initiated the OAuth request
  const returnUrl = searchParams.get('return_url');
  const provider = searchParams.get('provider') || 'google';
  
  if (!returnUrl) {
    return NextResponse.json(
      { error: 'return_url parameter is required' }, 
      { status: 400 }
    );
  }

  try {
    // Validate the return URL is a valid Vercel preview or localhost
    const returnUrlObj = new URL(returnUrl);
    const isValidPreviewUrl = 
      returnUrlObj.hostname.includes('vercel.app') || 
      returnUrlObj.hostname === 'localhost' ||
      returnUrlObj.hostname.includes('revly.health');

    if (!isValidPreviewUrl) {
      return NextResponse.json(
        { error: 'Invalid return URL' }, 
        { status: 400 }
      );
    }

    // Get production URL (stable URL for OAuth)
    const productionUrl = process.env.NEXTAUTH_URL || 'https://www.revly.health';
    
    // Construct OAuth initiation URL on production with return info
    const oauthUrl = new URL(`${productionUrl}/api/auth/signin/${provider}`);
    
    // Add callback URL that includes return information
    oauthUrl.searchParams.set('callbackUrl', `${productionUrl}/api/auth/proxy/callback?return_url=${encodeURIComponent(returnUrl)}`);
    
    // Preserve any additional state from the original request
    for (const [key, value] of searchParams.entries()) {
      if (key !== 'return_url' && key !== 'provider') {
        oauthUrl.searchParams.set(key, value);
      }
    }

    console.log(`OAuth Proxy: Redirecting ${returnUrl} to production OAuth: ${oauthUrl.toString()}`);
    
    // Redirect to production OAuth
    return NextResponse.redirect(oauthUrl.toString());
    
  } catch (error) {
    console.error('OAuth proxy error:', error);
    return NextResponse.json(
      { error: 'Invalid return_url format' }, 
      { status: 400 }
    );
  }
}
