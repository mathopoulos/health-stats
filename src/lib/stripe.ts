import Stripe from 'stripe';

// For development mode, we can bypass Stripe entirely
const isDevelopment = process.env.NODE_ENV === 'development';

// Initialize Stripe with the secret key only if it's available
let stripe: Stripe | null = null;

try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2022-11-15' as Stripe.LatestApiVersion,
    });
    console.log('Stripe initialized successfully');
  } else {
    console.warn('No Stripe secret key found in environment variables');
  }
} catch (error) {
  console.error('Error initializing Stripe:', error);
}

export default stripe;

// Simple function to track users who have paid
const paidUsers = new Set<string>();

export function markUserAsPaid(email: string) {
  if (email) {
    paidUsers.add(email);
    console.log(`User ${email} marked as paid`);
    return true;
  }
  return false;
}

export function hasUserPaid(email: string) {
  return paidUsers.has(email);
} 