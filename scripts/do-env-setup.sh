#!/bin/bash

# DigitalOcean Environment Variable Setup Helper
# This script provides the exact environment variables to add

echo "🔧 DigitalOcean Environment Variable Setup"
echo "=========================================="
echo ""
echo "📋 Copy these environment variables to DigitalOcean:"
echo ""
echo "Go to: https://cloud.digitalocean.com/apps/41fe1a5b-84b8-4cf8-a69f-5330c7ed7518/settings"
echo "Click on 'Environment Variables' tab"
echo "Add each of these variables:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Read Supabase credentials
SUPABASE_URL="https://cmfdlebyqgjifwmfvquu.supabase.co"
SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
SUPABASE_SERVICE_KEY="YOUR_SUPABASE_SERVICE_KEY"

cat << EOF
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.cmfdlebyqgjifwmfvquu.supabase.co:5432/postgres
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY
REDIS_URL=redis://default:YOUR_REDIS_PASSWORD@redis-12345.c123.us-east-1-4.ec2.cloud.redislabs.com:12345
FRONTEND_URL=https://burstlet.vercel.app
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
CSRF_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)
ADMIN_OVERRIDE_TOKEN=$(openssl rand -base64 32)
STORAGE_BUCKET=burstlet-media

# AI Service Keys (use placeholders for now)
OPENAI_API_KEY=sk-placeholder
HAILUOAI_API_KEY=hailuoai-placeholder
MINIMAX_API_KEY=minimax-placeholder

# Email Service
RESEND_API_KEY=re_placeholder

# Payment Processing  
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder

# OAuth Placeholders (will configure later)
YOUTUBE_CLIENT_ID=placeholder
YOUTUBE_CLIENT_SECRET=placeholder
TIKTOK_CLIENT_ID=placeholder
TIKTOK_CLIENT_SECRET=placeholder
INSTAGRAM_CLIENT_ID=placeholder
INSTAGRAM_CLIENT_SECRET=placeholder
TWITTER_CLIENT_ID=placeholder
TWITTER_CLIENT_SECRET=placeholder
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  IMPORTANT NOTES:"
echo "1. Replace YOUR_PASSWORD with your Supabase database password"
echo "2. Get SUPABASE_ANON_KEY from: https://supabase.com/dashboard/project/cmfdlebyqgjifwmfvquu/settings/api"
echo "3. Get SUPABASE_SERVICE_KEY from the same page (service_role key)"
echo "4. Replace Redis URL with your Redis Cloud connection string"
echo "5. The generated secrets (JWT_SECRET, etc.) are unique - save them!"
echo ""
echo "📝 After adding all variables:"
echo "1. Click 'Save' at the bottom"
echo "2. DigitalOcean will automatically redeploy"
echo "3. Wait ~5 minutes for deployment"
echo "4. Run: ./scripts/production-monitor.sh to verify"
echo ""