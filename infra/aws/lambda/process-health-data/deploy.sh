#!/bin/bash
set -e

# Function name
FUNCTION_NAME=process-health-data

# Get AWS account ID and region
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=${AWS_REGION:-us-east-1}

# Create IAM role if it doesn't exist
ROLE_NAME=${FUNCTION_NAME}-role
if ! aws iam get-role --role-name $ROLE_NAME > /dev/null 2>&1; then
  echo "Creating IAM role: $ROLE_NAME"
  aws iam create-role \
    --role-name $ROLE_NAME \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": {
          "Service": "lambda.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }]
    }'
  
  # Attach custom policy from lambda-policy.json
  aws iam put-role-policy \
    --role-name $ROLE_NAME \
    --policy-name ${FUNCTION_NAME}-policy \
    --policy-document file://lambda-policy.json
fi

# Get role ARN
ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query Role.Arn --output text)

# Build and package function
echo "Building and packaging function..."
npm run package

# Check if function exists
if aws lambda get-function --function-name $FUNCTION_NAME > /dev/null 2>&1; then
  # Update existing function
  echo "Updating existing function..."
  aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://function.zip

  aws lambda update-function-configuration \
    --function-name $FUNCTION_NAME \
    --timeout 900 \
    --memory-size 4096 \
    --environment "Variables={MONGODB_URI=${MONGODB_URI},AWS_BUCKET_NAME=${AWS_BUCKET_NAME}}"
else
  # Create new function
  echo "Creating new function..."
  aws lambda create-function \
    --function-name $FUNCTION_NAME \
    --runtime nodejs18.x \
    --handler index.handler \
    --role $ROLE_ARN \
    --timeout 300 \
    --memory-size 4096 \
    --environment "Variables={MONGODB_URI=${MONGODB_URI},AWS_BUCKET_NAME=${AWS_BUCKET_NAME}}" \
    --zip-file fileb://function.zip
fi

echo "Deployment complete!" 