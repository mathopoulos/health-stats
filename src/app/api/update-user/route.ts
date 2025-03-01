import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, age, sex } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Validate age if provided
    if (age !== null && age !== undefined && (isNaN(Number(age)) || Number(age) < 0 || Number(age) > 120)) {
      return NextResponse.json({ error: 'Age must be between 0 and 120' }, { status: 400 });
    }

    // Validate sex if provided
    if (sex !== null && sex !== undefined && !['male', 'female', 'other', ''].includes(sex)) {
      return NextResponse.json({ error: 'Sex must be male, female, other, or empty' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("health-stats");

    const updateData: Record<string, any> = {
      name,
      updatedAt: new Date()
    };

    // Only include age and sex if they are provided
    if (age !== undefined) {
      updateData.age = age;
    }
    
    if (sex !== undefined) {
      updateData.sex = sex;
    }

    await db.collection('users').updateOne(
      { userId: session.user.id },
      { 
        $set: updateData,
        $setOnInsert: {
          userId: session.user.id,
          email: session.user.email,
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
} 