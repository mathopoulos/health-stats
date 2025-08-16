# GitHub Actions + Vercel Setup Guide

## 🚀 Overview

This setup creates a quality assurance pipeline that:
1. **Tests your code** before deployment
2. **Deploys previews** for pull requests
3. **Deploys to production** only after all tests pass

## 📋 Step-by-Step Setup

### 1. Enable GitHub Actions

GitHub Actions will automatically start working once you push the workflow files to your repository.

### 2. Get Vercel Credentials

You'll need these from your Vercel dashboard:

1. **Go to Vercel Dashboard** → Your Project → Settings → General
2. **Copy these values:**
   - Project ID
   - Org ID
   - Create a Vercel token (Account → Tokens → Create)

### 3. Add GitHub Secrets

1. **Go to your GitHub repository** → Settings → Secrets and variables → Actions
2. **Add these secrets:**
   - `VERCEL_TOKEN` - Your Vercel token
   - `VERCEL_ORG_ID` - Your Vercel organization ID
   - `VERCEL_PROJECT_ID` - Your Vercel project ID

### 4. Test the Setup

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/test-github-actions
   ```

2. **Make a small change and push:**
   ```bash
   git add .
   git commit -m "test: add GitHub Actions setup"
   git push origin feature/test-github-actions
   ```

3. **Create a Pull Request** on GitHub

4. **Watch the Actions run** in the Actions tab

## 🔄 New Workflow

### For Feature Development:
```
1. Create feature branch
2. Make changes
3. Push to GitHub
4. Create Pull Request
5. GitHub Actions runs tests
6. Vercel deploys preview
7. Review and merge
```

### For Production Deployment:
```
1. Merge to main
2. GitHub Actions runs full test suite
3. All tests pass
4. Vercel deploys to production
```

## 🛠️ Available Commands

```bash
# Local development
npm run test:e2e:theme        # Run theme tests
npm run test:e2e             # Run all E2E tests
npm run test:e2e:headed      # See browser while testing

# Cleanup
npm run test:e2e:clean       # Clean test artifacts
```

## 📊 What Gets Tested

### On Every PR:
- ✅ Linting and type checking
- ✅ Unit tests
- ✅ Critical E2E tests (theme toggle)
- ✅ Preview deployment

### On Main Branch:
- ✅ All of the above
- ✅ Full E2E test suite
- ✅ Production deployment

## 🎯 Benefits

1. **Quality Assurance** - No broken code reaches production
2. **Preview Deployments** - Test changes before merging
3. **Automated Testing** - No manual testing required
4. **Rollback Safety** - Easy to revert if issues arise

## 🔧 Troubleshooting

### If Actions Fail:
1. Check the Actions tab in GitHub
2. Look at the specific job that failed
3. Fix the issue and push again

### If Vercel Deployment Fails:
1. Check Vercel dashboard for build logs
2. Verify secrets are correct
3. Check if build command works locally

## 📈 Next Steps

1. **Add more E2E tests** for critical user flows
2. **Set up monitoring** for production
3. **Add performance testing**
4. **Configure branch protection rules**
