#!/bin/bash
set -e

# Function name
FUNCTION_NAME=process-health-data

# Default date if not provided
DEFAULT_DATE="2025-01-20"

# Get the date to revert to from the first argument, or use the default
REVERT_DATE=${1:-$DEFAULT_DATE}

echo "Reverting Lambda function to $REVERT_DATE version..."

# Get the commit hash from the specified date
COMMIT_HASH=$(git rev-list -n 1 --before="$REVERT_DATE 23:59:59" HEAD)

if [ -z "$COMMIT_HASH" ]; then
  echo "❌ Could not find a commit before $REVERT_DATE"
  exit 1
fi

echo "📝 Found commit: $COMMIT_HASH from before $REVERT_DATE"

# Create a temporary directory
TEMP_DIR=$(mktemp -d)
echo "📁 Created temporary directory: $TEMP_DIR"

# Checkout the source files from the specified date
echo "⏳ Checking out source files from $REVERT_DATE..."
git checkout $COMMIT_HASH -- src/

# Check if we have a function.zip from the specified date
echo "🔍 Looking for function.zip from $REVERT_DATE..."
FUNCTION_ZIP_COMMIT=$(git rev-list -n 1 --before="$REVERT_DATE 23:59:59" HEAD -- function.zip)

if [ -n "$FUNCTION_ZIP_COMMIT" ]; then
  echo "📦 Found function.zip from commit: $FUNCTION_ZIP_COMMIT"
  git checkout $FUNCTION_ZIP_COMMIT -- function.zip
  echo "✅ Restored function.zip from $REVERT_DATE"
else
  echo "⚠️ Could not find function.zip from $REVERT_DATE"
  echo "⚠️ Will use the current function.zip instead"
fi

# Check if function exists
if aws lambda get-function --function-name $FUNCTION_NAME > /dev/null 2>&1; then
  # Update existing function
  echo "🔄 Updating existing function..."
  aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://function.zip

  # Update function configuration
  aws lambda update-function-configuration \
    --function-name $FUNCTION_NAME \
    --timeout 900 \
    --memory-size 4096
else
  echo "❌ Lambda function '$FUNCTION_NAME' not found"
  exit 1
fi

echo "✅ Lambda function reverted to $REVERT_DATE version!"
echo "✅ Deployment complete!"
echo ""
echo "Don't forget to update the environment variables in the AWS console if needed." 