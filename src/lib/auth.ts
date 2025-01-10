import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only allow specific email addresses
      const allowedEmails = process.env.ALLOWED_EMAILS?.split(',') || [];
      return allowedEmails.includes(user.email || '');
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
      // Always redirect to upload page after sign in
      return `${baseUrl}/upload`;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
    signOut: '/auth/signin',
  },
}; 