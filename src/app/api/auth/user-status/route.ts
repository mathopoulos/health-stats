import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// In a real app, this would be stored in a database table
// This is just for demonstration purposes
const authenticatedEmails = new Set<string>();

export async function GET() {
  const session = await getServerSession(authOptions);
  
  // If user is already authenticated with a valid session,
  // they don't need to validate an invite code
  if (session?.user?.email) {
    return NextResponse.json({
      isAuthenticated: true,
      needsInvite: false,
    });
  }
  
  // For demonstration, we'll assume any email in our set is a returning user
  // A real implementation would check a database table
  const email = session?.user?.email;
  const isReturningUser = email ? authenticatedEmails.has(email) : false;
  
  return NextResponse.json({
    isAuthenticated: false,
    needsInvite: !isReturningUser,
  });
}

// This route can also be used to record a successful invite validation
export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    // In a real app, store this in a database
    authenticatedEmails.add(email);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
} 