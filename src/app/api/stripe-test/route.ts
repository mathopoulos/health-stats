import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';

export async function GET() {
  try {
    // Just try to retrieve something simple from Stripe
    const keyPreview = process.env.STRIPE_SECRET_KEY?.substring(0, 8) + '...';
    console.log('Testing Stripe connectivity with key beginning with:', keyPreview);
    
    const balance = await stripe.balance.retrieve();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Stripe connection successful',
      balanceAvailable: balance.available.length > 0 ? balance.available[0].amount : 0
    });
  } catch (error: any) {
    console.error('Stripe connectivity test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode
    }, { status: 500 });
  }
} 