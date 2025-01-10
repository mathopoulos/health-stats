import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    console.log('Fetching user data for userId:', userId);

    if (!userId) {
      console.log('No userId provided');
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("health-stats");

    const user = await db.collection('users').findOne(
      { userId },
      { projection: { _id: 0, name: 1, email: 1, userId: 1, profileImage: 1 } }
    );

    console.log('Found user:', user);

    if (!user) {
      console.log('No user found for userId:', userId);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If user has a profile image, generate a presigned URL
    if (user.profileImage) {
      console.log('Generating presigned URL for profile image');
      const key = new URL(user.profileImage).pathname.slice(1); // Remove leading slash
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: key,
      });
      const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      user.profileImage = presignedUrl;
    }

    console.log('Returning user data with success');
    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
} 