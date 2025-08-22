import { renderHook, act } from '@testing-library/react';
import { toast } from 'react-hot-toast';
import { useProfileForm } from '../useProfileForm';

// Mock dependencies
jest.mock('react-hot-toast');

const mockToast = toast as jest.MockedFunction<typeof toast>;

// Mock fetch
global.fetch = jest.fn();

describe('useProfileForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToast.success = jest.fn();
    mockToast.error = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useProfileForm());

    expect(result.current.name).toBe('');
    expect(result.current.age).toBe('');
    expect(result.current.sex).toBe('');
    expect(result.current.nameError).toBeNull();
    expect(result.current.ageError).toBeNull();
    expect(result.current.sexError).toBeNull();
    expect(result.current.isSavingProfile).toBe(false);
  });

  it('initializes with provided initial values', () => {
    const initialValues = {
      name: 'John Doe',
      age: 30 as number | '',
      sex: 'male' as 'male' | 'female' | 'other' | '',
    };

    const { result } = renderHook(() => useProfileForm(initialValues));

    expect(result.current.name).toBe('John Doe');
    expect(result.current.age).toBe(30);
    expect(result.current.sex).toBe('male');
  });

  it('updates name correctly', () => {
    const { result } = renderHook(() => useProfileForm());

    act(() => {
      result.current.setName('Jane Doe');
    });

    expect(result.current.name).toBe('Jane Doe');
  });

  it('updates age correctly', () => {
    const { result } = renderHook(() => useProfileForm());

    act(() => {
      result.current.setAge(25);
    });

    expect(result.current.age).toBe(25);
  });

  it('updates sex correctly', () => {
    const { result } = renderHook(() => useProfileForm());

    act(() => {
      result.current.setSex('female');
    });

    expect(result.current.sex).toBe('female');
  });

  it('validates required name before submission', async () => {
    const { result } = renderHook(() => useProfileForm());

    await act(async () => {
      await result.current.handleUpdateProfile();
    });

    expect(result.current.nameError).toBe('Name is required');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('validates age range before submission', async () => {
    const { result } = renderHook(() => useProfileForm({ name: 'John' }));

    act(() => {
      result.current.setAge(150);
    });

    await act(async () => {
      await result.current.handleUpdateProfile();
    });

    expect(result.current.ageError).toBe('Please enter a valid age between 0 and 120');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('validates negative age', async () => {
    const { result } = renderHook(() => useProfileForm({ name: 'John' }));

    act(() => {
      result.current.setAge(-5);
    });

    await act(async () => {
      await result.current.handleUpdateProfile();
    });

    expect(result.current.ageError).toBe('Please enter a valid age between 0 and 120');
  });

  it('successfully updates profile with valid data', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const { result } = renderHook(() => useProfileForm({
      name: 'John Doe',
      age: 30,
      sex: 'male',
    }));

    await act(async () => {
      await result.current.handleUpdateProfile();
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/update-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        age: 30,
        sex: 'male',
      }),
    });

    expect(mockToast.success).toHaveBeenCalledWith('Profile updated successfully');
    expect(result.current.isSavingProfile).toBe(false);
  });

  it('handles empty age as null in submission', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const { result } = renderHook(() => useProfileForm({
      name: 'John Doe',
      age: '',
      sex: 'male',
    }));

    await act(async () => {
      await result.current.handleUpdateProfile();
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/update-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        age: null,
        sex: 'male',
      }),
    });
  });

  it('handles API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useProfileForm({ name: 'John Doe' }));

    await act(async () => {
      await result.current.handleUpdateProfile();
    });

    expect(result.current.nameError).toBe('Network error');
    expect(mockToast.error).toHaveBeenCalledWith('Failed to update profile');
    expect(result.current.isSavingProfile).toBe(false);
  });

  it('handles non-ok response from API', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    const { result } = renderHook(() => useProfileForm({ name: 'John Doe' }));

    await act(async () => {
      await result.current.handleUpdateProfile();
    });

    expect(result.current.nameError).toBe('Failed to update profile');
    expect(mockToast.error).toHaveBeenCalledWith('Failed to update profile');
  });

  it('trims whitespace from name before validation and submission', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const { result } = renderHook(() => useProfileForm());

    act(() => {
      result.current.setName('  John Doe  ');
    });

    await act(async () => {
      await result.current.handleUpdateProfile();
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/update-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        age: null,
        sex: null,
      }),
    });
  });

  it('clears errors when validation passes', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const { result } = renderHook(() => useProfileForm({ name: 'John Doe' }));

    // Set initial errors
    act(() => {
      result.current.setNameError('Previous name error');
      result.current.setAgeError('Previous age error');
      result.current.setSexError('Previous sex error');
    });

    // Submit with valid data
    await act(async () => {
      await result.current.handleUpdateProfile();
    });

    // All errors should be cleared
    expect(result.current.nameError).toBeNull();
    expect(result.current.ageError).toBeNull();
    expect(result.current.sexError).toBeNull();
  });

  it('manages loading state correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const { result } = renderHook(() => useProfileForm({ name: 'John Doe' }));

    expect(result.current.isSavingProfile).toBe(false);

    await act(async () => {
      await result.current.handleUpdateProfile();
    });

    // Should not be loading after completion
    expect(result.current.isSavingProfile).toBe(false);
  });
});
