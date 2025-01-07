import { ObjectId } from 'mongodb';

export interface BloodMarkerEntry {
  _id?: ObjectId;
  userId: string;
  date: Date;
  markers: Array<{
    name: string;
    value: number;
    unit: string;
    category: string;
    referenceRange?: {
      min: number;
      max: number;
    };
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBloodMarkerEntry {
  date: Date;
  markers: Array<{
    name: string;
    value: number;
    unit: string;
    category: string;
  }>;
} 