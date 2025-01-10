import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("health-stats");

    const users = await db
      .collection('users')
      .find({ dashboardPublished: true })
      .project({
        userId: 1,
        name: 1,
        email: 1,
        dashboardPublished: 1,
        _id: 0
      })
      .toArray();

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
} 