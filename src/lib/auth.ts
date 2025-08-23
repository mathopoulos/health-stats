import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { hasUserPurchasedProduct } from '@/server/payments/stripe';
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

// Removed preview URL cache - no longer needed for simplified staging workflow

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

// Get the production URL
export function getProductionUrl(): string {
  return process.env.NEXTAUTH_URL || 'https://www.revly.health';
}



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

// Force NextAuth to use HTTPS and proper URL construction
const getBaseUrl = () => {
  // Use NEXTAUTH_URL if available (production and staging)
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  
  // Fallback for local development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  
  // This should not happen in production/staging
  throw new Error('NEXTAUTH_URL environment variable is required');
};

export const authOptions: NextAuthOptions = {
  // Ensure secure cookies in production and staging
  useSecureCookies: process.env.NODE_ENV === 'production' || process.env.NEXTAUTH_URL?.includes('https'),
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
      if (session.user) {
        // Use token.id (which we set in JWT callback) or fall back to token.sub
        session.user.id = (token.id || token.sub || session.user.email || 'unknown') as string;
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
        token.accessToken = account.access_token;
        
        // Check for iOS authentication in state (simplified)
        try {
          if (account.state) {
            const stateData = JSON.parse(account.state as string);
            console.log("JWT callback - parsed state data:", stateData);
            
            // Set iOS flag if we have a verified token or legacy indicators
            if ((stateData.iosToken && verifyIosToken(stateData.iosToken)) || 
                stateData.platform === 'ios' || 
                stateData.iosBypass === true) {
              token.isIosApp = true;
              console.log("JWT callback - stored iOS flag in token");
            }
          }
        } catch (e) {
          console.error('Error parsing state in JWT callback:', e);
        }
      }
      
      if (user) {
        // For Google OAuth, user.id might be undefined, so use email or sub as fallback
        token.id = user.id || user.email || token.sub || 'unknown';
      }
      
      // Ensure token always has an ID (string value)
      if (!token.id) {
        token.id = token.sub || token.email || 'unknown';
      }
      
      return token;
    },
    async redirect({ url, baseUrl }) {
      console.log("=== NextAuth Redirect (Simplified) ===");
      console.log("Redirect URL:", url);
      console.log("Base URL:", baseUrl);
      console.log("NEXTAUTH_URL env:", process.env.NEXTAUTH_URL);
      
      const currentEnvUrl = getBaseUrl();
      console.log("Current environment URL:", currentEnvUrl);
      
      // Direct iOS app URL scheme redirect - highest priority
      if (url.startsWith('health.revly://')) {
        console.log("✅ iOS app redirect detected");
        return url;
      }
      
      // Handle iOS authentication flows
      if (url.includes('state=')) {
        try {
          const urlObj = new URL(url.startsWith('http') ? url : `${baseUrl}${url}`);
          const state = urlObj.searchParams.get('state');
          
          if (state) {
            const stateData = JSON.parse(state);
            
            // Check if this is iOS auth
            if ((stateData?.iosToken && verifyIosToken(stateData.iosToken)) || 
                stateData?.platform === 'ios' || 
                stateData?.iosBypass === true) {
              
              if (url.includes('/auth/checkout') || url.includes('error=')) {
                console.log("✅ iOS auth: Redirecting to mobile callback");
                return `${currentEnvUrl}/auth/mobile-callback?state=${encodeURIComponent(state)}&iosRedirect=true`;
              }
              
              if (url.includes('/api/auth/callback/google')) {
                console.log("✅ iOS auth: Google callback to mobile callback");
                return `${currentEnvUrl}/auth/mobile-callback?state=${encodeURIComponent(state)}`;
              }
            }
          }
        } catch (e) {
          console.log('Could not parse state:', e);
        }
      }
      
      // Mobile callback page
      if (url.includes('/auth/mobile-callback')) {
        console.log("✅ iOS mobile callback");
        return url;
      }
      
      // Auth error handling
      if (url.includes('error=Callback') || url.includes('error=AccessDenied')) {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Development auth error, redirecting to upload');
          return `${currentEnvUrl}/upload`;
        }
        console.log('✅ Production auth error, redirecting to checkout');
        return `${currentEnvUrl}/auth/checkout`;
      }
      
      // Successful auth - redirect to upload page
      if (url.includes('auth/callback') || url.includes('api/auth/callback') || url.includes('/upload')) {
        console.log("✅ Successful auth, redirecting to upload page");
        return `${currentEnvUrl}/upload`;
      }
      
      // If URL is for the same domain, use it
      if (url.startsWith(currentEnvUrl) || url.startsWith(baseUrl)) {
        console.log("✅ Same domain redirect");
        return url;
      }
      
      // Default fallback - go to upload page
      console.log("✅ Default fallback to upload page");
      return `${currentEnvUrl}/upload`;
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