import { NextResponse } from 'next/server';
import { generateLeaderboard } from '@/server/leaderboard';

export async function GET(request: Request) {
  try {
    const result = await generateLeaderboard('vo2max', {
      timeWindowDays: 30,
      minDataPoints: 1,
      maxEntries: 100,
    });

    return NextResponse.json({
      success: true,
      data: result.entries,
      totalUsers: result.totalUsers,
    });
  } catch (error) {
    console.error('Error fetching VO2 max leaderboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
} 