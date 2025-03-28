import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { markUserAsPaid } from '@/lib/auth';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  try {
    // Extract the state parameter to preserve it
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    
    // Redirect to the Google sign-in page with platform=ios and special flag
    const newUrl = new URL('/auth/signin', request.url);
    newUrl.searchParams.set('platform', 'ios');
    newUrl.searchParams.set('ios_direct', 'true');
    
    // Add email if provided
    if (email) {
      newUrl.searchParams.set('email', email);
    }
    
    return NextResponse.redirect(newUrl);
  } catch (error) {
    console.error('Error in iOS auth route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get data from request
    const data = await request.json();
    const { email } = data;
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    // Mark the user as paid directly
    const result = markUserAsPaid(email);
    
    if (result) {
      console.log(`iOS user ${email} marked as paid via direct API call`);
      return NextResponse.json({ success: true, message: 'User marked as paid' });
    } else {
      return NextResponse.json({ error: 'Failed to mark user as paid' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in iOS auth route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 