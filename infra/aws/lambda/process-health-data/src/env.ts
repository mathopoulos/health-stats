// Required environment variables
const requiredEnvVars = [
  'AWS_REGION',
  'AWS_BUCKET_NAME',
  'MONGODB_URI',
] as const;

// Check for missing environment variables
const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);
if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Export environment variables with types
export const env = {
  AWS_REGION: process.env.AWS_REGION!,
  AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME!,
  MONGODB_URI: process.env.MONGODB_URI!,
} as const; 