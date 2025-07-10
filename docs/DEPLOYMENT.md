# 🚀 Burstlet Deployment Guide

This guide will walk you through deploying Burstlet to production.

## Prerequisites

- GitHub account with repository access
- Vercel account (for frontend)
- DigitalOcean account (for backend)
- Supabase account (for database)
- Stripe account (for payments)
- Domain name (e.g., burstlet.com)

## 1. Supabase Setup

### Create Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New project"
3. Fill in:
   - Organization: Your org
   - Project name: `burstlet-production`
   - Database password: Generate a strong password
   - Region: Choose closest to your users
   - Pricing plan: Pro ($25/month recommended)

### Configure Database

1. Go to SQL Editor and run the Prisma migrations:
   ```sql
   -- The migrations will be handled by Prisma
   -- Just ensure the database is ready
   ```

2. Enable Row Level Security (RLS) on all tables

3. Set up Storage buckets:
   - Go to Storage
   - Create bucket: `media`
   - Set public access for media files

### Get Credentials

1. Go to Settings > API
2. Copy:
   - Project URL
   - Anon key
   - Service role key

## 2. Vercel Deployment (Frontend)

### Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import from GitHub: `codevanmoose/burstlet`
4. Configure project:
   - Framework Preset: Next.js
   - Root Directory: `./`
   - Build Command: `cd frontend && npm run build`
   - Output Directory: `frontend/.next`

### Environment Variables

Add these in Vercel project settings:

```bash
# Production URLs
NEXT_PUBLIC_API_URL=https://api.burstlet.com
NEXT_PUBLIC_APP_URL=https://burstlet.com

# NextAuth
NEXTAUTH_URL=https://burstlet.com
NEXTAUTH_SECRET=[generate with: openssl rand -base64 32]

# Google OAuth
GOOGLE_CLIENT_ID=[from Google Cloud Console]
GOOGLE_CLIENT_SECRET=[from Google Cloud Console]

# Supabase
NEXT_PUBLIC_SUPABASE_URL=[from Supabase]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[from Supabase]

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=[from Stripe Dashboard]
```

### Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Set up custom domain in project settings

## 3. DigitalOcean App Platform (Backend)

### Create App

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click "Create App"
3. Choose GitHub repository: `codevanmoose/burstlet`
4. Configure app:
   - Branch: `main`
   - Source Directory: `/backend`
   - Autodeploy: Enable

### Configure Components

1. **Web Service**:
   - Name: `burstlet-api`
   - Resource Size: Basic ($12/month)
   - Build Command: `npm ci --only=production`
   - Run Command: `npm run start:prod`
   - HTTP Port: 3001
   - Health Check Path: `/health`

2. **Worker** (for queue processing):
   - Name: `burstlet-worker`
   - Resource Size: Basic ($12/month)
   - Build Command: `npm ci --only=production`
   - Run Command: `npm run worker:prod`

3. **Redis** (Managed Database):
   - Add Database > Redis
   - Name: `burstlet-redis`
   - Size: Basic ($15/month)
   - Eviction Policy: `allkeys-lru`

### Environment Variables

Add these in App Settings:

```bash
NODE_ENV=production
PORT=3001

# Database (from Supabase)
DATABASE_URL=[connection string from Supabase]

# Redis (auto-filled by DigitalOcean)
REDIS_URL=${redis.REDIS_URL}

# All other variables from backend/.env.production
```

### Deploy

1. Click "Create Resources"
2. Wait for deployment
3. Note the app URL (e.g., `burstlet-api-xxxxx.ondigitalocean.app`)

## 4. Stripe Configuration

### Create Products

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Products > Add Product:

**Starter Plan**:
- Name: Burstlet Starter
- Price: $29/month
- Features: 100 videos, 500 blog posts

**Professional Plan**:
- Name: Burstlet Professional  
- Price: $99/month
- Features: 500 videos, unlimited blogs

**Enterprise Plan**:
- Name: Burstlet Enterprise
- Price: $299/month
- Features: Unlimited everything

### Webhooks

1. Go to Developers > Webhooks
2. Add endpoint:
   - URL: `https://api.burstlet.com/webhook/stripe`
   - Events:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

3. Copy webhook signing secret

## 5. Domain & DNS Setup

### Configure DNS

Add these records to your domain:

```
A     @         76.76.21.21        (Vercel IP)
CNAME www       cname.vercel-dns.com
CNAME api       burstlet-api-xxxxx.ondigitalocean.app
```

### SSL Certificates

- Vercel: Automatic SSL
- DigitalOcean: Automatic Let's Encrypt

## 6. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create/select project
3. APIs & Services > Credentials
4. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized redirect URIs:
     - `https://burstlet.com/api/auth/callback/google`
     - `http://localhost:3000/api/auth/callback/google` (for dev)

## 7. Social Media API Setup

### YouTube
1. Use same Google Cloud project
2. Enable YouTube Data API v3
3. Use same OAuth credentials

### TikTok
1. Go to [TikTok Developers](https://developers.tiktok.com)
2. Create app
3. Add Login Kit and Content Posting API
4. Set redirect URI: `https://api.burstlet.com/oauth/tiktok/callback`

### Instagram
1. Go to [Meta Developers](https://developers.facebook.com)
2. Create app (Business type)
3. Add Instagram Basic Display
4. Set redirect URI: `https://api.burstlet.com/oauth/instagram/callback`

### Twitter/X
1. Go to [Twitter Developer Portal](https://developer.twitter.com)
2. Create project and app
3. Enable OAuth 2.0
4. Set callback URL: `https://api.burstlet.com/oauth/twitter/callback`

## 8. Post-Deployment

### Database Migrations

SSH into DigitalOcean app or run locally:

```bash
cd backend
npx prisma migrate deploy
npx prisma db seed
```

### Monitoring Setup

1. **Vercel Analytics**: Enable in project settings
2. **DigitalOcean Monitoring**: Enable in app settings
3. **Error Tracking**: Configure Sentry
4. **Uptime Monitoring**: Set up Better Uptime or similar

### Security Checklist

- [ ] Enable 2FA on all service accounts
- [ ] Set up backup automation for database
- [ ] Configure rate limiting
- [ ] Set up DDoS protection (Cloudflare)
- [ ] Review and restrict CORS origins
- [ ] Audit API keys and rotate if needed

## 9. Testing Production

1. **Health Checks**:
   - Frontend: `https://burstlet.com`
   - API: `https://api.burstlet.com/health`
   - Docs: `https://api.burstlet.com/api-docs`

2. **Test User Flow**:
   - Sign up with Google
   - Generate test content
   - Check billing flow
   - Verify analytics

3. **Performance Testing**:
   - Run Lighthouse audit
   - Test API response times
   - Check video generation queue

## Maintenance

### Regular Tasks

- **Daily**: Check error logs and monitoring dashboards
- **Weekly**: Review analytics and performance metrics
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Review and optimize costs

### Scaling Considerations

When you need to scale:

1. **Frontend**: Vercel auto-scales
2. **Backend**: Increase DigitalOcean app size
3. **Database**: Upgrade Supabase plan
4. **Redis**: Increase memory allocation
5. **CDN**: Add Cloudflare for media delivery

## Support

For deployment issues:
- Vercel: [vercel.com/support](https://vercel.com/support)
- DigitalOcean: [digitalocean.com/support](https://digitalocean.com/support)
- Supabase: [supabase.com/support](https://supabase.com/support)

---

🎉 Congratulations! Burstlet is now deployed and ready for users!