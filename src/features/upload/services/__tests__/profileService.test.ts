import { ProfileService } from '../profileService';

// Mock fetch
global.fetch = jest.fn();

describe('ProfileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('updateUser', () => {
    it('makes POST request to update user with correct data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      const userData = {
        name: 'John Doe',
        age: 30,
        sex: 'male' as const,
      };

      await ProfileService.updateUser(userData);

      expect(global.fetch).toHaveBeenCalledWith('/api/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
    });

    it('throws error when request fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      const userData = {
        name: 'John Doe',
        age: 30,
        sex: 'male' as const,
      };

      await expect(ProfileService.updateUser(userData)).rejects.toThrow('Failed to update profile');
    });
  });

  describe('uploadProfileImage', () => {
    it('makes POST request to upload image with form data', async () => {
      const mockUrl = 'https://example.com/image.jpg';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: mockUrl }),
      });

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = await ProfileService.uploadProfileImage(file);

      expect(global.fetch).toHaveBeenCalledWith('/api/upload', {
        method: 'POST',
        body: expect.any(FormData),
      });

      expect(result).toBe(mockUrl);
    });

    it('throws error when upload fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await expect(ProfileService.uploadProfileImage(file)).rejects.toThrow('Failed to upload image');
    });
  });

  describe('validation methods', () => {
    it('validates age correctly', () => {
      expect(ProfileService.validateAge(25)).toBeNull();
      expect(ProfileService.validateAge('')).toBeNull();
      expect(ProfileService.validateAge(-1)).toBe('Please enter a valid age between 0 and 120');
      expect(ProfileService.validateAge(150)).toBe('Please enter a valid age between 0 and 120');
    });

    it('validates name correctly', () => {
      expect(ProfileService.validateName('John Doe')).toBeNull();
      expect(ProfileService.validateName('')).toBe('Name is required');
      expect(ProfileService.validateName('   ')).toBe('Name is required');
    });

    it('validates image file correctly', () => {
      const imageFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const textFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      expect(ProfileService.validateImageFile(imageFile)).toBeNull();
      expect(ProfileService.validateImageFile(textFile)).toBe('Please select an image file');
    });
  });
});
