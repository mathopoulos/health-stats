import { renderHook, act } from '@testing-library/react';
import { toast } from 'react-hot-toast';
import { useImageUpload } from '../useImageUpload';

// Mock dependencies
jest.mock('react-hot-toast');

const mockToast = toast as jest.MockedFunction<typeof toast>;

// Mock fetch
global.fetch = jest.fn();

describe('useImageUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToast.success = jest.fn();
    mockToast.error = jest.fn();
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('initialization', () => {
    it('initializes with default values', () => {
      const { result } = renderHook(() => useImageUpload());

      expect(result.current.profileImage).toBeNull();
      expect(result.current.imageError).toBeNull();
      expect(result.current.isUploadingImage).toBe(false);
    });

    it('initializes with provided initial image', () => {
      const initialImage = 'https://example.com/image.jpg';
      const { result } = renderHook(() => useImageUpload(initialImage));

      expect(result.current.profileImage).toBe(initialImage);
      expect(result.current.imageError).toBeNull();
      expect(result.current.isUploadingImage).toBe(false);
    });

    it('updates profile image when initial value changes', () => {
      const initialImage = 'https://example.com/image1.jpg';
      const { result, rerender } = renderHook(
        ({ image }) => useImageUpload(image),
        { initialProps: { image: initialImage } }
      );

      expect(result.current.profileImage).toBe(initialImage);

      const newImage = 'https://example.com/image2.jpg';
      rerender({ image: newImage });

      expect(result.current.profileImage).toBe(newImage);
    });

    it('does not update if new image is the same as current', () => {
      const initialImage = 'https://example.com/image.jpg';
      const { result, rerender } = renderHook(
        ({ image }) => useImageUpload(image),
        { initialProps: { image: initialImage } }
      );

      expect(result.current.profileImage).toBe(initialImage);

      // Re-render with same image
      rerender({ image: initialImage });

      expect(result.current.profileImage).toBe(initialImage);
    });
  });

  describe('handleProfileImageUpload', () => {
    it('successfully uploads image', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ url: 'https://example.com/uploaded.jpg' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        });

      const { result } = renderHook(() => useImageUpload());
      const mockFile = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });

      await act(async () => {
        await result.current.handleProfileImageUpload(mockFile);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/upload', {
        method: 'POST',
        body: expect.any(FormData)
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileImage: 'https://example.com/uploaded.jpg' })
      });

      expect(result.current.profileImage).toBe('https://example.com/uploaded.jpg');
      expect(result.current.imageError).toBeNull();
      expect(result.current.isUploadingImage).toBe(false);
      expect(mockToast.success).toHaveBeenCalledWith('Profile image updated successfully');
    });

    it('rejects non-image files', async () => {
      const { result } = renderHook(() => useImageUpload());
      const mockFile = new File(['text content'], 'test.txt', { type: 'text/plain' });

      await act(async () => {
        await result.current.handleProfileImageUpload(mockFile);
      });

      expect(result.current.profileImage).toBeNull();
      expect(result.current.imageError).toBe('Please select an image file');
      expect(result.current.isUploadingImage).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('handles upload failure with error response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400
      });

      const { result } = renderHook(() => useImageUpload());
      const mockFile = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });

      await act(async () => {
        await result.current.handleProfileImageUpload(mockFile);
      });

      expect(result.current.profileImage).toBeNull();
      expect(result.current.imageError).toBe('Failed to upload image');
      expect(result.current.isUploadingImage).toBe(false);
      expect(mockToast.error).toHaveBeenCalledWith('Failed to upload image');
    });

    it('handles network error during upload', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useImageUpload());
      const mockFile = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });

      await act(async () => {
        await result.current.handleProfileImageUpload(mockFile);
      });

      expect(result.current.imageError).toBe('Failed to upload image');
      expect(result.current.isUploadingImage).toBe(false);
      expect(mockToast.error).toHaveBeenCalledWith('Failed to upload image');
    });

    it('sets loading state during upload', async () => {
      let resolvePromise: (value: any) => void;
      const uploadPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValueOnce(uploadPromise);

      const { result } = renderHook(() => useImageUpload());
      const mockFile = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });

      act(() => {
        result.current.handleProfileImageUpload(mockFile);
      });

      expect(result.current.isUploadingImage).toBe(true);
      expect(result.current.imageError).toBeNull();

      await act(async () => {
        resolvePromise!({
          ok: true,
          json: async () => ({ url: 'https://example.com/uploaded.jpg' })
        });
        await uploadPromise;
      });

      expect(result.current.isUploadingImage).toBe(false);
    });

    it('creates FormData with correct file and type', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ url: 'https://example.com/uploaded.jpg' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        });

      const { result } = renderHook(() => useImageUpload());
      const mockFile = new File(['image content'], 'profile.jpg', { type: 'image/jpeg' });

      await act(async () => {
        await result.current.handleProfileImageUpload(mockFile);
      });

      const formData = (global.fetch as jest.Mock).mock.calls[0][1].body as FormData;
      expect(formData.get('file')).toBe(mockFile);
      expect(formData.get('type')).toBe('profile-image');
    });

    it('handles failure in profile update API call', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ url: 'https://example.com/uploaded.jpg' })
        })
        .mockRejectedValueOnce(new Error('Profile update failed'));

      const { result } = renderHook(() => useImageUpload());
      const mockFile = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });

      await act(async () => {
        await result.current.handleProfileImageUpload(mockFile);
      });

      expect(result.current.imageError).toBe('Failed to upload image');
      expect(mockToast.error).toHaveBeenCalledWith('Failed to upload image');
    });

    it('handles empty file input', async () => {
      const { result } = renderHook(() => useImageUpload());

      await act(async () => {
        await result.current.handleProfileImageUpload(null as any);
      });

      expect(global.fetch).not.toHaveBeenCalled();
      expect(result.current.imageError).toBeNull();
    });
  });

  describe('state setters', () => {
    it('setProfileImage updates profile image state', () => {
      const { result } = renderHook(() => useImageUpload());
      const newImage = 'https://example.com/new-image.jpg';

      act(() => {
        result.current.setProfileImage(newImage);
      });

      expect(result.current.profileImage).toBe(newImage);
    });

    it('setImageError updates image error state', () => {
      const { result } = renderHook(() => useImageUpload());
      const errorMessage = 'Upload failed';

      act(() => {
        result.current.setImageError(errorMessage);
      });

      expect(result.current.imageError).toBe(errorMessage);
    });

    it('setIsUploadingImage updates uploading state', () => {
      const { result } = renderHook(() => useImageUpload());

      act(() => {
        result.current.setIsUploadingImage(true);
      });

      expect(result.current.isUploadingImage).toBe(true);
    });

    it('allows setting profile image directly', () => {
      const { result } = renderHook(() => useImageUpload());
      const newImage = 'https://example.com/manual-image.jpg';

      act(() => {
        result.current.setProfileImage(newImage);
      });

      expect(result.current.profileImage).toBe(newImage);
    });
  });

  describe('edge cases', () => {
    it('handles undefined initial image', () => {
      const { result } = renderHook(() => useImageUpload(undefined));

      expect(result.current.profileImage).toBeNull();
    });

    it('handles null initial image', () => {
      const { result } = renderHook(() => useImageUpload(null));

      expect(result.current.profileImage).toBeNull();
    });

    it('handles empty string initial image', () => {
      const { result } = renderHook(() => useImageUpload(''));

      expect(result.current.profileImage).toBe('');
    });

    it('handles multiple rapid uploads', async () => {
      let resolveFirst: (value: any) => void;
      let resolveSecond: (value: any) => void;
      
      const firstPromise = new Promise(resolve => {
        resolveFirst = resolve;
      });
      
      const secondPromise = new Promise(resolve => {
        resolveSecond = resolve;
      });

      (global.fetch as jest.Mock)
        .mockReturnValueOnce(firstPromise)
        .mockReturnValueOnce(firstPromise) // Second call for update-user
        .mockReturnValueOnce(secondPromise)
        .mockReturnValueOnce(secondPromise); // Second call for update-user

      const { result } = renderHook(() => useImageUpload());
      const file1 = new File(['content1'], 'image1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['content2'], 'image2.jpg', { type: 'image/jpeg' });

      // Start first upload
      act(() => {
        result.current.handleProfileImageUpload(file1);
      });

      expect(result.current.isUploadingImage).toBe(true);

      // Start second upload while first is in progress
      act(() => {
        result.current.handleProfileImageUpload(file2);
      });

      // Both uploads should complete
      await act(async () => {
        resolveFirst!({
          ok: true,
          json: async () => ({ url: 'https://example.com/image1.jpg' })
        });
        resolveSecond!({
          ok: true,
          json: async () => ({ url: 'https://example.com/image2.jpg' })
        });
        await Promise.all([firstPromise, secondPromise]);
      });

      expect(result.current.isUploadingImage).toBe(false);
    });
  });
});