import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';

// Price IDs for different environments
const PRICE_ID = process.env.NODE_ENV === 'production'
  ? process.env.STRIPE_LIVE_PRICE_ID
  : process.env.STRIPE_TEST_PRICE_ID;

// Get the base URL for the environment
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

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

    // First, try to find an existing customer
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    let customerId;

    if (customers.data.length > 0) {
      // Use existing customer
      customerId = customers.data[0].id;
    } else {
      // Create a new customer
      const customer = await stripe.customers.create({
        email: email,
        metadata: {
          source: 'revly.health'
        }
      });
      customerId = customer.id;
    }

    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId, // Use the customer ID
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'payment',
      allow_promotion_codes: true, // Enable promotion codes
      success_url: `${BASE_URL}/auth/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/auth/checkout`,
      metadata: {
        userEmail: email,
        priceId: PRICE_ID
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