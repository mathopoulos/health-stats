import { Handler, Context } from 'aws-lambda';
import { handler } from './index';
import { env } from './env';

// Mock Lambda context
const context: Context = {
  functionName: 'process-health-data',
  functionVersion: '1',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:process-health-data',
  memoryLimitInMB: '256',
  awsRequestId: '123456789',
  logGroupName: '/aws/lambda/process-health-data',
  logStreamName: '2024/01/01/[$LATEST]123456789',
  getRemainingTimeInMillis: () => 30000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
  callbackWaitsForEmptyEventLoop: true
};

// Test event
const event = {
  jobId: '6784214d36cc6c26189d2bbf',
  userId: 'test-user',
  xmlKey: 'uploads/test-user/test-data.xml',
};

// Run test
async function test() {
  try {
    console.log('Starting test with event:', event);
    const result = await handler(event, context, () => {});
    console.log('Test result:', result);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

test(); 