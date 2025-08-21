// Experiment management API calls and business logic

export interface Experiment {
  id: string;
  name: string;
  description: string;
  frequency: string;
  duration: string;
  fitnessMarkers: string[];
  bloodMarkers: string[];
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
}

export type CreateExperimentRequest = Omit<Experiment, 'id' | 'createdAt'>;
export type UpdateExperimentRequest = Partial<Omit<Experiment, 'id' | 'createdAt'>>;

export class ExperimentService {
  static async getExperiments(): Promise<Experiment[]> {
    const response = await fetch('/api/experiments');
    
    if (!response.ok) {
      throw new Error('Failed to load experiments');
    }

    return response.json();
  }

  static async createExperiment(experiment: CreateExperimentRequest): Promise<Experiment> {
    const response = await fetch('/api/experiments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(experiment),
    });

    if (!response.ok) {
      throw new Error('Failed to create experiment');
    }

    return response.json();
  }

  static async updateExperiment(id: string, updates: UpdateExperimentRequest): Promise<Experiment> {
    const response = await fetch(`/api/experiments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update experiment');
    }

    return response.json();
  }

  static async deleteExperiment(id: string): Promise<void> {
    const response = await fetch(`/api/experiments/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete experiment');
    }
  }

  // Validation Methods
  static validateExperimentName(name: string): string | null {
    if (!name.trim()) {
      return 'Experiment name is required';
    }
    
    if (name.length < 3) {
      return 'Experiment name must be at least 3 characters long';
    }
    
    if (name.length > 100) {
      return 'Experiment name must be less than 100 characters';
    }
    
    return null;
  }

  static validateExperimentDescription(description: string): string | null {
    if (!description.trim()) {
      return 'Experiment description is required';
    }
    
    if (description.length < 10) {
      return 'Description must be at least 10 characters long';
    }
    
    if (description.length > 500) {
      return 'Description must be less than 500 characters';
    }
    
    return null;
  }

  static validateFrequency(frequency: string): string | null {
    const validFrequencies = ['daily', 'weekly', 'biweekly', 'monthly'];
    
    if (!frequency) {
      return 'Frequency is required';
    }
    
    if (!validFrequencies.includes(frequency.toLowerCase())) {
      return 'Please select a valid frequency';
    }
    
    return null;
  }

  static validateDuration(duration: string): string | null {
    if (!duration.trim()) {
      return 'Duration is required';
    }
    
    return null;
  }

  static validateMarkers(markers: string[]): string | null {
    if (markers.length === 0) {
      return 'Please select at least one marker to track';
    }
    
    if (markers.length > 10) {
      return 'Please select no more than 10 markers';
    }
    
    return null;
  }

  static validateExperiment(experiment: CreateExperimentRequest): { [key: string]: string } {
    const errors: { [key: string]: string } = {};

    const nameError = this.validateExperimentName(experiment.name);
    if (nameError) errors.name = nameError;

    const descriptionError = this.validateExperimentDescription(experiment.description);
    if (descriptionError) errors.description = descriptionError;

    const frequencyError = this.validateFrequency(experiment.frequency);
    if (frequencyError) errors.frequency = frequencyError;

    const durationError = this.validateDuration(experiment.duration);
    if (durationError) errors.duration = durationError;

    const allMarkers = [...experiment.fitnessMarkers, ...experiment.bloodMarkers];
    const markersError = this.validateMarkers(allMarkers);
    if (markersError) errors.markers = markersError;

    return errors;
  }
}
