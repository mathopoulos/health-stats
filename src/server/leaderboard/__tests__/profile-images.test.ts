import { getPresignedProfileImageUrl, processProfileImages } from '../profile-images';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => ({})),
  GetObjectCommand: jest.fn(),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
  jest.resetAllMocks();
  process.env = {
    ...originalEnv,
    AWS_REGION: 'us-east-1',
    AWS_ACCESS_KEY_ID: 'test-access-key',
    AWS_SECRET_ACCESS_KEY: 'test-secret-key',
    AWS_BUCKET_NAME: 'test-bucket',
  };
});

afterAll(() => {
  process.env = originalEnv;
});

describe('Profile Images', () => {
  describe('getPresignedProfileImageUrl', () => {
    it('should generate presigned URL for valid image URL', async () => {
      const mockGetSignedUrl = require('@aws-sdk/s3-request-presigner').getSignedUrl;
      mockGetSignedUrl.mockResolvedValue('https://signed-url.com/image.jpg');

      const result = await getPresignedProfileImageUrl('https://bucket.s3.amazonaws.com/profile-images/user123.jpg');

      expect(result).toBe('https://signed-url.com/image.jpg');
      expect(mockGetSignedUrl).toHaveBeenCalledTimes(1);
    });

    it('should return null for invalid URL', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await getPresignedProfileImageUrl('invalid-url');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error generating presigned URL for profile image:',
        expect.objectContaining({ message: expect.stringContaining('Invalid URL') })
      );

      consoleSpy.mockRestore();
    });

    it('should handle AWS SDK errors gracefully', async () => {
      const mockGetSignedUrl = require('@aws-sdk/s3-request-presigner').getSignedUrl;
      mockGetSignedUrl.mockRejectedValue(new Error('AWS SDK Error'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await getPresignedProfileImageUrl('https://bucket.s3.amazonaws.com/profile-images/user123.jpg');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error generating presigned URL for profile image:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should extract correct key from S3 URL', async () => {
      const mockGetSignedUrl = require('@aws-sdk/s3-request-presigner').getSignedUrl;
      const mockGetObjectCommand = require('@aws-sdk/client-s3').GetObjectCommand;
      
      mockGetSignedUrl.mockResolvedValue('https://signed-url.com/image.jpg');

      await getPresignedProfileImageUrl('https://bucket.s3.amazonaws.com/profile-images/user123.jpg');

      expect(mockGetObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: 'profile-images/user123.jpg',
      });
    });
  });

  describe('processProfileImages', () => {
    it('should process multiple users with profile images', async () => {
      const mockGetSignedUrl = require('@aws-sdk/s3-request-presigner').getSignedUrl;
      mockGetSignedUrl
        .mockResolvedValueOnce('https://signed-url1.com/image.jpg')
        .mockResolvedValueOnce('https://signed-url2.com/image.jpg');

      const users = [
        { userId: 'user1', profileImage: 'https://bucket.s3.amazonaws.com/profile-images/user1.jpg' },
        { userId: 'user2', profileImage: 'https://bucket.s3.amazonaws.com/profile-images/user2.jpg' },
      ];

      const result = await processProfileImages(users);

      expect(result.size).toBe(2);
      expect(result.get('user1')).toBe('https://signed-url1.com/image.jpg');
      expect(result.get('user2')).toBe('https://signed-url2.com/image.jpg');
    });

    it('should handle users without profile images', async () => {
      const users = [
        { userId: 'user1' },
        { userId: 'user2', profileImage: undefined },
      ];

      const result = await processProfileImages(users);

      expect(result.size).toBe(2);
      expect(result.get('user1')).toBeUndefined();
      expect(result.get('user2')).toBeUndefined();
    });

    it('should handle mixed users with and without images', async () => {
      const mockGetSignedUrl = require('@aws-sdk/s3-request-presigner').getSignedUrl;
      mockGetSignedUrl.mockResolvedValue('https://signed-url.com/image.jpg');

      const users = [
        { userId: 'user1', profileImage: 'https://bucket.s3.amazonaws.com/profile-images/user1.jpg' },
        { userId: 'user2' },
        { userId: 'user3', profileImage: 'https://bucket.s3.amazonaws.com/profile-images/user3.jpg' },
      ];

      const result = await processProfileImages(users);

      expect(result.size).toBe(3);
      expect(result.get('user1')).toBe('https://signed-url.com/image.jpg');
      expect(result.get('user2')).toBeUndefined();
      expect(result.get('user3')).toBe('https://signed-url.com/image.jpg');
    });

    it('should handle errors in individual image processing', async () => {
      const mockGetSignedUrl = require('@aws-sdk/s3-request-presigner').getSignedUrl;
      mockGetSignedUrl
        .mockResolvedValueOnce('https://signed-url.com/image.jpg')
        .mockRejectedValueOnce(new Error('AWS Error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const users = [
        { userId: 'user1', profileImage: 'https://bucket.s3.amazonaws.com/profile-images/user1.jpg' },
        { userId: 'user2', profileImage: 'invalid-url' },
      ];

      const result = await processProfileImages(users);

      expect(result.size).toBe(2);
      expect(result.get('user1')).toBe('https://signed-url.com/image.jpg');
      expect(result.get('user2')).toBeUndefined();

      consoleSpy.mockRestore();
    });

    it('should process empty user array', async () => {
      const result = await processProfileImages([]);

      expect(result.size).toBe(0);
    });

    it('should process single user', async () => {
      const mockGetSignedUrl = require('@aws-sdk/s3-request-presigner').getSignedUrl;
      mockGetSignedUrl.mockResolvedValue('https://signed-url.com/image.jpg');

      const users = [
        { userId: 'user1', profileImage: 'https://bucket.s3.amazonaws.com/profile-images/user1.jpg' },
      ];

      const result = await processProfileImages(users);

      expect(result.size).toBe(1);
      expect(result.get('user1')).toBe('https://signed-url.com/image.jpg');
    });
  });
});
