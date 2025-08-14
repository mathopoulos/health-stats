import { NextResponse } from 'next/server';
import clientPromise from '@/db/client';
import { fetchAllHealthData, type HealthDataType } from '@/server/aws/s3';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

interface HRVData {
  date: string;
  value: number;
}

interface LeaderboardEntry {
  userId: string;
  name: string;
  profileImage?: string;
  avgHRV: number;
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
    const db = client.db("health-stats");

    // Get all users (we'll filter by actual data availability)
    const users = await db
      .collection('users')
      .find({})
      .project({
        userId: 1,
        name: 1,
        profileImage: 1,
        _id: 0
      })
      .toArray();

    console.log('Found total users:', users.length);

    // For each user, fetch their HRV data directly from S3
    const leaderboardData = await Promise.all(
      users.map(async (user) => {
        try {
          // Fetch HRV data directly from S3 instead of making HTTP calls
          const hrvData = await fetchAllHealthData('hrv' as HealthDataType, user.userId);
          
          if (!hrvData || hrvData.length === 0) {
            console.log(`No HRV data found for user ${user.userId}`);
            return null; // Skip users with no HRV data
          }

          // Sort by date descending and get last 30 days of data
          const sortedData = (hrvData as HRVData[])
            .sort((a: HRVData, b: HRVData) => new Date(b.date).getTime() - new Date(a.date).getTime());

          // Determine dynamic 30-day window based on the user's most-recent reading
          const latestReadingDate = new Date(sortedData[0].date);
          const windowStart = new Date(latestReadingDate);
          windowStart.setDate(windowStart.getDate() - 30);
          
          const recentData = sortedData.filter((item: HRVData) => 
            new Date(item.date) >= windowStart && new Date(item.date) <= latestReadingDate
          );

          if (recentData.length === 0) {
            console.log(`No recent HRV data found for user ${user.userId}`);
            return null; // Skip users with no recent HRV data
          }

          // Calculate average HRV for the last 30 days
          const avgHRV = recentData.reduce((sum: number, item: HRVData) => sum + item.value, 0) / recentData.length;
          
          // Get most recent reading date
          const latestDate = new Date(recentData[0].date);

          // Generate presigned profile image URL directly instead of making HTTP calls
          let profileImageUrl: string | undefined = undefined;
          if (user.profileImage) {
            profileImageUrl = await getPresignedProfileImageUrl(user.profileImage) || undefined;
          }

          console.log(`User ${user.userId} (${user.name}): ${recentData.length} HRV readings, avg: ${avgHRV.toFixed(2)}`);

          return {
            userId: user.userId,
            name: user.name || 'Anonymous',
            profileImage: profileImageUrl,
            avgHRV: Math.round(avgHRV * 100) / 100, // Round to 2 decimal places
            dataPoints: recentData.length,
            latestDate: latestDate.toISOString()
          };
        } catch (error) {
          console.error(`Error processing HRV data for user ${user.userId}:`, error);
          return null;
        }
      })
    );

    // Filter out null results and sort by HRV average (descending)
    const validResults = leaderboardData
      .filter((result: any) => result !== null)
      .sort((a: any, b: any) => b.avgHRV - a.avgHRV);

    console.log(`Leaderboard generated: ${validResults.length} users with HRV data`);

    return NextResponse.json({ 
      success: true, 
      data: validResults,
      totalUsers: validResults.length
    });
  } catch (error) {
    console.error('Error fetching HRV leaderboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
} 