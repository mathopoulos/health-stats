import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Centralized S3 client configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

/**
 * Generate a presigned URL for a profile image stored in S3
 */
export async function getPresignedProfileImageUrl(profileImageUrl: string): Promise<string | null> {
  try {
    const imageUrl = new URL(profileImageUrl);
    const key = imageUrl.pathname.slice(1); // Remove leading slash
    
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
    });
    
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return presignedUrl;
  } catch (error) {
    console.error('Error generating presigned URL for profile image:', error);
    return null;
  }
}

/**
 * Process profile images for multiple users in parallel
 */
export async function processProfileImages(
  users: Array<{ userId: string; profileImage?: string }>
): Promise<Map<string, string | undefined>> {
  const profileImageMap = new Map<string, string | undefined>();
  
  const imagePromises = users.map(async (user) => {
    if (!user.profileImage) {
      profileImageMap.set(user.userId, undefined);
      return;
    }
    
    const presignedUrl = await getPresignedProfileImageUrl(user.profileImage);
    profileImageMap.set(user.userId, presignedUrl || undefined);
  });
  
  await Promise.all(imagePromises);
  return profileImageMap;
}
