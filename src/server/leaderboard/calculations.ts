import clientPromise from '@/db/client';
import { fetchAllHealthData, type HealthDataType } from '@/server/aws/s3';
import { processProfileImages } from './profile-images';
import type { 
  HealthDataPoint, 
  UserRecord, 
  LeaderboardEntry, 
  LeaderboardResult, 
  LeaderboardMetric,
  LeaderboardOptions 
} from './types';

/**
 * Filter health data by time window from the most recent date
 */
function filterByTimeWindow(data: HealthDataPoint[], days: number): HealthDataPoint[] {
  if (data.length === 0) return [];
  
  // Sort by date descending to get the most recent first
  const sortedData = [...data].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Use the most recent reading as the reference point
  const latestReadingDate = new Date(sortedData[0].date);
  const windowStart = new Date(latestReadingDate);
  windowStart.setDate(windowStart.getDate() - days);
  
  return sortedData.filter(item => 
    new Date(item.date) >= windowStart && new Date(item.date) <= latestReadingDate
  );
}

/**
 * Calculate average value from health data points
 */
function calculateAverage(data: HealthDataPoint[]): number {
  if (data.length === 0) return 0;
  return data.reduce((sum, item) => sum + item.value, 0) / data.length;
}

/**
 * Fetch all users from the database
 */
async function fetchUsers(): Promise<UserRecord[]> {
  const client = await clientPromise;
  const db = client.db('health-stats');
  
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
    
  return users as UserRecord[];
}

/**
 * Process health data for a single user and metric
 */
async function processUserHealthData(
  user: UserRecord,
  metric: LeaderboardMetric,
  options: LeaderboardOptions
): Promise<LeaderboardEntry | null> {
  try {
    const healthDataType = metric as HealthDataType;
    const healthData = await fetchAllHealthData(healthDataType, user.userId);
    
    if (!healthData || healthData.length === 0) {
      return null;
    }
    
    // Filter by time window (default 30 days)
    const timeWindowDays = options.timeWindowDays || 30;
    const recentData = filterByTimeWindow(healthData as HealthDataPoint[], timeWindowDays);
    
    if (recentData.length === 0) {
      return null;
    }
    
    // Check minimum data points requirement
    const minDataPoints = options.minDataPoints || 1;
    if (recentData.length < minDataPoints) {
      return null;
    }
    
    // Calculate average and create entry
    const avgValue = calculateAverage(recentData);
    const latestDate = new Date(recentData[0].date);
    
    return {
      userId: user.userId,
      name: user.name || 'Anonymous',
      profileImage: user.profileImage, // Use the actual profile image from user record
      avgValue: Math.round(avgValue * 100) / 100, // Round to 2 decimal places
      dataPoints: recentData.length,
      latestDate: latestDate.toISOString(),
    };
  } catch (error) {
    console.error(`Error processing health data for user ${user.userId}:`, error);
    return null;
  }
}

/**
 * Generate leaderboard for a specific metric
 */
export async function generateLeaderboard(
  metric: LeaderboardMetric,
  options: LeaderboardOptions = {}
): Promise<LeaderboardResult> {
  console.log(`Generating ${metric} leaderboard with options:`, options);
  
  try {
    // Fetch all users
    const users = await fetchUsers();
    console.log(`Found ${users.length} total users`);
    
    // Process health data for all users in parallel
    const leaderboardPromises = users.map(user => 
      processUserHealthData(user, metric, options)
    );
    
    const leaderboardData = await Promise.all(leaderboardPromises);
    
    // Filter out null results and sort by average value (descending)
    const validEntries = leaderboardData
      .filter((entry): entry is LeaderboardEntry => entry !== null)
      .sort((a, b) => b.avgValue - a.avgValue);
    
    console.log(`Processed ${validEntries.length} users with valid ${metric} data`);
    
    // Apply max entries limit if specified
    const maxEntries = options.maxEntries || 100;
    const limitedEntries = validEntries.slice(0, maxEntries);
    
    // Process profile images for all valid entries
    const profileImageMap = await processProfileImages(limitedEntries);
    
    // Update entries with profile images
    const entriesWithImages = limitedEntries.map(entry => ({
      ...entry,
      profileImage: profileImageMap.get(entry.userId),
    }));
    
    return {
      entries: entriesWithImages,
      totalUsers: entriesWithImages.length,
      lastUpdated: new Date().toISOString(),
    };
    
  } catch (error) {
    console.error(`Error generating ${metric} leaderboard:`, error);
    throw new Error(`Failed to generate ${metric} leaderboard`);
  }
}

/**
 * Generate leaderboards for multiple metrics in parallel
 */
export async function generateMultipleLeaderboards(
  metrics: LeaderboardMetric[],
  options: LeaderboardOptions = {}
): Promise<Record<LeaderboardMetric, LeaderboardResult>> {
  const promises = metrics.map(async (metric) => {
    const result = await generateLeaderboard(metric, options);
    return [metric, result] as const;
  });
  
  const results = await Promise.all(promises);
  
  return Object.fromEntries(results) as Record<LeaderboardMetric, LeaderboardResult>;
}
