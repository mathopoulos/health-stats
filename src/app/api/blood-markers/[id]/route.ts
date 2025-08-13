import { NextResponse } from 'next/server';
import clientPromise from '@server/services/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// Update a specific blood marker entry
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = params.id;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("health-stats");

    // Make sure the user owns this marker entry
    const existingEntry = await db.collection('blood-markers').findOne({
      _id: new ObjectId(id),
    });

    if (!existingEntry) {
      return NextResponse.json(
        { success: false, error: 'Entry not found' },
        { status: 404 }
      );
    }

    if (existingEntry.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updateData = {
      date: body.date || existingEntry.date,
      markers: body.markers || existingEntry.markers,
      updatedAt: new Date()
    };

    const result = await db.collection('blood-markers').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    return NextResponse.json({ 
      success: true, 
      data: { ...existingEntry, ...updateData } 
    });
  } catch (error) {
    console.error('Error updating blood marker entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update blood marker entry' },
      { status: 500 }
    );
  }
}

// Delete a specific blood marker entry
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = params.id;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("health-stats");

    // Make sure the user owns this marker entry
    const existingEntry = await db.collection('blood-markers').findOne({
      _id: new ObjectId(id),
    });

    if (!existingEntry) {
      return NextResponse.json(
        { success: false, error: 'Entry not found' },
        { status: 404 }
      );
    }

    if (existingEntry.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await db.collection('blood-markers').deleteOne({
      _id: new ObjectId(id),
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Blood marker entry deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting blood marker entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete blood marker entry' },
      { status: 500 }
    );
  }
} 