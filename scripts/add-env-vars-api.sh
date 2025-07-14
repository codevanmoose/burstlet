#!/bin/bash
# Add environment variables using DigitalOcean API directly

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

APP_ID="41fe1a5b-84b8-4cf8-a69f-5330c7ed7518"

log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log "🔧 Configuring DigitalOcean app environment variables"
log "App ID: $APP_ID"
log "=========================================================="

# Get auth token
TOKEN=$(doctl auth list --format Token --no-header | head -1)
if [ -z "$TOKEN" ]; then
    error "No DigitalOcean auth token found. Please run 'doctl auth init' first."
    exit 1
fi

# Create a comprehensive list of all environment variables needed
log "Creating environment variables configuration..."

cat > /tmp/env-vars.json << 'EOF'
{
  "envs": [
    {"key": "NODE_ENV", "value": "production", "scope": "RUN_AND_BUILD_TIME"},
    {"key": "PORT", "value": "3001", "scope": "RUN_AND_BUILD_TIME"},
    {"key": "FRONTEND_URL", "value": "https://burstlet.vercel.app", "scope": "RUN_TIME"},
    {"key": "CSRF_SECRET", "value": "FfVCH60pzK6oNfabfPPH00eyomn8hDoM", "scope": "RUN_TIME", "type": "SECRET"},
    {"key": "ADMIN_OVERRIDE_TOKEN", "value": "0VCLj55hHvinycPTGMdY8rfsAugdCMft", "scope": "RUN_TIME", "type": "SECRET"},
    {"key": "SESSION_SECRET", "value": "52BoIp4PVyHESnbjZUTb2wbvMQzVuYha", "scope": "RUN_TIME", "type": "SECRET"},
    {"key": "ENCRYPTION_KEY", "value": "28e404e25b30f35d4a3cd2b91c304993", "scope": "RUN_TIME", "type": "SECRET"},
    {"key": "SUPABASE_ANON_KEY", "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0", "scope": "RUN_TIME"},
    {"key": "STORAGE_BUCKET", "value": "burstlet-media", "scope": "RUN_TIME"},
    {"key": "REDIS_URL", "value": "redis://localhost:6379", "scope": "RUN_TIME"},
    {"key": "YOUTUBE_CLIENT_ID", "value": "placeholder-add-real-id", "scope": "RUN_TIME"},
    {"key": "TIKTOK_CLIENT_ID", "value": "placeholder-add-real-id", "scope": "RUN_TIME"},
    {"key": "INSTAGRAM_CLIENT_ID", "value": "placeholder-add-real-id", "scope": "RUN_TIME"},
    {"key": "TWITTER_CLIENT_ID", "value": "placeholder-add-real-id", "scope": "RUN_TIME"}
  ]
}
EOF

log "Environment variables configuration created."
log ""
warning "Since the DigitalOcean CLI has limitations with updating environment variables,"
warning "please follow these steps to add them manually:"
log ""
log "1. Go to: https://cloud.digitalocean.com/apps/$APP_ID/settings"
log "2. Click on the 'Environment Variables' tab"
log "3. Click 'Edit' button"
log "4. Add the following variables:"
log ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "AUTHENTICATION SECRETS (mark as SECRET):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "CSRF_SECRET = FfVCH60pzK6oNfabfPPH00eyomn8hDoM"
echo "ADMIN_OVERRIDE_TOKEN = 0VCLj55hHvinycPTGMdY8rfsAugdCMft"
echo "SESSION_SECRET = 52BoIp4PVyHESnbjZUTb2wbvMQzVuYha"
echo "ENCRYPTION_KEY = 28e404e25b30f35d4a3cd2b91c304993"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PUBLIC CONFIGURATION (regular variables):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "FRONTEND_URL = https://burstlet.vercel.app"
echo "SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
echo "STORAGE_BUCKET = burstlet-media"
echo "REDIS_URL = redis://localhost:6379"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "OAUTH CLIENT IDS (regular variables):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "YOUTUBE_CLIENT_ID = placeholder-add-real-id"
echo "TIKTOK_CLIENT_ID = placeholder-add-real-id"
echo "INSTAGRAM_CLIENT_ID = placeholder-add-real-id"
echo "TWITTER_CLIENT_ID = placeholder-add-real-id"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
log "5. Click 'Save' to apply changes"
log "6. The app will automatically redeploy"
log ""
success "The environment variables have been prepared for manual entry."
log ""
log "Alternatively, check the deployment logs to see if the app is already running:"
log "doctl apps logs $APP_ID --type=run"

# Clean up
rm -f /tmp/env-vars.json