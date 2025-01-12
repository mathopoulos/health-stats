import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const lambdaClient = new LambdaClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

export async function invokeLambda(jobId: string, userId: string, xmlKey: string): Promise<void> {
  const command = new InvokeCommand({
    FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME || 'process-health-data',
    InvocationType: 'Event', // Asynchronous invocation
    Payload: Buffer.from(JSON.stringify({ jobId, userId, xmlKey }))
  });

  await lambdaClient.send(command);
} 