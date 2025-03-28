import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { encode, decode } from 'next-auth/jwt';
import { markUserAsPaid } from '@/lib/auth';

// Secret used for token generation - must match NextAuth
const secret = process.env.NEXTAUTH_SECRET || 'default-secret-change-me';

// Create a secure endpoint that redirects to Google auth but pre-registers the iOS user
export async function GET(request: NextRequest) {
  try {
    // Extract email parameter if provided
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    
    // Generate a strong identifier for this authentication attempt
    const authId = `ios-auth-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    // Pre-register a generic iOS user ID if no email provided
    // This ensures all iOS authentication attempts bypass payment verification
    if (email) {
      console.log(`iOS auth: Pre-registering user with email ${email}`);
      markUserAsPaid(email);
    } else {
      // If no email provided, we'll create a placeholder that will be replaced later
      console.log(`iOS auth: Pre-registering generic iOS user with ID ${authId}`);
      markUserAsPaid(`ios-temp-${authId}@revly.health`);
    }
    
    // Redirect to the Google sign-in flow with special iOS flags
    const redirectUrl = new URL('/api/auth/signin/google', request.url);
    
    // Add special state parameter that will be preserved through all redirects
    const stateData = {
      platform: 'ios',
      redirect: 'health.revly://auth',
      timestamp: Date.now(),
      authId: authId,  // Include the auth ID for tracking
      iosBypass: true  // Special flag to guarantee bypassing payment check
    };
    
    // Add callbackUrl to ensure proper redirection after Google auth
    redirectUrl.searchParams.set('callbackUrl', '/auth/mobile-callback');
    redirectUrl.searchParams.set('state', JSON.stringify(stateData));
    
    console.log(`iOS auth: Redirecting to Google auth with state: ${JSON.stringify(stateData)}`);
    
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Error in iOS auth route:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

// API endpoint to register iOS users for preflight
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { email } = data;
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    // Mark the user as paid to bypass payment requirements
    const result = markUserAsPaid(email);
    
    if (result) {
      console.log(`iOS user ${email} pre-registered via API call`);
      return NextResponse.json({ 
        success: true, 
        message: 'User pre-registered for authentication'
      });
    } else {
      return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in iOS auth route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 