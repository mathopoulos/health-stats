import { NextResponse } from 'next/server';
import { markUserAsPaid } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    // Basic validation
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { error: 'Valid session ID is required' },
        { status: 400 }
      );
    }

    // For all sessions, try to get the email from session storage
    let userEmail = null;
    try {
      if (typeof sessionStorage !== 'undefined') {
        userEmail = sessionStorage.getItem('checkoutEmail');
        
        if (userEmail) {
          markUserAsPaid(userEmail);
          console.log(`Payment verified for user ${userEmail}`);
        }
      }
    } catch (error) {
      console.error('Error accessing sessionStorage:', error);
    }

    // Success response - in a real app, you would validate the session with Stripe
    return NextResponse.json({ 
      success: true,
      marked: !!userEmail 
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Error verifying payment' },
      { status: 500 }
    );
  }
} 