import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * OAuth Proxy Callback for Vercel Preview Deployments
 * 
 * This endpoint receives the user after OAuth completion on production
 * and redirects them back to their original preview deployment with session info.
 */

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const searchParams = url.searchParams;
  
  // Get the original preview URL to return to
  const returnUrl = searchParams.get('return_url');
  
  if (!returnUrl) {
    return NextResponse.json(
      { error: 'return_url parameter is required' }, 
      { status: 400 }
    );
  }

  try {
    // Validate return URL
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

    // Get the user's session (should be available after OAuth)
    const session = await getServerSession(authOptions);
    
    if (!session) {
      // If no session, redirect to signin with error
      const errorUrl = new URL(returnUrl);
      errorUrl.pathname = '/auth/signin';
      errorUrl.searchParams.set('error', 'oauth_proxy_no_session');
      return NextResponse.redirect(errorUrl.toString());
    }

    // Create return URL with success indicator
    const successUrl = new URL(returnUrl);
    
    // If the return URL doesn't already have a path, default to upload
    if (successUrl.pathname === '/') {
      successUrl.pathname = '/upload';
    }
    
    // Add success parameter
    successUrl.searchParams.set('oauth_success', 'true');
    
    console.log(`OAuth Proxy Callback: Redirecting back to preview: ${successUrl.toString()}`);
    
    // Create response with redirect
    const response = NextResponse.redirect(successUrl.toString());
    
    // Copy session cookies from current request to response
    // This ensures the session is available on the preview deployment
    const cookies = request.headers.get('cookie');
    if (cookies) {
      // Parse and re-set session cookies for the preview domain
      const sessionCookies = cookies
        .split(';')
        .filter(cookie => cookie.includes('next-auth'))
        .map(cookie => cookie.trim());
      
      for (const cookie of sessionCookies) {
        const [name, value] = cookie.split('=');
        if (name && value) {
          // Set cookie for preview domain
          response.cookies.set(name, value, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            path: '/',
            domain: returnUrlObj.hostname.includes('vercel.app') ? undefined : returnUrlObj.hostname
          });
        }
      }
    }
    
    return response;
    
  } catch (error) {
    console.error('OAuth proxy callback error:', error);
    
    // Try to redirect to return URL with error
    try {
      const errorUrl = new URL(returnUrl);
      errorUrl.pathname = '/auth/signin';
      errorUrl.searchParams.set('error', 'oauth_proxy_error');
      return NextResponse.redirect(errorUrl.toString());
    } catch {
      return NextResponse.json(
        { error: 'OAuth proxy callback failed' }, 
        { status: 500 }
      );
    }
  }
}
