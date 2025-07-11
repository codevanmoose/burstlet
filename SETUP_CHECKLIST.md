# Burstlet Setup Checklist

## 🚀 Deployment Status

### ✅ Completed
- [x] Frontend deployed to Vercel: https://burstlet-gilt.vercel.app
- [x] GitHub repository created: https://github.com/codevanmoose/burstlet
- [x] Supabase project created
- [x] Environment variables configured in Vercel
- [x] Backend app created on DigitalOcean (ID: 4203c53f-7d9b-4c3c-9adb-de8e0ac6cc48)

### 🔄 In Progress
- [ ] Backend deployment building on DigitalOcean
- [ ] Stripe account setup

### 📋 Remaining Tasks

#### 1. Backend Configuration (DigitalOcean)
- [ ] Wait for deployment to complete
- [ ] Get app URL from DigitalOcean dashboard
- [ ] Configure environment variables:
  - [ ] DATABASE_URL (from Supabase)
  - [ ] SUPABASE_URL
  - [ ] SUPABASE_SERVICE_KEY
  - [ ] JWT_SECRET
  - [ ] REDIS_URL (use Upstash)
  - [ ] Email service keys
  - [ ] AI service API keys
  - [ ] Social media API credentials

#### 2. Database Setup
- [ ] Get Supabase database password
- [ ] Run Prisma migrations:
  ```bash
  cd backend
  DATABASE_URL="..." npx prisma db push
  ```
- [ ] Create initial seed data (optional)

#### 3. Stripe Configuration
- [ ] Create Stripe account (if needed)
- [ ] Create subscription products:
  - [ ] Starter Plan ($29/month)
  - [ ] Professional Plan ($99/month)
  - [ ] Enterprise Plan ($299/month)
- [ ] Get API keys (publishable and secret)
- [ ] Create webhook endpoint
- [ ] Update environment variables

#### 4. OAuth Setup
- [ ] Google OAuth:
  - [ ] Create project in Google Cloud Console
  - [ ] Enable Google+ API
  - [ ] Create OAuth 2.0 credentials
  - [ ] Add redirect URIs
- [ ] Social Media APIs:
  - [ ] YouTube Data API
  - [ ] TikTok Developer App
  - [ ] Instagram Basic Display API
  - [ ] Twitter API v2

#### 5. External Services
- [ ] Resend account for emails
- [ ] OpenAI API key
- [ ] HailuoAI API key
- [ ] MiniMax API key
- [ ] Upstash Redis instance

#### 6. Final Configuration
- [ ] Update NEXT_PUBLIC_API_URL in Vercel
- [ ] Configure CORS settings
- [ ] Set up monitoring (optional)
- [ ] Configure custom domain (optional)

#### 7. Testing
- [ ] Test user registration/login
- [ ] Test video generation
- [ ] Test payment flow
- [ ] Test social media posting
- [ ] Test email notifications

## 🛠️ Quick Commands

```bash
# Check backend deployment status
doctl apps list-deployments 4203c53f-7d9b-4c3c-9adb-de8e0ac6cc48

# View backend logs
doctl apps logs 4203c53f-7d9b-4c3c-9adb-de8e0ac6cc48

# Run database migrations
cd backend
DATABASE_URL="postgresql://..." npx prisma db push

# Update Vercel environment variable
cd frontend
vercel env add NEXT_PUBLIC_API_URL production

# Test Stripe webhooks locally
stripe listen --forward-to localhost:3001/api/billing/webhook
```

## 📚 Resources
- [Vercel Dashboard](https://vercel.com/dashboard)
- [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Google Cloud Console](https://console.cloud.google.com)
- [Upstash Console](https://console.upstash.com)