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
  },
  pages: {
    signIn: '/auth/signin',
  },
}; 