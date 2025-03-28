import { NextRequest, NextResponse } from 'next/server';

// Simple API key for iOS authentication
const IOS_API_KEY = process.env.IOS_API_KEY || 'ios-test-key-change-me';

// Direct endpoint for iOS authentication - no Google redirect
export async function GET(request: NextRequest) {
  try {
    // Generate a response with the API key
    return NextResponse.json({
      success: true,
      message: 'Authentication not required - use API key for data uploads',
      apiKey: IOS_API_KEY,
      userId: '100492380040453908509', // The hardcoded user ID
      instructions: 'Include this API key in the x-api-key header for all data upload requests'
    });
  } catch (error) {
    console.error('Error in iOS auth route:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

// API endpoint is no longer needed for pre-registration
export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Authentication not required - use API key from GET request',
    apiKey: IOS_API_KEY
  });
} 