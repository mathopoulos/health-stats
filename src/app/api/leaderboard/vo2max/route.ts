import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

interface FitnessData {
  date: string;
  value: number;
}

interface LeaderboardEntry {
  userId: string;
  name: string;
  profileImage?: string;
  avgValue: number;
  dataPoints: number;
  latestDate: string;
}

export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db('health-stats');

    // Get all users (we'll filter by actual data availability)
    const users = await db
      .collection('users')
      .find({})
      .project({ userId: 1, name: 1, profileImage: 1, _id: 0 })
      .toArray();

    console.log('VO2 Max - Found total users:', users.length);

    const leaderboardData = await Promise.all(
      users.map(async (user) => {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
          const url = new URL(`/api/health-data?type=vo2max&userId=${user.userId}`, baseUrl);

          const res = await fetch(url.toString(), {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          if (!res.ok) return null;
          const json = await res.json();
          if (!json.success || !json.data || json.data.length === 0) return null;

          const data: FitnessData[] = json.data;
          data.sort((a: FitnessData, b: FitnessData) => new Date(b.date).getTime() - new Date(a.date).getTime());

          // Get a presigned profile image via /api/users
          let profileImageUrl: string | undefined = user.profileImage;
          try {
            const userRes = await fetch(`${baseUrl}/api/users/${user.userId}`);
            if (userRes.ok) {
              const userJson = await userRes.json();
              if (userJson.success && userJson.user?.profileImage) {
                profileImageUrl = userJson.user.profileImage;
              }
            }
          } catch (e) {
            // ignore errors – fallback to stored URL if any
          }

          const latest = new Date(data[0].date);
          const start = new Date(latest);
          start.setDate(start.getDate() - 30);

          const recent = data.filter((d: FitnessData) => {
            const dt = new Date(d.date);
            return dt >= start && dt <= latest;
          });
          if (recent.length === 0) return null;

          const avg = recent.reduce((sum: number, d: FitnessData) => sum + d.value, 0) / recent.length;

          const entry: LeaderboardEntry = {
            userId: user.userId,
            name: user.name || 'Anonymous',
            profileImage: profileImageUrl,
            avgValue: Math.round(avg * 100) / 100,
            dataPoints: recent.length,
            latestDate: latest.toISOString()
          };
          return entry;
        } catch {
          return null;
        }
      })
    );

    const results = leaderboardData.filter((r: any) => r !== null).sort((a: any, b: any) => b.avgValue - a.avgValue);

    return NextResponse.json({ success: true, data: results, totalUsers: results.length });
  } catch (e) {
    console.error('VO2 max leaderboard error', e);
    return NextResponse.json({ success: false, error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
} 