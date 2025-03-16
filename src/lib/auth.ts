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
        // Check if this is a returning user (previously authenticated)
        const isReturningUser = authenticatedUsers.has(user.email);
        
        // Check if the user has a validated invite code
        let hasValidatedInvite = usersWithValidatedInviteCodes.has(user.email);
        
        // Check if the user has paid
        let hasPaid = paidUsers.has(user.email);
        
        // If a state parameter was passed with a validated email, check if it matches
        try {
          if (account?.provider === 'google' && account.state) {
            const stateData = JSON.parse(account.state as string) as StateData;
            if (stateData.email === user.email) {
              // Mark this email as having a validated invite code
              usersWithValidatedInviteCodes.add(user.email);
              hasValidatedInvite = true;
            }
          }
        } catch (err) {
          console.error('Error parsing state parameter:', err);
        }
        
        // Check for checkout email in session storage
        // This is set by the checkout page before redirecting to Stripe payment
        // and is used to mark the user as paid when they return from payment
        try {
          if (typeof window !== 'undefined') {
            const checkoutEmail = sessionStorage.getItem('checkoutEmail');
            if (checkoutEmail && checkoutEmail.toLowerCase() === user.email.toLowerCase()) {
              // Check if the user is coming from the checkout flow with the "already purchased" flag
              const alreadyPurchased = sessionStorage.getItem('alreadyPurchased');
              if (alreadyPurchased === 'true') {
                console.log(`User ${user.email} already purchased, verified from checkout flow`);
                paidUsers.add(user.email);
                hasPaid = true;
                
                // Clear the session storage after using it
                sessionStorage.removeItem('checkoutEmail');
                sessionStorage.removeItem('alreadyPurchased');
              } else {
                // Mark the user as paid
                console.log(`User ${user.email} marked as paid from checkout flow`);
                paidUsers.add(user.email);
                hasPaid = true;
                
                // Clear the session storage after using it
                sessionStorage.removeItem('checkoutEmail');
              }
            }
            
            // Also check for a flag indicating the user just completed payment
            const justPaid = sessionStorage.getItem('justCompletedPayment');
            if (justPaid === 'true') {
              // This is a user coming directly from payment
              console.log(`User ${user.email} coming directly from payment`);
              
              // If we have their email stored, mark them as paid
              const storedEmail = sessionStorage.getItem('checkoutEmail');
              if (storedEmail && storedEmail.toLowerCase() === user.email.toLowerCase()) {
                paidUsers.add(user.email);
                hasPaid = true;
                console.log(`User ${user.email} marked as paid from direct payment flow`);
                
                // Clear the flags after using them
                sessionStorage.removeItem('checkoutEmail');
                sessionStorage.removeItem('justCompletedPayment');
              }
            }
          }
        } catch (err) {
          console.error('Error checking session storage:', err);
        }
        
        // If the user is not marked as paid, check with Stripe API
        if (!hasPaid) {
          try {
            const hasPurchased = await hasUserPurchasedProduct(user.email);
            if (hasPurchased) {
              console.log(`User ${user.email} verified as paid via Stripe API`);
              paidUsers.add(user.email);
              hasPaid = true;
            }
          } catch (err) {
            console.error('Error checking purchase status with Stripe:', err);
          }
        }
        
        // TEMPORARY SOLUTION: Consider all Google users as authenticated in development
        if (process.env.NODE_ENV !== 'production') {
          // Add the user to authenticated users
          authenticatedUsers.add(user.email);
          return true;
        }
        
        // For production: If this is a new user and they haven't validated an invite code or paid,
        // reject the sign-in (this will redirect to the checkout page)
        if (!isReturningUser && !hasValidatedInvite && !hasPaid) {
          return false;
        }
        
        // Add this user to our authenticated users set for future sign-ins
        authenticatedUsers.add(user.email);
      }
      
      // Allow sign in
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        // Add the user ID to the session
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        // Add any additional user info to the token if needed
        token.id = user.id;
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      // For development, bypass invite page redirect for errors
      if (process.env.NODE_ENV !== 'production' && (url.includes('error=Callback') || url.includes('error=AccessDenied'))) {
        console.log('Auth error in development mode, still redirecting to upload page:', url);
        return `${baseUrl}/upload`;
      }
      
      // In production: If auth failed due to missing invite code or payment, redirect to checkout page
      if (url.includes('error=Callback') || url.includes('error=AccessDenied')) {
        return `${baseUrl}/auth/checkout`;
      }
      
      // If the URL is explicitly set to /upload, honor that
      if (url.includes('/upload')) {
        return url;
      }
      
      // For all successful auth callbacks, direct to upload page
      if (url.includes('auth/callback')) {
        return `${baseUrl}/upload`;
      }
      
      // If the URL starts with baseUrl, go to the requested URL
      if (url.startsWith(baseUrl)) {
        return url;
      }
      
      // Default fallback - go to upload page
      return `${baseUrl}/upload`;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/checkout', // Send people to checkout page on errors
    signOut: '/auth/signin',
  },
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