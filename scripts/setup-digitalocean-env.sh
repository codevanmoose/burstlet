#!/bin/bash
# Setup environment variables for DigitalOcean App Platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

APP_ID="41fe1a5b-84b8-4cf8-a69f-5330c7ed7518"

log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Generated secrets from generate-secrets.sh
JWT_SECRET="ieu0A3MUFTznb6NytnWOYF5zl8olyYZeiMS3IPIZJ9Ej1e4d7v6V2EOXwsDmzg8TwbBiGIhkIGftz1GhV4Q"
CSRF_SECRET="FfVCH60pzK6oNfabfPPH00eyomn8hDoM"
ADMIN_OVERRIDE_TOKEN="0VCLj55hHvinycPTGMdY8rfsAugdCMft"
SESSION_SECRET="52BoIp4PVyHESnbjZUTb2wbvMQzVuYha"
ENCRYPTION_KEY="28e404e25b30f35d4a3cd2b91c304993"

# Function to set environment variable
set_env_var() {
    local key=$1
    local value=$2
    local is_secret=${3:-true}
    
    if [ -z "$value" ]; then
        warning "Skipping $key - no value provided"
        return
    fi
    
    log "Setting $key..."
    
    if [ "$is_secret" = true ]; then
        echo "$value" | doctl apps update $APP_ID --spec - << EOF
envs:
- key: $key
  value: $value
  scope: RUN_TIME
  type: SECRET
EOF
    else
        doctl apps update $APP_ID --spec - << EOF
envs:
- key: $key
  value: $value
  scope: RUN_TIME
EOF
    fi
    
    if [ $? -eq 0 ]; then
        success "$key set successfully"
    else
        error "Failed to set $key"
    fi
}

log "🔧 Setting up DigitalOcean App Platform environment variables"
log "App ID: $APP_ID"
log "=========================================================="

# Set generated secrets
log "Setting authentication secrets..."
set_env_var "JWT_SECRET" "$JWT_SECRET"
set_env_var "CSRF_SECRET" "$CSRF_SECRET"
set_env_var "ADMIN_OVERRIDE_TOKEN" "$ADMIN_OVERRIDE_TOKEN"
set_env_var "SESSION_SECRET" "$SESSION_SECRET"
set_env_var "ENCRYPTION_KEY" "$ENCRYPTION_KEY"

# Set public configuration
log "Setting public configuration..."
set_env_var "NODE_ENV" "production" false
set_env_var "PORT" "3001" false
set_env_var "FRONTEND_URL" "https://burstlet-gilt.vercel.app" false

# Database and services (these need real values)
warning "The following environment variables need real values:"
echo
echo "🗄️  Database & Services:"
echo "   DATABASE_URL - Get from Supabase project"
echo "   SUPABASE_URL - Your Supabase project URL" 
echo "   SUPABASE_SERVICE_KEY - Your Supabase service role key"
echo "   REDIS_URL - Redis connection string"
echo
echo "🤖 AI Services:"
echo "   OPENAI_API_KEY - Your OpenAI API key"
echo "   HAILUOAI_API_KEY - Your HailuoAI API key"
echo "   MINIMAX_API_KEY - Your MiniMax API key"
echo
echo "💳 Payment Processing:"
echo "   STRIPE_SECRET_KEY - Your Stripe secret key"
echo "   STRIPE_WEBHOOK_SECRET - Your Stripe webhook secret"
echo
echo "📧 Email Service:"
echo "   RESEND_API_KEY - Your Resend API key"
echo
echo "📱 Social Media APIs:"
echo "   YOUTUBE_CLIENT_SECRET - YouTube OAuth client secret"
echo "   TIKTOK_CLIENT_SECRET - TikTok OAuth client secret"
echo "   INSTAGRAM_CLIENT_SECRET - Instagram OAuth client secret"
echo "   TWITTER_CLIENT_SECRET - Twitter OAuth client secret"
echo

log "To set these manually, go to:"
log "https://cloud.digitalocean.com/apps/$APP_ID/settings"
log ""
log "Or use doctl to set them:"
log "doctl apps update $APP_ID --spec <app-spec.yaml>"

log "🎯 Next steps:"
log "1. Configure the remaining environment variables with real API keys"
log "2. Wait for deployment to complete"
log "3. Test the deployment with health checks"
log "4. Configure custom domain (optional)"

success "Basic environment setup complete!"