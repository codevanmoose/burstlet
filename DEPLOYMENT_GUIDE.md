# Complete Deployment Guide for Burstlet

## 🚀 Quick Deploy with Railway (Recommended)

### Step 1: Deploy Backend
```bash
# Navigate to backend directory
cd backend

# Login to Railway
railway login

# Initialize new project
railway init

# Link to GitHub (when prompted, select "Empty Project")
# Then configure GitHub repo manually in Railway dashboard

# Deploy
railway up

# Get your app URL
railway domain
```

### Step 2: Configure Environment Variables
Go to your Railway project dashboard and add these variables:

```bash
DATABASE_URL=postgresql://postgres:[password]@db.cmfdlebyqgjifwmfvquu.supabase.co:5432/postgres
SUPABASE_URL=https://cmfdlebyqgjifwmfvquu.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZmRsZWJ5cWdqaWZ3bWZ2cXV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjUzODY5OSwiZXhwIjoyMDUyMTE0Njk5fQ.LJuJ0r9S3-lI0rnBHhLwBqx0B6t9JZUrtGjO3g2Msfo
JWT_SECRET=[generate with: openssl rand -base64 32]
NODE_ENV=production
PORT=3001
REDIS_URL=redis://default:[password]@[host]:[port]
```

### Step 3: Update Frontend
```bash
cd frontend
vercel env add NEXT_PUBLIC_API_URL production
# Enter your Railway backend URL (e.g., https://burstlet-api.up.railway.app)
```

### Step 4: Run Database Migrations
```bash
cd backend
DATABASE_URL="your-database-url" npx prisma db push
```

## 📋 Complete Setup Checklist

### 1. Backend Services Required
- [ ] **Supabase Database**: Get password from dashboard
- [ ] **Upstash Redis**: Create free instance at https://console.upstash.com
- [ ] **Resend Email**: Get API key from https://resend.com
- [ ] **OpenAI**: API key from https://platform.openai.com
- [ ] **HailuoAI**: Contact for API access
- [ ] **MiniMax**: Contact for API access

### 2. Authentication Setup
- [ ] **Google OAuth**:
  1. Go to https://console.cloud.google.com
  2. Create OAuth 2.0 credentials
  3. Add redirect URIs:
     - `https://burstlet-gilt.vercel.app/api/auth/callback/google`
     - `http://localhost:3000/api/auth/callback/google`

### 3. Payment Setup (Stripe)
- [ ] Create products in Stripe Dashboard
- [ ] Get API keys (publishable and secret)
- [ ] Create webhook endpoint
- [ ] Update environment variables

### 4. Social Media APIs
- [ ] YouTube (uses Google OAuth)
- [ ] TikTok Developer App
- [ ] Instagram Basic Display
- [ ] Twitter API v2

## 🔧 Environment Variables Reference

### Frontend (Vercel)
```env
NEXT_PUBLIC_SUPABASE_URL=https://cmfdlebyqgjifwmfvquu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXTAUTH_SECRET=[generated]
NEXTAUTH_URL=https://burstlet-gilt.vercel.app
NEXT_PUBLIC_API_URL=https://your-backend-url
NEXT_PUBLIC_APP_URL=https://burstlet-gilt.vercel.app
GOOGLE_CLIENT_ID=[from Google Console]
GOOGLE_CLIENT_SECRET=[from Google Console]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Backend (Railway)
```env
# Database
DATABASE_URL=postgresql://...
SUPABASE_URL=https://cmfdlebyqgjifwmfvquu.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...

# Auth
JWT_SECRET=[generated]

# Services
REDIS_URL=redis://...
RESEND_API_KEY=re_...
OPENAI_API_KEY=sk-...
HAILUOAI_API_KEY=...
MINIMAX_API_KEY=...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Social Media
YOUTUBE_CLIENT_ID=[same as Google]
YOUTUBE_CLIENT_SECRET=[same as Google]
TIKTOK_CLIENT_ID=...
TIKTOK_CLIENT_SECRET=...
INSTAGRAM_CLIENT_ID=...
INSTAGRAM_CLIENT_SECRET=...
TWITTER_CLIENT_ID=...
TWITTER_CLIENT_SECRET=...

# App Config
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://burstlet-gilt.vercel.app
BACKEND_URL=https://your-railway-url
```

## 🧪 Testing Your Deployment

```bash
# Test API health
curl https://your-backend-url/health

# Test from frontend
# Visit https://burstlet-gilt.vercel.app and try:
# 1. Sign up / Login
# 2. Generate content
# 3. View analytics

# Test with provided script
./scripts/test-api.sh https://your-backend-url
```

## 🆘 Troubleshooting

### Backend won't deploy
- Check build logs in Railway dashboard
- Ensure all dependencies are in package.json
- Try the simplified version (index-simple.ts)

### Database connection fails
- Get password from Supabase dashboard
- Check connection pooling settings
- Ensure SSL is enabled

### Authentication not working
- Verify Google OAuth credentials
- Check redirect URIs match exactly
- Ensure NEXTAUTH_SECRET is set

### Payments not processing
- Verify Stripe keys are correct
- Check webhook endpoint is accessible
- Test with Stripe CLI locally first

## 📚 Additional Resources

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Stripe Docs: https://stripe.com/docs

## 🎯 Next Steps After Deployment

1. **Configure DNS** (optional):
   - Add custom domain in Vercel
   - Add custom domain in Railway

2. **Set up monitoring**:
   - Enable Vercel Analytics
   - Set up error tracking (Sentry)

3. **Security hardening**:
   - Review CORS settings
   - Enable rate limiting
   - Set up WAF rules

4. **Performance optimization**:
   - Enable caching
   - Optimize images
   - Set up CDN

The application is fully built and ready for production use!