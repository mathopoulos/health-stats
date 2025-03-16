import { NextResponse } from 'next/server';
import { hasUserPurchasedProduct } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json({ 
        error: 'Email is required' 
      }, { status: 400 });
    }
    
    console.log(`Checking purchase status for email: ${email}`);
    
    // Use the hasUserPurchasedProduct function with our reliable approach
    const hasPurchased = await hasUserPurchasedProduct(email);
    
    return NextResponse.json({ 
      hasPurchased,
      email 
    });
  } catch (error: any) {
    console.error('Error checking purchase status:', error);
    
    return NextResponse.json({ 
      error: error.message || 'Failed to check purchase status',
      hasPurchased: false
    }, { status: 500 });
  }
} 