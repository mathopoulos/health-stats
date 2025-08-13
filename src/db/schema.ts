// Place to keep reusable collection names / indexes definitions.
// For MongoDB we often define constants for collection names to avoid typos.

export const COLLECTIONS = {
  USERS: 'users',
  BLOOD_MARKERS: 'blood_markers',
  HEALTH_PROTOCOLS: 'health_protocols',
  PROCESSING_JOBS: 'processing_jobs',
  // Add more as needed
} as const;

type ValueOf<T> = T[keyof T];
export type CollectionName = ValueOf<typeof COLLECTIONS>;

