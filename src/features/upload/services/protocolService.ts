// Protocol management API calls and business logic

export interface WorkoutProtocol {
  type: string;
  frequency: number;
}

export interface SupplementProtocol {
  type: string;
  frequency: string;
  dosage: string;
  unit: string;
}

export class ProtocolService {
  // Diet Protocol Methods
  static async updateDietProtocol(diet: string): Promise<void> {
    const response = await fetch('/api/diet-protocol', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ diet }),
    });

    if (!response.ok) {
      throw new Error('Failed to update diet protocol');
    }
  }

  // Workout Protocol Methods
  static async saveWorkoutProtocols(protocols: WorkoutProtocol[]): Promise<void> {
    const response = await fetch('/api/workout-protocols', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ protocols }),
    });

    if (!response.ok) {
      throw new Error('Failed to save workout protocols');
    }
  }

  static async updateWorkoutProtocolFrequency(type: string, frequency: number): Promise<void> {
    const response = await fetch('/api/workout-protocols', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, frequency }),
    });

    if (!response.ok) {
      throw new Error('Failed to update workout protocol frequency');
    }
  }

  static async deleteWorkoutProtocol(type: string): Promise<void> {
    const response = await fetch('/api/workout-protocols', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove workout protocol');
    }
  }

  // Supplement Protocol Methods
  static async saveSupplementProtocols(protocols: SupplementProtocol[]): Promise<void> {
    const response = await fetch('/api/supplement-protocols', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ protocols }),
    });

    if (!response.ok) {
      throw new Error('Failed to save supplement protocols');
    }
  }

  static async updateSupplementProtocol(type: string, field: string, value: string): Promise<void> {
    const response = await fetch('/api/supplement-protocols', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, field, value }),
    });

    if (!response.ok) {
      throw new Error('Failed to update supplement protocol');
    }
  }

  // Validation Methods
  static validateWorkoutType(type: string, existingProtocols: WorkoutProtocol[]): string | null {
    if (!type.trim()) {
      return 'Workout type is required';
    }
    
    if (existingProtocols.some(p => p.type === type)) {
      return 'This workout type is already added';
    }
    
    return null;
  }

  static validateSupplementType(type: string, existingProtocols: SupplementProtocol[]): string | null {
    if (!type.trim()) {
      return 'Supplement type is required';
    }
    
    if (existingProtocols.some(p => p.type === type)) {
      return 'This supplement is already added';
    }
    
    return null;
  }

  static validateFrequency(frequency: number): string | null {
    if (frequency < 1 || frequency > 7) {
      return 'Frequency must be between 1 and 7 times per week';
    }
    return null;
  }

  static validateDosage(dosage: string): string | null {
    if (!dosage.trim()) {
      return 'Dosage is required';
    }
    return null;
  }
}
