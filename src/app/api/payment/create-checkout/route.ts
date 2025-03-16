import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';

// Price IDs for different environments
const PRICE_ID = process.env.NODE_ENV === 'production'
  ? process.env.STRIPE_LIVE_PRICE_ID
  : process.env.STRIPE_TEST_PRICE_ID;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!PRICE_ID) {
      return NextResponse.json(
        { error: 'Stripe price ID is not configured' },
        { status: 500 }
      );
    }

    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/auth/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/auth/checkout`,
      customer_email: email,
      metadata: {
        userEmail: email,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 