import { ObjectId } from 'mongodb';

export type ProtocolType = 'diet' | 'supplement' | 'exercise' | 'sleep' | 'meditation' | 'cold-therapy' | 'sauna';

export interface HealthProtocol {
  _id?: ObjectId;
  userId: string;
  protocolType: ProtocolType;
  protocol: string;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateHealthProtocol {
  protocolType: ProtocolType;
  protocol: string;
  startDate?: Date;
}

// Diet-specific types for future expansion
export type DietType = 
  | 'ketogenic'
  | 'carnivore'
  | 'mediterranean'
  | 'paleo'
  | 'vegan'
  | 'vegetarian'
  | 'whole30'
  | 'low-carb'
  | 'variable-no-particular'
  | 'other';

export interface DietProtocol extends Omit<HealthProtocol, 'protocol'> {
  protocolType: 'diet';
  protocol: DietType;
}

// Workout-specific types
export interface WorkoutProtocolData {
  workouts: Array<{
    type: string;
    frequency: number;
  }>;
}

export interface WorkoutProtocol extends Omit<HealthProtocol, 'protocol'> {
  protocolType: 'exercise';
  protocol: string; // JSON stringified WorkoutProtocolData
} 