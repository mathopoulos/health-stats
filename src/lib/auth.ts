import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

// This is a server-side map to track users who are authenticated
// In a real app, you would use a database table for this
// This is just for demonstration purposes
const authenticatedUsers = new Set<string>();

// Also track users who have validated an invite code
// In a real app, this would be stored in a database
const usersWithValidatedInviteCodes = new Set<string>();

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
        
        // TEMPORARY SOLUTION: Consider all Google users as authenticated
        // In development mode, allow all Google logins
        // In production, you would use a database check instead
        if (process.env.NODE_ENV !== 'production') {
          // Add the user to authenticated users
          authenticatedUsers.add(user.email);
          return true;
        }
        
        // For production: If this is a new user and they haven't validated an invite code,
        // reject the sign-in (this will redirect to the invite page)
        if (!isReturningUser && !hasValidatedInvite) {
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
      
      // In production: If auth failed due to missing invite code, redirect to invite page
      if (url.includes('error=Callback') || url.includes('error=AccessDenied')) {
        return `${baseUrl}/auth/invite`;
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
    error: '/auth/invite', // Send people to invite page on errors
    signOut: '/auth/signin',
  },
};

// This function allows other server components to mark a user as having a valid invite code
export function markUserWithValidInviteCode(email: string) {
  if (email) {
    usersWithValidatedInviteCodes.add(email);
    return true;
  }
  return false;
} 