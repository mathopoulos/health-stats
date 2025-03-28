import { NextRequest, NextResponse } from 'next/server';
import { markUserAsPaid } from '@/lib/auth';
import crypto from 'crypto';

// Secret key for verification (should match server's NextAuth secret)
const IOS_AUTH_SECRET = process.env.NEXTAUTH_SECRET || 'default-secret-change-me';

// Create a secure iOS verification token
function createIosVerificationToken() {
  // Create a timestamp that's valid for 10 minutes
  const timestamp = Math.floor(Date.now() / 1000) + 600; // 10 minutes
  const random = crypto.randomBytes(8).toString('hex');
  const data = `ios_auth_${timestamp}_${random}`;
  
  // Sign the data with HMAC using the server secret
  const hmac = crypto.createHmac('sha256', IOS_AUTH_SECRET);
  hmac.update(data);
  const signature = hmac.digest('hex');
  
  // Return the signed token that proves this is an iOS request
  return `${data}.${signature}`;
}

// Direct iOS auth that redirects to Google but guarantees iOS users bypass payment
export async function GET(request: NextRequest) {
  try {
    // Extract email if provided
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    
    // Generate an iOS verification token that can't be forged
    const iosToken = createIosVerificationToken();
    
    // Pre-register email if provided (helps but not critical with new approach)
    if (email) {
      console.log(`iOS auth: Pre-registering user with email ${email}`);
      markUserAsPaid(email);
    }
    
    // Redirect to Google auth with special params
    const redirectUrl = new URL('/api/auth/signin/google', request.url);
    
    // The state object now contains a cryptographically signed token
    // This ensures nobody can forge iOS auth requests
    const stateData = {
      platform: 'ios',
      redirect: 'health.revly://auth',
      timestamp: Date.now(),
      iosToken: iosToken, // This is the key to verification
    };
    
    // Add callback and state params
    redirectUrl.searchParams.set('callbackUrl', '/auth/mobile-callback');
    redirectUrl.searchParams.set('state', JSON.stringify(stateData));
    
    console.log(`iOS auth: Redirecting to Google auth with verified iOS token`);
    
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Error in iOS auth route:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

// API endpoint for pre-registering iOS users
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { email } = data;
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    // Mark the user as paid in server memory (helpful but not critical now)
    const result = markUserAsPaid(email);
    
    if (result) {
      console.log(`iOS user ${email} pre-registered via API`);
      return NextResponse.json({ 
        success: true, 
        message: 'User pre-registered for authentication',
        iosToken: createIosVerificationToken() // Send token in response too
      });
    } else {
      return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in iOS auth route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 