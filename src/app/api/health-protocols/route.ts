import { NextResponse } from 'next/server';
import clientPromise from '@server/services/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { protocolType, protocol, startDate } = await request.json();
    
    // Validate required fields
    if (!protocolType || !protocol) {
      return NextResponse.json({ error: 'Protocol type and protocol are required' }, { status: 400 });
    }

    // Validate protocol type (currently only diet, but designed for expansion)
    const validProtocolTypes = ['diet', 'supplement', 'exercise', 'sleep', 'meditation', 'cold-therapy', 'sauna'];
    if (!validProtocolTypes.includes(protocolType)) {
      return NextResponse.json({ error: 'Invalid protocol type' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("health-stats");

    // For diet and exercise protocols, check if there's an active one and set it to inactive
    if (protocolType === 'diet' || protocolType === 'exercise') {
      await db.collection('health-protocols').updateMany(
        { 
          userId: session.user.id, 
          protocolType: protocolType,
          isActive: true 
        },
        { 
          $set: { 
            isActive: false,
            endDate: new Date(),
            updatedAt: new Date()
          }
        }
      );
    }

    // Create new protocol entry
    const newProtocol = {
      userId: session.user.id,
      protocolType,
      protocol,
      startDate: startDate ? new Date(startDate) : new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('health-protocols').insertOne(newProtocol);

    return NextResponse.json({ 
      success: true, 
      data: { 
        _id: result.insertedId,
        ...newProtocol 
      } 
    });
  } catch (error) {
    console.error('Error saving health protocol:', error);
    return NextResponse.json(
      { error: 'Failed to save health protocol' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const protocolType = searchParams.get('protocolType');
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const userId = searchParams.get('userId');

    // Validate userId parameter
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required',
        data: []
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("health-stats");

    // Build query
    const query: any = { userId: userId };
    if (protocolType) {
      query.protocolType = protocolType;
    }
    if (activeOnly) {
      query.isActive = true;
    }

    const protocols = await db.collection('health-protocols')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ 
      success: true, 
      data: protocols 
    });
  } catch (error) {
    console.error('Error fetching health protocols:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch health protocols',
      data: []
    }, { status: 500 });
  }
} 