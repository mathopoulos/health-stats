// Profile-related API calls and business logic

export interface UpdateUserRequest {
  name?: string;
  age?: number | null;
  sex?: 'male' | 'female' | 'other' | null;
  profileImage?: string;
}

export interface DeleteAccountRequest {
  // Any additional data for account deletion
}

export class ProfileService {
  static async updateUser(data: UpdateUserRequest): Promise<void> {
    const response = await fetch('/api/update-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update profile');
    }
  }

  static async uploadProfileImage(file: File): Promise<string> {
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
    return data.url;
  }

  static async deleteAccount(): Promise<void> {
    const response = await fetch('/api/delete-account', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete account');
    }
  }

  static validateAge(age: number | ''): string | null {
    if (age !== '' && (isNaN(Number(age)) || Number(age) < 0 || Number(age) > 120)) {
      return 'Please enter a valid age between 0 and 120';
    }
    return null;
  }

  static validateName(name: string): string | null {
    if (!name.trim()) {
      return 'Name is required';
    }
    return null;
  }

  static validateImageFile(file: File): string | null {
    if (!file.type.startsWith('image/')) {
      return 'Please select an image file';
    }
    return null;
  }
}
