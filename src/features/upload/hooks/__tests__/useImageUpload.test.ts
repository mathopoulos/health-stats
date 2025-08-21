import { renderHook } from '@testing-library/react';
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
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('initializes with null profile image by default', () => {
    const { result } = renderHook(() => useImageUpload());

    expect(result.current.profileImage).toBeNull();
    expect(result.current.imageError).toBeNull();
    expect(result.current.isUploadingImage).toBe(false);
  });

  it('initializes with provided initial image', () => {
    const initialImage = 'https://example.com/profile.jpg';
    const { result } = renderHook(() => useImageUpload(initialImage));

    expect(result.current.profileImage).toBe(initialImage);
  });

  it('has all required functions', () => {
    const { result } = renderHook(() => useImageUpload());

    expect(typeof result.current.setProfileImage).toBe('function');
    expect(typeof result.current.setImageError).toBe('function');
    expect(typeof result.current.setIsUploadingImage).toBe('function');
    expect(typeof result.current.handleProfileImageUpload).toBe('function');
  });
});
