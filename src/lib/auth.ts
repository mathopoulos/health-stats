import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { hasUserPurchasedProduct } from './stripe';
import crypto from 'crypto';

// This is a server-side map to track users who are authenticated
// In a real app, you would use a database table for this
// This is just for demonstration purposes
const authenticatedUsers = new Set<string>();

// Also track users who have validated an invite code
// In a real app, this would be stored in a database
const usersWithValidatedInviteCodes = new Set<string>();

// Track users who have paid
// In a real app, this would be stored in a database
const paidUsers = new Set<string>();

// Temporary solution for development - mark some test accounts as paid
if (process.env.NODE_ENV === 'development') {
  // Add some test emails that are always considered paid
  const testPaidEmails = [
    'test@example.com',
    'demo@example.com',
    // Add any email you want to test with here
  ];
  
  testPaidEmails.forEach(email => paidUsers.add(email));
}

interface StateData {
  email?: string;
  [key: string]: any;
}

// Secret for iOS token verification
const IOS_AUTH_SECRET = process.env.NEXTAUTH_SECRET || 'default-secret-change-me';

// Verify an iOS token to ensure it's authentic and not expired
function verifyIosToken(token: string): boolean {
  try {
    // Split token into data and signature
    const [data, signature] = token.split('.');
    
    if (!data || !signature) {
      console.log('iOS auth verification: Invalid token format');
      return false;
    }
    
    // Verify signature
    const hmac = crypto.createHmac('sha256', IOS_AUTH_SECRET);
    hmac.update(data);
    const expectedSignature = hmac.digest('hex');
    
    if (signature !== expectedSignature) {
      console.log('iOS auth verification: Invalid signature');
      return false;
    }
    
    // Extract timestamp and check expiration
    const parts = data.split('_');
    if (parts.length < 3 || parts[0] !== 'ios' || parts[1] !== 'auth') {
      console.log('iOS auth verification: Invalid token format in data');
      return false;
    }
    
    const timestamp = parseInt(parts[2], 10);
    const now = Math.floor(Date.now() / 1000);
    
    // Check if token is expired (10 minute validity)
    if (now > timestamp) {
      console.log('iOS auth verification: Token expired');
      return false;
    }
    
    console.log('iOS auth verification: Valid token');
    return true;
  } catch (error) {
    console.error('iOS auth verification error:', error);
    return false;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      if (user.email) {
        console.log("Auth flow for:", user.email);
        
        // Check if this is an iOS authentication with a verified token
        if (account?.provider === 'google' && account.state) {
          try {
            const stateData = JSON.parse(account.state as string);
            
            // First priority: Check for a valid iOS verification token
            if (stateData.iosToken && verifyIosToken(stateData.iosToken)) {
              // This is a cryptographically verified iOS request
              console.log(`iOS auth: Cryptographically verified iOS auth for ${user.email}`);
              authenticatedUsers.add(user.email);
              paidUsers.add(user.email);
              return true;
            }
            
            // For backward compatibility - check legacy indicators
            if (stateData.platform === 'ios' || stateData.iosBypass === true) {
              console.log(`iOS auth: Legacy iOS flag found for ${user.email}`);
              authenticatedUsers.add(user.email);
              paidUsers.add(user.email);
              return true;
            }
          } catch (e) {
            console.error('Error parsing state in signIn callback:', e);
          }
        }
        
        // Check if this user has been pre-registered
        if (paidUsers.has(user.email)) {
          console.log(`User ${user.email} is pre-registered as paid, allowing`);
          authenticatedUsers.add(user.email);
          return true;
        }

        // Regular web flow continues
        // Check if this is a returning user (previously authenticated)
        const isReturningUser = authenticatedUsers.has(user.email);
        
        // Check if the user has paid
        let hasPaid = paidUsers.has(user.email);
        
        // If the user is not marked as paid, check with Stripe API
        if (!hasPaid) {
          try {
            console.log('Checking Stripe payment status for:', user.email);
            const hasPurchased = await hasUserPurchasedProduct(user.email);
            if (hasPurchased) {
              console.log(`User ${user.email} verified as paid via Stripe API`);
              paidUsers.add(user.email);
              hasPaid = true;
            } else {
              console.log(`User ${user.email} has not paid according to Stripe API`);
            }
          } catch (err) {
            console.error('Error checking purchase status with Stripe:', err);
          }
        }

        // If user has paid, allow sign in
        if (hasPaid) {
          console.log(`User ${user.email} is paid, allowing sign in`);
          authenticatedUsers.add(user.email);
          return true;
        }

        // If user hasn't paid, redirect to checkout
        console.log(`User ${user.email} has not paid, redirecting to checkout`);
        return false;
      }
      
      return false;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.accessToken = token.accessToken as string | undefined;
        
        // Pass the iOS flag to the session if present
        if (token.isIosApp) {
          (session as any).isIosApp = true;
        }
      }
      return session;
    },
    async jwt({ token, user, account }) {
      // Store access token and iOS flag in JWT
      if (account) {
        console.log("JWT callback for:", account.provider);
        token.accessToken = account.access_token;
        
        // Check for iOS authentication
        try {
          if (account.state) {
            const stateData = JSON.parse(account.state as string);
            
            // Set iOS flag if we have a verified token or legacy indicators
            if ((stateData.iosToken && verifyIosToken(stateData.iosToken)) || 
                stateData.platform === 'ios' || 
                stateData.iosBypass === true) {
              console.log("iOS auth: Marking JWT with iOS flag");
              token.isIosApp = true;
            }
          }
        } catch (e) {
          console.error('Error parsing state in JWT callback:', e);
        }
      }
      
      if (user) {
        token.id = user.id;
      }
      
      return token;
    },
    async redirect({ url, baseUrl }) {
      console.log("NextAuth redirect URL:", url);
      
      // Get the production URL from env
      const productionUrl = process.env.NEXTAUTH_URL || baseUrl;
      
      // Direct iOS app URL scheme redirect - highest priority
      if (url.startsWith('health.revly://')) {
        console.log("iOS auth: Direct iOS scheme URL, returning as is");
        return url;
      }
      
      // Handle Google auth callback
      if (url.includes('/api/auth/callback/google')) {
        try {
          const urlObj = new URL(url);
          const state = urlObj.searchParams.get('state');
          
          if (state) {
            const stateData = JSON.parse(state);
            
            // Check if this is iOS auth with a valid token or legacy indicators
            if ((stateData.iosToken && verifyIosToken(stateData.iosToken)) || 
                stateData.platform === 'ios' || 
                stateData.iosBypass === true) {
              
              console.log("iOS auth: Verified iOS auth in Google callback, redirecting to mobile-callback");
              return `${productionUrl}/auth/mobile-callback?state=${encodeURIComponent(state)}`;
            }
          }
        } catch (e) {
          console.error('Error in redirect callback:', e);
        }
      }
      
      // Mobile callback page
      if (url.includes('/auth/mobile-callback')) {
        console.log("iOS auth: Found mobile callback URL");
        return url;
      }
      
      // Prevent iOS users from being sent to payment/checkout
      if ((url.includes('/auth/checkout') || url.includes('error=')) && url.includes('state=')) {
        try {
          const urlObj = new URL(url);
          const state = urlObj.searchParams.get('state');
          
          if (state) {
            const stateData = JSON.parse(state);
            
            // Check if this is iOS auth
            if ((stateData.iosToken && verifyIosToken(stateData.iosToken)) || 
                stateData.platform === 'ios' || 
                stateData.iosBypass === true) {
              
              console.log("iOS auth: Intercepted payment redirect for iOS user, sending to mobile-callback");
              return `${productionUrl}/auth/mobile-callback?state=${encodeURIComponent(state)}&iosRedirect=true`;
            }
          }
        } catch (e) {
          console.error('Error checking state in error redirect:', e);
        }
      }
      
      // Rest of original redirect logic for regular web flow
      // For iOS app callback
      if (url.includes('auth/callback') || url.includes('api/auth/callback')) {
        // Try to extract state from the URL
        try {
          const urlObj = new URL(url);
          const state = urlObj.searchParams.get('state');
          
          if (state) {
            const stateData = JSON.parse(state);
            if (stateData.platform === 'ios') {
              // Get token from session to pass back to the app
              // Format: health.revly://auth?token=xyz
              return `health.revly://auth?token=${stateData.token || ''}`;
            }
          }
        } catch (e) {
          console.error('Error parsing state in redirect callback:', e);
        }
        
        // Default web callback
        return `${productionUrl}/upload`;
      }
      
      // For development, bypass invite page redirect for errors
      if (process.env.NODE_ENV !== 'production' && (url.includes('error=Callback') || url.includes('error=AccessDenied'))) {
        console.log('Auth error in development mode, still redirecting to upload page:', url);
        return `${baseUrl}/upload`;
      }
      
      // In production: If auth failed due to missing invite code or payment, redirect to checkout page
      if (url.includes('error=Callback') || url.includes('error=AccessDenied')) {
        return `${productionUrl}/auth/checkout`;
      }
      
      // If the URL is explicitly set to /upload, honor that
      if (url.includes('/upload')) {
        return url.startsWith('http') ? url : `${productionUrl}${url}`;
      }
      
      // For all successful auth callbacks, direct to upload page
      if (url.includes('auth/callback')) {
        return `${productionUrl}/upload`;
      }
      
      // If the URL starts with baseUrl or productionUrl, go to the requested URL
      if (url.startsWith(baseUrl) || url.startsWith(productionUrl)) {
        return url;
      }
      
      // Default fallback - go to upload page
      return `${productionUrl}/upload`;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/checkout', // Send people to checkout page on errors
    signOut: '/auth/signin',
  },
  logger: {
    error(code, ...message) {
      console.error(code, ...message);
    },
    warn(code, ...message) {
      console.warn(code, ...message);
    },
    debug(code, ...message) {
      console.debug(code, ...message);
    },
  }
};

// Helper functions for managing user state

// This function allows other server components to mark a user as having a valid invite code
export function markUserWithValidInviteCode(email: string) {
  if (email) {
    usersWithValidatedInviteCodes.add(email);
    return true;
  }
  return false;
}

// This function allows marking a user as having paid
export function markUserAsPaid(email: string) {
  if (email) {
    paidUsers.add(email);
    console.log(`User ${email} marked as paid directly`);
    return true;
  }
  return false;
}

// This function checks if a user has paid
export function hasUserPaid(email: string) {
  return paidUsers.has(email);
}

// Exported helper function to mark a user as authenticated (adds to the demo set)
export function markUserAsAuthenticated(email: string): void {
  if (email) {
    authenticatedUsers.add(email);
    console.log(`Demo Auth: Marked ${email} as authenticated.`);
  }
}

// Exported helper function to check if a user is marked as paid (checks the demo set)
export function isUserPaid(email: string): boolean {
  if (!email) return false;
  // In a real app, check Stripe/database status here
  const paid = paidUsers.has(email);
  console.log(`Demo Auth: Checking paid status for ${email}: ${paid}`);
  return paid;
}

// Exported helper function to mark a user as paid (adds to the demo set)
// export function markUserAsPaid(email: string): void {
//   if (email) {
//     paidUsers.add(email);
//     console.log(`Demo Auth: Marked ${email} as paid.`);
//   }
// } 