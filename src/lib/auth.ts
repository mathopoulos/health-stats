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

// Temporary preview URL cache for OAuth flow
// In a real app, this would be stored in Redis or a database
const previewUrlCache = new Map<string, string>();

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

// Get the appropriate URL for the current environment
// Uses preview URL if in preview, production URL otherwise
function getCurrentEnvironmentUrl(baseUrl: string): string {
  console.log("🔍 getCurrentEnvironmentUrl called with baseUrl:", baseUrl);
  console.log("NEXTAUTH_URL env:", process.env.NEXTAUTH_URL);
  console.log("VERCEL_URL env:", process.env.VERCEL_URL);
  
  // If we have NEXTAUTH_URL set, we're in production
  if (process.env.NEXTAUTH_URL) {
    console.log("✅ Using NEXTAUTH_URL (production):", process.env.NEXTAUTH_URL);
    return process.env.NEXTAUTH_URL;
  }
  
  // For preview deployments, use the baseUrl provided by NextAuth
  // This ensures we stay within the same preview environment
  if (baseUrl && baseUrl.includes('vercel.app')) {
    console.log('✅ Using preview deployment URL:', baseUrl);
    return baseUrl;
  }
  
  // Development or fallback
  const fallback = baseUrl || 'https://www.revly.health';
  console.log('✅ Using fallback URL:', fallback);
  return fallback;
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
      if (session.user) {
        // Use token.id (which we set in JWT callback) or fall back to token.sub
        session.user.id = (token.id || token.sub || session.user.email || 'unknown') as string;
        session.accessToken = token.accessToken as string | undefined;
        
        // Pass the iOS flag to the session if present
        if (token.isIosApp) {
          (session as any).isIosApp = true;
        }
        
        // Pass the preview URL to the session if present
        if (token.previewUrl) {
          (session as any).previewUrl = token.previewUrl;
          console.log("Session callback - passed preview URL to session:", token.previewUrl);
        }
      }
      return session;
    },
    async jwt({ token, user, account }) {
      // Store access token and iOS flag in JWT
      if (account) {
        token.accessToken = account.access_token;
        
        // Check for preview URL or iOS authentication in state
        try {
          if (account.state) {
            const stateData = JSON.parse(account.state as string);
            console.log("JWT callback - parsed state data:", stateData);
            
            // Store preview URL in cache for redirect callback
            if (stateData.previewUrl && user?.email) {
              token.previewUrl = stateData.previewUrl;
              previewUrlCache.set(user.email, stateData.previewUrl);
              console.log("JWT callback - stored preview URL in cache for user:", user.email, "->", stateData.previewUrl);
              
              // Clean up cache after 5 minutes
              setTimeout(() => {
                previewUrlCache.delete(user.email!);
                console.log("JWT callback - cleaned up preview URL cache for user:", user.email);
              }, 5 * 60 * 1000);
            }
            
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
      console.log("=== NextAuth Redirect Debug ===");
      console.log("Redirect URL:", url);
      console.log("Base URL:", baseUrl);
      console.log("NEXTAUTH_URL env:", process.env.NEXTAUTH_URL);
      console.log("VERCEL_URL env:", process.env.VERCEL_URL);
      console.log("USE_OAUTH_PROXY env:", process.env.USE_OAUTH_PROXY);
      console.log("OAUTH_PROXY_URL env:", process.env.OAUTH_PROXY_URL);
      
      // Check cache for preview URL (try all cached entries for recent OAuth flows)
      console.log("Redirect callback - checking preview URL cache:", Array.from(previewUrlCache.entries()));
      for (const [email, previewUrl] of previewUrlCache.entries()) {
        try {
          const previewUrlObj = new URL(previewUrl);
          if (previewUrlObj.hostname.endsWith('vercel.app')) {
            console.log("✅ REDIRECT DECISION: Found preview URL in cache for user:", email);
            console.log("✅ FINAL REDIRECT:", previewUrl);
            // Clean up the cache entry after use
            previewUrlCache.delete(email);
            return previewUrl;
          }
        } catch (e) {
          console.log("Invalid preview URL in cache:", e);
        }
      }
      
      // Log all URL components for detailed analysis
      try {
        // Handle relative URLs by making them absolute
        const absoluteUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
        const urlObj = new URL(absoluteUrl);
        console.log("URL pathname:", urlObj.pathname);
        console.log("URL search params:", Object.fromEntries(urlObj.searchParams.entries()));
        console.log("URL hash:", urlObj.hash);
      } catch (e) {
        console.log("Could not parse URL:", e);
      }
      
      // Check if we're being redirected back to a preview deployment
      // This happens when using the OAuth proxy for preview deployments
      if (url.includes('vercel.app') && !url.includes('www.revly.health')) {
        console.log("✅ REDIRECT DECISION: Preview deployment redirect detected, using preview URL");
        console.log("✅ FINAL REDIRECT:", url);
        return url;
      }
      
      // Get URLs for different scenarios
      const productionUrl = process.env.NEXTAUTH_URL || baseUrl;
      const currentEnvUrl = getCurrentEnvironmentUrl(baseUrl);
      console.log("productionUrl:", productionUrl);
      console.log("currentEnvUrl:", currentEnvUrl);
      
      // Direct iOS app URL scheme redirect - highest priority
      if (url.startsWith('health.revly://')) {
        console.log("✅ REDIRECT DECISION: iOS auth: Direct iOS scheme URL, returning as is");
        console.log("✅ FINAL REDIRECT:", url);
        return url;
      }
      
      // Handle Google auth callback
      if (url.includes('/api/auth/callback/google')) {
        console.log("🔍 PROCESSING: Google auth callback detected");
        
        // Check state parameter for preview URL
        try {
          // Handle relative URLs by making them absolute
          const absoluteUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
          const urlObj = new URL(absoluteUrl);
          const state = urlObj.searchParams.get('state');
          console.log("State parameter from Google callback:", state);
          
          if (state) {
            let stateData: any;
            try {
              stateData = JSON.parse(state);
              console.log("Parsed state data:", stateData);
            } catch (e) {
              console.log("Could not parse state as JSON:", e);
            }
            
            // Check for preview URL in state
            if (stateData?.previewUrl) {
              try {
                const previewUrlObj = new URL(stateData.previewUrl);
                if (previewUrlObj.hostname.endsWith('vercel.app')) {
                  console.log('✅ REDIRECT DECISION: Preview URL found in state:', stateData.previewUrl);
                  console.log("✅ FINAL REDIRECT:", stateData.previewUrl);
                  return stateData.previewUrl;
                }
              } catch (e) {
                console.log("Invalid preview URL in state:", e);
              }
            }
            
            // Check if this is iOS auth
            if ((stateData?.iosToken && verifyIosToken(stateData.iosToken)) || 
                stateData?.platform === 'ios' || 
                stateData?.iosBypass === true) {
              
              console.log("✅ REDIRECT DECISION: iOS auth detected, redirecting to mobile-callback");
              console.log("✅ FINAL REDIRECT:", `${productionUrl}/auth/mobile-callback?state=${encodeURIComponent(state)}`);
              return `${productionUrl}/auth/mobile-callback?state=${encodeURIComponent(state)}`;
            }
          }
        } catch (e) {
          console.error('Error parsing state in Google callback:', e);
        }
        
        // Default to production upload page
        console.log('✅ REDIRECT DECISION: Default Google callback to production upload');
        console.log("✅ FINAL REDIRECT:", `${productionUrl}/upload`);
        return `${productionUrl}/upload`;
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
      
      // Handle other auth callbacks (non-Google)
      if (url.includes('auth/callback') || url.includes('api/auth/callback')) {
        console.log("🔍 PROCESSING: General auth callback detected");
        
        // Try to extract state for iOS apps
        try {
          const urlObj = new URL(url);
          const state = urlObj.searchParams.get('state');
          
          if (state) {
            const stateData = JSON.parse(state);
            if (stateData.platform === 'ios') {
              console.log("✅ REDIRECT DECISION: iOS callback, redirecting to app scheme");
              console.log("✅ FINAL REDIRECT:", `health.revly://auth?token=${stateData.token || ''}`);
              return `health.revly://auth?token=${stateData.token || ''}`;
            }
          }
        } catch (e) {
          console.log('Could not parse state in general callback:', e);
        }
        
        // Default web callback - use production for consistency
        console.log("✅ REDIRECT DECISION: Default web callback to production upload");
        console.log("✅ FINAL REDIRECT:", `${productionUrl}/upload`);
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
        if (url.startsWith('http')) {
          console.log("✅ REDIRECT DECISION: Absolute upload URL detected:", url);
          console.log("✅ FINAL REDIRECT:", url);
          return url;
        } else {
          // Handle relative URL, avoid double slashes
          const cleanUrl = `${currentEnvUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
          console.log("✅ REDIRECT DECISION: Relative upload URL detected, using current environment:", cleanUrl);
          console.log("✅ FINAL REDIRECT:", cleanUrl);
          return cleanUrl;
        }
      }
      
      // For all successful auth callbacks, direct to upload page
      if (url.includes('auth/callback')) {
        console.log("Auth callback detected, redirecting to:", `${currentEnvUrl}/upload`);
        return `${currentEnvUrl}/upload`;
      }
      
      // If the URL starts with baseUrl or productionUrl, go to the requested URL
      if (url.startsWith(baseUrl) || url.startsWith(productionUrl)) {
        return url;
      }
      
      // Default fallback - go to upload page using current environment
      console.log("✅ REDIRECT DECISION: Default fallback, redirecting to:", `${currentEnvUrl}/upload`);
      console.log("✅ FINAL REDIRECT:", `${currentEnvUrl}/upload`);
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