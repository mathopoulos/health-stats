const dotenv = require('dotenv');
const nodePath = require('path');
const nodeFetch = require('node-fetch');

// Load environment variables from .env.local
dotenv.config({ path: nodePath.resolve(process.cwd(), '.env.local') });

type HealthDataResponse = {
  success: boolean;
  count: number;
  data: Array<{
    date: string;
    value: number;
  }>;
}

type BloodMarkersResponse = {
  success: boolean;
  data: Array<{
    _id: string;
    userId: string;
    date: string;
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
    createdAt: string;
    updatedAt: string;
  }>;
}

const BASE_URL = 'http://localhost:3000/api';

async function testHealthDataAPI() {
  console.log('\nTesting Health Data API...');
  const dataTypes = ['heartRate', 'weight', 'bodyFat', 'hrv', 'vo2Max'];

  for (const type of dataTypes) {
    console.log(`\nFetching ${type} data...`);
    const response = await nodeFetch(`${BASE_URL}/health-data?type=${type}`);
    const data = await response.json() as HealthDataResponse;

    console.log(`${type} data:
      - Success: ${data.success}
      - Count: ${data.count}
      - Sample: ${data.data.length > 0 ? JSON.stringify(data.data[0]) : 'No data'}
    `);
  }
}

async function testBloodMarkersAPI() {
  console.log('\nTesting Blood Markers API...');
  
  // Test GET
  console.log('\nFetching blood markers...');
  const response = await nodeFetch(`${BASE_URL}/blood-markers`);
  const data = await response.json() as BloodMarkersResponse;

  console.log(`Blood markers data:
    - Success: ${data.success}
    - Count: ${data.data.length}
    - Sample: ${data.data.length > 0 ? JSON.stringify(data.data[0]) : 'No data'}
  `);
}

async function main() {
  try {
    console.log('Starting API tests...');
    
    // Test health data API
    await testHealthDataAPI();
    
    // Test blood markers API
    await testBloodMarkersAPI();
    
    console.log('\nAPI tests completed successfully');
  } catch (error) {
    console.error('API tests failed:', error);
    process.exit(1);
  }
}

main(); 