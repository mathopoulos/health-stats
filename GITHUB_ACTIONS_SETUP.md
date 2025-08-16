# GitHub Actions + Vercel Setup Guide

## 🚀 Overview

This setup creates a quality assurance pipeline that:
1. **Tests your code** before deployment
2. **Deploys previews** for pull requests
3. **Deploys to production** only after all tests pass

## 📋 Step-by-Step Setup

### 1. Enable GitHub Actions

GitHub Actions will automatically start working once you push the workflow files to your repository.

### 2. Add Environment Variables to GitHub Actions

**This is crucial for E2E tests to work!**

1. **Go to your GitHub repository** → Settings → Secrets and variables → Actions
2. **Click "Variables" tab** (not Secrets)
3. **Click "New repository variable"**
4. **Add these variables:**

```
MONGODB_URI=mongodb://localhost:27017/test
NEXTAUTH_SECRET=your-nextauth-secret-key
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name
```

**Note:** Use your actual values from your `.env.local` file, but for testing you can use placeholder values.

### 3. Get Vercel Credentials

You'll need these from your Vercel dashboard:

1. **Go to Vercel Dashboard** → Your Project → Settings → General
2. **Copy these values:**
   - Project ID
   - Org ID
   - Create a Vercel token (Account → Tokens → Create)

### 4. Add GitHub Secrets

1. **Go to your GitHub repository** → Settings → Secrets and variables → Actions
2. **Click "Secrets" tab**
3. **Add these secrets:**
   - `VERCEL_TOKEN` - Your Vercel token
   - `VERCEL_PROJECT_ID` - Your Vercel project ID
   - `VERCEL_ORG_ID` - Your Vercel org ID

## 🔄 How It Works

### **On Every Push/Pull Request:**
1. **Linting & Type Checking** - Catches code quality issues
2. **Unit Tests** - Tests individual components
3. **E2E Tests** - Tests theme toggle functionality
4. **Preview Deployment** - Creates a Vercel preview URL

### **On Main Branch:**
1. **All tests above** +
2. **Full E2E Suite** - Complete testing
3. **Production Deployment** - Deploys to production

## 🚨 Troubleshooting

### **E2E Tests Failing?**
- Make sure you've added all environment variables
- Check that the variables match your local `.env.local` file
- Use placeholder values for sensitive data in CI

### **Vercel Deployment Failing?**
- Verify your Vercel credentials are correct
- Check that your project is connected to Vercel
- Ensure your Vercel token has the right permissions

## 📊 Benefits

- **Quality Assurance** - Tests run before every deployment
- **Preview URLs** - Test changes before merging to main
- **Automated Deployment** - No manual deployment needed
- **Rollback Safety** - Easy to revert if issues arise
