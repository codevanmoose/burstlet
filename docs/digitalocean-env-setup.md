# DigitalOcean Environment Variables Setup Guide

## Quick Access
- **App Dashboard**: https://cloud.digitalocean.com/apps/41fe1a5b-84b8-4cf8-a69f-5330c7ed7518/settings
- **Environment Variables Tab**: Navigate to Settings → Environment Variables

## Missing Environment Variables to Add

### 1. Authentication Secrets (Required)
Add these as **SECRET** type:

```
CSRF_SECRET = FfVCH60pzK6oNfabfPPH00eyomn8hDoM
ADMIN_OVERRIDE_TOKEN = 0VCLj55hHvinycPTGMdY8rfsAugdCMft
SESSION_SECRET = 52BoIp4PVyHESnbjZUTb2wbvMQzVuYha
ENCRYPTION_KEY = 28e404e25b30f35d4a3cd2b91c304993
```

### 2. Public Configuration (Required)
Add these as regular (non-secret) variables:

```
FRONTEND_URL = https://burstlet.vercel.app
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
STORAGE_BUCKET = burstlet-media
REDIS_URL = redis://localhost:6379
```

### 3. OAuth Client IDs (Optional for now)
Add these as regular variables (replace with real values when available):

```
YOUTUBE_CLIENT_ID = placeholder-add-real-id
TIKTOK_CLIENT_ID = placeholder-add-real-id
INSTAGRAM_CLIENT_ID = placeholder-add-real-id
TWITTER_CLIENT_ID = placeholder-add-real-id
```

### 4. Already Set (Verify these exist)
These should already be in your app:
- DATABASE_URL
- SUPABASE_URL
- SUPABASE_SERVICE_KEY
- JWT_SECRET
- NODE_ENV
- PORT
- OPENAI_API_KEY
- HAILUOAI_API_KEY
- MINIMAX_API_KEY
- RESEND_API_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- Social media CLIENT_SECRETs

## Steps to Add Variables

1. Go to https://cloud.digitalocean.com/apps/41fe1a5b-84b8-4cf8-a69f-5330c7ed7518/settings
2. Click on the "Environment Variables" tab
3. Click "Edit" button
4. For each variable:
   - Click "Add Variable"
   - Enter the Key and Value
   - Select type (SECRET for sensitive data)
   - Click "Save"
5. After adding all variables, click "Save" at the bottom
6. The app will automatically redeploy

## Post-Configuration Checklist

After adding all environment variables:

1. ✅ Wait for deployment to complete (5-10 minutes)
2. ✅ Check deployment logs for any errors
3. ✅ Test the health endpoint: `curl https://[your-app-url]/health`
4. ✅ Verify frontend can connect to backend
5. ✅ Test authentication flow
6. ✅ Test content generation (if API keys are valid)

## Troubleshooting

If the app fails to deploy:
1. Check the deployment logs in DigitalOcean dashboard
2. Verify all required environment variables are set
3. Ensure DATABASE_URL is correct and accessible
4. Check that ports match (PORT=3001)

## Next Steps

Once environment variables are configured:
1. Configure custom domain (burstlet.com)
2. Set up Stripe production account
3. Add real OAuth credentials for social platforms
4. Test complete customer journey