import { NextResponse } from 'next/server';
import { generateLeaderboard } from '@/server/leaderboard';

export async function GET(request: Request) {
  try {
    const result = await generateLeaderboard('hrv', {
      timeWindowDays: 30,
      minDataPoints: 1,
      maxEntries: 100,
    });

    // Transform the data to match the expected format
    const transformedData = result.entries.map(entry => ({
      userId: entry.userId,
      name: entry.name,
      profileImage: entry.profileImage,
      avgHRV: entry.avgValue, // Keep the avgHRV field name for backward compatibility
      dataPoints: entry.dataPoints,
      latestDate: entry.latestDate,
    }));

    return NextResponse.json({
      success: true,
      data: transformedData,
      totalUsers: result.totalUsers,
    });
  } catch (error) {
    console.error('Error fetching HRV leaderboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
} 