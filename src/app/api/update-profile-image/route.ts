import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contentType } = await request.json();
    if (!contentType || !contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    const key = `profile-images/${session.user.id}/${Date.now()}.${contentType.split('/')[1]}`;
    
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    // Update user record with new image URL
    const client = await clientPromise;
    const db = client.db("health-stats");
    
    const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    await db.collection('users').updateOne(
      { userId: session.user.id },
      { 
        $set: { 
          profileImage: imageUrl,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    return NextResponse.json({ 
      success: true, 
      url: signedUrl,
      imageUrl: imageUrl
    });
  } catch (error) {
    console.error('Error handling profile image upload:', error);
    return NextResponse.json(
      { error: 'Failed to handle profile image upload' },
      { status: 500 }
    );
  }
} 