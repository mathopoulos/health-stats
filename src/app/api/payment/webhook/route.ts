import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import stripe from '@/lib/stripe';
import { markUserAsPaid } from '@/lib/auth';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing Stripe signature' },
      { status: 400 }
    );
  }

  // Check if Stripe client is available
  if (!stripe) {
    console.error('Stripe client not initialized');
    return NextResponse.json(
      { error: 'Stripe client not initialized' },
      { status: 500 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Extract the user email from the session metadata
    const userEmail = session.metadata?.userEmail || session.customer_email;
    
    if (userEmail) {
      // Mark the user as having paid access
      markUserAsPaid(userEmail);
      console.log(`User ${userEmail} has been marked as paid via webhook!`);
    } else {
      console.error('No user email found in the session');
    }
  }

  return NextResponse.json({ received: true });
} 