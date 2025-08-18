# DNS Setup Guide for OAuth Proxy

## Overview

You need to set up `auth.revly.health` as a subdomain that points to your main Vercel deployment. This creates a stable URL for Google OAuth that works across all environments.

## DNS Configuration

### Option 1: CNAME Record (Recommended)

If you manage your DNS through your domain provider:

```
Type: CNAME
Name: auth
Value: www.revly.health
TTL: 300 (5 minutes)
```

### Option 2: A Record

If you prefer A records:

```
Type: A  
Name: auth
Value: 76.76.19.61 (Vercel's IP - check current IP)
TTL: 300 (5 minutes)
```

**Note:** Vercel IPs can change, so CNAME is preferred.

### Option 3: Vercel Custom Domain

1. **Go to Vercel Dashboard** → Your Project → Settings → Domains
2. **Add Domain:** `auth.revly.health`
3. **Follow Vercel's DNS instructions** for your provider

## Verification Steps

Once DNS is configured:

1. **Test DNS Resolution:**
   ```bash
   nslookup auth.revly.health
   dig auth.revly.health
   ```

2. **Test HTTP Response:**
   ```bash
   curl -I https://auth.revly.health/api/auth/proxy
   ```

3. **Expected Response:**
   - Status: 200 OK or 302 (redirect)
   - Should not be a 404 or SSL error

## SSL Certificate

Vercel automatically provisions SSL certificates for custom domains. After adding the domain:

1. Wait 5-10 minutes for DNS propagation
2. Vercel will automatically issue an SSL certificate
3. Verify HTTPS works: `https://auth.revly.health`

## Common DNS Providers

### Cloudflare
1. DNS → Records → Add record
2. Type: CNAME, Name: auth, Target: www.revly.health
3. Proxy status: DNS only (orange cloud OFF)

### Namecheap
1. Advanced DNS → Add New Record
2. Type: CNAME Record, Host: auth, Value: www.revly.health

### GoDaddy
1. DNS Management → Add Record
2. Type: CNAME, Name: auth, Value: www.revly.health

### Route 53 (AWS)
1. Hosted Zones → Your Domain → Create Record
2. Record Type: CNAME, Name: auth, Value: www.revly.health

## Troubleshooting

### DNS Not Propagating
- Wait 5-15 minutes for propagation
- Clear DNS cache: `sudo dscacheutil -flushcache` (macOS)
- Test from different locations: [whatsmydns.net](https://www.whatsmydns.net)

### SSL Certificate Issues
- Ensure DNS is fully propagated first
- Remove and re-add the domain in Vercel if needed
- Check Vercel logs for certificate provisioning errors

### 404 Errors
- Verify the domain points to the correct Vercel deployment
- Ensure your main domain (www.revly.health) works first
- Check Vercel project settings for domain configuration
