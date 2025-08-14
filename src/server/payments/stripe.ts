import Stripe from 'stripe';

const isDevelopment = process.env.NODE_ENV === 'development';
const apiVersion = process.env.STRIPE_API_VERSION || '2022-11-15';

let stripe: Stripe | null = null;

try {
  if (process.env.STRIPE_SECRET_KEY) {
    const stripeKey = process.env.STRIPE_SECRET_KEY.replace(/"/g, '').trim();
    stripe = new Stripe(stripeKey, {
      apiVersion: apiVersion as Stripe.LatestApiVersion,
    });
  }
} catch (error) {
  console.error('Error initializing Stripe:', error);
}

export function getStripe(): Stripe | null {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripeKey = process.env.STRIPE_SECRET_KEY.replace(/"/g, '').trim();
      stripe = new Stripe(stripeKey, {
        apiVersion: apiVersion as Stripe.LatestApiVersion,
      });
    } catch (error) {
      console.error('Error initializing Stripe on demand:', error);
    }
  }
  return stripe;
}

export async function makeStripeApiCall(endpoint: string = 'customers', queryParams: string = ''): Promise<any> {
  const axios = (await import('axios')).default;
  
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('No Stripe secret key found in environment variables');
  }
  
  const apiKey = process.env.STRIPE_SECRET_KEY.replace(/"/g, '').trim();
  const url = `https://api.stripe.com/v1/${endpoint}${queryParams ? queryParams : ''}`;
  
  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error making Stripe API call:', error);
    throw error;
  }
}

export async function testStripeConnection(): Promise<{ success: boolean; message: string; error?: any }> {
  try {
    await makeStripeApiCall('customers', '?limit=1');
    return { 
      success: true, 
      message: 'Stripe connection successful'
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Stripe connection failed',
      error: error.message || error
    };
  }
}

const paidUsers = new Set<string>();

export function markUserAsPaid(email: string) {
  if (email) {
    paidUsers.add(email);
    return true;
  }
  return false;
}

export function hasUserPaid(email: string) {
  return paidUsers.has(email);
}

export async function hasUserPurchasedProduct(email: string): Promise<boolean> {
  try {
    if (hasUserPaid(email)) {
      return true;
    }

    const stripeInstance = getStripe();
    if (!stripeInstance) {
      return false;
    }

    const customers = await stripeInstance.customers.list({
      email: email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return false;
    }

    const customerId = customers.data[0].id;

    const sessions = await stripeInstance.checkout.sessions.list({
      customer: customerId,
      limit: 100,
    });

    const priceId = process.env.NODE_ENV === 'production' 
      ? process.env.STRIPE_LIVE_PRICE_ID 
      : process.env.STRIPE_TEST_PRICE_ID;

    const hasPurchased = sessions.data.some(session => {
      const isSuccessful = session.payment_status === 'paid';
      const matchesPrice = session.metadata?.priceId === priceId;
      return isSuccessful && matchesPrice;
    });

    if (hasPurchased) {
      markUserAsPaid(email);
    }

    return hasPurchased;
  } catch (error) {
    console.error('Error checking purchase status:', error);
    return false;
  }
}

export default stripe;


