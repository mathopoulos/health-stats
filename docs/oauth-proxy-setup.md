# OAuth Proxy Setup Guide

## 🎯 Overview

This guide explains how to set up the OAuth proxy system that allows Google OAuth to work seamlessly across all environments (production, preview deployments, and development) without manually managing redirect URIs.

## 🔧 How It Works

### The Problem
- Vercel preview deployments create dynamic URLs (e.g., `health-stats-xyz-git-feature-abc.vercel.app`)
- Google OAuth requires exact redirect URI matches and doesn't support wildcards
- Each preview deployment would need manual OAuth configuration

### The Solution
- **Stable Redirect Proxy**: Use a fixed subdomain (e.g., `auth.revly.health`) for all OAuth callbacks
- **Smart Routing**: The proxy determines the target environment and redirects appropriately
- **Security**: State parameter validation and signature verification prevent tampering

### Flow Diagram
```
1. User initiates OAuth from any environment (prod/preview/dev)
   ↓
2. OAuth provider redirects to stable proxy URL
   ↓
3. Proxy validates state and redirects back to original environment
   ↓
4. Original environment completes the OAuth flow
```

## 🚀 Setup Instructions

### 1. Configure Google OAuth

1. **Go to Google Cloud Console** → API & Services → Credentials
2. **Edit your OAuth 2.0 client**
3. **Update Authorized redirect URIs** to include only:
   ```
   https://auth.revly.health/api/auth/proxy
   http://localhost:3000/api/auth/proxy (for development)
   ```
4. **Remove all dynamic Vercel URLs** from the list

### 2. Environment Variables

Add these environment variables to your deployment:

```bash
# OAuth Proxy Configuration
OAUTH_PROXY_URL=https://auth.revly.health/api/auth/proxy
USE_OAUTH_PROXY=true  # Set to true for preview deployments

# Standard OAuth Configuration (unchanged)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXTAUTH_SECRET=your-secret-key
```

### 3. Vercel Environment Configuration

#### Production Environment
```bash
NEXTAUTH_URL=https://www.revly.health
OAUTH_PROXY_URL=https://auth.revly.health/api/auth/proxy
USE_OAUTH_PROXY=true
```

#### Preview Environment
```bash
# NEXTAUTH_URL is automatically set by Vercel as VERCEL_URL
OAUTH_PROXY_URL=https://auth.revly.health/api/auth/proxy
USE_OAUTH_PROXY=true
```

#### Development Environment
```bash
NEXTAUTH_URL=http://localhost:3000
# Proxy is optional for development
USE_OAUTH_PROXY=false
```

## 🔒 Security Features

### State Parameter Validation
- **HMAC Signature**: Each state parameter is signed with `NEXTAUTH_SECRET`
- **Timestamp Validation**: States expire after 10 minutes
- **Domain Validation**: Only trusted domains are allowed for redirects

### Trusted Domains
The proxy only redirects to these trusted domains:
- `localhost:3000` (development)
- `www.revly.health` (production)
- `revly.health` (production)
- `*.vercel.app` (all Vercel deployments)
- `*.vercel.com` (alternative Vercel domains)

### Error Handling
- **OAuth Errors**: Gracefully handled and redirected to error pages
- **Invalid State**: Blocked with appropriate error messages
- **Expired Tokens**: Automatically rejected with fallback redirects

## 🧪 Testing

### Local Development
```bash
# Test without proxy (direct OAuth)
USE_OAUTH_PROXY=false npm run dev

# Test with proxy (production-like behavior)
USE_OAUTH_PROXY=true npm run dev
```

### Preview Deployments
1. Create a pull request
2. Vercel automatically deploys a preview
3. OAuth should work immediately without manual configuration

### Production
OAuth flows should work identically to preview deployments.

## 🔧 Customization

### Adding New Trusted Domains
Edit `src/app/api/auth/proxy/route.ts`:

```typescript
const TRUSTED_DOMAINS = [
  'localhost:3000',
  'www.revly.health',
  'revly.health',
  '.vercel.app',
  '.vercel.com',
  'your-custom-domain.com'  // Add your domain here
];
```

### Adjusting State Expiry
Edit the `STATE_EXPIRY_MINUTES` constant:

```typescript
const STATE_EXPIRY_MINUTES = 10; // Adjust as needed
```

## 🚨 Troubleshooting

### Common Issues

#### "Invalid redirect URI" Error
- Check that `auth.revly.health/api/auth/proxy` is in Google OAuth settings
- Ensure DNS is properly configured for the auth subdomain

#### "Invalid state" Error
- Check that `NEXTAUTH_SECRET` is the same across all environments
- Verify system clocks are synchronized (state includes timestamps)

#### "Untrusted domain" Error
- Add the domain to the `TRUSTED_DOMAINS` array
- Ensure the domain format matches exactly

### Debug Logging
The proxy includes comprehensive logging. Check your deployment logs for:
- `OAuth proxy: Received callback`
- `OAuth proxy: Redirecting to target`
- `OAuth proxy: State validation failed`

## 🔄 Migration from Manual URL Management

### Before (Manual Approach)
```
Google OAuth Settings:
- https://www.revly.health/api/auth/callback/google
- https://health-stats-abc-xyz.vercel.app/api/auth/callback/google
- https://health-stats-def-xyz.vercel.app/api/auth/callback/google
- ... (manually added for each deployment)
```

### After (Proxy Approach)
```
Google OAuth Settings:
- https://auth.revly.health/api/auth/proxy
- http://localhost:3000/api/auth/proxy (dev only)
```

No more manual URL management required! 🎉

## 🌟 Benefits

- **Zero Manual Configuration**: New preview deployments work immediately
- **Consistent Behavior**: Same OAuth flow across all environments
- **Enhanced Security**: State validation and domain restrictions
- **Simplified Management**: Single OAuth configuration for all environments
- **Better DX**: Developers can focus on features, not infrastructure
