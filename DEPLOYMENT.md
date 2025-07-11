# Burstlet Deployment Guide

## Current Status

### ✅ Completed
1. **Frontend Deployment (Vercel)**
   - URL: https://burstlet-gilt.vercel.app
   - Environment variables configured (Supabase, NextAuth)
   - Automatic deployments from GitHub enabled

2. **GitHub Repository**
   - URL: https://github.com/codevanmoose/burstlet
   - All code pushed and version controlled

3. **Supabase Project**
   - URL: https://cmfdlebyqgjifwmfvquu.supabase.co
   - API keys retrieved and configured in Vercel

### 🔄 In Progress
4. **Backend Deployment (DigitalOcean)**
   - Run: `./scripts/deploy-backend.sh`
   - Configure environment variables in DigitalOcean dashboard
   - Update NEXT_PUBLIC_API_URL in Vercel to point to deployed backend

### 📋 TODO
5. **Database Setup**
   - Run Prisma migrations on Supabase
   - Seed initial data if needed

6. **Stripe Configuration**
   - Create products and price plans in Stripe dashboard
   - Configure webhook endpoints
   - Update environment variables with real Stripe keys

7. **OAuth Configuration**
   - Set up Google OAuth in Google Cloud Console
   - Configure social media API apps (YouTube, TikTok, Instagram, Twitter)
   - Update redirect URIs to production URLs

8. **Final Testing**
   - Test authentication flow
   - Test AI generation features
   - Test payment flow
   - Test social media integrations

## Environment Variables Checklist

### Frontend (Vercel) ✅
- [x] NEXT_PUBLIC_SUPABASE_URL
- [x] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [x] NEXTAUTH_SECRET
- [x] NEXTAUTH_URL
- [x] NEXT_PUBLIC_APP_URL
- [ ] NEXT_PUBLIC_API_URL (update after backend deployment)
- [ ] GOOGLE_CLIENT_ID (needs real value)
- [ ] GOOGLE_CLIENT_SECRET (needs real value)
- [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (needs real value)

### Backend (DigitalOcean) 🔄
- [ ] DATABASE_URL (Supabase PostgreSQL)
- [ ] SUPABASE_URL
- [ ] SUPABASE_SERVICE_KEY
- [ ] JWT_SECRET
- [ ] RESEND_API_KEY
- [ ] OPENAI_API_KEY
- [ ] HAILUOAI_API_KEY
- [ ] MINIMAX_API_KEY
- [ ] STRIPE_SECRET_KEY
- [ ] STRIPE_WEBHOOK_SECRET
- [ ] Social media API credentials

## Quick Commands

```bash
# Deploy frontend (automatic via GitHub)
git push

# Deploy backend
./scripts/deploy-backend.sh

# Run database migrations
cd backend
npm run db:push

# Update Vercel environment variables
cd frontend
vercel env pull
vercel env add VARIABLE_NAME production
```

## Support Resources
- Vercel Dashboard: https://vercel.com/dashboard
- DigitalOcean Dashboard: https://cloud.digitalocean.com
- Supabase Dashboard: https://app.supabase.com
- Stripe Dashboard: https://dashboard.stripe.com