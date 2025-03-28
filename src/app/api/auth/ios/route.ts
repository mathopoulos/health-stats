import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { encode, decode } from 'next-auth/jwt';
import { markUserAsPaid } from '@/lib/auth';

// Secret used for token generation - must match NextAuth
const secret = process.env.NEXTAUTH_SECRET || 'default-secret-change-me';

// Direct iOS auth handler
export async function GET(request: NextRequest) {
  try {
    // Extract email and redirect params
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }
    
    // Always mark iOS users as paid to avoid payment flows
    markUserAsPaid(email);
    
    // Generate a JWT token directly without going through NextAuth
    // This token will be similar to what NextAuth would generate
    const token = await encode({
      token: {
        email,
        name: email.split('@')[0], // Basic name from email
        sub: `ios-user-${Buffer.from(email).toString('base64')}`, // User ID
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
        jti: crypto.randomUUID(),
        isIosApp: true,
      },
      secret,
    });
    
    // Redirect directly to the iOS app with the token
    return NextResponse.redirect(`health.revly://auth?token=${token}`);
  } catch (error) {
    console.error('Error in direct iOS auth:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

// Allows registering an iOS user via POST
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { email } = data;
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    // Mark the user as paid directly
    const result = markUserAsPaid(email);
    
    if (result) {
      console.log(`iOS user ${email} marked as paid via direct API call`);
      
      // Generate a token for this user
      const token = await encode({
        token: {
          email,
          name: email.split('@')[0],
          sub: `ios-user-${Buffer.from(email).toString('base64')}`,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
          jti: crypto.randomUUID(),
          isIosApp: true,
        },
        secret,
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'User authenticated',
        token
      });
    } else {
      return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in iOS auth route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 