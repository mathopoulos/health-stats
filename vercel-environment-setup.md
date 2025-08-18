# Vercel Environment Setup for OAuth Proxy

## Production Environment Variables

```bash
# Core Configuration
NEXTAUTH_URL=https://www.revly.health
NEXTAUTH_SECRET=your-production-secret-key

# OAuth Proxy Configuration
OAUTH_PROXY_URL=https://auth.revly.health/api/auth/proxy
USE_OAUTH_PROXY=true

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_IOS_CLIENT_ID=your-ios-google-client-id

# Database & AWS (your existing values)
MONGODB_URI=your-mongodb-connection-string
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name

# Stripe (your existing values)
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
```

## Preview Environment Variables

```bash
# OAuth Proxy Configuration (most important for previews)
OAUTH_PROXY_URL=https://auth.revly.health/api/auth/proxy
USE_OAUTH_PROXY=true

# NEXTAUTH_URL is automatically set by Vercel to VERCEL_URL
# Google OAuth (same as production)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_IOS_CLIENT_ID=your-ios-google-client-id

# NEXTAUTH_SECRET (same as production for state validation)
NEXTAUTH_SECRET=your-production-secret-key

# Other environment variables (same as production)
```

## Development Environment Variables

```bash
# Local Development (.env.local)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# OAuth Proxy (optional for development)
USE_OAUTH_PROXY=false
OAUTH_PROXY_URL=http://localhost:3000/api/auth/proxy

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_IOS_CLIENT_ID=your-ios-google-client-id
```
