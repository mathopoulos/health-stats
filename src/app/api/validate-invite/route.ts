import { NextResponse } from 'next/server';
import { markUserWithValidInviteCode } from '@/lib/auth';

// List of valid invite codes - in a real app, these would be stored in a database
// You can replace these with your own invite codes
const VALID_INVITE_CODES = ['REVLY2024', 'HEALTHDATA', 'BETAUSER', 'EARLYACCESS'];

export async function POST(request: Request) {
  try {
    const { inviteCode, email } = await request.json();

    // Basic validation
    if (!inviteCode || typeof inviteCode !== 'string') {
      return NextResponse.json(
        { valid: false, message: 'Invalid request format' },
        { status: 400 }
      );
    }

    // Check if the invite code is valid
    const isValid = VALID_INVITE_CODES.includes(inviteCode.trim().toUpperCase());

    if (isValid) {
      // If email is provided, mark it as validated on the server side
      // This allows for persistent tracking of validated emails
      if (email && typeof email === 'string') {
        markUserWithValidInviteCode(email);
      }

      return NextResponse.json({ valid: true });
    } else {
      return NextResponse.json(
        { valid: false, message: 'Invalid invite code' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error validating invite code:', error);
    return NextResponse.json(
      { valid: false, message: 'Server error' },
      { status: 500 }
    );
  }
} 