import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// List of valid invite codes - duplicated from validate-invite route
// In a production app, these would be stored in a database
const VALID_INVITE_CODES = ['REVLY2024', 'HEALTHDATA', 'BETAUSER', 'EARLYACCESS'];

export async function GET() {
  try {
    // Get the user's session
    const session = await getServerSession(authOptions);
    
    // Only allow authenticated users to view this
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Return the list of invite codes
    return NextResponse.json({
      inviteCodes: VALID_INVITE_CODES,
      message: 'These are the current valid invite codes for Revly. You can share these with users you want to invite.',
    });
  } catch (error) {
    console.error('Error fetching invite codes:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
} 