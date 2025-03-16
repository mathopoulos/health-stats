import Stripe from 'stripe';

// For development mode, we can bypass Stripe entirely
const isDevelopment = process.env.NODE_ENV === 'development';

// Get the API version from environment variables or use a default
const apiVersion = process.env.STRIPE_API_VERSION || '2022-11-15';
console.log(`Using Stripe API version: ${apiVersion}`);

// Initialize Stripe with the secret key only if it's available
let stripe: Stripe | null = null;

try {
  if (process.env.STRIPE_SECRET_KEY) {
    // Remove any quotes that might be in the environment variable
    const stripeKey = process.env.STRIPE_SECRET_KEY.replace(/"/g, '').trim();
    console.log('Initializing Stripe with key starting with:', stripeKey.substring(0, 8) + '...');
    console.log('Key length:', stripeKey.length);
    
    // Use minimal configuration to avoid potential issues
    stripe = new Stripe(stripeKey, {
      apiVersion: apiVersion as Stripe.LatestApiVersion,
    });
    
    console.log('Stripe initialized successfully');
  } else {
    console.warn('No Stripe secret key found in environment variables');
    console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('STRIPE')));
  }
} catch (error) {
  console.error('Error initializing Stripe:', error);
}

// Export a function to get the Stripe instance, which will attempt to initialize it if it's null
export function getStripe(): Stripe | null {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    try {
      // Remove any quotes that might be in the environment variable
      const stripeKey = process.env.STRIPE_SECRET_KEY.replace(/"/g, '').trim();
      
      // Use minimal configuration to avoid potential issues
      stripe = new Stripe(stripeKey, {
        apiVersion: apiVersion as Stripe.LatestApiVersion,
      });
      console.log('Stripe initialized lazily on demand');
    } catch (error) {
      console.error('Error initializing Stripe on demand:', error);
    }
  }
  return stripe;
}

// Function to make a direct API call to Stripe using axios
export async function makeStripeApiCall(endpoint: string = 'customers', queryParams: string = ''): Promise<any> {
  // Import axios dynamically
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

// Simple function to test Stripe connectivity
export async function testStripeConnection(): Promise<{ success: boolean; message: string; error?: any }> {
  try {
    const data = await makeStripeApiCall('customers', '?limit=1');
    return { 
      success: true, 
      message: 'Stripe connection successful'
    };
  } catch (error: any) {
    console.error('Stripe connection test failed:', error);
    return {
      success: false,
      message: 'Stripe connection failed',
      error: error.message || error
    };
  }
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

// Function to check if a user has purchased a product
export async function hasUserPurchasedProduct(email: string, productId?: string): Promise<boolean> {
  try {
    // Use axios for reliable API calls
    console.log(`Checking if user ${email} has purchased product ${productId || 'any'}`);
    
    // Find customer by email
    const customersData = await makeStripeApiCall('customers', `?email=${encodeURIComponent(email)}&limit=1`);
    
    if (!customersData.data || customersData.data.length === 0) {
      console.log(`No customer found with email: ${email}`);
      return false;
    }
    
    const customerId = customersData.data[0].id;
    console.log(`Found customer with ID: ${customerId}`);
    
    // Get all successful payments for this customer
    const paymentsData = await makeStripeApiCall('payment_intents', `?customer=${customerId}&limit=100`);
    
    console.log(`Found ${paymentsData.data.length} payments for customer`);
    
    // Check if any payment was successful
    const hasPurchased = paymentsData.data.some((payment: any) => {
      const isSuccessful = payment.status === 'succeeded';
      const matchesProduct = !productId || payment.metadata?.productId === productId;
      return isSuccessful && matchesProduct;
    });
    
    if (hasPurchased) {
      // If they've purchased, also mark them as paid in our local cache
      markUserAsPaid(email);
      console.log(`User ${email} has purchased, marking as paid`);
    } else {
      console.log(`User ${email} has not purchased`);
    }
    
    return hasPurchased;
  } catch (error: any) {
    console.error('Error checking purchase status:', error);
    
    // Fall back to the library approach if direct API call fails
    const stripeInstance = getStripe();
    
    if (!stripeInstance || !email) {
      console.log('Cannot check purchase: Stripe not initialized or email missing');
      return false;
    }
    
    try {
      console.log(`Falling back to library approach to check if user ${email} has purchased`);
      
      // Find the customer by email
      const customers = await stripeInstance.customers.list({
        email: email,
        limit: 1,
      });
      
      if (customers.data.length === 0) {
        console.log(`No customer found with email: ${email} (via library)`);
        return false;
      }
      
      const customerId = customers.data[0].id;
      console.log(`Found customer with ID: ${customerId} (via library)`);
      
      // Get all successful payments for this customer
      const payments = await stripeInstance.paymentIntents.list({
        customer: customerId,
        limit: 100,
      });
      
      console.log(`Found ${payments.data.length} payments for customer (via library)`);
      
      // Check if any payment was successful
      const hasPurchased = payments.data.some(payment => {
        const isSuccessful = payment.status === 'succeeded';
        const matchesProduct = !productId || payment.metadata?.productId === productId;
        return isSuccessful && matchesProduct;
      });
      
      if (hasPurchased) {
        // If they've purchased, also mark them as paid in our local cache
        markUserAsPaid(email);
        console.log(`User ${email} has purchased, marking as paid (via library)`);
      } else {
        console.log(`User ${email} has not purchased (via library)`);
      }
      
      return hasPurchased;
    } catch (libraryError) {
      console.error('Error checking purchase status via library:', libraryError);
      return false;
    }
  }
} 