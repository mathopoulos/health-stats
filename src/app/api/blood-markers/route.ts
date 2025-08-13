import { NextResponse } from 'next/server';
import clientPromise from '@server/services/mongodb';
import { CreateBloodMarkerEntry, BloodMarkerEntry } from '@/types/bloodMarker';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateBloodMarkerEntry = await request.json();
    const client = await clientPromise;
    const db = client.db("health-stats");

    const entry: BloodMarkerEntry = {
      userId: session.user.id,
      date: body.date,
      markers: body.markers,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('blood-markers').insertOne(entry);

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error('Error saving blood markers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save blood markers' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const category = searchParams.get('category');
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("health-stats");

    let query: any = { userId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (category) {
      query['markers.category'] = category;
    }

    const results = await db
      .collection('blood-markers')
      .find(query)
      .sort({ date: -1 })
      .toArray();

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('Error fetching blood markers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blood markers' },
      { status: 500 }
    );
  }
} 