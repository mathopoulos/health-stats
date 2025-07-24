import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

const ADMIN_EMAIL = 'alexandros@mathopoulos.com';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is the admin
    if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const client = await clientPromise;
    const db = client.db("health-stats");

    // Get ALL users (not just those with published dashboards)
    const users = await db
      .collection('users')
      .find({})
      .project({
        userId: 1,
        name: 1,
        email: 1,
        dashboardPublished: 1,
        createdAt: 1,
        updatedAt: 1,
        profileImage: 1,
        _id: 0
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Get count of related data for each user
    const usersWithCounts = await Promise.all(
      users.map(async (user) => {
        try {
          const [bloodMarkers, healthProtocols, processingJobs] = await Promise.all([
            db.collection('blood-markers').countDocuments({ userId: user.userId }),
            db.collection('health-protocols').countDocuments({ userId: user.userId }),
            db.collection('processing-jobs').countDocuments({ userId: user.userId })
          ]);

          return {
            ...user,
            dataCounts: {
              bloodMarkers,
              healthProtocols,
              processingJobs,
              total: bloodMarkers + healthProtocols + processingJobs
            }
          };
        } catch (error) {
          console.error(`Error getting counts for user ${user.userId}:`, error);
          return {
            ...user,
            dataCounts: {
              bloodMarkers: 0,
              healthProtocols: 0,
              processingJobs: 0,
              total: 0
            }
          };
        }
      })
    );

    return NextResponse.json({ 
      success: true, 
      users: usersWithCounts,
      totalCount: usersWithCounts.length 
    });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
} 