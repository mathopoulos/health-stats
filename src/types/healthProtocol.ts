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
  | 'intermittent-fasting'
  | 'carnivore'
  | 'mediterranean'
  | 'paleo'
  | 'vegan'
  | 'vegetarian'
  | 'whole30'
  | 'low-carb'
  | 'elimination'
  | 'time-restricted'
  | 'standard'
  | 'other';

export interface DietProtocol extends Omit<HealthProtocol, 'protocol'> {
  protocolType: 'diet';
  protocol: DietType;
} 