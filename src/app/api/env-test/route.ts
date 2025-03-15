import { NextResponse } from 'next/server';

export async function GET() {
  // Check if environment variables are loaded
  const hasStripeKey = !!process.env.STRIPE_SECRET_KEY;
  const stripeKeyLength = process.env.STRIPE_SECRET_KEY?.length || 0;
  
  // Only show first 4 chars for security
  const stripeKeyPreview = process.env.STRIPE_SECRET_KEY 
    ? `${process.env.STRIPE_SECRET_KEY.substring(0, 4)}...${process.env.STRIPE_SECRET_KEY.substring(stripeKeyLength - 4)}`
    : 'not found';
  
  return NextResponse.json({
    environment: process.env.NODE_ENV,
    hasStripeKey,
    stripeKeyLength,
    stripeKeyPreview,
    allEnvKeys: Object.keys(process.env).filter(key => 
      key.includes('STRIPE') || key.includes('NEXT_PUBLIC')
    )
  });
} 