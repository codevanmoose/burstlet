# API Keys Setup Guide for Burstlet

This guide will help you obtain and configure all necessary API keys for Burstlet to function fully.

## 🔑 Required API Keys

### 1. OpenAI API Key (For Blog Generation)
**Status**: ❌ Not configured  
**Required for**: Blog post generation, content ideas, SEO optimization

**How to get it**:
1. Go to https://platform.openai.com/api-keys
2. Sign up or log in to your OpenAI account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. Add to DigitalOcean: `OPENAI_API_KEY=sk-...`

**Cost**: Pay-as-you-go, approximately $0.01-0.03 per blog post

---

### 2. HailuoAI API Key (For Video Generation)
**Status**: ❌ Not configured  
**Required for**: AI video generation

**How to get it**:
1. Go to https://hailuoai.video
2. Sign up for an account
3. Navigate to API section in your dashboard
4. Generate an API key
5. Add to DigitalOcean: `HAILUOAI_API_KEY=...`

**Cost**: Check their pricing page for current rates

---

### 3. MiniMax API Key (For Audio Generation)
**Status**: ❌ Not configured  
**Required for**: Text-to-speech, background music for videos

**How to get it**:
1. Go to https://www.minimax.io
2. Sign up for an account
3. Navigate to API Keys in settings
4. Create a new API key
5. Add to DigitalOcean: `MINIMAX_API_KEY=...`

**Cost**: Usage-based pricing

---

### 4. Stripe API Keys (For Payments)
**Status**: ❌ Not configured  
**Required for**: Subscription billing, payment processing

**How to get it**:
1. Go to https://dashboard.stripe.com/register
2. Create a Stripe account
3. Navigate to Developers > API keys
4. Copy both keys:
   - Publishable key (starts with `pk_`)
   - Secret key (starts with `sk_`)
5. Add to DigitalOcean:
   - `STRIPE_SECRET_KEY=sk_...`
   - `STRIPE_WEBHOOK_SECRET=whsec_...` (get this after setting up webhooks)

**For Frontend (Vercel)**:
- Add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...`

**Cost**: 2.9% + 30¢ per successful transaction

---

### 5. Resend API Key (For Emails)
**Status**: ❌ Not configured  
**Required for**: User registration emails, password resets, notifications

**How to get it**:
1. Go to https://resend.com/signup
2. Create an account
3. Navigate to API Keys
4. Create a new API key
5. Add to DigitalOcean: `RESEND_API_KEY=re_...`

**Cost**: Free for up to 3,000 emails/month

---

## 🔐 OAuth Applications Setup

### YouTube (Google Cloud)
**Required for**: Uploading videos to YouTube

1. Go to https://console.cloud.google.com
2. Create a new project or select existing
3. Enable YouTube Data API v3
4. Create OAuth 2.0 credentials
5. Add redirect URI: `https://burstlet-api-wyn4p.ondigitalocean.app/api/platforms/youtube/callback`
6. Add to DigitalOcean:
   - `YOUTUBE_CLIENT_ID=...`
   - `YOUTUBE_CLIENT_SECRET=...`

### TikTok
**Required for**: Posting videos to TikTok

1. Go to https://developers.tiktok.com
2. Create an app
3. Add redirect URI: `https://burstlet-api-wyn4p.ondigitalocean.app/api/platforms/tiktok/callback`
4. Add to DigitalOcean:
   - `TIKTOK_CLIENT_ID=...`
   - `TIKTOK_CLIENT_SECRET=...`

### Instagram (Meta)
**Required for**: Posting to Instagram

1. Go to https://developers.facebook.com
2. Create an app
3. Add Instagram Basic Display product
4. Add redirect URI: `https://burstlet-api-wyn4p.ondigitalocean.app/api/platforms/instagram/callback`
5. Add to DigitalOcean:
   - `INSTAGRAM_CLIENT_ID=...`
   - `INSTAGRAM_CLIENT_SECRET=...`

### Twitter/X
**Required for**: Posting to Twitter/X

1. Go to https://developer.twitter.com
2. Apply for developer account
3. Create a project and app
4. Add redirect URI: `https://burstlet-api-wyn4p.ondigitalocean.app/api/platforms/twitter/callback`
5. Add to DigitalOcean:
   - `TWITTER_CLIENT_ID=...`
   - `TWITTER_CLIENT_SECRET=...`

---

## 📝 How to Add Keys to DigitalOcean

1. Go to: https://cloud.digitalocean.com/apps/41fe1a5b-84b8-4cf8-a69f-5330c7ed7518/settings
2. Click "Environment Variables" tab
3. Click "Edit" button
4. Add each key as:
   ```
   KEY_NAME=value
   ```
5. Click "Save"
6. The app will automatically redeploy

---

## 🧪 Testing Your Keys

After adding keys and waiting for deployment:

1. **Test OpenAI**: Try generating a blog post
2. **Test HailuoAI**: Try generating a video
3. **Test Stripe**: Check billing page loads
4. **Test Resend**: Try password reset
5. **Test OAuth**: Try connecting a social account

---

## 🚨 Security Notes

- Never commit API keys to Git
- Use environment variables only
- Rotate keys regularly
- Monitor usage to prevent abuse
- Set up billing alerts on all services

---

## 💡 Cost Optimization Tips

1. **Development**: Use test/sandbox modes where available
2. **OpenAI**: Use GPT-3.5-turbo for drafts, GPT-4 for finals
3. **Stripe**: Test with test keys first
4. **Resend**: Stay under 3,000 emails for free tier
5. **Monitor usage**: Set up alerts for unexpected spikes