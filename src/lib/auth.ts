import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { hasUserPurchasedProduct } from './stripe';

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
        // For mobile auth, we'll skip payment checks if the state contains 'platform=ios'
        // This assumes the JWT verification is sufficient for mobile auth
        if (account?.provider === 'google' && account.state) {
          try {
            const stateData = JSON.parse(account.state as string);
            if (stateData.platform === 'ios') {
              console.log(`iOS app authentication for ${user.email}, skipping payment check`);
              authenticatedUsers.add(user.email);
              return true;
            }
          } catch (e) {
            // Continue with normal flow if state isn't parseable
            console.log('Unable to parse state parameter:', e);
          }
        }

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
        // Add the user ID to the session
        session.user.id = token.sub;
        // Make access token available to the client for iOS app
        session.accessToken = token.accessToken as string | undefined;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        // Add any additional user info to the token if needed
        token.id = user.id;
      }
      // Pass the access token to the JWT if available
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      // Get the production URL from env
      const productionUrl = process.env.NEXTAUTH_URL || baseUrl;
      
      // For iOS app callback
      if (url.startsWith('health.revly://')) {
        return url;
      }
      
      // Check if this is a callback and there's state data with platform=ios
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