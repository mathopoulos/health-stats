'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

export interface UseImageUploadReturn {
  profileImage: string | null;
  setProfileImage: (image: string | null) => void;
  imageError: string | null;
  setImageError: (error: string | null) => void;
  isUploadingImage: boolean;
  setIsUploadingImage: (uploading: boolean) => void;
  
  // Image upload handler
  handleProfileImageUpload: (file: File) => Promise<void>;
}

export function useImageUpload(initialImage?: string | null): UseImageUploadReturn {
  const [profileImage, setProfileImage] = useState<string | null>(initialImage || null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleProfileImageUpload = async (file: File) => {
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setImageError('Please select an image file');
      return;
    }

    setIsUploadingImage(true);
    setImageError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'profile-image');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      setProfileImage(data.url);
      
      // Update user profile with new image URL
      await fetch('/api/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileImage: data.url }),
      });

      toast.success('Profile image updated successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      setImageError('Failed to upload image');
      toast.error('Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  return {
    profileImage,
    setProfileImage,
    imageError,
    setImageError,
    isUploadingImage,
    setIsUploadingImage,
    handleProfileImageUpload,
  };
}
