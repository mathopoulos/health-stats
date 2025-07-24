import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ObjectId } from 'mongodb';

interface ExperimentDocument {
  userId: string;
  name: string;
  description: string;
  frequency: string;
  duration: string;
  fitnessMarkers: string[];
  bloodMarkers: string[];
  status: 'active' | 'completed' | 'paused';
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, frequency, duration, fitnessMarkers, bloodMarkers } = await request.json();
    
    // Validate required fields
    if (!name || !frequency || !duration) {
      return NextResponse.json({ 
        error: 'Name, frequency, and duration are required' 
      }, { status: 400 });
    }

    // Validate that at least one marker is selected
    if ((!fitnessMarkers || fitnessMarkers.length === 0) && 
        (!bloodMarkers || bloodMarkers.length === 0)) {
      return NextResponse.json({ 
        error: 'At least one fitness or blood marker must be selected' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("health-stats");

    // Calculate end date based on duration
    const startDate = new Date();
    let endDate = new Date(startDate);
    
    // Parse duration and calculate end date
    const durationMap: Record<string, number> = {
      '1-week': 7,
      '2-weeks': 14,
      '4-weeks': 28,
      '6-weeks': 42,
      '8-weeks': 56,
      '12-weeks': 84,
      '16-weeks': 112,
      '6-months': 182,
      '1-year': 365
    };

    const durationDays = durationMap[duration] || 28; // Default to 4 weeks
    endDate.setDate(startDate.getDate() + durationDays);

    // Create new experiment
    const newExperiment: ExperimentDocument = {
      userId: session.user.id,
      name: name.trim(),
      description: description?.trim() || '',
      frequency,
      duration,
      fitnessMarkers: fitnessMarkers || [],
      bloodMarkers: bloodMarkers || [],
      status: 'active',
      startDate,
      endDate,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('experiments').insertOne(newExperiment);

    return NextResponse.json({ 
      success: true, 
      data: { 
        _id: result.insertedId,
        ...newExperiment 
      } 
    });
  } catch (error) {
    console.error('Error saving experiment:', error);
    return NextResponse.json(
      { error: 'Failed to save experiment' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'active', 'completed', 'paused'
    
    const client = await clientPromise;
    const db = client.db("health-stats");

    // Build query
    const query: any = { userId: session.user.id };
    if (status) {
      query.status = status;
    }

    const experiments = await db.collection('experiments')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // Convert ObjectId to string for frontend
    const experimentsWithStringId = experiments.map(exp => ({
      ...exp,
      id: exp._id.toString(),
      _id: exp._id.toString()
    }));

    return NextResponse.json({ 
      success: true, 
      data: experimentsWithStringId 
    });
  } catch (error) {
    console.error('Error fetching experiments:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch experiments',
      data: []
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const experimentId = searchParams.get('id');
    
    if (!experimentId || !ObjectId.isValid(experimentId)) {
      return NextResponse.json({ 
        error: 'Valid experiment ID is required' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("health-stats");

    // Check if experiment exists and belongs to user
    const experiment = await db.collection('experiments').findOne({
      _id: new ObjectId(experimentId),
      userId: session.user.id
    });

    if (!experiment) {
      return NextResponse.json({ 
        error: 'Experiment not found or access denied' 
      }, { status: 404 });
    }

    // Delete the experiment
    await db.collection('experiments').deleteOne({
      _id: new ObjectId(experimentId),
      userId: session.user.id
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Experiment deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting experiment:', error);
    return NextResponse.json(
      { error: 'Failed to delete experiment' },
      { status: 500 }
    );
  }
} 