import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { fetchAllHealthData, type HealthDataType } from '@/lib/s3';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

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

// Helper function to generate presigned URL for profile image
async function getPresignedProfileImageUrl(profileImageUrl: string): Promise<string | null> {
  try {
    const imageUrl = new URL(profileImageUrl);
    const key = imageUrl.pathname.slice(1); // Remove leading slash
    
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
    });
    
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return presignedUrl;
  } catch (error) {
    console.error('Error generating presigned URL for profile image:', error);
    return null;
  }
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
          // Fetch VO2 max data directly from S3 instead of making HTTP calls
          const data = await fetchAllHealthData('vo2max' as HealthDataType, user.userId);
          
          if (!data || data.length === 0) {
            return null;
          }

          const fitnessData: FitnessData[] = data;
          fitnessData.sort((a: FitnessData, b: FitnessData) => new Date(b.date).getTime() - new Date(a.date).getTime());

          // Generate presigned profile image URL directly instead of making HTTP calls
          let profileImageUrl: string | undefined = undefined;
          if (user.profileImage) {
            profileImageUrl = await getPresignedProfileImageUrl(user.profileImage) || undefined;
          }

          const latest = new Date(fitnessData[0].date);
          const start = new Date(latest);
          start.setDate(start.getDate() - 30);

          const recent = fitnessData.filter((d: FitnessData) => {
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