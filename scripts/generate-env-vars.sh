#!/bin/bash

# Generate all required environment variables for DigitalOcean deployment
# This script creates a complete list of environment variables to add

echo "🔧 Burstlet Environment Variables Configuration"
echo "=============================================="
echo ""
echo "Copy these environment variables to DigitalOcean:"
echo "https://cloud.digitalocean.com/apps/41fe1a5b-84b8-4cf8-a69f-5330c7ed7518/settings"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get Supabase password from user
echo "📌 IMPORTANT: You need the Supabase database password"
echo "   Find it in your Supabase project settings or the original setup email"
echo ""
read -p "Enter your Supabase database password: " SUPABASE_PASSWORD
echo ""

# Generate the environment variables
cat << EOF
🔐 CORE DATABASE VARIABLES (Mark as SECRET)
==========================================
DATABASE_URL = postgresql://postgres:${SUPABASE_PASSWORD}@db.cmfdlebyqgjifwmfvquu.supabase.co:5432/postgres
SUPABASE_URL = https://cmfdlebyqgjifwmfvquu.supabase.co
SUPABASE_SERVICE_KEY = [Get from Supabase Dashboard > Settings > API > service_role key]
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

🔧 REDIS CONFIGURATION (Mark as SECRET)
======================================
REDIS_URL = [Get from Redis Cloud or use redis://localhost:6379 for testing]

🔑 AUTHENTICATION SECRETS (Mark as SECRET)
=========================================
JWT_SECRET = $(openssl rand -base64 32)
CSRF_SECRET = FfVCH60pzK6oNfabfPPH00eyomn8hDoM
SESSION_SECRET = 52BoIp4PVyHESnbjZUTb2wbvMQzVuYha
ENCRYPTION_KEY = 28e404e25b30f35d4a3cd2b91c304993
ADMIN_OVERRIDE_TOKEN = 0VCLj55hHvinycPTGMdY8rfsAugdCMft

🌐 PUBLIC CONFIGURATION (Regular Variables)
==========================================
NODE_ENV = production
PORT = 3001
FRONTEND_URL = https://burstlet.vercel.app
STORAGE_BUCKET = burstlet-media

🤖 AI SERVICE KEYS (Mark as SECRET)
==================================
OPENAI_API_KEY = [Your OpenAI API key]
HAILUOAI_API_KEY = [Your HailuoAI API key]
MINIMAX_API_KEY = [Your MiniMax API key]

💳 PAYMENT PROCESSING (Mark as SECRET)
=====================================
STRIPE_SECRET_KEY = [Your Stripe secret key]
STRIPE_WEBHOOK_SECRET = [Your Stripe webhook secret]

📧 EMAIL SERVICE (Mark as SECRET)
================================
RESEND_API_KEY = [Your Resend API key]

📱 SOCIAL MEDIA OAUTH (Regular Variables for IDs, SECRET for secrets)
====================================================================
YOUTUBE_CLIENT_ID = placeholder-add-real-id
YOUTUBE_CLIENT_SECRET = placeholder-add-real-secret
TIKTOK_CLIENT_ID = placeholder-add-real-id
TIKTOK_CLIENT_SECRET = placeholder-add-real-secret
INSTAGRAM_CLIENT_ID = placeholder-add-real-id
INSTAGRAM_CLIENT_SECRET = placeholder-add-real-secret
TWITTER_CLIENT_ID = placeholder-add-real-id
TWITTER_CLIENT_SECRET = placeholder-add-real-secret

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 STEPS TO ADD THESE VARIABLES:
================================
1. Go to: https://cloud.digitalocean.com/apps/41fe1a5b-84b8-4cf8-a69f-5330c7ed7518/settings
2. Click "Environment Variables" tab
3. Click "Edit" button
4. For each variable above:
   - Click "Add Variable"
   - Enter the Key and Value
   - Check "Encrypt" for SECRET variables
   - Click the checkmark to save
5. After adding all, click "Save" at the bottom
6. The app will automatically redeploy

⚠️  MISSING VALUES TO GET:
========================
1. SUPABASE_SERVICE_KEY: 
   - Go to https://supabase.com/dashboard/project/cmfdlebyqgjifwmfvquu/settings/api
   - Copy the "service_role" key (starts with eyJ...)

2. REDIS_URL:
   - If using Redis Cloud, get from your Redis Cloud dashboard
   - For testing, use: redis://localhost:6379

3. AI API Keys:
   - Get from respective service dashboards
   - Can use placeholders initially if not available

4. Stripe Keys:
   - Get from Stripe dashboard
   - Can use test keys initially

5. Resend API Key:
   - Get from Resend dashboard
   - Required for email functionality

EOF

echo ""
echo "🚀 After adding all variables, run:"
echo "   ./scripts/deployment-verification.sh"
echo ""
echo "📊 To monitor deployment:"
echo "   ./scripts/production-monitor.sh --watch"
echo ""